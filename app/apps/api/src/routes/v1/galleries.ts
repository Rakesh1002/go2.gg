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
import { eq, and, desc, sql, asc } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok, created, noContent, notFound, forbidden, conflict } from "../../lib/response.js";

const galleries = new Hono<{ Bindings: Env }>();

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
});

const updateGallerySchema = createGallerySchema.partial();

const createItemSchema = z.object({
  type: z.enum(["link", "header", "divider", "embed", "image"]),
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

  const domain = input.domain ?? c.env.DEFAULT_DOMAIN ?? "go2.gg";

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
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.linkGalleries).values(newGallery);

  const result = await db
    .select()
    .from(schema.linkGalleries)
    .where(eq(schema.linkGalleries.id, id))
    .limit(1);

  return created(c, formatGallery(result[0]));
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

  // Check slug uniqueness if changed
  if (input.slug && input.slug !== existing[0].slug) {
    const domain = input.domain ?? existing[0].domain;
    const slugExists = await db
      .select({ id: schema.linkGalleries.id })
      .from(schema.linkGalleries)
      .where(
        and(eq(schema.linkGalleries.domain, domain), eq(schema.linkGalleries.slug, input.slug))
      )
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
    updatedAt: new Date().toISOString(),
  };

  await db
    .update(schema.linkGalleries)
    .set(updateData)
    .where(eq(schema.linkGalleries.id, galleryId));

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

  const result = await db
    .select()
    .from(schema.galleryItems)
    .where(eq(schema.galleryItems.id, id))
    .limit(1);

  return created(c, formatGalleryItem(result[0]));
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
 * PATCH /galleries/:id/items/reorder
 * Reorder gallery items
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

  // Update positions
  const now = new Date().toISOString();
  for (const item of items) {
    await db
      .update(schema.galleryItems)
      .set({ position: item.position, updatedAt: now })
      .where(
        and(eq(schema.galleryItems.id, item.id), eq(schema.galleryItems.galleryId, galleryId))
      );
  }

  // Return updated items
  const updatedItems = await db
    .select()
    .from(schema.galleryItems)
    .where(eq(schema.galleryItems.galleryId, galleryId))
    .orderBy(asc(schema.galleryItems.position));

  return ok(c, updatedItems.map(formatGalleryItem));
});

// -----------------------------------------------------------------------------
// Public Routes (no authentication required)
// -----------------------------------------------------------------------------

/**
 * GET /galleries/public/:domain/:slug
 * Get public gallery for rendering
 */
galleries.get("/public/:domain/:slug", async (c) => {
  const domain = c.req.param("domain");
  const slug = c.req.param("slug");
  const db = drizzle(c.env.DB, { schema });

  const result = await db
    .select()
    .from(schema.linkGalleries)
    .where(
      and(
        eq(schema.linkGalleries.domain, domain),
        eq(schema.linkGalleries.slug, slug),
        eq(schema.linkGalleries.isPublished, true)
      )
    )
    .limit(1);

  if (!result[0]) {
    return notFound(c, "Gallery not found");
  }

  // Increment view count
  await db
    .update(schema.linkGalleries)
    .set({ viewCount: (result[0].viewCount ?? 0) + 1 })
    .where(eq(schema.linkGalleries.id, result[0].id));

  // Get gallery items
  const items = await db
    .select()
    .from(schema.galleryItems)
    .where(
      and(eq(schema.galleryItems.galleryId, result[0].id), eq(schema.galleryItems.isVisible, true))
    )
    .orderBy(asc(schema.galleryItems.position));

  return ok(c, {
    ...formatGallery(result[0]),
    items: items.map(formatGalleryItem),
  });
});

/**
 * POST /galleries/public/:domain/:slug/items/:itemId/click
 * Track click on a gallery item
 */
galleries.post("/public/:domain/:slug/items/:itemId/click", async (c) => {
  const domain = c.req.param("domain");
  const slug = c.req.param("slug");
  const itemId = c.req.param("itemId");
  const db = drizzle(c.env.DB, { schema });

  // Verify gallery exists and is published
  const gallery = await db
    .select()
    .from(schema.linkGalleries)
    .where(
      and(
        eq(schema.linkGalleries.domain, domain),
        eq(schema.linkGalleries.slug, slug),
        eq(schema.linkGalleries.isPublished, true)
      )
    )
    .limit(1);

  if (!gallery[0]) {
    return notFound(c, "Gallery not found");
  }

  // Verify item exists
  const item = await db
    .select()
    .from(schema.galleryItems)
    .where(
      and(eq(schema.galleryItems.id, itemId), eq(schema.galleryItems.galleryId, gallery[0].id))
    )
    .limit(1);

  if (!item[0]) {
    return notFound(c, "Item not found");
  }

  // Increment click count
  await db
    .update(schema.galleryItems)
    .set({ clickCount: (item[0].clickCount ?? 0) + 1 })
    .where(eq(schema.galleryItems.id, itemId));

  return ok(c, { success: true });
});

// Mount protected routes
galleries.route("/", protectedRoutes);

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function formatGallery(gallery: schema.LinkGallery) {
  return {
    id: gallery.id,
    slug: gallery.slug,
    domain: gallery.domain,
    url: `https://${gallery.domain}/@${gallery.slug}`,
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
    embedType: item.embedType,
    embedData: item.embedData ? JSON.parse(item.embedData) : null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export { galleries as galleriesRouter };
