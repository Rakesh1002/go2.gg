/**
 * Zapier Integration Routes
 *
 * Provides Zapier-compatible endpoints for:
 * - Authentication (API key based)
 * - Triggers (link.created, link.clicked, etc.)
 * - Actions (create link, update link, delete link)
 * - Searches (find link by slug, find links by tag)
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../../bindings.js";
import { ok, unauthorized, badRequest } from "../../lib/response.js";
import { createD1Repositories } from "@repo/db/d1";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@repo/db";
import { eq, and, desc, like } from "drizzle-orm";

const zapier = new Hono<{ Bindings: Env }>();

// -----------------------------------------------------------------------------
// Middleware: Zapier API Key Authentication
// -----------------------------------------------------------------------------

zapier.use("*", async (c, next) => {
  // Zapier sends API key in various ways
  const apiKey =
    c.req.header("X-API-Key") ||
    c.req.header("Authorization")?.replace("Bearer ", "") ||
    c.req.query("api_key");

  if (!apiKey) {
    return unauthorized(c, "API key required");
  }

  // Validate API key
  const db = drizzle(c.env.DB, { schema });
  const keys = await db
    .select()
    .from(schema.apiKeys)
    .where(and(eq(schema.apiKeys.key, apiKey), eq(schema.apiKeys.isRevoked, false)))
    .limit(1);

  const key = keys[0];
  if (!key) {
    return unauthorized(c, "Invalid API key");
  }

  // Check expiration
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
    return unauthorized(c, "API key expired");
  }

  // Set user context
  c.set("apiKey", key);
  c.set("userId", key.userId);
  c.set("organizationId", key.organizationId);

  // Update last used
  await db
    .update(schema.apiKeys)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(schema.apiKeys.id, key.id));

  await next();
});

// -----------------------------------------------------------------------------
// Authentication Test
// -----------------------------------------------------------------------------

/**
 * GET /zapier/me
 * Test authentication - Zapier calls this to validate API keys
 */
zapier.get("/me", async (c) => {
  const userId = c.get("userId");
  const organizationId = c.get("organizationId");
  const repos = createD1Repositories(c.env);

  const user = await repos.users.findById(userId);

  if (!user) {
    return unauthorized(c, "User not found");
  }

  let organization = null;
  if (organizationId) {
    organization = await repos.organizations.findById(organizationId);
  }

  return ok(c, {
    id: user.id,
    email: user.email,
    name: user.name,
    organization: organization
      ? {
          id: organization.id,
          name: organization.name,
        }
      : null,
  });
});

// -----------------------------------------------------------------------------
// Triggers
// -----------------------------------------------------------------------------

/**
 * GET /zapier/triggers/link_created
 * Returns recently created links for trigger polling
 */
zapier.get("/triggers/link_created", async (c) => {
  const organizationId = c.get("organizationId");
  const db = drizzle(c.env.DB, { schema });

  const links = await db
    .select()
    .from(schema.links)
    .where(eq(schema.links.organizationId, organizationId))
    .orderBy(desc(schema.links.createdAt))
    .limit(100);

  const formattedLinks = links.map((link) => ({
    id: link.id,
    short_url: `https://${link.domain}/${link.slug}`,
    destination_url: link.destinationUrl,
    slug: link.slug,
    domain: link.domain,
    title: link.title,
    tags: link.tags ? JSON.parse(link.tags) : [],
    click_count: link.clickCount,
    created_at: link.createdAt,
  }));

  return c.json(formattedLinks);
});

/**
 * GET /zapier/triggers/link_clicked
 * Hook-based trigger - returns webhook subscription info
 */
zapier.get("/triggers/link_clicked", async (c) => {
  // For polling-based triggers, return recent click events
  // In a full implementation, this would query click analytics
  return c.json([]);
});

/**
 * POST /zapier/triggers/link_clicked/subscribe
 * Subscribe to link click webhook
 */
