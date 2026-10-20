/**
 * Link Galleries Routes (v1)
 *
 * CRUD operations for link-in-bio galleries:
 * - POST /galleries - Create a new gallery
 * - GET /galleries - List user's galleries
 * - GET /galleries/:id - Get gallery by ID
 * - PATCH /galleries/:id - Update gallery
 * - DELETE /galleries/:id - Delete gallery
 * - POST /galleries/:id/items - Add item to gallery
 * - PATCH /galleries/:id/items/:itemId - Update gallery item
 * - DELETE /galleries/:id/items/:itemId - Delete gallery item
 * - PATCH /galleries/:id/items/reorder - Reorder gallery items
 * - GET /galleries/public/:domain/:slug - Get public gallery (no auth)
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, desc, sql, asc, or } from "drizzle-orm";
import * as schema from "@repo/db";
import { type PlanId, planLimits } from "@repo/config/pricing";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import {
  ok,
  created,
  noContent,
  notFound,
  forbidden,
  conflict,
  paymentRequired,
} from "../../lib/response.js";
import { unfurl } from "../../lib/og-unfurl.js";
import { getPlanForOrg } from "../../lib/retention.js";
import { getPlanCapabilities } from "../../lib/plan-capabilities.js";
import {
  type DomainAccess,
  domainAccessDenied,
  getDomainAccess,
  platformDomain,
} from "../../lib/domain-access.js";
import { isAdultUrl } from "../../lib/adult-hosts.js";

const galleries = new Hono<{ Bindings: Env }>();

type DrizzleD1 = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Fetch OG metadata for a link item and persist it back to the row.
 * Called via c.executionCtx.waitUntil so it doesn't block API responses.
 */
function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

async function unfurlAndPersist(db: DrizzleD1, itemId: string, url: string) {
  try {
    const meta = await unfurl(url);
    await db
      .update(schema.galleryItems)
      .set({
        ogTitle: meta.title,
        ogDescription: meta.description,
        thumbnailUrl: meta.imageUrl,
        ogFetchedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.galleryItems.id, itemId));
  } catch (err) {
    // Silent — the editor renders fine without OG data, and we'll retry on
    // next save / cron-revalidate.
    console.error("unfurlAndPersist failed", { itemId, url, err: String(err) });
  }
}

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const themeSchema = z.enum(["default", "minimal", "gradient", "dark", "neon", "pastel", "custom"]);

const socialLinkSchema = z.object({
  platform: z.string(),
  url: z.string().url(),
});

const themeConfigSchema = z.object({
  primaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  fontFamily: z.string().optional(),
  buttonStyle: z.enum(["rounded", "pill", "square"]).optional(),
  backgroundImage: z.string().url().optional(),
});

const createGallerySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Slug can only contain letters, numbers, hyphens, and underscores"),
  domain: z.string().optional(),
  title: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  theme: themeSchema.optional(),
  themeConfig: themeConfigSchema.optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
  customCss: z.string().max(5000).optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  isPublished: z.boolean().optional(),
  hideBranding: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
  isSensitive: z.boolean().optional(),
});

const updateGallerySchema = createGallerySchema.partial();

const createItemSchema = z.object({
  type: z.enum(["link", "header", "divider", "embed", "image", "email_signup"]),
  title: z.string().max(100).optional(),
  url: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  iconName: z.string().optional(),
  isVisible: z.boolean().optional(),
  embedType: z.string().optional(),
  embedData: z.record(z.unknown()).optional(),
});

const updateItemSchema = createItemSchema.partial();

const reorderItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      position: z.number().int().min(0),
    })
  ),
});

const listGalleriesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
});

// -----------------------------------------------------------------------------
// Protected Routes (require authentication)
// -----------------------------------------------------------------------------

const protectedRoutes = new Hono<{ Bindings: Env }>();
protectedRoutes.use("/*", apiKeyAuthMiddleware());

/**
 * POST /galleries
 * Create a new gallery
 */
