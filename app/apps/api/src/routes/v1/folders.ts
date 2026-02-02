/**
 * Folder Routes (v1)
 *
 * CRUD operations for link folders:
 * - POST /folders - Create a new folder
 * - GET /folders - List user's folders
 * - GET /folders/:id - Get folder by ID
 * - PATCH /folders/:id - Update folder
 * - DELETE /folders/:id - Delete folder
 * - GET /folders/:id/links - Get links in folder
 * - POST /folders/:id/links - Add links to folder
 * - DELETE /folders/:id/links - Remove links from folder
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
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
  paymentRequired,
} from "../../lib/response.js";
import { getPlanCapabilities } from "../../lib/plan-capabilities.js";
import { planLimits, type PlanId } from "@repo/config/pricing";

const folders = new Hono<{ Bindings: Env }>();

// All routes require authentication
folders.use("/*", apiKeyAuthMiddleware());

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional(),
  icon: z.string().max(50).optional(),
  parentId: z.string().uuid().optional(),
});

const updateFolderSchema = createFolderSchema.partial();

const listFoldersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
  parentId: z.string().uuid().optional(),
});

const manageFolderLinksSchema = z.object({
  linkIds: z.array(z.string().uuid()).min(1).max(100),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * POST /folders
 * Create a new folder
 */
folders.post("/", zValidator("json", createFolderSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Check plan capabilities - folders require Pro+
  const capabilities = getPlanCapabilities(user.plan);
  if (!capabilities.canAddFolder) {
    return forbidden(c, "Link folders require a Pro plan or higher");
  }

  // Check folder limit
  const plan = (user.plan || "free") as PlanId;
  const folderLimit = planLimits[plan].folders;

  if (folderLimit !== -1) {
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.folders)
      .where(eq(schema.folders.userId, user.id));

    const currentCount = countResult[0]?.count ?? 0;
    if (currentCount >= folderLimit) {
      return paymentRequired(
        c,
        `You've reached your limit of ${folderLimit} folders. Upgrade to add more.`,
        {
          limit: folderLimit,
          current: currentCount,
          upgradeUrl: "/dashboard/billing",
        }
      );
    }
  }

  // Validate parent folder if provided
  if (input.parentId) {
    const parent = await db
      .select({ id: schema.folders.id })
      .from(schema.folders)
      .where(and(eq(schema.folders.id, input.parentId), eq(schema.folders.userId, user.id)))
      .limit(1);

    if (!parent[0]) {
      return notFound(c, "Parent folder not found");
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newFolder: schema.NewFolder = {
    id,
    userId: user.id,
    organizationId: user.organizationId,
    name: input.name,
    description: input.description,
    color: input.color ?? "#6366f1",
    icon: input.icon ?? "folder",
    parentId: input.parentId,
    linkCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.folders).values(newFolder);

  const result = await db.select().from(schema.folders).where(eq(schema.folders.id, id)).limit(1);

  return created(c, formatFolder(result[0]));
});

/**
 * GET /folders
 * List user's folders
 */
folders.get("/", zValidator("query", listFoldersSchema), async (c) => {
  const user = c.get("user");
  const { page, perPage, parentId } = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  const offset = (page - 1) * perPage;

  const conditions = [eq(schema.folders.userId, user.id)];

  if (parentId) {
    conditions.push(eq(schema.folders.parentId, parentId));
  } else {
    // Get root folders by default
    conditions.push(sql`${schema.folders.parentId} IS NULL`);
  }

  const results = await db
    .select()
    .from(schema.folders)
    .where(and(...conditions))
    .orderBy(desc(schema.folders.createdAt))
    .limit(perPage)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.folders)
    .where(and(...conditions));

  const total = countResult[0]?.count ?? 0;

  return ok(c, results.map(formatFolder), {
    page,
    perPage,
    total,
    hasMore: offset + results.length < total,
  });
});

/**
 * GET /folders/:id
 * Get folder by ID
 */
folders.get("/:id", async (c) => {
  const user = c.get("user");
  const folderId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const result = await db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.id, folderId))
    .limit(1);

  if (!result[0]) {
    return notFound(c, "Folder not found");
  }

  if (result[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this folder");
  }

  return ok(c, formatFolder(result[0]));
});

/**
 * PATCH /folders/:id
 * Update folder
 */