zapier.post(
  "/triggers/link_clicked/subscribe",
  zValidator(
    "json",
    z.object({
      hookUrl: z.string().url(),
      linkId: z.string().optional(),
    })
  ),
  async (c) => {
    const { hookUrl, linkId: _linkId } = c.req.valid("json");
    const organizationId = c.get("organizationId");
    const db = drizzle(c.env.DB, { schema });

    // Create webhook subscription
    const id = crypto.randomUUID();
    await db.insert(schema.webhooks).values({
      id,
      organizationId,
      name: "Zapier Click Webhook",
      url: hookUrl,
      events: JSON.stringify(["link.clicked"]),
      isActive: true,
      secret: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return ok(c, { id });
  }
);

/**
 * DELETE /zapier/triggers/link_clicked/subscribe/:id
 * Unsubscribe from webhook
 */
zapier.delete("/triggers/link_clicked/subscribe/:id", async (c) => {
  const id = c.req.param("id");
  const organizationId = c.get("organizationId");
  const db = drizzle(c.env.DB, { schema });

  await db
    .delete(schema.webhooks)
    .where(and(eq(schema.webhooks.id, id), eq(schema.webhooks.organizationId, organizationId)));

  return ok(c, { deleted: true });
});

// -----------------------------------------------------------------------------
// Actions
// -----------------------------------------------------------------------------

const createLinkSchema = z.object({
  destination_url: z.string().url(),
  slug: z.string().optional(),
  domain: z.string().optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
  password: z.string().optional(),
  expires_at: z.string().optional(),
});

/**
 * POST /zapier/actions/create_link
 * Create a new short link
 */
zapier.post("/actions/create_link", zValidator("json", createLinkSchema), async (c) => {
  const input = c.req.valid("json");
  const userId = c.get("userId");
  const organizationId = c.get("organizationId");
  const repos = createD1Repositories(c.env);

  // Generate slug if not provided
  const slug = input.slug || generateSlug();
  const domain = input.domain || c.env.DEFAULT_DOMAIN || "go2.gg";

  // Check if slug is available
  const existing = await repos.links.findByDomainAndSlug(domain, slug);
  if (existing) {
    return badRequest(c, "Slug already in use");
  }

  // Hash password if provided
  let passwordHash = null;
  if (input.password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input.password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    passwordHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const link = await repos.links.create({
    userId,
    organizationId,
    destinationUrl: input.destination_url,
    slug,
    domain,
    title: input.title,
    tags: input.tags ? JSON.stringify(input.tags) : null,
    passwordHash,
    expiresAt: input.expires_at,
  });

  return ok(c, {
    id: link.id,
    short_url: `https://${link.domain}/${link.slug}`,
    destination_url: link.destinationUrl,
    slug: link.slug,
    domain: link.domain,
    title: link.title,
    created_at: link.createdAt,
  });
});

const updateLinkSchema = z.object({
  link_id: z.string(),
  destination_url: z.string().url().optional(),
  title: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_archived: z.boolean().optional(),
});

/**
 * POST /zapier/actions/update_link
 * Update an existing link
 */
zapier.post("/actions/update_link", zValidator("json", updateLinkSchema), async (c) => {
  const input = c.req.valid("json");
  const organizationId = c.get("organizationId");
  const repos = createD1Repositories(c.env);

  const link = await repos.links.findById(input.link_id);
  if (!link || link.organizationId !== organizationId) {
    return badRequest(c, "Link not found");
  }

  const updated = await repos.links.update(input.link_id, {
    destinationUrl: input.destination_url,
    title: input.title,
    tags: input.tags ? JSON.stringify(input.tags) : undefined,
    isArchived: input.is_archived,
  });

  return ok(c, {
    id: updated.id,
    short_url: `https://${updated.domain}/${updated.slug}`,
    destination_url: updated.destinationUrl,
    slug: updated.slug,
    title: updated.title,
    is_archived: updated.isArchived,
    updated_at: updated.updatedAt,
  });
});

/**
 * POST /zapier/actions/delete_link
 * Delete a link
 */
zapier.post(
  "/actions/delete_link",
  zValidator("json", z.object({ link_id: z.string() })),
  async (c) => {
    const { link_id } = c.req.valid("json");
    const organizationId = c.get("organizationId");
    const repos = createD1Repositories(c.env);

    const link = await repos.links.findById(link_id);
    if (!link || link.organizationId !== organizationId) {
      return badRequest(c, "Link not found");
    }

    await repos.links.delete(link_id);

    return ok(c, { deleted: true, id: link_id });
  }
);

// -----------------------------------------------------------------------------
// Searches
// -----------------------------------------------------------------------------

/**
 * GET /zapier/searches/find_link
 * Find a link by slug or ID
 */
zapier.get("/searches/find_link", async (c) => {
  const slug = c.req.query("slug");
  const linkId = c.req.query("link_id");
  const organizationId = c.get("organizationId");
  const repos = createD1Repositories(c.env);

  if (!slug && !linkId) {
    return badRequest(c, "slug or link_id required");
  }

  let link = null;

  if (linkId) {
    link = await repos.links.findById(linkId);
    if (link && link.organizationId !== organizationId) {
      link = null;
    }
  } else if (slug) {
    const db = drizzle(c.env.DB, { schema });
    const links = await db
      .select()
      .from(schema.links)
      .where(and(eq(schema.links.organizationId, organizationId), eq(schema.links.slug, slug)))
      .limit(1);
    link = links[0] || null;
  }

  if (!link) {
    return c.json([]);
  }

  return c.json([
    {
      id: link.id,
      short_url: `https://${link.domain}/${link.slug}`,
      destination_url: link.destinationUrl,
      slug: link.slug,
      domain: link.domain,
      title: link.title,
      click_count: link.clickCount,
      created_at: link.createdAt,
    },
  ]);
});

/**
 * GET /zapier/searches/find_links_by_tag
 * Find links by tag
 */
zapier.get("/searches/find_links_by_tag", async (c) => {
  const tag = c.req.query("tag");
  const organizationId = c.get("organizationId");
  const db = drizzle(c.env.DB, { schema });

  if (!tag) {
    return badRequest(c, "tag required");
  }

  const links = await db
    .select()
    .from(schema.links)
    .where(
      and(eq(schema.links.organizationId, organizationId), like(schema.links.tags, `%"${tag}"%`))
    )
    .orderBy(desc(schema.links.createdAt))
    .limit(100);

  const formattedLinks = links.map((link) => ({
    id: link.id,
    short_url: `https://${link.domain}/${link.slug}`,
    destination_url: link.destinationUrl,
    slug: link.slug,
    domain: link.domain,
    title: link.title,
    tags: link.tags ? JSON.parse(link.tags) : [],
    click_count: link.clickCount,
    created_at: link.createdAt,
  }));

  return c.json(formattedLinks);
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function generateSlug(length: number = 7): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let slug = "";
  for (let i = 0; i < length; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

export { zapier };
