/**
 * Bulk Operations Routes (v1)
 *
 * Handles CSV import/export and bulk link operations:
 * - POST /bulk/import - Import links from CSV
 * - GET /bulk/export - Export links to CSV
 * - POST /bulk/delete - Bulk delete links
 * - POST /bulk/archive - Bulk archive links
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, inArray, sql } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env, CachedLink } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok, created, noContent, badRequest, paymentRequired } from "../../lib/response.js";
import { generateSlug, isReservedSlug } from "../../lib/slug.js";
import { getOrgUsage, checkLinkLimit } from "../../lib/usage.js";
import {
  parseCSV,
  processImport,
  generateCSV,
  detectImportFormat,
  type ImportFormat,
} from "../../lib/csv.js";

const bulk = new Hono<{ Bindings: Env }>();

// All routes require authentication (supports both API keys and session auth)
bulk.use("/*", apiKeyAuthMiddleware());

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const importQuerySchema = z.object({
  format: z.enum(["go2", "bitly", "rebrandly", "short.io", "dub", "generic"]).optional(),
  dryRun: z.coerce.boolean().optional().default(false),
});

const exportQuerySchema = z.object({
  domain: z.string().optional(),
  tag: z.string().optional(),
  archived: z.coerce.boolean().optional().default(false),
});

const bulkDeleteSchema = z.object({
  linkIds: z.array(z.string().uuid()).min(1).max(1000),
  permanent: z.boolean().optional().default(false),
});

const bulkArchiveSchema = z.object({
  linkIds: z.array(z.string().uuid()).min(1).max(1000),
  archive: z.boolean().default(true),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * POST /bulk/import
 * Import links from CSV file
 *
 * Supports formats: Go2, Bitly, Rebrandly, Short.io, Dub, Generic
 */
