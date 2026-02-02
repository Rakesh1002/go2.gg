CREATE TABLE `ab_tests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`variants` text NOT NULL,
	`winner_variant_id` text,
	`traffic_percentage` integer DEFAULT 100 NOT NULL,
	`started_at` text,
	`ended_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ab_tests_user_idx` ON `ab_tests` (`user_id`);--> statement-breakpoint
CREATE INDEX `ab_tests_org_idx` ON `ab_tests` (`organization_id`);--> statement-breakpoint
CREATE INDEX `ab_tests_status_idx` ON `ab_tests` (`status`);--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`access_token_expires_at` text,
	`refresh_token_expires_at` text,
	`scope` text,
	`id_token` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_account_idx` ON `accounts` (`provider`,`provider_account_id`);--> statement-breakpoint
CREATE INDEX `accounts_user_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `affiliates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`code` text NOT NULL,
	`commission_rate` integer DEFAULT 20 NOT NULL,
	`total_earnings` integer DEFAULT 0 NOT NULL,
	`pending_earnings` integer DEFAULT 0 NOT NULL,
	`paid_earnings` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`paypal_email` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `affiliates_code_unique` ON `affiliates` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `affiliates_code_idx` ON `affiliates` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `affiliates_user_idx` ON `affiliates` (`user_id`);--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`key_hash` text NOT NULL,
	`key_prefix` text NOT NULL,
	`last_used_at` text,
	`expires_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `api_keys_org_idx` ON `api_keys` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_hash_idx` ON `api_keys` (`key_hash`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`resource_type` text,
	`resource_id` text,
	`details` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_logs_org_idx` ON `audit_logs` (`organization_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_user_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `audit_logs_resource_idx` ON `audit_logs` (`resource_type`,`resource_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `clicks` (
	`id` text PRIMARY KEY NOT NULL,
	`link_id` text NOT NULL,
	`country` text,
	`city` text,
	`region` text,
	`latitude` text,
	`longitude` text,
	`device` text,
	`browser` text,
	`browser_version` text,
	`os` text,
	`os_version` text,
	`referrer` text,
	`referrer_domain` text,
	`ip_hash` text,
	`user_agent` text,
	`is_bot` integer DEFAULT false,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`ab_variant` text,
	`timestamp` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `clicks_link_idx` ON `clicks` (`link_id`);--> statement-breakpoint
CREATE INDEX `clicks_timestamp_idx` ON `clicks` (`timestamp`);--> statement-breakpoint
CREATE INDEX `clicks_country_idx` ON `clicks` (`country`);--> statement-breakpoint
CREATE INDEX `clicks_device_idx` ON `clicks` (`device`);--> statement-breakpoint
CREATE INDEX `clicks_referrer_idx` ON `clicks` (`referrer_domain`);--> statement-breakpoint
CREATE TABLE `conversion_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`name` text NOT NULL,
	`type` text DEFAULT 'custom' NOT NULL,
	`url_pattern` text,
	`event_name` text,
	`attribution_window` integer DEFAULT 30,
	`has_value` integer DEFAULT false,
	`default_value` integer,
	`currency` text DEFAULT 'usd',
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `conversion_goals_user_idx` ON `conversion_goals` (`user_id`);--> statement-breakpoint
CREATE INDEX `conversion_goals_org_idx` ON `conversion_goals` (`organization_id`);--> statement-breakpoint
CREATE TABLE `conversions` (
	`id` text PRIMARY KEY NOT NULL,
	`link_id` text NOT NULL,
	`click_id` text,
	`goal_id` text,
	`type` text NOT NULL,
	`event_name` text,
	`attributed_at` text,
	`converted_at` text NOT NULL,
	`value` integer,
	`currency` text DEFAULT 'usd',
	`external_id` text,
	`customer_id` text,
	`metadata` text,
	`country` text,
	`device` text,
	`browser` text,
	`referrer` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`click_id`) REFERENCES `clicks`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`goal_id`) REFERENCES `conversion_goals`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `conversions_link_idx` ON `conversions` (`link_id`);--> statement-breakpoint
CREATE INDEX `conversions_click_idx` ON `conversions` (`click_id`);--> statement-breakpoint
CREATE INDEX `conversions_goal_idx` ON `conversions` (`goal_id`);--> statement-breakpoint
CREATE INDEX `conversions_type_idx` ON `conversions` (`type`);--> statement-breakpoint
CREATE INDEX `conversions_converted_idx` ON `conversions` (`converted_at`);--> statement-breakpoint
CREATE INDEX `conversions_external_idx` ON `conversions` (`external_id`);--> statement-breakpoint
CREATE TABLE `domains` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`domain` text NOT NULL,
	`verification_status` text DEFAULT 'pending' NOT NULL,
	`verification_token` text NOT NULL,
	`verified_at` text,
	`ssl_status` text,
	`default_redirect_url` text,
	`not_found_url` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `domains_domain_unique` ON `domains` (`domain`);--> statement-breakpoint
CREATE UNIQUE INDEX `domains_domain_idx` ON `domains` (`domain`);--> statement-breakpoint
CREATE INDEX `domains_user_idx` ON `domains` (`user_id`);--> statement-breakpoint
CREATE INDEX `domains_org_idx` ON `domains` (`organization_id`);--> statement-breakpoint
CREATE INDEX `domains_verification_idx` ON `domains` (`verification_status`);--> statement-breakpoint
CREATE TABLE `dunning_records` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`stripe_customer_id` text NOT NULL,
	`stripe_invoice_id` text NOT NULL,
	`email` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`failed_at` text NOT NULL,
	`last_reminder_sent` integer DEFAULT 0 NOT NULL,
	`last_reminder_sent_at` text,
	`resolved` integer DEFAULT false NOT NULL,
	`resolved_at` text,
	`canceled_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dunning_org_idx` ON `dunning_records` (`organization_id`);--> statement-breakpoint
CREATE INDEX `dunning_customer_idx` ON `dunning_records` (`stripe_customer_id`);--> statement-breakpoint
CREATE INDEX `dunning_invoice_idx` ON `dunning_records` (`stripe_invoice_id`);--> statement-breakpoint
CREATE INDEX `dunning_resolved_idx` ON `dunning_records` (`resolved`);--> statement-breakpoint
CREATE TABLE `gallery_items` (
	`id` text PRIMARY KEY NOT NULL,
	`gallery_id` text NOT NULL,
	`type` text DEFAULT 'link' NOT NULL,
	`title` text,
	`url` text,
	`thumbnail_url` text,
	`icon_name` text,
	`position` integer NOT NULL,
	`is_visible` integer DEFAULT true,
	`click_count` integer DEFAULT 0 NOT NULL,
	`embed_type` text,
	`embed_data` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`gallery_id`) REFERENCES `link_galleries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `gallery_items_gallery_idx` ON `gallery_items` (`gallery_id`);--> statement-breakpoint
CREATE INDEX `gallery_items_position_idx` ON `gallery_items` (`position`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`invited_by` text NOT NULL,
	`expires_at` text NOT NULL,
	`accepted_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_token_unique` ON `invitations` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `invitations_token_idx` ON `invitations` (`token`);--> statement-breakpoint
CREATE INDEX `invitations_org_idx` ON `invitations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `invitations_email_idx` ON `invitations` (`email`);--> statement-breakpoint
CREATE TABLE `link_conversion_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`link_id` text NOT NULL,
	`goal_id` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`goal_id`) REFERENCES `conversion_goals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `link_conversion_goals_unique_idx` ON `link_conversion_goals` (`link_id`,`goal_id`);--> statement-breakpoint
CREATE INDEX `link_conversion_goals_link_idx` ON `link_conversion_goals` (`link_id`);--> statement-breakpoint
CREATE INDEX `link_conversion_goals_goal_idx` ON `link_conversion_goals` (`goal_id`);--> statement-breakpoint
CREATE TABLE `link_galleries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`slug` text NOT NULL,
	`domain` text DEFAULT 'go2.gg' NOT NULL,
	`title` text,
	`bio` text,
	`avatar_url` text,
	`theme` text DEFAULT 'default',
	`theme_config` text,
	`social_links` text,
	`custom_css` text,
	`seo_title` text,
	`seo_description` text,
	`is_published` integer DEFAULT false,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `link_galleries_domain_slug_idx` ON `link_galleries` (`domain`,`slug`);--> statement-breakpoint
CREATE INDEX `link_galleries_user_idx` ON `link_galleries` (`user_id`);--> statement-breakpoint
CREATE INDEX `link_galleries_org_idx` ON `link_galleries` (`organization_id`);--> statement-breakpoint
CREATE TABLE `link_tag_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`link_id` text NOT NULL,
	`tag_id` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `link_tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `link_tag_assignments_unique_idx` ON `link_tag_assignments` (`link_id`,`tag_id`);--> statement-breakpoint
CREATE INDEX `link_tag_assignments_link_idx` ON `link_tag_assignments` (`link_id`);--> statement-breakpoint
CREATE INDEX `link_tag_assignments_tag_idx` ON `link_tag_assignments` (`tag_id`);--> statement-breakpoint
CREATE TABLE `link_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`name` text NOT NULL,
	`color` text DEFAULT '#6366f1',
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `link_tags_user_name_idx` ON `link_tags` (`user_id`,`name`);--> statement-breakpoint
CREATE INDEX `link_tags_org_idx` ON `link_tags` (`organization_id`);--> statement-breakpoint
CREATE TABLE `links` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`organization_id` text,
	`slug` text NOT NULL,
	`destination_url` text NOT NULL,
	`domain` text DEFAULT 'go2.gg' NOT NULL,
	`title` text,
	`description` text,
	`tags` text,
	`password_hash` text,
	`expires_at` text,
	`click_limit` integer,
	`click_count` integer DEFAULT 0 NOT NULL,
	`geo_targets` text,
	`device_targets` text,
	`utm_source` text,
	`utm_medium` text,
	`utm_campaign` text,
	`utm_term` text,
	`utm_content` text,
	`ab_test_id` text,
	`ab_variant` text,
	`is_archived` integer DEFAULT false,
	`is_public` integer DEFAULT false,
	`ios_url` text,
	`android_url` text,
	`og_title` text,
	`og_description` text,
	`og_image` text,
	`tracking_pixels` text,
	`enable_pixel_tracking` integer DEFAULT false,
	`require_pixel_consent` integer DEFAULT false,
	`migration_id` text,
	`migration_source` text,
	`migration_original_id` text,
	`health_status` text DEFAULT 'unknown',
	`health_status_code` integer,
	`health_response_time` integer,
	`health_error_message` text,
	`last_health_check` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`last_clicked_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `links_domain_slug_idx` ON `links` (`domain`,`slug`);--> statement-breakpoint
CREATE INDEX `links_user_idx` ON `links` (`user_id`);--> statement-breakpoint
CREATE INDEX `links_org_idx` ON `links` (`organization_id`);--> statement-breakpoint
CREATE INDEX `links_created_idx` ON `links` (`created_at`);--> statement-breakpoint
CREATE INDEX `links_click_count_idx` ON `links` (`click_count`);--> statement-breakpoint
CREATE INDEX `links_health_status_idx` ON `links` (`health_status`);--> statement-breakpoint
CREATE TABLE `migrations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`provider` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`total_links` integer DEFAULT 0 NOT NULL,
	`imported_links` integer DEFAULT 0 NOT NULL,
	`skipped_links` integer DEFAULT 0 NOT NULL,
	`failed_links` integer DEFAULT 0 NOT NULL,
	`errors` text,
	`started_at` text,
	`completed_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `migrations_user_idx` ON `migrations` (`user_id`);--> statement-breakpoint
CREATE INDEX `migrations_org_idx` ON `migrations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `migrations_status_idx` ON `migrations` (`status`);--> statement-breakpoint
CREATE TABLE `organization_members` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `org_members_unique_idx` ON `organization_members` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `org_members_user_idx` ON `organization_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `org_members_org_idx` ON `organization_members` (`organization_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo_url` text,
	`stripe_customer_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_idx` ON `organizations` (`slug`);--> statement-breakpoint
CREATE INDEX `organizations_stripe_customer_idx` ON `organizations` (`stripe_customer_id`);--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`github_username` text,
	`license_id` text NOT NULL,
	`license_name` text NOT NULL,
	`stripe_session_id` text NOT NULL,
	`stripe_customer_id` text,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'usd' NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`github_access_granted` integer DEFAULT false,
	`github_access_granted_at` text,
	`refunded_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_stripe_session_id_unique` ON `purchases` (`stripe_session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_stripe_session_idx` ON `purchases` (`stripe_session_id`);--> statement-breakpoint
CREATE INDEX `purchases_email_idx` ON `purchases` (`email`);--> statement-breakpoint
CREATE INDEX `purchases_github_idx` ON `purchases` (`github_username`);--> statement-breakpoint
CREATE INDEX `purchases_status_idx` ON `purchases` (`status`);--> statement-breakpoint
CREATE TABLE `qr_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`link_id` text,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`size` integer DEFAULT 256,
	`foreground_color` text DEFAULT '#000000',
	`background_color` text DEFAULT '#FFFFFF',
	`logo_url` text,
	`logo_size` integer DEFAULT 50,
	`corner_radius` integer DEFAULT 0,
	`error_correction` text DEFAULT 'M',
	`ai_style` text,
	`ai_image_url` text,
	`scan_count` integer DEFAULT 0 NOT NULL,
	`last_scanned_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `qr_codes_user_idx` ON `qr_codes` (`user_id`);--> statement-breakpoint
CREATE INDEX `qr_codes_org_idx` ON `qr_codes` (`organization_id`);--> statement-breakpoint
CREATE INDEX `qr_codes_link_idx` ON `qr_codes` (`link_id`);--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`affiliate_id` text NOT NULL,
	`referred_user_id` text,
	`referred_email` text NOT NULL,
	`purchase_id` text,
	`purchase_amount` integer,
	`commission` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`converted_at` text,
	`paid_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`affiliate_id`) REFERENCES `affiliates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`referred_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `referrals_affiliate_idx` ON `referrals` (`affiliate_id`);--> statement-breakpoint
