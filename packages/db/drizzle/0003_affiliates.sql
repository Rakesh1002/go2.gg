-- Affiliate Program Tables

CREATE TABLE IF NOT EXISTS `affiliates` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE CASCADE,
  `code` text NOT NULL UNIQUE,
  `commission_rate` real NOT NULL DEFAULT 0.4,
  `status` text NOT NULL DEFAULT 'pending',
  `paypal_email` text,
  `total_earnings` real NOT NULL DEFAULT 0,
  `paid_earnings` real NOT NULL DEFAULT 0,
  `pending_earnings` real NOT NULL DEFAULT 0,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS `affiliates_user_idx` ON `affiliates` (`user_id`);
CREATE INDEX IF NOT EXISTS `affiliates_code_idx` ON `affiliates` (`code`);
CREATE INDEX IF NOT EXISTS `affiliates_status_idx` ON `affiliates` (`status`);

CREATE TABLE IF NOT EXISTS `affiliate_referrals` (
  `id` text PRIMARY KEY NOT NULL,
  `affiliate_id` text NOT NULL REFERENCES `affiliates`(`id`) ON DELETE CASCADE,
  `referred_user_id` text REFERENCES `users`(`id`) ON DELETE SET NULL,
  `subscription_id` text REFERENCES `subscriptions`(`id`) ON DELETE SET NULL,
  `commission_amount` real,
  `status` text NOT NULL DEFAULT 'pending',
  `paid_at` text,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS `referrals_affiliate_idx` ON `affiliate_referrals` (`affiliate_id`);
CREATE INDEX IF NOT EXISTS `referrals_user_idx` ON `affiliate_referrals` (`referred_user_id`);
CREATE INDEX IF NOT EXISTS `referrals_status_idx` ON `affiliate_referrals` (`status`);
