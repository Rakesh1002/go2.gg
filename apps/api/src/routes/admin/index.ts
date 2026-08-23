/**
 * Admin Routes
 *
 * Internal-only endpoints for administrative tasks.
 * Protected by admin authentication.
 */

import { zValidator } from "@hono/zod-validator";
import { createD1Client, createD1Repositories } from "@repo/db/d1";
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../../bindings.js";
import { logEvent } from "../../lib/axiom.js";
import {
  addCollaborator,
  checkCollaborator,
  removeCollaborator,
  verifyGithubUser,
} from "../../lib/github.js";
import { badRequest, ok } from "../../lib/response.js";

const admin = new Hono<{ Bindings: Env }>();

/**
 * Admin authentication middleware.
 * Uses service role key for internal operations.
 */
admin.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Admin authentication required" },
      },
      401
    );
  }

  const token = authHeader.substring(7);

  // Verify admin token. Set via `wrangler secret put ADMIN_TOKEN`.
  if (!c.env.ADMIN_TOKEN || token !== c.env.ADMIN_TOKEN) {
    // Log every failed admin auth attempt — these are usually leaked-token
    // probes or misconfigured callers. Includes IP + UA + path for triage.
    await logEvent(
      c.env,
      "admin.auth.failed",
      {
        path: c.req.path,
        method: c.req.method,
        ip: c.req.header("CF-Connecting-IP") ?? "unknown",
        ua: (c.req.header("user-agent") ?? "").slice(0, 200),
      },
      "warn"
    ).catch(() => undefined);
    return c.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Invalid admin credentials" },
      },
      403
    );
  }

  await next();
});

/**
 * Audit log for every mutating admin call. Captures method, path, IP, UA,
 * and (for POST/PATCH/PUT/DELETE) the top-level body keys — never raw
 * values, since some admin payloads carry email addresses or other PII.
 * GET requests are deliberately skipped: they're read-only enumeration and
 * would 10x the log volume without adding signal.
 */
admin.use("*", async (c, next) => {
  const method = c.req.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return next();

  // Buffer body keys without consuming the body for the downstream handler.
  let bodyKeys: string[] = [];
  try {
    const clone = c.req.raw.clone();
    const ct = clone.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const json = (await clone.json()) as Record<string, unknown>;
      bodyKeys = Object.keys(json).slice(0, 20);
    }
  } catch {
    // Non-JSON or unreadable body — log without keys.
  }

  await logEvent(
    c.env,
    "admin.action",
    {
      method,
      path: c.req.path,
      ip: c.req.header("CF-Connecting-IP") ?? "unknown",
      ua: (c.req.header("user-agent") ?? "").slice(0, 200),
      bodyKeys,
    },
    "info"
  ).catch(() => undefined);

  return next();
});

// -----------------------------------------------------------------------------
// KV / Cache Maintenance
// -----------------------------------------------------------------------------

/**
 * POST /admin/links/resync-kv
 * Repopulate LINKS_KV from the D1 links table for every active (non-archived,
 * non-expired) link. Used after a cache wipe / TTL expiry / namespace switch.
 *
 * Response shape: { synced, skipped, errors, total }.
 * Body (optional): { dryRun?: boolean, batchSize?: number }
 */
admin.post("/links/resync-kv", async (c) => {
  let body: { dryRun?: boolean; batchSize?: number } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const dryRun = body.dryRun === true;
  const batchSize = Math.max(50, Math.min(body.batchSize ?? 500, 1000));

  const nowIso = new Date().toISOString();
  let synced = 0;
  let skipped = 0;
  let errors = 0;
  let cursor: string | null = null;

  const { drizzle } = await import("drizzle-orm/d1");
  const { and, asc, eq, gt } = await import("drizzle-orm");
  const schema = await import("@repo/db");
  const { serializeCachedLink, syncLinkToKV } = await import("../../lib/cached-link.js");
  const db = drizzle(c.env.DB, { schema });

  for (;;) {
    const rows = await db
      .select()
      .from(schema.links)
      .where(
        cursor
          ? and(eq(schema.links.isArchived, false), gt(schema.links.id, cursor))
          : eq(schema.links.isArchived, false)
      )
      .orderBy(asc(schema.links.id))
      .limit(batchSize);
    if (rows.length === 0) break;

    for (const row of rows) {
      try {
        if (row.expiresAt && row.expiresAt < nowIso) {
          skipped++;
          continue;
        }
        if (row.policyExpiresAt && row.policyExpiresAt < nowIso) {
          skipped++;
          continue;
        }
        // Disabled links are synced too — the resolver needs the isDisabled
        // entry to serve the 410 explanation page instead of redirecting.
        const cached = serializeCachedLink(row);
        if (!dryRun) {
          await syncLinkToKV(c.env.LINKS_KV, cached);
        }
        synced++;
      } catch (error) {
        console.error("[admin/resync-kv] error on row", row.id, error);
        errors++;
      }
      cursor = row.id;
    }

    if (rows.length < batchSize) break;
  }

  return ok(c, { synced, skipped, errors, dryRun });
});

