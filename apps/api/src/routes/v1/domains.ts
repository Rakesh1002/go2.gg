/**
 * Domain Routes (v1)
 *
 * Custom domain management:
 * - POST /domains - Add a custom domain
 * - GET /domains - List user's domains
 * - GET /domains/:id - Get domain details
 * - DELETE /domains/:id - Remove domain
 * - POST /domains/:id/verify - Verify domain ownership
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import {
  ok,
  created,
  noContent,
  notFound,
  forbidden,
  badRequest,
  conflict,
  paymentRequired,
} from "../../lib/response.js";
import { getOrgUsage, checkDomainLimit } from "../../lib/usage.js";
import { dispatchWebhookEvent } from "../../lib/webhook-dispatcher.js";
import {
  createCustomHostname,
  deleteCustomHostname,
  findCustomHostnameByHostname,
  getCustomHostname,
} from "../../lib/cf-for-saas.js";
import { bioHostKey, recomputeBioHost } from "../../lib/bio-host.js";

const domains = new Hono<{ Bindings: Env }>();

type SslResult = {
  status: string;
  validationRecords: Array<{ type: string; name: string; value: string }>;
  errors: string[];
};

/**
 * Register (or re-read) the Cloudflare for SaaS custom hostname for a verified
 * domain and persist its id + SSL status. Best-effort: a CF failure is surfaced
 * in the returned status, never thrown, so it can't undo verification. Idempotent
 * — safe to call again for a verified row that has no hostname id yet.
 */
async function provisionCustomHostname(
  env: Env,
  db: DrizzleD1Database<typeof schema>,
  row: { id: string; domain: string; customHostnameId: string | null }
): Promise<SslResult> {
  let customHostname: Awaited<ReturnType<typeof createCustomHostname>> | null = null;
  // Read the stored hostname if we have one; a failure (e.g. it was deleted on
  // Cloudflare, or a delete whose local cleanup failed) falls through to
  // find-or-create so a stale id can't wedge provisioning forever.
  if (row.customHostnameId) {
    try {
      customHostname = await getCustomHostname(env, row.customHostnameId);
    } catch (err) {
      console.error(
        "stored custom hostname unreadable, re-provisioning:",
        err instanceof Error ? err.message : err
      );
    }
  }
  if (!customHostname) {
    try {
      // Adopt an existing hostname (orphan from a lost response / failed delete)
      // before creating, so a retry never POSTs a duplicate.
      customHostname =
        (await findCustomHostnameByHostname(env, row.domain)) ??
        (await createCustomHostname(env, row.domain));
    } catch (err) {
      console.error("custom hostname provisioning failed:", err instanceof Error ? err.message : err);
    }
  }
  if (!customHostname) {
    return {
      status: "provisioning_failed",
      validationRecords: [],
      errors: ["Could not reach Cloudflare to issue a certificate. Retry verification."],
    };
  }
  await db
    .update(schema.domains)
    .set({
      customHostnameId: customHostname.id,
      sslStatus: customHostname.sslStatus,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.domains.id, row.id));
  return {
    status: customHostname.sslStatus,
    validationRecords: customHostname.validationRecords,
    errors: customHostname.validationErrors,
  };
}

// All routes require authentication (supports both API keys and session auth)
domains.use("/*", apiKeyAuthMiddleware());

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const addDomainSchema = z.object({
  domain: z
    .string()
    .min(1)
    .max(253)
    .regex(/^(?!-)([a-zA-Z0-9-]{1,63}(?<!-)\.)+[a-zA-Z]{2,}$/, "Invalid domain format"),
  defaultRedirectUrl: z.string().url().optional(),
  notFoundUrl: z.string().url().optional(),
});

