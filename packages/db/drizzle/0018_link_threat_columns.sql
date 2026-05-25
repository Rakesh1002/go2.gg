-- Migration: Link threat/safety columns
-- Created: 2026-05-12
--
-- Adds per-link moderation columns so we can disable a link in seconds when
-- Google Safe Browsing or Cloudflare URL Scanner flags its destination as
-- phishing / malware / social engineering, without losing the row (we want
-- the audit trail for GSC reviews and for blocking re-creation of the same
-- destination from another slug).
--
-- Workflow:
--   1. Pre-flight at link create + update: lib/safe-browsing.ts looks up the
--      destination URL. On a positive verdict we reject before insert.
--   2. Daily rescan cron (0 0 * * *) re-checks active destinations; newly
--      flagged links get isDisabled=1 and a 410 Gone response from the
--      redirect handler.
--   3. The redirect handler honours `is_disabled = 1` with 410 and never
--      indexes — that's enforced by an X-Robots-Tag header on every response.
--
-- `disabled_reason` accepts free-form text but values from this enum are
-- used in code: 'safe_browsing:MALWARE', 'safe_browsing:SOCIAL_ENGINEERING',
-- 'safe_browsing:UNWANTED_SOFTWARE', 'safe_browsing:POTENTIALLY_HARMFUL_APPLICATION',
-- 'url_scanner:phishing', 'url_scanner:malicious', 'abuse_report', 'manual'.

ALTER TABLE `links` ADD COLUMN `is_disabled` integer DEFAULT 0;
ALTER TABLE `links` ADD COLUMN `disabled_at` text;
ALTER TABLE `links` ADD COLUMN `disabled_reason` text;
ALTER TABLE `links` ADD COLUMN `threat_status` text;
ALTER TABLE `links` ADD COLUMN `threat_verdict` text;
ALTER TABLE `links` ADD COLUMN `threat_last_checked` text;

CREATE INDEX `links_is_disabled_idx` ON `links` (`is_disabled`);
CREATE INDEX `links_threat_last_checked_idx` ON `links` (`threat_last_checked`);

-- Abuse reports — public submissions from the interstitial / report-abuse
-- page. We never auto-disable from a single report; the daily cron + a
-- review queue handle that. One row per submission, lightly deduped on
-- (link_id, reporter_ip_hash, day) at insert time.

CREATE TABLE `abuse_reports` (
  `id` text PRIMARY KEY NOT NULL,
  `link_id` text REFERENCES `links`(`id`) ON DELETE CASCADE,
  `short_url` text NOT NULL,
  `destination_url` text,
  `reason` text NOT NULL,
  `notes` text,
  `reporter_email` text,
  `reporter_ip_hash` text,
  `status` text NOT NULL DEFAULT 'open',
  `resolution` text,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `resolved_at` text
);

CREATE INDEX `abuse_reports_link_idx` ON `abuse_reports` (`link_id`);
CREATE INDEX `abuse_reports_status_idx` ON `abuse_reports` (`status`);
CREATE INDEX `abuse_reports_created_idx` ON `abuse_reports` (`created_at`);
