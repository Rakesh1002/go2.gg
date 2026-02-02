/**
 * Admin Routes
 *
 * Internal-only endpoints for administrative tasks.
 * Protected by admin authentication.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createD1Client, createD1Repositories } from "@repo/db/d1";
import type { Env } from "../../bindings.js";
import { ok, badRequest } from "../../lib/response.js";
import {
  addCollaborator,
  removeCollaborator,
  checkCollaborator,
  verifyGithubUser,
} from "../../lib/github.js";

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

  // Verify admin token (using service role key as admin token)
  // In production, you might want a separate admin token system
  if (token !== c.env.SUPABASE_SERVICE_ROLE_KEY) {
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

// -----------------------------------------------------------------------------
// User Management
// -----------------------------------------------------------------------------

/**
 * GET /admin/users
 * List all users (paginated)
 */
admin.get("/users", async (c) => {
  const limit = parseInt(c.req.query("limit") ?? "50");
  const offset = parseInt(c.req.query("offset") ?? "0");

  const result = await c.env.DB.prepare(
    `SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all();

  const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as total FROM users`).first<{
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
  const limit = parseInt(c.req.query("limit") ?? "50");
  const offset = parseInt(c.req.query("offset") ?? "0");

  const result = await c.env.DB.prepare(
    `SELECT * FROM organizations ORDER BY created_at DESC LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all();

  const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as total FROM organizations`).first<{
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
    query += ` WHERE s.status = ?`;
  }

  query += ` ORDER BY s.created_at DESC`;

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
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM users`).first<{ total: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as total FROM organizations`).first<{ total: number }>(),
    c.env.DB.prepare(`SELECT status, COUNT(*) as count FROM subscriptions GROUP BY status`).all(),
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
  const limit = parseInt(c.req.query("limit") ?? "50");
  const offset = parseInt(c.req.query("offset") ?? "0");
  const status = c.req.query("status");

  let query = `SELECT * FROM purchases`;
  const bindings: (string | number)[] = [];

  if (status) {
    query += ` WHERE status = ?`;
    bindings.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);

  const result = await c.env.DB.prepare(query)
    .bind(...bindings)
    .all();

  const countQuery = status
    ? c.env.DB.prepare(`SELECT COUNT(*) as total FROM purchases WHERE status = ?`).bind(status)
    : c.env.DB.prepare(`SELECT COUNT(*) as total FROM purchases`);

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

export { admin };