const updateDomainSchema = z.object({
  defaultRedirectUrl: z.string().url().optional().nullable(),
  notFoundUrl: z.string().url().optional().nullable(),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * POST /domains
 * Add a new custom domain
 */
domains.post("/", zValidator("json", addDomainSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Check usage limits
  const usage = await getOrgUsage(db, user.id, user.organizationId);
  const domainCheck = checkDomainLimit(usage);

  if (!domainCheck.allowed) {
    return paymentRequired(c, domainCheck.reason!, {
      limit: domainCheck.limit,
      current: domainCheck.current,
      upgradeUrl: "/dashboard/billing",
    });
  }

  const domainName = input.domain.toLowerCase();

  // Check if domain is already registered
  const existing = await db
    .select({ id: schema.domains.id })
    .from(schema.domains)
    .where(eq(schema.domains.domain, domainName))
    .limit(1);

  if (existing.length > 0) {
    return conflict(c, "This domain is already registered");
  }

  // Generate verification token
  const verificationToken = `go2-verify=${crypto.randomUUID().replace(/-/g, "")}`;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newDomain: schema.NewDomain = {
    id,
    userId: user.id,
    organizationId: user.organizationId,
    domain: domainName,
    verificationToken,
    defaultRedirectUrl: input.defaultRedirectUrl,
    notFoundUrl: input.notFoundUrl,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.domains).values(newDomain);

  const result = await db.select().from(schema.domains).where(eq(schema.domains.id, id)).limit(1);

  return created(c, formatDomain(result[0]));
});

/**
 * GET /domains
 * List user's custom domains
 */
domains.get("/", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });

  const results = await db
    .select()
    .from(schema.domains)
    .where(eq(schema.domains.userId, user.id))
    .orderBy(desc(schema.domains.createdAt));

  return ok(c, results.map(formatDomain));
});

/**
 * GET /domains/:id
 * Get domain details
 */
