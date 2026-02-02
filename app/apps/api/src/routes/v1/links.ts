/**
 * Link Routes (v1)
 *
 * CRUD operations for short links:
 * - POST /links - Create a new link
 * - GET /links - List user's links (paginated)
 * - GET /links/:id - Get link by ID
 * - PATCH /links/:id - Update link
 * - DELETE /links/:id - Archive/delete link
 * - GET /links/:id/stats - Get link analytics
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env, CachedLink } from "../../bindings.js";
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
import { generateSlug, isReservedSlug } from "../../lib/slug.js";
import { generateSingleAISlug } from "../../lib/ai-slug.js";
import { getOrgUsage, checkLinkLimit } from "../../lib/usage.js";
import { dispatchWebhookEvent } from "../../lib/webhook-dispatcher.js";

const links = new Hono<{ Bindings: Env }>();

// All routes require authentication (supports both API keys and session auth)
links.use("/*", apiKeyAuthMiddleware());

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

// Tracking pixel schema
const trackingPixelSchema = z.object({
  type: z.enum([
    "facebook",
    "google",
    "linkedin",
    "tiktok",
    "twitter",
    "pinterest",
    "ga4",
    "custom",
  ]),
  pixelId: z.string().min(1).max(100),
  enabled: z.boolean(),
  events: z.array(z.string().max(50)).optional(),
  customScript: z.string().max(5000).optional(),
});

const createLinkSchema = z.object({
  destinationUrl: z.string().url("Invalid URL"),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Slug can only contain letters, numbers, hyphens, and underscores")
    .optional(),
  domain: z.string().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  password: z.string().min(4).max(100).optional(),
  expiresAt: z.string().datetime().optional(),
  clickLimit: z.number().int().positive().optional(),
  geoTargets: z.record(z.string().url()).optional(),
  deviceTargets: z.record(z.string().url()).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmTerm: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
  iosUrl: z.string().url().optional(),
  androidUrl: z.string().url().optional(),
  ogTitle: z.string().max(200).optional(),
  ogDescription: z.string().max(500).optional(),
  ogImage: z.string().url().optional(),
  // Retargeting pixels
  trackingPixels: z.array(trackingPixelSchema).max(10).optional(),
  enablePixelTracking: z.boolean().optional(),
  requirePixelConsent: z.boolean().optional(),
  // Analytics configuration
  trackAnalytics: z.boolean().optional().default(true), // Enable/disable click tracking
  publicStats: z.boolean().optional().default(false), // Make stats publicly accessible
  trackConversion: z.boolean().optional().default(false), // Enable conversion tracking
  conversionUrl: z.string().max(500).optional(), // Conversion goal URL pattern
  skipDeduplication: z.boolean().optional().default(false), // Skip click deduplication
});

const updateLinkSchema = createLinkSchema.partial().extend({
  isArchived: z.boolean().optional(),
  // Allow clearing tracking pixels
  clearTrackingPixels: z.boolean().optional(),
});

const listLinksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  domain: z.string().optional(),
  tag: z.string().optional(),
  archived: z.coerce.boolean().optional().default(false),
  sort: z.enum(["created", "clicks", "updated"]).default("created"),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * POST /links
 * Create a new short link
 */
