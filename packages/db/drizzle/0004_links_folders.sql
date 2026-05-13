-- Add folder_id column to links table for folder organization
ALTER TABLE `links` ADD COLUMN `folder_id` text;
--> statement-breakpoint
-- Add rewrite column to links table for URL masking/cloaking
ALTER TABLE `links` ADD COLUMN `rewrite` integer DEFAULT false;
--> statement-breakpoint
-- Create folders table for link organization
CREATE TABLE IF NOT EXISTS `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`name` text NOT NULL,
	`description` text,
	`color` text DEFAULT '#6366f1',
	`icon` text DEFAULT 'folder',
	`access_level` text DEFAULT 'private',
	`parent_id` text,
	`link_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `folders_user_idx` ON `folders` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `folders_org_idx` ON `folders` (`organization_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `folders_parent_idx` ON `folders` (`parent_id`);
--> statement-breakpoint
-- Add index for folder_id in links
CREATE INDEX IF NOT EXISTS `links_folder_idx` ON `links` (`folder_id`);