domains.get("/:id", async (c) => {
  const user = c.get("user");
  const domainId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const result = await db
    .select()
    .from(schema.domains)
    .where(eq(schema.domains.id, domainId))
    .limit(1);

  if (!result[0]) {
    return notFound(c, "Domain not found");
  }

  if (result[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this domain");
  }

  // Refresh the cert status from Cloudflare so the dashboard reflects
  // pending -> active without the user re-verifying. Best-effort.
  let row = result[0];
  if (row.customHostnameId) {
    try {
      const ch = await getCustomHostname(c.env, row.customHostnameId);
      if (ch.sslStatus !== row.sslStatus) {
        await db
          .update(schema.domains)
          .set({ sslStatus: ch.sslStatus, updatedAt: new Date().toISOString() })
          .where(eq(schema.domains.id, domainId));
        row = { ...row, sslStatus: ch.sslStatus };
      }
    } catch (err) {
      console.error("ssl status refresh failed:", err instanceof Error ? err.message : err);
    }
  }

  return ok(c, formatDomain(row));
});

/**
 * PATCH /domains/:id
 * Update domain settings
 */
domains.patch("/:id", zValidator("json", updateDomainSchema), async (c) => {
  const user = c.get("user");
  const domainId = c.req.param("id");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.domains)
    .where(eq(schema.domains.id, domainId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Domain not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this domain");
  }

  // Which gallery serves the domain root is derived from the galleries on the
  // domain (see lib/bio-host.ts recomputeBioHost), not set here.
  await db
    .update(schema.domains)
    .set({
      defaultRedirectUrl: input.defaultRedirectUrl,
      notFoundUrl: input.notFoundUrl,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.domains.id, domainId));

  const result = await db
    .select()
    .from(schema.domains)
    .where(eq(schema.domains.id, domainId))
    .limit(1);

  return ok(c, formatDomain(result[0]));
});

/**
 * DELETE /domains/:id
 * Remove a custom domain
 */
domains.delete("/:id", async (c) => {
  const user = c.get("user");
  const domainId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.domains)
    .where(eq(schema.domains.id, domainId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Domain not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this domain");
  }

  // Check if domain has any links
  const linksWithDomain = await db
    .select({ id: schema.links.id })
    .from(schema.links)
    .where(eq(schema.links.domain, existing[0].domain))
    .limit(1);

  if (linksWithDomain.length > 0) {
    return badRequest(
      c,
      "Cannot delete domain with existing links. Please delete or move the links first."
    );
  }

  // Tear down the Cloudflare custom hostname (releases the cert) and the bio
  // KV mapping. Best-effort: a stale hostname shouldn't block domain removal.
  if (existing[0].customHostnameId) {
    try {
      await deleteCustomHostname(c.env, existing[0].customHostnameId);
    } catch (err) {
      console.error("custom hostname delete failed:", err instanceof Error ? err.message : err);
    }
  }
  await c.env.LINKS_KV.delete(bioHostKey(existing[0].domain));

  await db.delete(schema.domains).where(eq(schema.domains.id, domainId));

  return noContent(c);
});

/**
 * POST /domains/:id/verify
 * Verify domain ownership via DNS TXT record
 */
domains.post("/:id/verify", async (c) => {
  const user = c.get("user");
  const domainId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.domains)
    .where(eq(schema.domains.id, domainId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Domain not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this domain");
  }

  if (existing[0].verificationStatus === "verified") {
    // Already verified: refresh the cert status, or provision if it never got a
    // hostname (pre-feature row, or a past Cloudflare failure), then reconcile
    // which gallery serves the root. No need to re-check the ownership TXT.
    const ssl = await provisionCustomHostname(c.env, db, existing[0]);
    await recomputeBioHost(db, c.env, existing[0].domain);
    return ok(c, { verified: true, message: "Domain is already verified", ssl });
  }

  // Check DNS TXT record
  try {
    const verified = await verifyDomainDNS(existing[0].domain, existing[0].verificationToken);

    if (verified) {
      const verifiedAt = new Date().toISOString();
      await db
        .update(schema.domains)
        .set({ verificationStatus: "verified", verifiedAt, updatedAt: verifiedAt })
        .where(eq(schema.domains.id, domainId));

      // Register the custom hostname so the domain gets a DV cert and serves,
      // then bind any already-published gallery sitting on this domain.
      const ssl = await provisionCustomHostname(c.env, db, existing[0]);
      await recomputeBioHost(db, c.env, existing[0].domain);

      c.executionCtx.waitUntil(
        dispatchWebhookEvent(c.env, user.id, user.organizationId, "domain.verified", {
          id: existing[0].id,
          domain: existing[0].domain,
          verifiedAt,
        })
      );

      return ok(c, { verified: true, message: "Domain verified successfully", ssl });
    }

    return ok(c, {
      verified: false,
      message: "DNS TXT record not found. Please add the verification record and try again.",
      expectedRecord: {
        type: "TXT",
        name: `_go2.${existing[0].domain}`,
        value: existing[0].verificationToken,
      },
    });
  } catch (_error) {
    return ok(c, {
      verified: false,
      message: "Failed to verify DNS records. Please try again later.",
    });
  }
});

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Verify domain ownership via DNS TXT record
 */
async function verifyDomainDNS(domain: string, expectedToken: string): Promise<boolean> {
  try {
    // Use Cloudflare's DNS-over-HTTPS endpoint
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=_go2.${domain}&type=TXT`,
      {
        headers: {
          Accept: "application/dns-json",
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { Answer?: Array<{ data: string }> };

    if (!data.Answer) {
      return false;
    }

    // Check if any TXT record matches our token
    return data.Answer.some((record) => {
      // TXT records are usually quoted in DNS responses
      const value = record.data.replace(/^"|"$/g, "");
      return value === expectedToken;
    });
  } catch (error) {
    console.error("DNS verification error:", error);
    return false;
  }
}

/**
 * Format domain for API response
 */
function formatDomain(domain: schema.Domain) {
  return {
    id: domain.id,
    domain: domain.domain,
    verificationStatus: domain.verificationStatus,
    verifiedAt: domain.verifiedAt,
    sslStatus: domain.sslStatus,
    bioGalleryId: domain.bioGalleryId,
    defaultRedirectUrl: domain.defaultRedirectUrl,
    notFoundUrl: domain.notFoundUrl,
    dnsRecords: {
      verification: {
        type: "TXT",
        name: `_go2.${domain.domain}`,
        value: domain.verificationToken,
      },
      cname: {
        type: "CNAME",
        name: domain.domain,
        value: "cname.go2.gg",
      },
    },
    createdAt: domain.createdAt,
    updatedAt: domain.updatedAt,
  };
}

export { domains };