links.post("/", zValidator("json", createLinkSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

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

  // Determine domain
  const domain = input.domain ?? c.env.DEFAULT_DOMAIN ?? "go2.gg";

  // Generate or validate slug
  let slug: string;
  if (input.slug) {
    slug = input.slug;
  } else {
    // Use AI to generate a relevant, memorable slug
    try {
      slug = await generateSingleAISlug(c.env.AI, input.destinationUrl, 10);
    } catch {
      // Fall back to random slug if AI fails
      slug = generateSlug();
    }
  }

  // Check if slug is reserved
  if (isReservedSlug(slug)) {
    return badRequest(c, "This slug is reserved");
  }

  // Check if slug already exists for this domain
  const existing = await db
    .select({ id: schema.links.id, isArchived: schema.links.isArchived })
    .from(schema.links)
    .where(and(eq(schema.links.domain, domain), eq(schema.links.slug, slug)))
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].isArchived) {
      // If the existing link is archived, hard-delete it to free up the slug
      await db.delete(schema.links).where(eq(schema.links.id, existing[0].id));
    } else {
      // Active link with this slug exists
      return conflict(c, "This slug is already in use");
    }
  }

  // Hash password if provided
  let passwordHash: string | undefined;
  if (input.password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input.password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    passwordHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newLink: schema.NewLink = {
    id,
    userId: user.id,
    organizationId: user.organizationId,
    slug,
    destinationUrl: input.destinationUrl,
    domain,
    title: input.title,
    description: input.description,
    tags: input.tags ? JSON.stringify(input.tags) : null,
    passwordHash,
    expiresAt: input.expiresAt,
    clickLimit: input.clickLimit,
    geoTargets: input.geoTargets ? JSON.stringify(input.geoTargets) : null,
    deviceTargets: input.deviceTargets ? JSON.stringify(input.deviceTargets) : null,
    utmSource: input.utmSource,
    utmMedium: input.utmMedium,
    utmCampaign: input.utmCampaign,
    utmTerm: input.utmTerm,
    utmContent: input.utmContent,
    iosUrl: input.iosUrl,
    androidUrl: input.androidUrl,
    ogTitle: input.ogTitle,
    ogDescription: input.ogDescription,
    ogImage: input.ogImage,
    // Retargeting pixels
    trackingPixels: input.trackingPixels ? JSON.stringify(input.trackingPixels) : null,
    enablePixelTracking: input.enablePixelTracking ?? false,
    requirePixelConsent: input.requirePixelConsent ?? false,
    // Analytics configuration
    trackAnalytics: input.trackAnalytics ?? true,
    publicStats: input.publicStats ?? false,
    trackConversion: input.trackConversion ?? false,
    conversionUrl: input.conversionUrl,
    skipDeduplication: input.skipDeduplication ?? false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await db.insert(schema.links).values(newLink);
  } catch (error) {
    // Handle UNIQUE constraint violation
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return conflict(c, "This short link already exists. Please try a different slug.");
    }
    throw error;
  }

  // Sync to KV for fast edge lookups
  await syncLinkToKV(c.env.LINKS_KV, {
    id,
    destinationUrl: input.destinationUrl,
    domain,
    slug,
    userId: user.id,
    organizationId: user.organizationId,
    geoTargets: input.geoTargets,
    deviceTargets: input.deviceTargets,
    passwordHash,
    expiresAt: input.expiresAt,
    clickLimit: input.clickLimit,
    iosUrl: input.iosUrl,
    androidUrl: input.androidUrl,
    // Retargeting pixels
    trackingPixels: input.trackingPixels,
    enablePixelTracking: input.enablePixelTracking,
    requirePixelConsent: input.requirePixelConsent,
    // Analytics configuration
    trackAnalytics: input.trackAnalytics ?? true,
    publicStats: input.publicStats ?? false,
    trackConversion: input.trackConversion ?? false,
    skipDeduplication: input.skipDeduplication ?? false,
  });

  // Fetch the created link
  const result = await db.select().from(schema.links).where(eq(schema.links.id, id)).limit(1);

  const formattedLink = formatLink(result[0], domain);

  // Dispatch webhook event (non-blocking)
  c.executionCtx.waitUntil(
    dispatchWebhookEvent(c.env, user.id, user.organizationId, "link.created", {
      link: formattedLink,
    })
  );

  return created(c, formattedLink);
});

/**
 * GET /links/check-slug
 * Check if a slug is available
 */
const checkSlugSchema = z.object({
  slug: z.string().min(1).max(50),
  domain: z.string().optional(),
});

links.get("/check-slug", zValidator("query", checkSlugSchema), async (c) => {
  const { slug, domain: requestedDomain } = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  // Default domain
  const domain = requestedDomain || "go2.gg";

  // Check if slug is reserved
  if (isReservedSlug(slug)) {
    return ok(c, { available: false, reason: "reserved" });
  }

  // Check if slug exists for this domain
  const existing = await db
    .select({ id: schema.links.id })
    .from(schema.links)
    .where(and(eq(schema.links.slug, slug), eq(schema.links.domain, domain)))
    .limit(1);

  return ok(c, {
    available: existing.length === 0,
    slug,
    domain,
    reason: existing.length > 0 ? "taken" : null,
  });
});

/**
 * GET /links
 * List user's links
 */