protectedRoutes.post("/", zValidator("json", createGallerySchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  const domain = input.domain ?? platformDomain(c.env);
  const access = await getDomainAccess(db, c.env, user, domain);
  if (!access) {
    return forbidden(c, domainAccessDenied(domain));
  }

  const plan = await getPlanForOrg(db, user.organizationId);
  const denied = input.isSensitive
    ? sensitiveDenied(plan, access)
    : hasAdultSocialLink(input.socialLinks) && ADULT_LINK_NEEDS_18_PLUS;
  if (denied) return forbidden(c, denied);

  // Check if slug is already in use
  const existing = await db
    .select({ id: schema.linkGalleries.id })
    .from(schema.linkGalleries)
    .where(and(eq(schema.linkGalleries.domain, domain), eq(schema.linkGalleries.slug, input.slug)))
    .limit(1);

  if (existing.length > 0) {
    return conflict(c, "This slug is already in use");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newGallery: schema.NewLinkGallery = {
    id,
    userId: user.id,
    organizationId: user.organizationId,
    slug: input.slug,
    domain,
    title: input.title,
    bio: input.bio,
    avatarUrl: input.avatarUrl,
    theme: input.theme ?? "default",
    themeConfig: input.themeConfig ? JSON.stringify(input.themeConfig) : null,
    socialLinks: input.socialLinks ? JSON.stringify(input.socialLinks) : null,
    customCss: input.customCss,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    isPublished: input.isPublished ?? false,
    hideBranding: input.hideBranding ?? false,
    isPrimary: input.isPrimary ?? false,
    isSensitive: input.isSensitive ?? false,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const limit = planLimits[plan].bioPages;
  let result: schema.LinkGallery | undefined;
  try {
    result = await insertWithinLimit(db, newGallery, user, limit);
  } catch (err) {
    if (isUniqueViolation(err)) return conflict(c, "This slug is already in use");
    throw err;
  }
  if (!result) {
    return paymentRequired(c, `You've reached your plan's limit of ${limit} bio page(s).`, {
      limit,
      upgradeUrl: "/dashboard/billing",
    });
  }

  return created(c, formatGallery(result));
});

/**
 * GET /galleries
 * List user's galleries
 */
protectedRoutes.get("/", zValidator("query", listGalleriesSchema), async (c) => {
  const user = c.get("user");
  const { page, perPage } = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  const offset = (page - 1) * perPage;

  const results = await db
    .select()
    .from(schema.linkGalleries)
    .where(eq(schema.linkGalleries.userId, user.id))
    .orderBy(desc(schema.linkGalleries.createdAt))
    .limit(perPage)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.linkGalleries)
    .where(eq(schema.linkGalleries.userId, user.id));

  const total = countResult[0]?.count ?? 0;

  return ok(c, results.map(formatGallery), {
    page,
    perPage,
    total,
    hasMore: offset + results.length < total,
  });
});

/**
 * GET /galleries/:id
 * Get gallery by ID with items
 */
protectedRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const galleryId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const result = await db
    .select()
    .from(schema.linkGalleries)
    .where(eq(schema.linkGalleries.id, galleryId))
    .limit(1);

  if (!result[0]) {
    return notFound(c, "Gallery not found");
  }

  if (result[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this gallery");
  }

  // Get gallery items
  const items = await db
    .select()
    .from(schema.galleryItems)
    .where(eq(schema.galleryItems.galleryId, galleryId))
    .orderBy(asc(schema.galleryItems.position));

  return ok(c, {
    ...formatGallery(result[0]),
    items: items.map(formatGalleryItem),
  });
});

/**
 * PATCH /galleries/:id
 * Update gallery
 */