// -----------------------------------------------------------------------------
// User Management
// -----------------------------------------------------------------------------

/**
 * GET /admin/users
 * List all users (paginated)
 */
admin.get("/users", async (c) => {
  const limit = Number.parseInt(c.req.query("limit") ?? "50");
  const offset = Number.parseInt(c.req.query("offset") ?? "0");

  const result = await c.env.DB.prepare(
    "SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?"
  )
    .bind(limit, offset)
    .all();

  const countResult = await c.env.DB.prepare("SELECT COUNT(*) as total FROM users").first<{
    total: number;
  }>();

  return ok(c, result.results, {
    page: Math.floor(offset / limit) + 1,
    perPage: limit,
    total: countResult?.total ?? 0,
  });
});

/**
 * GET /admin/users/:id
 * Get user details
 */
admin.get("/users/:id", async (c) => {
  const userId = c.req.param("id");
  const db = createD1Client(c.env.DB);
  const repos = createD1Repositories(db);

  const user = await repos.users.findById(userId);

  if (!user) {
    return c.json({ success: false, error: { code: "NOT_FOUND", message: "User not found" } }, 404);
  }

  // Get user's organizations
  const orgs = await c.env.DB.prepare(
    `
      SELECT o.*, om.role 
      FROM organizations o
      INNER JOIN organization_members om ON om.organization_id = o.id
      WHERE om.user_id = ?
    `
  )
    .bind(userId)
    .all();

  return ok(c, { ...user, organizations: orgs.results });
});

/**
 * POST /admin/users/:id/ban
 * Suspend a user: flags user_metadata, disables their active links in D1 and
 * KV, expires API keys, revokes OAuth tokens, deletes live sessions.
 * Body (optional): { reason?: string }
 */