links.get("/", zValidator("query", listLinksSchema), async (c) => {
  const user = c.get("user");
  const { page, perPage, search, domain, tag, archived, sort } = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  // Ensure user is properly authenticated
  if (!user?.id) {
    return c.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User authentication failed",
        },
      },
      401
    );
  }

  const offset = (page - 1) * perPage;

  // Build where conditions
  const conditions = [eq(schema.links.userId, user.id)];

  if (!archived) {
    conditions.push(eq(schema.links.isArchived, false));
  }

  if (domain) {
    conditions.push(eq(schema.links.domain, domain));
  }

  if (search) {
    conditions.push(
      or(
        like(schema.links.slug, `%${search}%`),
        like(schema.links.destinationUrl, `%${search}%`),
        like(schema.links.title, `%${search}%`)
      )!
    );
  }

  // Build sort
  const orderBy =
    sort === "clicks"
      ? desc(schema.links.clickCount)
      : sort === "updated"
        ? desc(schema.links.updatedAt)
        : desc(schema.links.createdAt);

  // Query links
  const results = await db
    .select()
    .from(schema.links)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(perPage)
    .offset(offset);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.links)
    .where(and(...conditions));

  const total = countResult[0]?.count ?? 0;

  const defaultDomain = c.env.DEFAULT_DOMAIN || "go2.gg";
  return ok(
    c,
    results.map((link) => formatLink(link, defaultDomain)),
    {
      page,
      perPage,
      total,
      hasMore: offset + results.length < total,
    }
  );
});

/**
 * GET /links/:id
 * Get link by ID
 */