folders.patch("/:id", zValidator("json", updateFolderSchema), async (c) => {
  const user = c.get("user");
  const folderId = c.req.param("id");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.id, folderId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Folder not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this folder");
  }

  // Prevent circular parent references
  if (input.parentId) {
    if (input.parentId === folderId) {
      return badRequest(c, "A folder cannot be its own parent");
    }

    const parent = await db
      .select({ id: schema.folders.id, parentId: schema.folders.parentId })
      .from(schema.folders)
      .where(eq(schema.folders.id, input.parentId))
      .limit(1);

    if (!parent[0]) {
      return notFound(c, "Parent folder not found");
    }

    if (parent[0].parentId === folderId) {
      return badRequest(c, "Circular folder reference not allowed");
    }
  }

  const updateData: Partial<schema.NewFolder> = {
    ...(input.name && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.color && { color: input.color }),
    ...(input.icon && { icon: input.icon }),
    ...(input.parentId !== undefined && { parentId: input.parentId }),
    updatedAt: new Date().toISOString(),
  };

  await db.update(schema.folders).set(updateData).where(eq(schema.folders.id, folderId));

  const result = await db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.id, folderId))
    .limit(1);

  return ok(c, formatFolder(result[0]));
});

/**
 * DELETE /folders/:id
 * Delete folder
 */
folders.delete("/:id", async (c) => {
  const user = c.get("user");
  const folderId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.id, folderId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Folder not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this folder");
  }

  // Move links out of folder (don't delete them)
  await db
    .update(schema.links)
    .set({ folderId: null, updatedAt: new Date().toISOString() })
    .where(eq(schema.links.folderId, folderId));

  // Move sub-folders to parent (or root)
  await db
    .update(schema.folders)
    .set({
      parentId: existing[0].parentId,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.folders.parentId, folderId));

  // Delete the folder
  await db.delete(schema.folders).where(eq(schema.folders.id, folderId));

  return noContent(c);
});

/**
 * GET /folders/:id/links
 * Get links in folder
 */
folders.get("/:id/links", async (c) => {
  const user = c.get("user");
  const folderId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  // Verify folder access
  const folder = await db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.id, folderId))
    .limit(1);

  if (!folder[0]) {
    return notFound(c, "Folder not found");
  }

  if (folder[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this folder");
  }

  const links = await db
    .select()
    .from(schema.links)
    .where(and(eq(schema.links.folderId, folderId), eq(schema.links.isArchived, false)))
    .orderBy(desc(schema.links.createdAt))
    .limit(100);

  return ok(c, {
    folder: formatFolder(folder[0]),
    links: links.map((link) => ({
      id: link.id,
      shortUrl: `https://${link.domain}/${link.slug}`,
      slug: link.slug,
      destinationUrl: link.destinationUrl,
      title: link.title,
      clickCount: link.clickCount,
      createdAt: link.createdAt,
    })),
  });
});

/**
 * POST /folders/:id/links
 * Add links to folder
 */
folders.post("/:id/links", zValidator("json", manageFolderLinksSchema), async (c) => {
  const user = c.get("user");
  const folderId = c.req.param("id");
  const { linkIds } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Verify folder access
  const folder = await db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.id, folderId))
    .limit(1);

  if (!folder[0]) {
    return notFound(c, "Folder not found");
  }

  if (folder[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this folder");
  }

  const now = new Date().toISOString();

  // Update links to be in folder
  await db
    .update(schema.links)
    .set({ folderId, updatedAt: now })
    .where(and(eq(schema.links.userId, user.id), inArray(schema.links.id, linkIds)));

  // Update folder link count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.links)
    .where(eq(schema.links.folderId, folderId));

  await db
    .update(schema.folders)
    .set({ linkCount: countResult[0]?.count ?? 0, updatedAt: now })
    .where(eq(schema.folders.id, folderId));

  return ok(c, { added: linkIds.length });
});

/**
 * DELETE /folders/:id/links
 * Remove links from folder
 */
folders.delete("/:id/links", zValidator("json", manageFolderLinksSchema), async (c) => {
  const user = c.get("user");
  const folderId = c.req.param("id");
  const { linkIds } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Verify folder access
  const folder = await db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.id, folderId))
    .limit(1);

  if (!folder[0]) {
    return notFound(c, "Folder not found");
  }

  if (folder[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this folder");
  }

  const now = new Date().toISOString();

  // Remove links from folder
  await db
    .update(schema.links)
    .set({ folderId: null, updatedAt: now })
    .where(
      and(
        eq(schema.links.userId, user.id),
        eq(schema.links.folderId, folderId),
        inArray(schema.links.id, linkIds)
      )
    );

  // Update folder link count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.links)
    .where(eq(schema.links.folderId, folderId));

  await db
    .update(schema.folders)
    .set({ linkCount: countResult[0]?.count ?? 0, updatedAt: now })
    .where(eq(schema.folders.id, folderId));

  return ok(c, { removed: linkIds.length });
});

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function formatFolder(folder: schema.Folder) {
  return {
    id: folder.id,
    name: folder.name,
    description: folder.description,
    color: folder.color,
    icon: folder.icon,
    accessLevel: folder.accessLevel,
    parentId: folder.parentId,
    linkCount: folder.linkCount,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}

export { folders };