bulk.post("/import", zValidator("query", importQuerySchema), async (c) => {
  const user = c.get("user");
  const { format, dryRun } = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  // Get CSV content from request body
  const contentType = c.req.header("content-type") ?? "";
  let csvContent: string;

  if (contentType.includes("multipart/form-data")) {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return badRequest(c, "No file uploaded");
    }
    csvContent = await file.text();
  } else if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
    csvContent = await c.req.text();
  } else {
    return badRequest(c, "Invalid content type. Use multipart/form-data or text/csv");
  }

  // Process the import
  const importResult = processImport(csvContent, format as ImportFormat | undefined);

  if (importResult.links.length === 0) {
    return badRequest(c, "No valid links found in CSV", "INVALID_CSV", {
      errors: importResult.errors,
    });
  }

  // Check usage limits
  const usage = await getOrgUsage(db, user.id, user.organizationId);
  const linkCheck = checkLinkLimit(usage);

  if (!linkCheck.allowed) {
    return paymentRequired(c, linkCheck.reason!, {
      limit: linkCheck.limit,
      current: linkCheck.current,
      upgradeUrl: "/dashboard/billing",
    });
  }

  // If dry run, return preview without creating links
  if (dryRun) {
    return ok(c, {
      dryRun: true,
      preview: {
        total: importResult.links.length,
        valid: importResult.success,
        invalid: importResult.failed,
        links: importResult.links.slice(0, 10), // Preview first 10
      },
      errors: importResult.errors,
      detectedFormat: format ?? detectImportFormat(Object.keys(parseCSV(csvContent)[0] ?? {})),
    });
  }

  // Create links
  const defaultDomain = c.env.DEFAULT_DOMAIN ?? "go2.gg";
  const now = new Date().toISOString();
  const createdLinks: Array<{ id: string; shortUrl: string; destinationUrl: string }> = [];
  const creationErrors: Array<{ row: number; reason: string }> = [];

  for (let i = 0; i < importResult.links.length; i++) {
    const link = importResult.links[i];
    const domain = link.domain || defaultDomain;

    // Generate slug if not provided
    let slug = link.slug ?? generateSlug();

    // Check if slug is reserved
    if (isReservedSlug(slug)) {
      slug = generateSlug();
    }

    // Check if slug already exists for this domain
    const existing = await db
      .select({ id: schema.links.id })
      .from(schema.links)
      .where(and(eq(schema.links.domain, domain), eq(schema.links.slug, slug)))
      .limit(1);

    if (existing.length > 0) {
      // Generate new slug
      slug = generateSlug();
    }

    const id = crypto.randomUUID();

    try {
      const newLink: schema.NewLink = {
        id,
        userId: user.id,
        organizationId: user.organizationId,
        slug,
        destinationUrl: link.destinationUrl,
        domain,
        title: link.title,
        description: link.description,
        tags: link.tags ? JSON.stringify(link.tags) : null,
        expiresAt: link.expiresAt,
        clickLimit: link.clickLimit,
        geoTargets: link.geoTargets ? JSON.stringify(link.geoTargets) : null,
        deviceTargets: link.deviceTargets ? JSON.stringify(link.deviceTargets) : null,
        utmSource: link.utmSource,
        utmMedium: link.utmMedium,
        utmCampaign: link.utmCampaign,
        utmTerm: link.utmTerm,
        utmContent: link.utmContent,
        iosUrl: link.iosUrl,
        androidUrl: link.androidUrl,
        ogTitle: link.ogTitle,
        ogDescription: link.ogDescription,
        ogImage: link.ogImage,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(schema.links).values(newLink);

      // Sync to KV
      const kvKey = `${domain}:${slug}`;
      const cachedLink: CachedLink = {
        id,
        destinationUrl: link.destinationUrl,
        domain,
        slug,
        geoTargets: link.geoTargets,
        deviceTargets: link.deviceTargets,
        expiresAt: link.expiresAt,
        clickLimit: link.clickLimit,
        iosUrl: link.iosUrl,
        androidUrl: link.androidUrl,
      };
      await c.env.LINKS_KV.put(kvKey, JSON.stringify(cachedLink), {
        expirationTtl: 60 * 60 * 24 * 30,
      });

      createdLinks.push({
        id,
        shortUrl: `https://${domain}/${slug}`,
        destinationUrl: link.destinationUrl,
      });
    } catch (error) {
      creationErrors.push({
        row: i + 1,
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return created(c, {
    imported: createdLinks.length,
    failed: creationErrors.length + importResult.failed,
    links: createdLinks,
    errors: [...importResult.errors, ...creationErrors],
  });
});

/**
 * GET /bulk/export
 * Export links to CSV file
 */
bulk.get("/export", zValidator("query", exportQuerySchema), async (c) => {
  const user = c.get("user");
  const { domain, tag, archived } = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  // Build where conditions
  const conditions = [eq(schema.links.userId, user.id)];

  if (!archived) {
    conditions.push(eq(schema.links.isArchived, false));
  }

  if (domain) {
    conditions.push(eq(schema.links.domain, domain));
  }

  // Query links
  const links = await db
    .select()
    .from(schema.links)
    .where(and(...conditions))
    .orderBy(schema.links.createdAt);

  // Filter by tag if specified
  let filteredLinks = links;
  if (tag) {
    filteredLinks = links.filter((link) => {
      if (!link.tags) return false;
      try {
        const tags = JSON.parse(link.tags) as string[];
        return tags.includes(tag);
      } catch {
        return false;
      }
    });
  }

  // Format links for export
  const formattedLinks = filteredLinks.map((link) => ({
    id: link.id,
    shortUrl: `https://${link.domain}/${link.slug}`,
    destinationUrl: link.destinationUrl,
    slug: link.slug,
    domain: link.domain,
    title: link.title,
    description: link.description,
    tags: link.tags ? JSON.parse(link.tags) : [],
    hasPassword: !!link.passwordHash,
    expiresAt: link.expiresAt,
    clickLimit: link.clickLimit,
    clickCount: link.clickCount,
    geoTargets: link.geoTargets ? JSON.parse(link.geoTargets) : null,
    deviceTargets: link.deviceTargets ? JSON.parse(link.deviceTargets) : null,
    utm: {
      source: link.utmSource,
      medium: link.utmMedium,
      campaign: link.utmCampaign,
      term: link.utmTerm,
      content: link.utmContent,
    },
    deepLinks: {
      ios: link.iosUrl,
      android: link.androidUrl,
    },
    og: {
      title: link.ogTitle,
      description: link.ogDescription,
      image: link.ogImage,
    },
    isArchived: link.isArchived ?? undefined,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    lastClickedAt: link.lastClickedAt,
  }));

  // Generate CSV
  const csv = generateCSV(formattedLinks);

  // Return as downloadable file
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="go2-links-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
});

/**
 * POST /bulk/delete
 * Bulk delete (archive) links
 */
bulk.post("/delete", zValidator("json", bulkDeleteSchema), async (c) => {
  const user = c.get("user");
  const { linkIds, permanent } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Get links to verify ownership
  const links = await db
    .select({ id: schema.links.id, domain: schema.links.domain, slug: schema.links.slug })
    .from(schema.links)
    .where(and(eq(schema.links.userId, user.id), inArray(schema.links.id, linkIds)));

  if (links.length === 0) {
    return badRequest(c, "No links found to delete");
  }

  const now = new Date().toISOString();

  if (permanent) {
    // Hard delete
    await db
      .delete(schema.links)
      .where(and(eq(schema.links.userId, user.id), inArray(schema.links.id, linkIds)));
  } else {
    // Soft delete (archive)
    await db
      .update(schema.links)
      .set({ isArchived: true, updatedAt: now })
      .where(and(eq(schema.links.userId, user.id), inArray(schema.links.id, linkIds)));
  }

  // Remove from KV
  for (const link of links) {
    await c.env.LINKS_KV.delete(`${link.domain}:${link.slug}`);
  }

  return ok(c, {
    deleted: links.length,
    permanent,
    linkIds: links.map((l) => l.id),
  });
});

/**
 * POST /bulk/archive
 * Bulk archive or unarchive links
 */
bulk.post("/archive", zValidator("json", bulkArchiveSchema), async (c) => {
  const user = c.get("user");
  const { linkIds, archive } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Get links to verify ownership
  const links = await db
    .select()
    .from(schema.links)
    .where(and(eq(schema.links.userId, user.id), inArray(schema.links.id, linkIds)));

  if (links.length === 0) {
    return badRequest(c, "No links found");
  }

  const now = new Date().toISOString();

  // Update archive status
  await db
    .update(schema.links)
    .set({ isArchived: archive, updatedAt: now })
    .where(and(eq(schema.links.userId, user.id), inArray(schema.links.id, linkIds)));

  // Update KV (remove if archiving, add if unarchiving)
  for (const link of links) {
    const kvKey = `${link.domain}:${link.slug}`;

    if (archive) {
      await c.env.LINKS_KV.delete(kvKey);
    } else {
      // Re-add to KV
      const cachedLink: CachedLink = {
        id: link.id,
        destinationUrl: link.destinationUrl,
        domain: link.domain,
        slug: link.slug,
        geoTargets: link.geoTargets ? JSON.parse(link.geoTargets) : undefined,
        deviceTargets: link.deviceTargets ? JSON.parse(link.deviceTargets) : undefined,
        passwordHash: link.passwordHash ?? undefined,
        expiresAt: link.expiresAt ?? undefined,
        clickLimit: link.clickLimit ?? undefined,
        iosUrl: link.iosUrl ?? undefined,
        androidUrl: link.androidUrl ?? undefined,
      };
      await c.env.LINKS_KV.put(kvKey, JSON.stringify(cachedLink), {
        expirationTtl: 60 * 60 * 24 * 30,
      });
    }
  }

  return ok(c, {
    updated: links.length,
    archived: archive,
    linkIds: links.map((l) => l.id),
  });
});

export { bulk };
