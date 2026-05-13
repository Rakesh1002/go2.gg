-- Drip Campaigns - Email Lifecycle Automation
-- Migration: 0005_drip_campaigns

-- Drip campaigns define automated email sequences
CREATE TABLE `drip_campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`trigger` text NOT NULL,
	`is_active` integer DEFAULT true,
	`target_plans` text,
	`target_user_types` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `drip_campaigns_trigger_idx` ON `drip_campaigns` (`trigger`);
--> statement-breakpoint
CREATE INDEX `drip_campaigns_active_idx` ON `drip_campaigns` (`is_active`);

--> statement-breakpoint

-- Individual emails within a drip campaign
CREATE TABLE `drip_emails` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`delay_minutes` integer DEFAULT 0 NOT NULL,
	`template_name` text NOT NULL,
	`subject` text NOT NULL,
	`skip_condition` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `drip_campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `drip_emails_campaign_idx` ON `drip_emails` (`campaign_id`);
--> statement-breakpoint
CREATE INDEX `drip_emails_sequence_idx` ON `drip_emails` (`campaign_id`, `sequence`);

--> statement-breakpoint

-- Track user progress through drip campaigns
CREATE TABLE `user_drip_state` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`campaign_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`current_email_id` text,
	`last_email_sent_at` text,
	`next_email_at` text,
	`emails_sent` integer DEFAULT 0 NOT NULL,
	`started_at` text DEFAULT (datetime('now')) NOT NULL,
	`completed_at` text,
	`metadata` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`campaign_id`) REFERENCES `drip_campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`current_email_id`) REFERENCES `drip_emails`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_drip_state_user_campaign_idx` ON `user_drip_state` (`user_id`, `campaign_id`);
--> statement-breakpoint
CREATE INDEX `user_drip_state_status_idx` ON `user_drip_state` (`status`);
--> statement-breakpoint
CREATE INDEX `user_drip_state_next_email_idx` ON `user_drip_state` (`next_email_at`);

--> statement-breakpoint

-- Log of all drip emails sent
CREATE TABLE `drip_email_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`campaign_id` text NOT NULL,
	`email_id` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`opened_at` text,
	`clicked_at` text,
	`sent_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`campaign_id`) REFERENCES `drip_campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`email_id`) REFERENCES `drip_emails`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `drip_email_log_user_idx` ON `drip_email_log` (`user_id`);
--> statement-breakpoint
CREATE INDEX `drip_email_log_campaign_idx` ON `drip_email_log` (`campaign_id`);
--> statement-breakpoint
CREATE INDEX `drip_email_log_sent_idx` ON `drip_email_log` (`sent_at`);
