/**
 * Public Gallery Routes
 *
 * Public endpoints for viewing Link-in-Bio galleries:
 * - GET /public/galleries/:domain/:slug - Get public gallery by domain and slug
 * - POST /public/galleries/:galleryId/items/:itemId/click - Track item click
 */

import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, asc } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { ok, notFound } from "../../lib/response.js";

const publicGalleries = new Hono<{ Bindings: Env }>();

/**
 * GET /public/galleries/:domain/:slug
 * Get a public gallery by domain and slug
 */
publicGalleries.get("/:domain/:slug", async (c) => {
  const domain = c.req.param("domain");
  const slug = c.req.param("slug");
  const db = drizzle(c.env.DB, { schema });

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

  // Get visible items
  const items = await db
    .select()
    .from(schema.galleryItems)
    .where(
      and(eq(schema.galleryItems.galleryId, gallery[0].id), eq(schema.galleryItems.isVisible, true))
    )
    .orderBy(asc(schema.galleryItems.position));

  // Increment view count asynchronously
  c.executionCtx.waitUntil(
    db
      .update(schema.linkGalleries)
      .set({
        viewCount: (gallery[0].viewCount ?? 0) + 1,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.linkGalleries.id, gallery[0].id))
  );

  const g = gallery[0];

  return ok(c, {
    id: g.id,
    slug: g.slug,
    domain: g.domain,
    title: g.title,
    bio: g.bio,
    avatarUrl: g.avatarUrl,
    theme: g.theme,
    themeConfig: g.themeConfig ? JSON.parse(g.themeConfig) : null,
    socialLinks: g.socialLinks ? JSON.parse(g.socialLinks) : [],
    customCss: g.customCss,
    seoTitle: g.seoTitle,
    seoDescription: g.seoDescription,
    viewCount: g.viewCount,
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl,
      iconName: item.iconName,
      position: item.position,
      embedType: item.embedType,
      embedData: item.embedData ? JSON.parse(item.embedData) : null,
    })),
  });
});

/**
 * POST /public/galleries/:galleryId/items/:itemId/click
 * Track a click on a gallery item
 */
publicGalleries.post("/:galleryId/items/:itemId/click", async (c) => {
  const galleryId = c.req.param("galleryId");
  const itemId = c.req.param("itemId");
  const db = drizzle(c.env.DB, { schema });

  // Increment click count
  await db
    .update(schema.galleryItems)
    .set({
      clickCount:
        ((
          await db
            .select({ clickCount: schema.galleryItems.clickCount })
            .from(schema.galleryItems)
            .where(
              and(eq(schema.galleryItems.id, itemId), eq(schema.galleryItems.galleryId, galleryId))
            )
            .limit(1)
        )[0]?.clickCount ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(schema.galleryItems.id, itemId), eq(schema.galleryItems.galleryId, galleryId)));

  return ok(c, { success: true });
});

export { publicGalleries };
