/**
 * Folder access helpers.
 *
 * Folders are scoped to an organization. Read access is granted to any member
 * of the owning org (or to legacy folders without an org, the creator only).
 * Write access requires the creator OR an org owner/admin.
 */

import type { AuthUser } from "@repo/auth";
import * as schema from "@repo/db";
import type { Folder } from "@repo/db";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, sql } from "drizzle-orm";

export type FolderAccessMode = "read" | "write" | "restore";

export interface FolderAccessResult {
  allowed: boolean;
  reason?: string;
}

const WRITE_ROLES = new Set(["owner", "admin"]);

export function checkFolderAccess(
  folder: Pick<Folder, "userId" | "organizationId" | "deletedAt">,
  user: AuthUser,
  mode: FolderAccessMode
): FolderAccessResult {
  const isCreator = folder.userId === user.id;
  const isDeleted = !!folder.deletedAt;

  // Soft-deleted folders are read-only by their owner/org for the restore
  // flow. Non-restore writes (move links into a deleted folder, edit name)
  // are blocked outright.
  if (mode === "write" && isDeleted) {
    return { allowed: false, reason: "Folder is archived; restore it first" };
  }

  if (mode === "read") {
    if (isCreator) return { allowed: true };
    if (
      folder.organizationId &&
      user.organizationId &&
      folder.organizationId === user.organizationId
    ) {
      return { allowed: true };
    }
    return { allowed: false, reason: "You don't have access to this folder" };
  }

  // write (live folder only) and restore (works on deleted folders).
  if (isCreator) return { allowed: true };
  if (
    folder.organizationId &&
    user.organizationId &&
    folder.organizationId === user.organizationId &&
    user.role &&
    WRITE_ROLES.has(user.role)
  ) {
    return { allowed: true };
  }
  return { allowed: false, reason: "You don't have permission to modify this folder" };
}

/**
 * Recompute and persist the cached `linkCount` on a folder. Pass the folder
 * IDs whose link membership might have changed and we'll refresh each.
 *
 * Best-effort: failures are swallowed so callers don't fail their primary
 * action just because the cached count drifted.
 */
export async function refreshFolderLinkCounts(
  db: DrizzleD1Database<typeof schema>,
  folderIds: Array<string | null | undefined>
): Promise<void> {
  const seen = new Set<string>();
  for (const id of folderIds) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.links)
        .where(eq(schema.links.folderId, id));
      const count = result[0]?.count ?? 0;
      await db
        .update(schema.folders)
        .set({ linkCount: count, updatedAt: new Date().toISOString() })
        .where(eq(schema.folders.id, id));
    } catch (err) {
      console.warn("refreshFolderLinkCounts failed for", id, err);
    }
  }
}
