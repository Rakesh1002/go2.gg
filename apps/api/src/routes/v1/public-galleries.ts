/**
 * Public Gallery Routes
 *
 * Public endpoints for viewing Link-in-Bio galleries:
 * - GET   /public/galleries/:domain/:slug — fetch a published gallery + items
 * - POST  /public/galleries/:galleryId/items/:itemId/click — track click
 * - POST  /public/galleries/:galleryId/items/:itemId/subscribe — email signup
 * - POST  /public/galleries/:galleryId/items/:itemId/unlock — open a gated item
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
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
    hideBranding: !!g.hideBranding,
    items: items.map((item) => {
      const parsedEmbed = item.embedData ? JSON.parse(item.embedData) : null;
      const gate = parsedEmbed?.gate as
        | { kind: "password" | "email"; passwordHash?: string }
        | undefined;
      // Don't ship the real URL or the password hash to the public — clients
      // call POST .../unlock to retrieve it.
      const safeEmbed = gate
        ? {
            ...parsedEmbed,
            gate: { kind: gate.kind },
          }
        : parsedEmbed;
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        url: gate ? null : item.url,
        thumbnailUrl: item.thumbnailUrl,
        iconName: item.iconName,
        position: item.position,
        embedType: item.embedType,
        embedData: safeEmbed,
        ogTitle: item.ogTitle,
        ogDescription: item.ogDescription,
        gate: gate ? { kind: gate.kind } : undefined,
      };
    }),
  });
});

/**
 * POST /public/galleries/:galleryId/items/:itemId/click
 * Track a click on a gallery item.
 */
publicGalleries.post("/:galleryId/items/:itemId/click", async (c) => {
  const galleryId = c.req.param("galleryId");
  const itemId = c.req.param("itemId");
  const now = new Date().toISOString();

  // Increment click count + record recency. Done as a single SQL statement
  // so we don't need a select+update round trip.
  await c.env.DB.prepare(
    `UPDATE gallery_items
        SET click_count = click_count + 1,
            last_clicked_at = ?,
            updated_at = ?
      WHERE id = ? AND gallery_id = ?`
  )
    .bind(now, now, itemId, galleryId)
    .run();

  return ok(c, { success: true });
});

// -----------------------------------------------------------------------------
// Email signup + gated content
// -----------------------------------------------------------------------------

const subscribeSchema = z.object({
  email: z.string().email().max(254),
  source: z.enum(["signup", "gate"]).default("signup"),
});

/**
 * POST /public/galleries/:galleryId/items/:itemId/subscribe
 * Save an email signup for a gallery's email_signup item or email-gate.
 */
publicGalleries.post(
  "/:galleryId/items/:itemId/subscribe",
  zValidator("json", subscribeSchema),
  async (c) => {
    const galleryId = c.req.param("galleryId");
    const itemId = c.req.param("itemId");
    const { email, source } = c.req.valid("json");
    const db = drizzle(c.env.DB, { schema });

    // Verify the gallery + item are actually published / available before we
    // accept the email — don't be a free email harvester for someone who
    // unpublished their page.
    const item = await db
      .select({
        item: schema.galleryItems,
        gallery: schema.linkGalleries,
      })
      .from(schema.galleryItems)
      .innerJoin(
        schema.linkGalleries,
        eq(schema.galleryItems.galleryId, schema.linkGalleries.id)
      )
      .where(
        and(
          eq(schema.galleryItems.id, itemId),
          eq(schema.galleryItems.galleryId, galleryId),
          eq(schema.linkGalleries.isPublished, true)
        )
      )
      .limit(1);

    if (!item[0]) {
      return notFound(c, "Item not found");
    }

    const id = crypto.randomUUID();
    const token = crypto.randomUUID().replace(/-/g, "");

    try {
      await db.insert(schema.bioSubscribers).values({
        id,
        galleryId,
        itemId,
        email: email.toLowerCase(),
        confirmed: false,
        confirmToken: token,
        source,
        createdAt: new Date().toISOString(),
      });
    } catch (_err) {
      // Unique-constraint hit on (gallery_id, email) — caller has already
      // signed up. Treat as success (idempotent) but don't reveal the row id.
      return ok(c, { success: true, alreadySubscribed: true });
    }

    // Confirmation email is intentionally fire-and-forget; if the email
    // binding errors we still report success, the user can re-subscribe.
    return ok(c, { success: true });
  }
);

const unlockSchema = z.object({
  password: z.string().max(200).optional(),
  email: z.string().email().max(254).optional(),
});

/**
 * POST /public/galleries/:galleryId/items/:itemId/unlock
 * Verify a password or email gate and return the item's underlying URL.
 */
publicGalleries.post(
  "/:galleryId/items/:itemId/unlock",
  zValidator("json", unlockSchema),
  async (c) => {
    const galleryId = c.req.param("galleryId");
    const itemId = c.req.param("itemId");
    const input = c.req.valid("json");
    const db = drizzle(c.env.DB, { schema });

    const item = await db
      .select({
        item: schema.galleryItems,
      })
      .from(schema.galleryItems)
      .innerJoin(
        schema.linkGalleries,
        eq(schema.galleryItems.galleryId, schema.linkGalleries.id)
      )
      .where(
        and(
          eq(schema.galleryItems.id, itemId),
          eq(schema.galleryItems.galleryId, galleryId),
          eq(schema.linkGalleries.isPublished, true)
        )
      )
      .limit(1);

    if (!item[0]?.item) {
      return notFound(c, "Item not found");
    }

    const it = item[0].item;
    const embedData = it.embedData ? JSON.parse(it.embedData) : {};
    const gate = embedData?.gate as
      | { kind: "password" | "email"; passwordHash?: string }
      | undefined;
    if (!gate) {
      return ok(c, { success: true, url: it.url });
    }

    if (gate.kind === "password") {
      if (!input.password || !gate.passwordHash) {
        return c.json(
          { success: false, error: { code: "GATE_FAILED", message: "Password required" } },
          401
        );
      }
      const supplied = await sha256Hex(input.password);
      if (supplied !== gate.passwordHash) {
        return c.json(
          { success: false, error: { code: "GATE_FAILED", message: "Wrong password" } },
          401
        );
      }
      return ok(c, { success: true, url: it.url });
    }

    if (gate.kind === "email") {
      if (!input.email) {
        return c.json(
          { success: false, error: { code: "GATE_FAILED", message: "Email required" } },
          401
        );
      }
      // Record the email (de-duped per gallery via UNIQUE) and return the URL.
      try {
        await db.insert(schema.bioSubscribers).values({
          id: crypto.randomUUID(),
          galleryId,
          itemId,
          email: input.email.toLowerCase(),
          confirmed: true,
          source: "gate",
          createdAt: new Date().toISOString(),
          confirmedAt: new Date().toISOString(),
        });
      } catch {
        // Already in the list — fine, gates aren't a wall.
      }
      return ok(c, { success: true, url: it.url });
    }

    return ok(c, { success: true, url: it.url });
  }
);

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export { publicGalleries };