CREATE INDEX `referrals_referred_user_idx` ON `referrals` (`referred_user_id`);--> statement-breakpoint
CREATE INDEX `referrals_status_idx` ON `referrals` (`status`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_idx` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `sso_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`provider` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`entity_id` text,
	`sso_url` text,
	`slo_url` text,
	`certificate` text,
	`oidc_issuer` text,
	`oidc_client_id` text,
	`oidc_client_secret` text,
	`email_domain` text,
	`enforce_sso` integer DEFAULT false NOT NULL,
	`auto_provision` integer DEFAULT true NOT NULL,
	`default_role` text DEFAULT 'member' NOT NULL,
	`metadata_url` text,
	`last_synced_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sso_configs_organization_id_unique` ON `sso_configs` (`organization_id`);--> statement-breakpoint
CREATE INDEX `sso_configs_org_idx` ON `sso_configs` (`organization_id`);--> statement-breakpoint
CREATE INDEX `sso_configs_domain_idx` ON `sso_configs` (`email_domain`);--> statement-breakpoint
CREATE TABLE `sso_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`sso_config_id` text NOT NULL,
	`session_index` text,
	`name_id` text,
	`attributes` text,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sso_config_id`) REFERENCES `sso_configs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sso_sessions_user_idx` ON `sso_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sso_sessions_config_idx` ON `sso_sessions` (`sso_config_id`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`stripe_subscription_id` text NOT NULL,
	`stripe_price_id` text NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`status` text NOT NULL,
	`current_period_start` text,
	`current_period_end` text,
	`cancel_at_period_end` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_stripe_subscription_id_unique` ON `subscriptions` (`stripe_subscription_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_stripe_idx` ON `subscriptions` (`stripe_subscription_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_org_idx` ON `subscriptions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_status_idx` ON `subscriptions` (`status`);--> statement-breakpoint
CREATE TABLE `usage_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`alert_type` text NOT NULL,
	`threshold` integer NOT NULL,
	`sent_at` text NOT NULL,
	`period_start` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `usage_alerts_org_idx` ON `usage_alerts` (`organization_id`);--> statement-breakpoint
CREATE INDEX `usage_alerts_user_idx` ON `usage_alerts` (`user_id`);--> statement-breakpoint
CREATE INDEX `usage_alerts_type_idx` ON `usage_alerts` (`alert_type`);--> statement-breakpoint
CREATE UNIQUE INDEX `usage_alerts_unique_idx` ON `usage_alerts` (`organization_id`,`alert_type`,`threshold`,`period_start`);--> statement-breakpoint
CREATE TABLE `user_metadata` (
	`user_id` text PRIMARY KEY NOT NULL,
	`is_admin` integer DEFAULT false,
	`is_banned` integer DEFAULT false,
	`banned_at` text,
	`banned_reason` text,
	`referral_code` text,
	`last_login_at` text,
	`login_count` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`avatar_url` text,
	`email_verified` integer DEFAULT false,
	`email_verified_at` text,
	`image` text,
	`password_hash` text,
	`two_factor_enabled` integer DEFAULT false,
	`two_factor_secret` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_unique` ON `verification_tokens` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_idx` ON `verification_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `verification_tokens_identifier_idx` ON `verification_tokens` (`identifier`);--> statement-breakpoint
CREATE TABLE `waitlist_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`source` text,
	`referral_code` text,
	`notified` integer DEFAULT false,
	`notified_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_entries_email_unique` ON `waitlist_entries` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_email_idx` ON `waitlist_entries` (`email`);--> statement-breakpoint
CREATE INDEX `waitlist_notified_idx` ON `waitlist_entries` (`notified`);--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`webhook_id` text NOT NULL,
	`event` text NOT NULL,
	`payload` text NOT NULL,
	`status_code` integer,
	`response` text,
	`duration` integer,
	`success` integer DEFAULT false,
	`attempts` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `webhook_deliveries_webhook_idx` ON `webhook_deliveries` (`webhook_id`);--> statement-breakpoint
CREATE INDEX `webhook_deliveries_created_idx` ON `webhook_deliveries` (`created_at`);--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`organization_id` text,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`events` text NOT NULL,
	`secret` text NOT NULL,
	`is_active` integer DEFAULT true,
	`last_triggered_at` text,
	`last_status` integer,
	`failure_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `webhooks_user_idx` ON `webhooks` (`user_id`);--> statement-breakpoint
CREATE INDEX `webhooks_org_idx` ON `webhooks` (`organization_id`);--> statement-breakpoint
CREATE INDEX `webhooks_active_idx` ON `webhooks` (`is_active`);--> statement-breakpoint
CREATE TABLE `white_label_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`brand_name` text,
	`logo_url` text,
	`logo_light_url` text,
	`favicon_url` text,
	`primary_color` text DEFAULT '#3b82f6',
	`secondary_color` text,
	`portal_domain` text,
	`portal_domain_verified` integer DEFAULT false,
	`hide_powered_by` integer DEFAULT false,
	`custom_email_domain` text,
	`custom_support_email` text,
	`custom_terms_url` text,
	`custom_privacy_url` text,
	`max_sub_accounts` integer DEFAULT 10,
	`sub_account_link_limit` integer DEFAULT 100,
	`is_reseller` integer DEFAULT false,
	`revenue_share_percent` integer DEFAULT 0,
	`stripe_connect_account_id` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `white_label_configs_organization_id_unique` ON `white_label_configs` (`organization_id`);--> statement-breakpoint
CREATE INDEX `white_label_org_idx` ON `white_label_configs` (`organization_id`);--> statement-breakpoint
CREATE INDEX `white_label_domain_idx` ON `white_label_configs` (`portal_domain`);--> statement-breakpoint
CREATE TABLE `white_label_sub_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_organization_id` text NOT NULL,
	`sub_organization_id` text NOT NULL,
	`custom_name` text,
	`is_active` integer DEFAULT true NOT NULL,
	`billed_by_parent` integer DEFAULT true,
	`monthly_fee` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`parent_organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sub_organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `wl_sub_parent_idx` ON `white_label_sub_accounts` (`parent_organization_id`);--> statement-breakpoint
CREATE INDEX `wl_sub_org_idx` ON `white_label_sub_accounts` (`sub_organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `wl_sub_unique_idx` ON `white_label_sub_accounts` (`parent_organization_id`,`sub_organization_id`);