protectedRoutes.patch("/:id", zValidator("json", updateGallerySchema), async (c) => {
  const user = c.get("user");
  const galleryId = c.req.param("id");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.linkGalleries)
    .where(eq(schema.linkGalleries.id, galleryId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Gallery not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this gallery");
  }

  // Plan-gate the bio modernization fields. These are Pro+ flips — block at
  // the API even though the dashboard hides the toggles, so a hand-rolled
  // PATCH can't bypass.
  if (input.hideBranding === true || input.customCss !== undefined) {
    const plan = await getPlanForOrg(db, existing[0].organizationId);
    if (input.hideBranding === true && plan === "free") {
      return forbidden(c, "Upgrade to Pro to hide the Powered by Go2 footer");
    }
    if (input.customCss !== undefined && (plan === "free" || plan === "pro")) {
      return forbidden(c, "Upgrade to Business to use custom CSS");
    }
  }

  const domain = input.domain || existing[0].domain;
  const domainChanged = domain !== existing[0].domain;
  const isSensitive = input.isSensitive ?? existing[0].isSensitive;

  let access: DomainAccess | null = null;
  if (domainChanged) {
    access = await getDomainAccess(db, c.env, user, domain);
    if (!access) return forbidden(c, domainAccessDenied(domain));
  }

  if (isSensitive && (domainChanged || !existing[0].isSensitive)) {
    const denied = sensitiveDenied(
      await getPlanForOrg(db, existing[0].organizationId),
      access ?? (await getDomainAccess(db, c.env, user, domain))
    );
    if (denied) return forbidden(c, denied);
  }

  if (!isSensitive) {
    if (hasAdultSocialLink(input.socialLinks)) {
      return forbidden(c, ADULT_LINK_NEEDS_18_PLUS);
    }
    if (existing[0].isSensitive) {
      const items = await db
        .select({ url: schema.galleryItems.url })
        .from(schema.galleryItems)
        .where(eq(schema.galleryItems.galleryId, galleryId));
      const socialLinks = input.socialLinks ?? JSON.parse(existing[0].socialLinks ?? "[]");
      if (hasAdultSocialLink(socialLinks) || items.some((i) => i.url && isAdultUrl(i.url))) {
        return forbidden(c, "Remove links to adult sites before turning off 18+ mode");
      }
    }
  }

  // A move to another domain can collide too, not only a slug change.
  const slug = input.slug || existing[0].slug;
  if (slug !== existing[0].slug || domainChanged) {
    const slugExists = await db
      .select({ id: schema.linkGalleries.id })
      .from(schema.linkGalleries)
      .where(and(eq(schema.linkGalleries.domain, domain), eq(schema.linkGalleries.slug, slug)))
      .limit(1);

    if (slugExists.length > 0) {
      return conflict(c, "This slug is already in use");
    }
  }

  const updateData: Partial<schema.NewLinkGallery> = {
    ...(input.slug && { slug: input.slug }),
    ...(input.domain && { domain: input.domain }),
    ...(input.title !== undefined && { title: input.title }),
    ...(input.bio !== undefined && { bio: input.bio }),
    ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
    ...(input.theme && { theme: input.theme }),
    ...(input.themeConfig !== undefined && { themeConfig: JSON.stringify(input.themeConfig) }),
    ...(input.socialLinks !== undefined && { socialLinks: JSON.stringify(input.socialLinks) }),
    ...(input.customCss !== undefined && { customCss: input.customCss }),
    ...(input.seoTitle !== undefined && { seoTitle: input.seoTitle }),
    ...(input.seoDescription !== undefined && { seoDescription: input.seoDescription }),
    ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
    ...(input.hideBranding !== undefined && { hideBranding: input.hideBranding }),
    ...(input.isPrimary !== undefined && { isPrimary: input.isPrimary }),
    ...(input.isSensitive !== undefined && { isSensitive: input.isSensitive }),
    updatedAt: new Date().toISOString(),
  };

  try {
    await db
      .update(schema.linkGalleries)
      .set(updateData)
      .where(eq(schema.linkGalleries.id, galleryId));
  } catch (err) {
    if (isUniqueViolation(err)) return conflict(c, "This slug is already in use");
    throw err;
  }

  const result = await db
    .select()
    .from(schema.linkGalleries)
    .where(eq(schema.linkGalleries.id, galleryId))
    .limit(1);

  return ok(c, formatGallery(result[0]));
});

/**
 * DELETE /galleries/:id
 * Delete gallery and all its items
 */
protectedRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const galleryId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.linkGalleries)
    .where(eq(schema.linkGalleries.id, galleryId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Gallery not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this gallery");
  }

  // Delete gallery (items will be cascade deleted due to FK)
  await db.delete(schema.linkGalleries).where(eq(schema.linkGalleries.id, galleryId));

  return noContent(c);
});

/**
 * POST /galleries/:id/items
 * Add item to gallery
 */