admin.post(
  "/users/:id/ban",
  zValidator("json", z.object({ reason: z.string().max(500).optional() }).optional()),
  async (c) => {
    const userId = c.req.param("id");
    const body = c.req.valid("json");

    const { drizzle } = await import("drizzle-orm/d1");
    const schema = await import("@repo/db");
    const { eq } = await import("drizzle-orm");
    const db = drizzle(c.env.DB, { schema });

    const [user] = await db
      .select({ id: schema.users.id, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    if (!user) {
      return c.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        404
      );
    }

    const { banUser } = await import("../../lib/suspension.js");
    const result = await banUser(c.env, db, userId, body?.reason);

    await logEvent(
      c.env,
      "admin.user.banned",
      { userId, reason: body?.reason ?? null, ...result },
      "warn"
    ).catch(() => undefined);

    return ok(c, { userId, banned: true, ...result });
  }
);

/**
 * POST /admin/users/:id/unban
 * Lift a suspension. Re-enables only the links that were disabled by the ban.
 */
admin.post("/users/:id/unban", async (c) => {
  const userId = c.req.param("id");

  const { drizzle } = await import("drizzle-orm/d1");
  const schema = await import("@repo/db");
  const db = drizzle(c.env.DB, { schema });

  const { unbanUser } = await import("../../lib/suspension.js");
  const result = await unbanUser(c.env, db, userId);

  await logEvent(c.env, "admin.user.unbanned", { userId, ...result }, "info").catch(
    () => undefined
  );

  return ok(c, { userId, banned: false, ...result });
});

/**
 * DELETE /admin/users/:id
 * Delete a user
 */
admin.delete("/users/:id", async (c) => {
  const userId = c.req.param("id");
  const db = createD1Client(c.env.DB);
  const repos = createD1Repositories(db);

  await repos.users.delete(userId);

  return c.body(null, 204);
});

// -----------------------------------------------------------------------------
// Organization Management
// -----------------------------------------------------------------------------

/**
 * GET /admin/organizations
 * List all organizations (paginated)
 */
admin.get("/organizations", async (c) => {
  const limit = Number.parseInt(c.req.query("limit") ?? "50");
  const offset = Number.parseInt(c.req.query("offset") ?? "0");

  const result = await c.env.DB.prepare(
    "SELECT * FROM organizations ORDER BY created_at DESC LIMIT ? OFFSET ?"
  )
    .bind(limit, offset)
    .all();

  const countResult = await c.env.DB.prepare("SELECT COUNT(*) as total FROM organizations").first<{
    total: number;
  }>();

  return ok(c, result.results, {
    page: Math.floor(offset / limit) + 1,
    perPage: limit,
    total: countResult?.total ?? 0,
  });
});

// -----------------------------------------------------------------------------
// Subscription Management
// -----------------------------------------------------------------------------

/**
 * GET /admin/subscriptions
 * List all subscriptions
 */
admin.get("/subscriptions", async (c) => {
  const status = c.req.query("status");

  let query = `
    SELECT s.*, o.name as organization_name
    FROM subscriptions s
    INNER JOIN organizations o ON o.id = s.organization_id
  `;

  if (status) {
    query += " WHERE s.status = ?";
  }

  query += " ORDER BY s.created_at DESC";

  const stmt = status ? c.env.DB.prepare(query).bind(status) : c.env.DB.prepare(query);

  const result = await stmt.all();

  return ok(c, result.results);
});

/**
 * PATCH /admin/subscriptions/:id
 * Update subscription status
 */
const updateSubscriptionSchema = z.object({
  status: z.enum([
    "trialing",
    "active",
    "canceled",
    "past_due",
    "unpaid",
    "incomplete",
    "incomplete_expired",
    "paused",
  ]),
  plan: z.enum(["free", "pro", "business", "enterprise"]).optional(),
});

admin.patch("/subscriptions/:id", zValidator("json", updateSubscriptionSchema), async (c) => {
  const subId = c.req.param("id");
  const input = c.req.valid("json");
  const db = createD1Client(c.env.DB);
  const repos = createD1Repositories(db);

  const updated = await repos.subscriptions.update(subId, input);

  return ok(c, updated);
});

// -----------------------------------------------------------------------------
// System Stats
// -----------------------------------------------------------------------------

/**
 * GET /admin/stats
 * Get system statistics
 */
admin.get("/stats", async (c) => {
  const [users, orgs, subs] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) as total FROM users").first<{ total: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) as total FROM organizations").first<{ total: number }>(),
    c.env.DB.prepare("SELECT status, COUNT(*) as count FROM subscriptions GROUP BY status").all(),
  ]);

  return ok(c, {
    users: users?.total ?? 0,
    organizations: orgs?.total ?? 0,
    subscriptions: subs.results,
    timestamp: new Date().toISOString(),
  });
});

// -----------------------------------------------------------------------------
// Cache Management
// -----------------------------------------------------------------------------

/**
 * POST /admin/cache/clear
 * Clear KV cache
 */
admin.post("/cache/clear", async (c) => {
  if (c.env.KV_CONFIG) {
    // List and delete all keys (limited operation)
    const keys = await c.env.KV_CONFIG.list({ limit: 100 });

    for (const key of keys.keys) {
      await c.env.KV_CONFIG.delete(key.name);
    }
  }

  return ok(c, { message: "Cache cleared" });
});

// -----------------------------------------------------------------------------
// Feature Flags (via KV)
// -----------------------------------------------------------------------------

/**
 * GET /admin/flags
 * Get all feature flags from KV
 */
admin.get("/flags", async (c) => {
  if (!c.env.KV_CONFIG) {
    return ok(c, {});
  }

  const flags: Record<string, string | null> = {};
  const keys = await c.env.KV_CONFIG.list({ prefix: "flag:" });

  for (const key of keys.keys) {
    flags[key.name.replace("flag:", "")] = await c.env.KV_CONFIG.get(key.name);
  }

  return ok(c, flags);
});

