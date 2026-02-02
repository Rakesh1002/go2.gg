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
import { drizzle } from "drizzle-orm/d1";
import { eq, and, desc } from "drizzle-orm";
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

const domains = new Hono<{ Bindings: Env }>();

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

  return ok(c, formatDomain(result[0]));
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
    return ok(c, {
      verified: true,
      message: "Domain is already verified",
    });
  }

  // Check DNS TXT record
  try {
    const verified = await verifyDomainDNS(existing[0].domain, existing[0].verificationToken);

    if (verified) {
      await db
        .update(schema.domains)
        .set({
          verificationStatus: "verified",
          verifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.domains.id, domainId));

      return ok(c, {
        verified: true,
        message: "Domain verified successfully",
      });
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
  } catch (error) {
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
