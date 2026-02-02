-- User Preferences - App Settings
-- Migration: 0006_user_preferences

-- User preferences for app settings (defaults, notifications, appearance)
CREATE TABLE `user_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`default_domain_id` text,
	`default_track_analytics` integer DEFAULT true,
	`default_public_stats` integer DEFAULT false,
	`default_folder_id` text,
	`email_notifications_enabled` integer DEFAULT true,
	`email_usage_alerts` integer DEFAULT true,
	`email_weekly_digest` integer DEFAULT false,
	`email_marketing` integer DEFAULT true,
	`theme` text DEFAULT 'system',
	`default_time_range` text DEFAULT '30d',
	`items_per_page` integer DEFAULT 25,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`default_domain_id`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE set null
);