/**
 * PUT /admin/flags/:key
 * Set a feature flag
 */
const setFlagSchema = z.object({
  value: z.union([z.boolean(), z.string()]),
});

admin.put("/flags/:key", zValidator("json", setFlagSchema), async (c) => {
  const key = c.req.param("key");
  const { value } = c.req.valid("json");

  if (!c.env.KV_CONFIG) {
    return c.json(
      { success: false, error: { code: "NOT_AVAILABLE", message: "KV not configured" } },
      503
    );
  }

  await c.env.KV_CONFIG.put(`flag:${key}`, String(value));

  return ok(c, { key, value });
});

// -----------------------------------------------------------------------------
// GitHub Access Management (for boilerplate purchases)
// -----------------------------------------------------------------------------

/**
 * GET /admin/purchases
 * List all boilerplate purchases
 */
admin.get("/purchases", async (c) => {
  const limit = Number.parseInt(c.req.query("limit") ?? "50");
  const offset = Number.parseInt(c.req.query("offset") ?? "0");
  const status = c.req.query("status");

  let query = "SELECT * FROM purchases";
  const bindings: (string | number)[] = [];

  if (status) {
    query += " WHERE status = ?";
    bindings.push(status);
  }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  bindings.push(limit, offset);

  const result = await c.env.DB.prepare(query)
    .bind(...bindings)
    .all();

  const countQuery = status
    ? c.env.DB.prepare("SELECT COUNT(*) as total FROM purchases WHERE status = ?").bind(status)
    : c.env.DB.prepare("SELECT COUNT(*) as total FROM purchases");

  const countResult = await countQuery.first<{ total: number }>();

  return ok(c, result.results, {
    page: Math.floor(offset / limit) + 1,
    perPage: limit,
    total: countResult?.total ?? 0,
  });
});

/**
 * GET /admin/purchases/:id
 * Get purchase details
 */
admin.get("/purchases/:id", async (c) => {
  const purchaseId = c.req.param("id");
  const db = createD1Client(c.env.DB);
  const repos = createD1Repositories(db);

  const purchase = await repos.purchases.findById(purchaseId);

  if (!purchase) {
    return c.json(
      { success: false, error: { code: "NOT_FOUND", message: "Purchase not found" } },
      404
    );
  }

  // Check GitHub access status if username is set
  let githubStatus = null;
  if (purchase.githubUsername) {
    githubStatus = await checkCollaborator(c.env, purchase.githubUsername);
  }

  return ok(c, { ...purchase, githubStatus });
});

/**
 * POST /admin/purchases/:id/grant-access
 * Grant GitHub repository access
 */
const grantAccessSchema = z.object({
  githubUsername: z.string().min(1).optional(),
});

admin.post("/purchases/:id/grant-access", zValidator("json", grantAccessSchema), async (c) => {
  const purchaseId = c.req.param("id");
  const input = c.req.valid("json");
  const db = createD1Client(c.env.DB);
  const repos = createD1Repositories(db);

  const purchase = await repos.purchases.findById(purchaseId);

  if (!purchase) {
    return c.json(
      { success: false, error: { code: "NOT_FOUND", message: "Purchase not found" } },
      404
    );
  }

  const username = input.githubUsername || purchase.githubUsername;

  if (!username) {
    return badRequest(c, "GitHub username is required", "NO_USERNAME");
  }

  // Verify the GitHub user exists
  const userExists = await verifyGithubUser(username);
  if (!userExists) {
    return badRequest(c, `GitHub user '${username}' not found`, "USER_NOT_FOUND");
  }

  // Add collaborator to the repo
  const result = await addCollaborator(c.env, username);

  if (result.success) {
    // Update purchase record
    await repos.purchases.update(purchaseId, {
      githubUsername: username,
      githubAccessGranted: true,
      githubAccessGrantedAt: new Date().toISOString(),
    });

    // Queue GitHub access email
    if (c.env.BACKGROUND_QUEUE) {
      await c.env.BACKGROUND_QUEUE.send({
        type: "email:send",
        payload: {
          to: purchase.email,
          template: "github-access-granted",
          data: {
            customerName: purchase.email.split("@")[0],
            githubUsername: username,
            licenseName: purchase.licenseName,
            repoUrl: `https://github.com/${c.env.GITHUB_ORG}/${c.env.GITHUB_REPO}`,
            docsUrl: `${c.env.APP_URL}/docs`,
            discordUrl: c.env.DISCORD_URL,
          },
        },
      });
    }
  }

  return ok(c, {
    success: result.success,
    message: result.message,
    username,
  });
});

