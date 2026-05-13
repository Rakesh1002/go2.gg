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
import { eq, and, desc, sql, inArray, or, isNull } from "drizzle-orm";
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
import { getPlanCapabilities, normalizePlan } from "../../lib/plan-capabilities.js";
import { checkFolderAccess, refreshFolderLinkCounts } from "../../lib/folders.js";
import { logEvent } from "../../lib/axiom.js";
import { planLimits } from "@repo/config/pricing";

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
  /** Set true to include soft-deleted folders. */
  includeDeleted: z.coerce.boolean().optional().default(false),
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
    // Telemetry: log denied attempts so we can spot future regressions
    // like the auth-middleware bug that originally caused this. Plan should
    // be `free` (or undefined) at this point — anything else is suspicious.
    c.executionCtx.waitUntil(
      logEvent(c.env, "folder.gate_blocked", {
        userId: user.id,
        organizationId: user.organizationId,
        plan: user.plan ?? "undefined",
      }),
    );
    return forbidden(c, "Link folders require a Pro plan or higher");
  }

  // Check folder limit
  const plan = normalizePlan(user.plan);
  const folderLimit = planLimits[plan].folders;

  // Folder count is scoped to the org when present, else to the user.
  const folderScope = user.organizationId
    ? eq(schema.folders.organizationId, user.organizationId)
    : eq(schema.folders.userId, user.id);

  if (folderLimit !== -1) {
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.folders)
      .where(folderScope);

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
      .select()
      .from(schema.folders)
      .where(eq(schema.folders.id, input.parentId))
      .limit(1);

    if (!parent[0]) {
      return notFound(c, "Parent folder not found");
    }

    const parentReadCheck = checkFolderAccess(parent[0], user, "read");
    if (!parentReadCheck.allowed) {
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

  c.executionCtx.waitUntil(
    logEvent(c.env, "folder.created", {
      folderId: id,
      userId: user.id,
      organizationId: user.organizationId,
      plan,
    }),
  );

  return created(c, formatFolder(result[0]));
});

/**
 * GET /folders
 * List user's folders
 */
folders.get("/", zValidator("query", listFoldersSchema), async (c) => {
  const user = c.get("user");
  const { page, perPage, parentId, includeDeleted } = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  const offset = (page - 1) * perPage;

  // Org members see every folder owned by the org. Solo users see their own.
  const scope = user.organizationId
    ? or(
        eq(schema.folders.userId, user.id),
        eq(schema.folders.organizationId, user.organizationId)
      )
    : eq(schema.folders.userId, user.id);

  const conditions = [scope!];

  if (!includeDeleted) {
    conditions.push(isNull(schema.folders.deletedAt));
  }

  if (parentId) {
    conditions.push(eq(schema.folders.parentId, parentId));
  } else {
    // Get root folders by default
    conditions.push(isNull(schema.folders.parentId));
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

  const readCheck = checkFolderAccess(result[0], user, "read");
  if (!readCheck.allowed) {
    return forbidden(c, readCheck.reason);
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

  const writeCheck = checkFolderAccess(existing[0], user, "write");
  if (!writeCheck.allowed) {
    return forbidden(c, writeCheck.reason);
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

  const deleteCheck = checkFolderAccess(existing[0], user, "write");
  if (!deleteCheck.allowed) {
    return forbidden(c, deleteCheck.reason);
  }

  const now = new Date().toISOString();

  // Move links out of folder (don't delete them) so users can still find
  // them at the root after the folder is archived.
  await db
    .update(schema.links)
    .set({ folderId: null, updatedAt: now })
    .where(eq(schema.links.folderId, folderId));

  // Move sub-folders to parent (or root)
  await db
    .update(schema.folders)
    .set({
      parentId: existing[0].parentId,
      updatedAt: now,
    })
    .where(eq(schema.folders.parentId, folderId));

  // Soft-delete the folder. A future hard-purge cron can collapse rows
  // older than N days. Idempotent — re-deleting a deleted folder is a no-op.
  await db
    .update(schema.folders)
    .set({ deletedAt: now, linkCount: 0, updatedAt: now })
    .where(eq(schema.folders.id, folderId));

  c.executionCtx.waitUntil(
    logEvent(c.env, "folder.deleted", {
      folderId,
      userId: user.id,
      organizationId: user.organizationId,
    }),
  );

  return noContent(c);
});

/**
 * POST /folders/:id/restore
 * Bring a soft-deleted folder back. Links that were orphaned at delete time
 * are NOT automatically re-attached (we don't track which ones used to live
 * in this folder); the user can re-add them via /folders/:id/links.
 */
folders.post("/:id/restore", async (c) => {
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

  const restoreCheck = checkFolderAccess(existing[0], user, "restore");
  if (!restoreCheck.allowed) {
    return forbidden(c, restoreCheck.reason);
  }

  if (existing[0].deletedAt === null || existing[0].deletedAt === undefined) {
    return ok(c, formatFolder(existing[0]));
  }

  await db
    .update(schema.folders)
    .set({ deletedAt: null, updatedAt: new Date().toISOString() })
    .where(eq(schema.folders.id, folderId));

  // Refresh link count in case any links were re-attached while the folder
  // was archived (unlikely but cheap).
  await refreshFolderLinkCounts(db, [folderId]);

  const result = await db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.id, folderId))
    .limit(1);

  return ok(c, formatFolder(result[0]));
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

  const folderReadCheck = checkFolderAccess(folder[0], user, "read");
  if (!folderReadCheck.allowed) {
    return forbidden(c, folderReadCheck.reason);
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

  const addWriteCheck = checkFolderAccess(folder[0], user, "write");
  if (!addWriteCheck.allowed) {
    return forbidden(c, addWriteCheck.reason);
  }

  const now = new Date().toISOString();

  // Update links to be in folder. Match links the caller can write — own
  // links, plus any link in the same org when the caller has owner/admin role.
  const linkOwnerScope = user.organizationId && (user.role === "owner" || user.role === "admin")
    ? or(
        eq(schema.links.userId, user.id),
        eq(schema.links.organizationId, user.organizationId)
      )
    : eq(schema.links.userId, user.id);

  // Read affected links before reassigning so we can refresh BOTH the source
  // folders and the destination's link counts.
  const affected = await db
    .select({ folderId: schema.links.folderId })
    .from(schema.links)
    .where(and(linkOwnerScope, inArray(schema.links.id, linkIds)));

  await db
    .update(schema.links)
    .set({ folderId, updatedAt: now })
    .where(and(linkOwnerScope, inArray(schema.links.id, linkIds)));

  await refreshFolderLinkCounts(db, [folderId, ...affected.map((a) => a.folderId)]);

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

  const removeWriteCheck = checkFolderAccess(folder[0], user, "write");
  if (!removeWriteCheck.allowed) {
    return forbidden(c, removeWriteCheck.reason);
  }

  const now = new Date().toISOString();

  // Remove links from folder. Same write-scope rule as the add path.
  const linkOwnerScope = user.organizationId && (user.role === "owner" || user.role === "admin")
    ? or(
        eq(schema.links.userId, user.id),
        eq(schema.links.organizationId, user.organizationId)
      )
    : eq(schema.links.userId, user.id);

  await db
    .update(schema.links)
    .set({ folderId: null, updatedAt: now })
    .where(
      and(
        linkOwnerScope,
        eq(schema.links.folderId, folderId),
        inArray(schema.links.id, linkIds)
      )
    );

  await refreshFolderLinkCounts(db, [folderId]);

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
    deletedAt: folder.deletedAt ?? null,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}

export { folders };
