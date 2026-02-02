-- Migration: Contact Submissions and Support Tickets
-- Created: 2026-01-27

-- Contact Submissions table (tracks contact form submissions)
CREATE TABLE IF NOT EXISTS `contact_submissions` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `subject` text NOT NULL,
  `message` text NOT NULL,
  `source` text DEFAULT 'website',
  `status` text DEFAULT 'new' NOT NULL,
  `responded_at` text,
  `responded_by` text,
  `ip_address` text,
  `user_agent` text,
  `user_id` text REFERENCES `user`(`id`) ON DELETE SET NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE INDEX IF NOT EXISTS `contact_submissions_email_idx` ON `contact_submissions` (`email`);
CREATE INDEX IF NOT EXISTS `contact_submissions_status_idx` ON `contact_submissions` (`status`);
CREATE INDEX IF NOT EXISTS `contact_submissions_created_idx` ON `contact_submissions` (`created_at`);

-- Support Tickets table (tracks support requests)
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text REFERENCES `user`(`id`) ON DELETE SET NULL,
  `email` text NOT NULL,
  `name` text,
  `subject` text NOT NULL,
  `message` text NOT NULL,
  `category` text DEFAULT 'other' NOT NULL,
  `priority` text DEFAULT 'medium' NOT NULL,
  `status` text DEFAULT 'open' NOT NULL,
  `ai_response` text,
  `ai_response_helpful` integer,
  `assigned_to` text,
  `first_response_at` text,
  `resolved_at` text,
  `ip_address` text,
  `user_agent` text,
  `metadata` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE INDEX IF NOT EXISTS `support_tickets_user_idx` ON `support_tickets` (`user_id`);
CREATE INDEX IF NOT EXISTS `support_tickets_email_idx` ON `support_tickets` (`email`);
CREATE INDEX IF NOT EXISTS `support_tickets_status_idx` ON `support_tickets` (`status`);
CREATE INDEX IF NOT EXISTS `support_tickets_category_idx` ON `support_tickets` (`category`);
CREATE INDEX IF NOT EXISTS `support_tickets_priority_idx` ON `support_tickets` (`priority`);
CREATE INDEX IF NOT EXISTS `support_tickets_created_idx` ON `support_tickets` (`created_at`);

-- Newsletter Subscribers table (mailing list)
CREATE TABLE IF NOT EXISTS `newsletter_subscribers` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL UNIQUE,
  `name` text,
  `source` text DEFAULT 'website',
  `is_active` integer DEFAULT true NOT NULL,
  `unsubscribed_at` text,
  `email_preferences` text,
  `confirmed_at` text,
  `last_email_at` text,
  `ip_address` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `newsletter_subscribers_email_idx` ON `newsletter_subscribers` (`email`);
CREATE INDEX IF NOT EXISTS `newsletter_subscribers_active_idx` ON `newsletter_subscribers` (`is_active`);
CREATE INDEX IF NOT EXISTS `newsletter_subscribers_source_idx` ON `newsletter_subscribers` (`source`);