links.get("/:id", async (c) => {
  const user = c.get("user");
  const linkId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const result = await db.select().from(schema.links).where(eq(schema.links.id, linkId)).limit(1);

  if (!result[0]) {
    return notFound(c, "Link not found");
  }

  // Check ownership
  if (result[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this link");
  }

  return ok(c, formatLink(result[0], c.env.DEFAULT_DOMAIN));
});

/**
 * PATCH /links/:id
 * Update link
 */
links.patch("/:id", zValidator("json", updateLinkSchema), async (c) => {
  const user = c.get("user");
  const linkId = c.req.param("id");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Get existing link
  const existing = await db.select().from(schema.links).where(eq(schema.links.id, linkId)).limit(1);

  if (!existing[0]) {
    return notFound(c, "Link not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this link");
  }

  // Check slug uniqueness if changed
  if (input.slug && input.slug !== existing[0].slug) {
    if (isReservedSlug(input.slug)) {
      return badRequest(c, "This slug is reserved");
    }

    const domain = input.domain ?? existing[0].domain;
    const slugExists = await db
      .select({ id: schema.links.id, isArchived: schema.links.isArchived })
      .from(schema.links)
      .where(and(eq(schema.links.domain, domain), eq(schema.links.slug, input.slug)))
      .limit(1);

    if (slugExists.length > 0) {
      if (slugExists[0].isArchived) {
        // If the existing link is archived, hard-delete it to free up the slug
        await db.delete(schema.links).where(eq(schema.links.id, slugExists[0].id));
      } else {
        // Active link with this slug exists
        return conflict(c, "This slug is already in use");
      }
    }
  }

  // Hash new password if provided
  let passwordHash = existing[0].passwordHash;
  if (input.password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input.password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    passwordHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const updateData: Partial<schema.NewLink> = {
    ...(input.destinationUrl && { destinationUrl: input.destinationUrl }),
    ...(input.slug && { slug: input.slug }),
    ...(input.domain && { domain: input.domain }),
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.tags !== undefined && { tags: JSON.stringify(input.tags) }),
    ...(input.password && { passwordHash }),
    ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt }),
    ...(input.clickLimit !== undefined && { clickLimit: input.clickLimit }),
    ...(input.geoTargets !== undefined && { geoTargets: JSON.stringify(input.geoTargets) }),
    ...(input.deviceTargets !== undefined && {
      deviceTargets: JSON.stringify(input.deviceTargets),
    }),
    ...(input.utmSource !== undefined && { utmSource: input.utmSource }),
    ...(input.utmMedium !== undefined && { utmMedium: input.utmMedium }),
    ...(input.utmCampaign !== undefined && { utmCampaign: input.utmCampaign }),
    ...(input.utmTerm !== undefined && { utmTerm: input.utmTerm }),
    ...(input.utmContent !== undefined && { utmContent: input.utmContent }),
    ...(input.iosUrl !== undefined && { iosUrl: input.iosUrl }),
    ...(input.androidUrl !== undefined && { androidUrl: input.androidUrl }),
    ...(input.ogTitle !== undefined && { ogTitle: input.ogTitle }),
    ...(input.ogDescription !== undefined && { ogDescription: input.ogDescription }),
    ...(input.ogImage !== undefined && { ogImage: input.ogImage }),
    ...(input.isArchived !== undefined && { isArchived: input.isArchived }),
    // Retargeting pixels
    ...(input.trackingPixels !== undefined && {
      trackingPixels: JSON.stringify(input.trackingPixels),
    }),
    ...(input.clearTrackingPixels && { trackingPixels: null }),
    ...(input.enablePixelTracking !== undefined && {
      enablePixelTracking: input.enablePixelTracking,
    }),
    ...(input.requirePixelConsent !== undefined && {
      requirePixelConsent: input.requirePixelConsent,
    }),
    // Analytics configuration
    ...(input.trackAnalytics !== undefined && { trackAnalytics: input.trackAnalytics }),
    ...(input.publicStats !== undefined && { publicStats: input.publicStats }),
    ...(input.trackConversion !== undefined && { trackConversion: input.trackConversion }),
    ...(input.conversionUrl !== undefined && { conversionUrl: input.conversionUrl }),
    ...(input.skipDeduplication !== undefined && { skipDeduplication: input.skipDeduplication }),
    updatedAt: new Date().toISOString(),
  };

  await db.update(schema.links).set(updateData).where(eq(schema.links.id, linkId));

  // Update KV cache
  const updatedLink = { ...existing[0], ...updateData };
  const oldKvKey = `${existing[0].domain}:${existing[0].slug}`;
  const newKvKey = `${updatedLink.domain}:${updatedLink.slug}`;

  // Delete old key if slug or domain changed
  if (oldKvKey !== newKvKey) {
    await c.env.LINKS_KV.delete(oldKvKey);
  }

  // Only sync if not archived
  if (!updatedLink.isArchived) {
    await syncLinkToKV(c.env.LINKS_KV, {
      id: linkId,
      destinationUrl: updatedLink.destinationUrl!,
      domain: updatedLink.domain!,
      slug: updatedLink.slug!,
      userId: updatedLink.userId ?? undefined,
      organizationId: updatedLink.organizationId ?? undefined,
      geoTargets: updatedLink.geoTargets ? JSON.parse(updatedLink.geoTargets) : undefined,
      deviceTargets: updatedLink.deviceTargets ? JSON.parse(updatedLink.deviceTargets) : undefined,
      passwordHash: updatedLink.passwordHash ?? undefined,
      expiresAt: updatedLink.expiresAt ?? undefined,
      clickLimit: updatedLink.clickLimit ?? undefined,
      iosUrl: updatedLink.iosUrl ?? undefined,
      androidUrl: updatedLink.androidUrl ?? undefined,
      // Retargeting pixels
      trackingPixels: updatedLink.trackingPixels
        ? JSON.parse(updatedLink.trackingPixels)
        : undefined,
      enablePixelTracking: updatedLink.enablePixelTracking ?? undefined,
      requirePixelConsent: updatedLink.requirePixelConsent ?? undefined,
      // Analytics configuration
      trackAnalytics: updatedLink.trackAnalytics ?? true,
      publicStats: updatedLink.publicStats ?? false,
      trackConversion: updatedLink.trackConversion ?? false,
      skipDeduplication: updatedLink.skipDeduplication ?? false,
    });
  } else {
    // Remove from KV if archived
    await c.env.LINKS_KV.delete(newKvKey);
  }

  // Fetch updated link
  const result = await db.select().from(schema.links).where(eq(schema.links.id, linkId)).limit(1);

  const formattedLink = formatLink(result[0], c.env.DEFAULT_DOMAIN);

  // Dispatch webhook event (non-blocking)
  c.executionCtx.waitUntil(
    dispatchWebhookEvent(c.env, user.id, user.organizationId, "link.updated", {
      link: formattedLink,
    })
  );

  return ok(c, formattedLink);
});

/**
 * DELETE /links/:id
 * Delete (archive) a link
 */