/**
 * POST /admin/purchases/:id/revoke-access
 * Revoke GitHub repository access
 */
admin.post("/purchases/:id/revoke-access", async (c) => {
  const purchaseId = c.req.param("id");
  const db = createD1Client(c.env.DB);
  const repos = createD1Repositories(db);

  const purchase = await repos.purchases.findById(purchaseId);

  if (!purchase) {
    return c.json(
      { success: false, error: { code: "NOT_FOUND", message: "Purchase not found" } },
      404
    );
  }

  if (!purchase.githubUsername) {
    return badRequest(c, "No GitHub username associated with this purchase", "NO_USERNAME");
  }

  // Remove collaborator from the repo
  const result = await removeCollaborator(c.env, purchase.githubUsername);

  if (result.success) {
    // Update purchase record
    await repos.purchases.update(purchaseId, {
      githubAccessGranted: false,
      githubAccessGrantedAt: null,
    });
  }

  return ok(c, {
    success: result.success,
    message: result.message,
    username: purchase.githubUsername,
  });
});

/**
 * POST /admin/github/verify-user
 * Verify a GitHub username exists
 */
const verifyUserSchema = z.object({
  username: z.string().min(1),
});

admin.post("/github/verify-user", zValidator("json", verifyUserSchema), async (c) => {
  const { username } = c.req.valid("json");

  const exists = await verifyGithubUser(username);

  return ok(c, { username, exists });
});

// -----------------------------------------------------------------------------
// Trust & safety — abuse warnings
// -----------------------------------------------------------------------------

const abuseWarningSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  reason: z.string().min(1),
  links: z
    .array(
      z.object({
        shortUrl: z.string().url(),
        destinationUrl: z.string().url(),
        createdAt: z.string(),
      })
    )
    .min(1)
    .max(20),
});

/**
 * POST /admin/abuse-warning
 *
 * Sends a phishing-warning email to a user whose link(s) were disabled for
 * social engineering / phishing / malware. Email includes the offending
 * slugs + destinations and warns that the account will be suspended on
 * recurrence. Queued via BACKGROUND_QUEUE so a single send failure doesn't
 * block the admin curl.
 */
admin.post("/abuse-warning", zValidator("json", abuseWarningSchema), async (c) => {
  const input = c.req.valid("json");

  if (!c.env.BACKGROUND_QUEUE) {
    return badRequest(c, "BACKGROUND_QUEUE binding is not configured", "QUEUE_MISSING");
  }

  await c.env.BACKGROUND_QUEUE.send({
    type: "email:send",
    payload: {
      to: input.email,
      template: "phishing-warning",
      data: {
        customerName: input.name ?? input.email.split("@")[0],
        links: input.links,
        reason: input.reason,
        appealUrl: "mailto:abuse@go2.gg",
      },
    },
  });

  // Record the warning as a strike so a human-issued warning carries the same
  // weight as an automated detection. Previously this route sent an email and
  // persisted nothing, so repeat offenders reset to zero every time.
  let strikeId: string | null = null;
  try {
    const { drizzle } = await import("drizzle-orm/d1");
    const schema = await import("@repo/db");
    const { eq } = await import("drizzle-orm");
    const db = drizzle(c.env.DB, { schema });

    const [user] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, input.email))
      .limit(1);

    if (user) {
      const { ABUSE_THRESHOLDS } = await import("../../lib/abuse-signals.js");
      const now = new Date();
      const nowIso = now.toISOString();
      const { countActiveStrikes } = await import("../../lib/abuse-enforcement.js");
      const prior = await countActiveStrikes(db, user.id);
      strikeId = crypto.randomUUID();
      await db
        .insert(schema.abuseStrikes)
        .values({
          id: strikeId,
          userId: user.id,
          organizationId: null,
          strikeNumber: prior + 1,
          signal: "manual",
          tier: "high",
          action: "strike",
          status: "active",
          evidence: JSON.stringify([{ signal: "manual", detail: input.reason }]),
          linkIds: JSON.stringify(input.links.map((l) => l.shortUrl)),
          linksDisabled: 0,
          dedupeKey: `manual:${user.id}:${nowIso}`,
          notifiedAt: nowIso,
          expiresAt: new Date(
            now.getTime() + ABUSE_THRESHOLDS.STRIKE_TTL_DAYS * 86_400_000
          ).toISOString(),
          createdAt: nowIso,
        })
        .onConflictDoNothing();
    }
  } catch {
    // The email is the primary action here — a strike-ledger failure must not
    // stop the warning from going out.
  }

  return ok(c, { queued: true, to: input.email, linkCount: input.links.length, strikeId });
});

