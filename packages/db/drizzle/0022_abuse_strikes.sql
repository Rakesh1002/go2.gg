-- Behavioral abuse detection: strike ledger + click-velocity baseline.
--
-- Why a stored click_count snapshot rather than querying the `clicks` table:
-- free accounts over their tracked-clicks quota get flagged and stop writing
-- `clicks` rows entirely (see the quota-degrade block in apps/api/src/index.ts),
-- and bot-detected clicks never write one either — but `links.click_count` is
-- incremented in both cases. Prod proved the gap: 222k `clicks` rows against
-- 4.6M counted clicks, and one ring link with 62k rows against a click_count
-- of 2,917,856. A detector reading `clicks` goes blind exactly when abuse
-- ramps. click_count is monotonic and never pruned, so a periodic snapshot is
-- the only retention-proof velocity source.

CREATE TABLE IF NOT EXISTS abuse_strikes (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id TEXT,
  strike_number   INTEGER NOT NULL,
  signal          TEXT NOT NULL,
  tier            TEXT NOT NULL DEFAULT 'high',
  action          TEXT NOT NULL,          -- strike | suspend | flag | shadow
  status          TEXT NOT NULL DEFAULT 'active',  -- active | revoked
  evidence        TEXT NOT NULL,          -- JSON: SignalHit[]
  link_ids        TEXT NOT NULL,          -- JSON string[]
  links_disabled  INTEGER NOT NULL DEFAULT 0,
  -- `${userId}:${YYYY-MM-DD}` — the DB-level guard behind the 24h cooldown,
  -- so a double-fired cron can never advance the ladder twice.
  dedupe_key      TEXT NOT NULL,
  notified_at     TEXT,
  expires_at      TEXT,
  revoked_at      TEXT,
  revoked_by      TEXT,
  revoked_reason  TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS abuse_strikes_dedupe_idx ON abuse_strikes (dedupe_key);
CREATE INDEX IF NOT EXISTS abuse_strikes_user_idx   ON abuse_strikes (user_id, created_at);
CREATE INDEX IF NOT EXISTS abuse_strikes_status_idx ON abuse_strikes (status, action);

-- Velocity baseline. Mirrors the threat_last_checked round-robin bookmark.
ALTER TABLE links ADD COLUMN abuse_scan_at     TEXT;
ALTER TABLE links ADD COLUMN abuse_scan_clicks INTEGER;
CREATE INDEX IF NOT EXISTS links_abuse_scan_at_idx ON links (abuse_scan_at);

-- Allowlist escape hatch: exempt a known-good high-volume customer without a
-- code deploy. A false positive is the expensive failure mode at this size.
ALTER TABLE user_metadata ADD COLUMN abuse_exempt INTEGER DEFAULT 0;