links.delete("/:id", async (c) => {
  const user = c.get("user");
  const linkId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db.select().from(schema.links).where(eq(schema.links.id, linkId)).limit(1);

  if (!existing[0]) {
    return notFound(c, "Link not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this link");
  }

  // Archive instead of hard delete
  await db
    .update(schema.links)
    .set({ isArchived: true, updatedAt: new Date().toISOString() })
    .where(eq(schema.links.id, linkId));

  // Remove from KV
  await c.env.LINKS_KV.delete(`${existing[0].domain}:${existing[0].slug}`);

  // Dispatch webhook event (non-blocking)
  c.executionCtx.waitUntil(
    dispatchWebhookEvent(c.env, user.id, user.organizationId, "link.deleted", {
      linkId,
      shortUrl: `https://${existing[0].domain}/${existing[0].slug}`,
    })
  );

  return noContent(c);
});

/**
 * GET /links/:id/stats
 * Get link analytics
 */
links.get("/:id/stats", async (c) => {
  const user = c.get("user");
  const linkId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const link = await db.select().from(schema.links).where(eq(schema.links.id, linkId)).limit(1);

  if (!link[0]) {
    return notFound(c, "Link not found");
  }

  if (link[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this link");
  }

  // Get click stats from clicks table
  const clicksByCountry = await db
    .select({
      country: schema.clicks.country,
      count: sql<number>`count(*)`,
    })
    .from(schema.clicks)
    .where(eq(schema.clicks.linkId, linkId))
    .groupBy(schema.clicks.country)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const clicksByDevice = await db
    .select({
      device: schema.clicks.device,
      count: sql<number>`count(*)`,
    })
    .from(schema.clicks)
    .where(eq(schema.clicks.linkId, linkId))
    .groupBy(schema.clicks.device);

  const clicksByBrowser = await db
    .select({
      browser: schema.clicks.browser,
      count: sql<number>`count(*)`,
    })
    .from(schema.clicks)
    .where(eq(schema.clicks.linkId, linkId))
    .groupBy(schema.clicks.browser)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const clicksByReferrer = await db
    .select({
      referrer: schema.clicks.referrerDomain,
      count: sql<number>`count(*)`,
    })
    .from(schema.clicks)
    .where(eq(schema.clicks.linkId, linkId))
    .groupBy(schema.clicks.referrerDomain)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // Get clicks over time (last 30 days)
  const clicksOverTime = await db
    .select({
      date: sql<string>`date(timestamp)`,
      count: sql<number>`count(*)`,
    })
    .from(schema.clicks)
    .where(eq(schema.clicks.linkId, linkId))
    .groupBy(sql`date(timestamp)`)
    .orderBy(sql`date(timestamp)`)
    .limit(30);

  return ok(c, {
    totalClicks: link[0].clickCount,
    lastClickedAt: link[0].lastClickedAt,
    byCountry: clicksByCountry,
    byDevice: clicksByDevice,
    byBrowser: clicksByBrowser,
    byReferrer: clicksByReferrer,
    overTime: clicksOverTime,
  });
});

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Sync link to KV for fast edge lookups
 */
async function syncLinkToKV(kv: KVNamespace, link: CachedLink) {
  const key = `${link.domain}:${link.slug}`;
  await kv.put(key, JSON.stringify(link), {
    expirationTtl: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Format link for API response
 */
function formatLink(link: schema.Link, defaultDomain: string) {
  const shortUrl = `https://${link.domain}/${link.slug}`;

  return {
    id: link.id,
    shortUrl,
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
    // Retargeting pixels
    trackingPixels: link.trackingPixels ? JSON.parse(link.trackingPixels) : [],
    enablePixelTracking: link.enablePixelTracking ?? false,
    requirePixelConsent: link.requirePixelConsent ?? false,
    // Analytics configuration
    trackAnalytics: link.trackAnalytics ?? true,
    publicStats: link.publicStats ?? false,
    trackConversion: link.trackConversion ?? false,
    conversionUrl: link.conversionUrl,
    skipDeduplication: link.skipDeduplication ?? false,
    // Stats
    leadCount: link.leadCount ?? 0,
    saleCount: link.saleCount ?? 0,
    saleAmount: link.saleAmount ?? 0,
    qrScans: link.qrScans ?? 0,
    uniqueClicks: link.uniqueClicks ?? 0,
    isArchived: link.isArchived,
    isPublic: link.isPublic,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    lastClickedAt: link.lastClickedAt,
  };
}

export { links };
