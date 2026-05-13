-- Migration: Link Retention Policy
-- Created: 2026-04-27
--
-- Adds `policy_expires_at` column to `links` so we can apply a plan-tier
-- retention policy (free = 60 days, paid = forever) without overwriting any
-- user-set `expires_at`. The redirect handler and list endpoint treat the
-- earlier of the two timestamps as the effective expiry.
--
-- Backfill is intentionally NOT done in this migration — the daily cron in
-- the API worker (`scheduledHandler` in src/index.ts) sweeps free-tier links
-- with NULL `policy_expires_at` on its first run after deploy and stamps
-- `created_at + 60d` retroactively.

ALTER TABLE links ADD COLUMN policy_expires_at TEXT;
CREATE INDEX IF NOT EXISTS links_policy_expires_at_idx ON links (policy_expires_at);