// -----------------------------------------------------------------------------
// Trust & safety — destination blocklist
// -----------------------------------------------------------------------------

const blocklistEntrySchema = z.object({
  kind: z.enum(["host", "host_suffix", "path_prefix", "path_segment"]),
  value: z.string().min(1).max(255),
  action: z.enum(["block", "suspect"]).optional().default("block"),
  reason: z.string().min(1).max(500),
  incidentId: z.string().max(100).optional(),
});

/**
 * GET /admin/blocklist
 * List blocklist entries, newest first. Filter by incidentId / kind / active.
 */
admin.get("/blocklist", async (c) => {
  const { drizzle } = await import("drizzle-orm/d1");
  const schema = await import("@repo/db");
  const { and, desc, eq } = await import("drizzle-orm");
  const db = drizzle(c.env.DB, { schema });

  const incidentId = c.req.query("incidentId");
  const kind = c.req.query("kind");
  const activeOnly = c.req.query("active") !== "false";

  const filters = [];
  if (incidentId) filters.push(eq(schema.destinationBlocklist.incidentId, incidentId));
  if (kind) filters.push(eq(schema.destinationBlocklist.kind, kind as never));
  if (activeOnly) filters.push(eq(schema.destinationBlocklist.isActive, true));

  const rows = await db
    .select()
    .from(schema.destinationBlocklist)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(schema.destinationBlocklist.createdAt))
    .limit(500);

  return ok(c, { entries: rows, total: rows.length });
});

/**
 * POST /admin/blocklist
 * Upsert entries and republish the compiled KV snapshot. Existing matching
 * links are disabled retroactively by the rescan cron, which calls the same
 * checkDestinationThreat this list hangs off.
 */
admin.post(
  "/blocklist",
  zValidator("json", z.object({ entries: z.array(blocklistEntrySchema).min(1).max(200) })),
  async (c) => {
    const { entries } = c.req.valid("json");
    const { drizzle } = await import("drizzle-orm/d1");
    const schema = await import("@repo/db");
    const db = drizzle(c.env.DB, { schema });
    const { normalizeBlocklistValue, republishBlocklist } = await import(
      "../../lib/destination-blocklist.js"
    );

    const now = new Date().toISOString();
    for (const entry of entries) {
      const value = normalizeBlocklistValue(entry.kind, entry.value);
      if (!value) continue;
      await db
        .insert(schema.destinationBlocklist)
        .values({
          id: crypto.randomUUID(),
          kind: entry.kind,
          value,
          action: entry.action,
          reason: entry.reason,
          incidentId: entry.incidentId ?? null,
          createdBy: "admin",
          isActive: true,
          createdAt: now,
        })
        .onConflictDoUpdate({
          target: [schema.destinationBlocklist.kind, schema.destinationBlocklist.value],
          set: { action: entry.action, reason: entry.reason, isActive: true },
        });
    }

    const all = await db.select().from(schema.destinationBlocklist);
    const published = await republishBlocklist(c.env, all);

    await logEvent(
      c.env,
      "blocklist.updated",
      { added: entries.length, activeTotal: published },
      "warn"
    ).catch(() => undefined);

    return ok(c, { added: entries.length, activeTotal: published });
  }
);