protectedRoutes.post("/:id/items", zValidator("json", createItemSchema), async (c) => {
  const user = c.get("user");
  const galleryId = c.req.param("id");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Verify gallery ownership
  const gallery = await db
    .select()
    .from(schema.linkGalleries)
    .where(eq(schema.linkGalleries.id, galleryId))
    .limit(1);

  if (!gallery[0]) {
    return notFound(c, "Gallery not found");
  }

  if (gallery[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this gallery");
  }

  if (adultLinkDenied(gallery[0], input.url)) {
    return forbidden(c, ADULT_LINK_NEEDS_18_PLUS);
  }

  // Get max position
  const maxPositionResult = await db
    .select({ maxPos: sql<number>`COALESCE(MAX(position), -1)` })
    .from(schema.galleryItems)
    .where(eq(schema.galleryItems.galleryId, galleryId));

  const position = (maxPositionResult[0]?.maxPos ?? -1) + 1;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newItem: schema.NewGalleryItem = {
    id,
    galleryId,
    type: input.type,
    title: input.title,
    url: input.url,
    thumbnailUrl: input.thumbnailUrl,
    iconName: input.iconName,
    position,
    isVisible: input.isVisible ?? true,
    clickCount: 0,
    embedType: input.embedType,
    embedData: input.embedData ? JSON.stringify(input.embedData) : null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.galleryItems).values(newItem);

  // Fire-and-forget OG unfurl. Writes ogTitle/ogDescription/thumbnailUrl
  // back into the row when it returns. Doesn't block the response — the
  // editor will see the OG data on the next gallery refetch.
  if (input.type === "link" && input.url && !input.thumbnailUrl) {
    c.executionCtx.waitUntil(unfurlAndPersist(db, id, input.url));
  }

  const result = await db
    .select()
    .from(schema.galleryItems)
    .where(eq(schema.galleryItems.id, id))
    .limit(1);

  return created(c, formatGalleryItem(result[0]));
});

/**
 * PATCH /galleries/:id/items/reorder
 * Reorder gallery items. Registered before /:id/items/:itemId, which would otherwise take
 * "reorder" as an item id.
 */
protectedRoutes.patch("/:id/items/reorder", zValidator("json", reorderItemsSchema), async (c) => {
  const user = c.get("user");
  const galleryId = c.req.param("id");
  const { items } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Verify gallery ownership
  const gallery = await db
    .select()
    .from(schema.linkGalleries)
    .where(eq(schema.linkGalleries.id, galleryId))
    .limit(1);

  if (!gallery[0]) {
    return notFound(c, "Gallery not found");
  }

  if (gallery[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this gallery");
  }

  // Update positions atomically. drizzle-orm/d1's `db.batch([...])` maps to
  // D1's batch() API, which runs the statements as a single SQLite
  // transaction — an interrupted reorder won't leave items half-shuffled.
  const now = new Date().toISOString();
  if (items.length > 0) {
    const stmts = items.map((item) =>
      db
        .update(schema.galleryItems)
        .set({ position: item.position, updatedAt: now })
        .where(
          and(eq(schema.galleryItems.id, item.id), eq(schema.galleryItems.galleryId, galleryId))
        )
    );
    // batch() requires a non-empty tuple type; we've guarded length above.
    await db.batch(stmts as unknown as [(typeof stmts)[number], ...(typeof stmts)[number][]]);
  }

  // Return updated items
  const updatedItems = await db
    .select()
    .from(schema.galleryItems)
    .where(eq(schema.galleryItems.galleryId, galleryId))
    .orderBy(asc(schema.galleryItems.position));

  return ok(c, updatedItems.map(formatGalleryItem));
});

/**
 * PATCH /galleries/:id/items/:itemId
 * Update gallery item
 */
protectedRoutes.patch("/:id/items/:itemId", zValidator("json", updateItemSchema), async (c) => {
  const user = c.get("user");
  const galleryId = c.req.param("id");
  const itemId = c.req.param("itemId");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Verify gallery ownership
  const gallery = await db
    .select()
    .from(schema.linkGalleries)
    .where(eq(schema.linkGalleries.id, galleryId))
    .limit(1);

  if (!gallery[0]) {
    return notFound(c, "Gallery not found");
  }

  if (gallery[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this gallery");
  }

  if (adultLinkDenied(gallery[0], input.url)) {
    return forbidden(c, ADULT_LINK_NEEDS_18_PLUS);
  }

  // Verify item exists and belongs to gallery
  const existing = await db
    .select()
    .from(schema.galleryItems)
    .where(and(eq(schema.galleryItems.id, itemId), eq(schema.galleryItems.galleryId, galleryId)))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Item not found");
  }

  const updateData: Partial<schema.NewGalleryItem> = {
    ...(input.type && { type: input.type }),
    ...(input.title !== undefined && { title: input.title }),
    ...(input.url !== undefined && { url: input.url }),
    ...(input.thumbnailUrl !== undefined && { thumbnailUrl: input.thumbnailUrl }),
    ...(input.iconName !== undefined && { iconName: input.iconName }),
    ...(input.isVisible !== undefined && { isVisible: input.isVisible }),
    ...(input.embedType !== undefined && { embedType: input.embedType }),
    ...(input.embedData !== undefined && { embedData: JSON.stringify(input.embedData) }),
    updatedAt: new Date().toISOString(),
  };

  await db.update(schema.galleryItems).set(updateData).where(eq(schema.galleryItems.id, itemId));

  // If the URL changed and the user didn't supply their own thumbnail, kick
  // off a fresh OG unfurl in the background.
  if (
    input.url !== undefined &&
    input.url !== existing[0].url &&
    input.thumbnailUrl === undefined &&
    (existing[0].type === "link" || input.type === "link")
  ) {
    c.executionCtx.waitUntil(unfurlAndPersist(db, itemId, input.url));
  }

  const result = await db
    .select()
    .from(schema.galleryItems)
    .where(eq(schema.galleryItems.id, itemId))
    .limit(1);

  return ok(c, formatGalleryItem(result[0]));
});

/**
 * DELETE /galleries/:id/items/:itemId
 * Delete gallery item
 */
protectedRoutes.delete("/:id/items/:itemId", async (c) => {
  const user = c.get("user");
  const galleryId = c.req.param("id");
  const itemId = c.req.param("itemId");
  const db = drizzle(c.env.DB, { schema });

  // Verify gallery ownership
  const gallery = await db
    .select()
    .from(schema.linkGalleries)
    .where(eq(schema.linkGalleries.id, galleryId))
    .limit(1);

  if (!gallery[0]) {
    return notFound(c, "Gallery not found");
  }

  if (gallery[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this gallery");
  }

  // Verify item exists and belongs to gallery
  const existing = await db
    .select()
    .from(schema.galleryItems)
    .where(and(eq(schema.galleryItems.id, itemId), eq(schema.galleryItems.galleryId, galleryId)))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Item not found");
  }

  await db.delete(schema.galleryItems).where(eq(schema.galleryItems.id, itemId));

  return noContent(c);
});

/**
 * GET /galleries/:id/subscribers
 * List email signups + email-gate captures for a gallery (CSV exportable).
 */
protectedRoutes.get("/:id/subscribers", async (c) => {
  const user = c.get("user");
  const galleryId = c.req.param("id");
  const format = c.req.query("format");
  const db = drizzle(c.env.DB, { schema });

  const gallery = await db
    .select()
    .from(schema.linkGalleries)
    .where(eq(schema.linkGalleries.id, galleryId))
    .limit(1);
  if (!gallery[0]) return notFound(c, "Gallery not found");
  if (gallery[0].userId !== user.id) return forbidden(c, "Not your gallery");

  const subs = await db
    .select()
    .from(schema.bioSubscribers)
    .where(eq(schema.bioSubscribers.galleryId, galleryId))
    .orderBy(desc(schema.bioSubscribers.createdAt));

  if (format === "csv") {
    const header = "email,source,confirmed,created_at,confirmed_at\n";
    const rows = subs
      .map(
        (s) =>
          `${csvEscape(s.email)},${csvEscape(s.source)},${s.confirmed ? "1" : "0"},${csvEscape(
            s.createdAt
          )},${csvEscape(s.confirmedAt ?? "")}`
      )
      .join("\n");
    return new Response(header + rows, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="bio-subscribers-${gallery[0].slug}.csv"`,
      },
    });
  }

  return ok(
    c,
    subs.map((s) => ({
      id: s.id,
      email: s.email,
      source: s.source,
      confirmed: !!s.confirmed,
      createdAt: s.createdAt,
      confirmedAt: s.confirmedAt,
    }))
  );
});

// Public bio routes are owned by routes/v1/public-galleries.ts (mounted at
// /api/v1/public/galleries) — what used to live here was an unused twin.

// Mount protected routes
galleries.route("/", protectedRoutes);

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

// Counts the user's pages in every organization plus the current organization's pages, so
// creating extra free organizations doesn't mint extra free pages.
function bioPageScope(user: { id: string; organizationId?: string | null }) {
  return user.organizationId
    ? or(
        eq(schema.linkGalleries.userId, user.id),
        eq(schema.linkGalleries.organizationId, user.organizationId)
      )
    : eq(schema.linkGalleries.userId, user.id);
}

// A count-then-insert lets concurrent creates all pass the count. D1 runs a batch as one
// transaction, so inserting and then removing the row if it pushed the scope over the limit is
// atomic. Undefined means the limit was reached.
async function insertWithinLimit(
  db: DrizzleD1,
  gallery: schema.NewLinkGallery & { id: string },
  user: { id: string; organizationId?: string | null },
  limit: number
): Promise<schema.LinkGallery | undefined> {
  const pagesInScope = db
    .select({ count: sql`count(*)` })
    .from(schema.linkGalleries)
    .where(bioPageScope(user));
  await db.batch([
    db.insert(schema.linkGalleries).values(gallery),
    db
      .delete(schema.linkGalleries)
      .where(and(eq(schema.linkGalleries.id, gallery.id), sql`(${pagesInScope}) > ${limit}`)),
  ]);
  const [row] = await db
    .select()
    .from(schema.linkGalleries)
    .where(eq(schema.linkGalleries.id, gallery.id))
    .limit(1);
  return row;
}

function isUniqueViolation(err: unknown) {
  return (
    err instanceof Error && /UNIQUE constraint failed/.test(`${err.message} ${err.cause ?? ""}`)
  );
}

const ADULT_LINK_NEEDS_18_PLUS =
  "Links to adult sites need 18+ mode. Turn on 18+ content for this bio page (Pro plan, on your own verified custom domain).";

function adultLinkDenied(gallery: schema.LinkGallery, url: string | undefined) {
  return !gallery.isSensitive && !!url && isAdultUrl(url);
}

function hasAdultSocialLink(socialLinks: Array<{ url: string }> | undefined) {
  return socialLinks?.some((link) => isAdultUrl(link.url)) ?? false;
}

// Adult traffic stays off the shared platform domain, whose reputation every customer's links depend on.
function sensitiveDenied(plan: PlanId, access: DomainAccess | null): string | null {
  if (!getPlanCapabilities(plan).canUseAdultBioPages) {
    return "18+ bio pages require a Pro plan or higher";
  }
  if (access !== "verified") {
    return "18+ bio pages must be on a verified custom domain you own";
  }
  return null;
}

function formatGallery(gallery: schema.LinkGallery) {
  return {
    id: gallery.id,
    slug: gallery.slug,
    domain: gallery.domain,
    url: `https://${gallery.domain}/bio/${gallery.slug}`,
    title: gallery.title,
    bio: gallery.bio,
    avatarUrl: gallery.avatarUrl,
    theme: gallery.theme,
    themeConfig: gallery.themeConfig ? JSON.parse(gallery.themeConfig) : null,
    socialLinks: gallery.socialLinks ? JSON.parse(gallery.socialLinks) : [],
    customCss: gallery.customCss,
    seoTitle: gallery.seoTitle,
    seoDescription: gallery.seoDescription,
    isPublished: gallery.isPublished,
    hideBranding: !!gallery.hideBranding,
    isPrimary: !!gallery.isPrimary,
    isSensitive: gallery.isSensitive,
    viewCount: gallery.viewCount,
    createdAt: gallery.createdAt,
    updatedAt: gallery.updatedAt,
  };
}

function formatGalleryItem(item: schema.GalleryItem) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    url: item.url,
    thumbnailUrl: item.thumbnailUrl,
    iconName: item.iconName,
    position: item.position,
    isVisible: item.isVisible,
    clickCount: item.clickCount,
    lastClickedAt: item.lastClickedAt,
    embedType: item.embedType,
    embedData: item.embedData ? JSON.parse(item.embedData) : null,
    ogTitle: item.ogTitle,
    ogDescription: item.ogDescription,
    ogFetchedAt: item.ogFetchedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export { galleries as galleriesRouter };
