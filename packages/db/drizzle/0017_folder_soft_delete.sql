-- Migration: Folder soft delete
-- Created: 2026-04-29
--
-- Add a nullable `deleted_at` column to `folders` so DELETE operations
-- become reversible. Live folders have NULL; soft-deleted ones get a
-- timestamp. The list/read APIs filter by `deleted_at IS NULL` by default;
-- a `?includeDeleted=true` query param surfaces archived folders for
-- restore UIs. The `folders_deleted_idx` index keeps that filter cheap on
-- D1 even as the archive grows.
--
-- Soft delete preserves the link-orphan behavior: when a folder is soft-
-- deleted we still null out `links.folder_id` (so links remain visible at
-- the root) and reparent any sub-folders. A future hard-delete path can
-- prune `deleted_at < NOW() - 30d` rows on a cron.

ALTER TABLE `folders` ADD COLUMN `deleted_at` text;
CREATE INDEX `folders_deleted_idx` ON `folders` (`deleted_at`);