/**
 * DELETE /admin/blocklist/:id
 * Soft-disable — the row stays as the paper trail for abuse-report appeals.
 */
admin.delete("/blocklist/:id", async (c) => {
  const { drizzle } = await import("drizzle-orm/d1");
  const schema = await import("@repo/db");
  const { eq } = await import("drizzle-orm");
  const db = drizzle(c.env.DB, { schema });
  const { republishBlocklist } = await import("../../lib/destination-blocklist.js");

  await db
    .update(schema.destinationBlocklist)
    .set({ isActive: false })
    .where(eq(schema.destinationBlocklist.id, c.req.param("id")));

  const all = await db.select().from(schema.destinationBlocklist);
  const published = await republishBlocklist(c.env, all);

  return ok(c, { id: c.req.param("id"), isActive: false, activeTotal: published });
});

/**
 * POST /admin/blocklist/republish
 * Rebuild the KV snapshot from D1. Recovery path if the two ever diverge.
 */
admin.post("/blocklist/republish", async (c) => {
  const { drizzle } = await import("drizzle-orm/d1");
  const schema = await import("@repo/db");
  const db = drizzle(c.env.DB, { schema });
  const { republishBlocklist } = await import("../../lib/destination-blocklist.js");

  const all = await db.select().from(schema.destinationBlocklist);
  const published = await republishBlocklist(c.env, all);
  return ok(c, { activeTotal: published });
});

/**
 * GET /admin/blocklist/propose/:linkId
 *
 * The ergonomic core of "one investigation → permanent coverage". Derives
 * candidate entries from an abusive link's destination and reports how many
 * existing links each candidate would match, so the blast radius is visible
 * before anything is committed. Review, then POST the subset you want.
 */
admin.get("/blocklist/propose/:linkId", async (c) => {
  const { drizzle } = await import("drizzle-orm/d1");
  const schema = await import("@repo/db");
  const { eq } = await import("drizzle-orm");
  const db = drizzle(c.env.DB, { schema });
  const { proposeBlocklistEntries, matchBlocklist, compileBlocklist } = await import(
    "../../lib/destination-blocklist.js"
  );

  const [link] = await db
    .select({ id: schema.links.id, destinationUrl: schema.links.destinationUrl })
    .from(schema.links)
    .where(eq(schema.links.id, c.req.param("linkId")))
    .limit(1);
  if (!link) {
    return c.json({ success: false, error: { code: "NOT_FOUND", message: "Link not found" } }, 404);
  }

  const candidates = proposeBlocklistEntries(link.destinationUrl);
  const allLinks = await db
    .select({
      id: schema.links.id,
      userId: schema.links.userId,
      destinationUrl: schema.links.destinationUrl,
    })
    .from(schema.links);

  const proposals = candidates.map((candidate) => {
    const list = compileBlocklist([{ ...candidate, action: "block" as const, reason: "preview" }]);
    const matches = allLinks.filter((l) => matchBlocklist(l.destinationUrl, list) !== null);
    return {
      ...candidate,
      wouldMatchLinks: matches.length,
      wouldMatchAccounts: new Set(matches.map((m) => m.userId).filter(Boolean)).size,
    };
  });

  return ok(c, { linkId: link.id, destinationUrl: link.destinationUrl, proposals });
});

// -----------------------------------------------------------------------------
// Trust & safety — behavioral abuse strikes
// -----------------------------------------------------------------------------

/**
 * GET /admin/abuse/strikes
 * Full strike list with parsed evidence. Filter by userId / status / action.
 */
admin.get("/abuse/strikes", async (c) => {
  const { drizzle } = await import("drizzle-orm/d1");
  const schema = await import("@repo/db");
  const { and, desc, eq } = await import("drizzle-orm");
  const db = drizzle(c.env.DB, { schema });

  const userId = c.req.query("userId");
  const status = c.req.query("status");
  const action = c.req.query("action");

  const filters = [];
  if (userId) filters.push(eq(schema.abuseStrikes.userId, userId));
  if (status) filters.push(eq(schema.abuseStrikes.status, status as never));
  if (action) filters.push(eq(schema.abuseStrikes.action, action as never));

  const rows = await db
    .select()
    .from(schema.abuseStrikes)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(schema.abuseStrikes.createdAt))
    .limit(Number(c.req.query("limit") ?? 100));

  return ok(c, {
    strikes: rows.map((r) => ({
      ...r,
      evidence: JSON.parse(r.evidence || "[]"),
      linkIds: JSON.parse(r.linkIds || "[]"),
    })),
    total: rows.length,
  });
});

