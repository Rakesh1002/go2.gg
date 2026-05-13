-- Migration: API key user binding
-- Created: 2026-04-28
--
-- Adds `created_by_user_id` to `api_keys` so the auth middleware can resolve
-- `c.user` to the actual minter of the key, not "the first row of
-- organization_members" (the prior behaviour).
--
-- Existing keys keep working — the column is nullable, and the middleware
-- falls back to the legacy first-member resolution when null. Keys minted
-- after this migration will populate the column.

ALTER TABLE `api_keys` ADD COLUMN `created_by_user_id` text REFERENCES `user`(`id`) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS `api_keys_created_by_idx` ON `api_keys` (`created_by_user_id`);
