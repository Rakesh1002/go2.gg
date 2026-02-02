PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "user_id", "token", "expires_at", "ip_address", "user_agent", "created_at", "updated_at") SELECT "id", "user_id", "token", "expires_at", "ip_address", "user_agent", "created_at", "updated_at" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_idx` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `__new_verification_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
INSERT INTO `__new_verification_tokens`("id", "identifier", "token", "expires_at", "created_at", "updated_at") SELECT "id", "identifier", "token", "expires_at", "created_at", "updated_at" FROM `verification_tokens`;--> statement-breakpoint
DROP TABLE `verification_tokens`;--> statement-breakpoint
ALTER TABLE `__new_verification_tokens` RENAME TO `verification_tokens`;--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_unique` ON `verification_tokens` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_idx` ON `verification_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `verification_tokens_identifier_idx` ON `verification_tokens` (`identifier`);