/**
 * POST /admin/abuse/scan
 * On-demand detection pass. Defaults to a shadow dry-run that does not consume
 * the velocity baselines, so it is safe to use for threshold tuning.
 */
admin.post(
  "/abuse/scan",
  zValidator(
    "json",
    z
      .object({
        userId: z.string().optional(),
        mode: z.enum(["shadow", "enforce"]).optional(),
        dryRun: z.boolean().optional().default(true),
      })
      .optional()
  ),
  async (c) => {
    const body = c.req.valid("json");
    const { drizzle } = await import("drizzle-orm/d1");
    const schema = await import("@repo/db");
    const db = drizzle(c.env.DB, { schema });
    const { runAbuseDetectionPass } = await import("../../lib/abuse-detection.js");

    const dryRun = body?.dryRun !== false;
    const result = await runAbuseDetectionPass(c.env, db, {
      forceMode: dryRun ? "shadow" : body?.mode,
      userId: body?.userId,
      skipWriteback: dryRun,
    });
    return ok(c, result);
  }
);

/**
 * POST /admin/abuse/strikes/:id/revoke
 * The appeal path. Count is computed from status='active', so revoking a
 * strike immediately drops the user back down the ladder — no recount job.
 */
admin.post(
  "/abuse/strikes/:id/revoke",
  zValidator(
    "json",
    z.object({ reason: z.string().min(1).max(500), reenableLinks: z.boolean().optional() })
  ),
  async (c) => {
    const strikeId = c.req.param("id");
    const { reason, reenableLinks } = c.req.valid("json");
    const { drizzle } = await import("drizzle-orm/d1");
    const schema = await import("@repo/db");
    const { eq } = await import("drizzle-orm");
    const db = drizzle(c.env.DB, { schema });

    const [strike] = await db
      .select()
      .from(schema.abuseStrikes)
      .where(eq(schema.abuseStrikes.id, strikeId))
      .limit(1);
    if (!strike) {
      return c.json(
        { success: false, error: { code: "NOT_FOUND", message: "Strike not found" } },
        404
      );
    }

    const now = new Date().toISOString();
    await db
      .update(schema.abuseStrikes)
      .set({ status: "revoked", revokedAt: now, revokedBy: "admin", revokedReason: reason })
      .where(eq(schema.abuseStrikes.id, strikeId));

    let reenabled = 0;
    if (reenableLinks) {
      const { reenableLinksForAbuse } = await import("../../lib/abuse-enforcement.js");
      reenabled = await reenableLinksForAbuse(
        c.env,
        db,
        JSON.parse(strike.linkIds || "[]") as string[]
      );
    }

    await logEvent(
      c.env,
      "abuse.strike.revoked",
      { strikeId, userId: strike.userId, reason, reenabledLinks: reenabled },
      "warn"
    ).catch(() => undefined);

    return ok(c, { strikeId, status: "revoked", reenabledLinks: reenabled });
  }
);

/**
 * PATCH /admin/users/:id/abuse-exempt
 * Allowlist a known-good high-volume account: it is still evaluated and
 * logged, but never enforced. No deploy needed.
 */
admin.patch(
  "/users/:id/abuse-exempt",
  zValidator("json", z.object({ exempt: z.boolean() })),
  async (c) => {
    const userId = c.req.param("id");
    const { exempt } = c.req.valid("json");
    const { drizzle } = await import("drizzle-orm/d1");
    const schema = await import("@repo/db");
    const db = drizzle(c.env.DB, { schema });
    const now = new Date().toISOString();

    await db
      .insert(schema.userMetadata)
      .values({ userId, abuseExempt: exempt, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: schema.userMetadata.userId,
        set: { abuseExempt: exempt, updatedAt: now },
      });

    return ok(c, { userId, abuseExempt: exempt });
  }
);

export { admin };
