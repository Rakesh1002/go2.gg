-- Destination blocklist.
--
-- Human-confirmed abusive destinations, matched at create time on every path
-- and re-applied retroactively by the 4h rescan cron (both go through
-- checkDestinationThreat). Turns one finished investigation into permanent
-- platform-wide coverage.
--
-- `path_segment` is the highest-leverage kind: the 2026-08-23 spam ring reused
-- the affiliate sub-ids 26W1Z61T and 3NKHWHB across six accounts and multiple
-- hosts, so blocking the segment kills every future host carrying that id.

CREATE TABLE IF NOT EXISTS destination_blocklist (
  id           TEXT PRIMARY KEY,
  kind         TEXT NOT NULL,           -- host | host_suffix | path_prefix | path_segment
  value        TEXT NOT NULL,           -- normalized, lowercase
  action       TEXT NOT NULL DEFAULT 'block',   -- block | suspect
  reason       TEXT NOT NULL,
  incident_id  TEXT,                    -- revert one investigation's entries together
  created_by   TEXT,
  is_active    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS destination_blocklist_kind_value_idx
  ON destination_blocklist (kind, value);
CREATE INDEX IF NOT EXISTS destination_blocklist_active_idx
  ON destination_blocklist (is_active);

-- Seed with the 2026-08-23 ring's confirmed infrastructure. Versioned here so
-- the entries are reviewable in git rather than living only in prod.
INSERT OR IGNORE INTO destination_blocklist (id, kind, value, action, reason, incident_id, created_by) VALUES
  ('bl_2026_08_23_01', 'host',         'hostpic.org',            'block', 'Email open-tracking pixel host, 2026-08-23 spam ring', 'incident-2026-08-23', 'migration'),
  ('bl_2026_08_23_02', 'host',         'imgbs.com',              'block', 'Email open-tracking pixel host, 2026-08-23 spam ring', 'incident-2026-08-23', 'migration'),
  ('bl_2026_08_23_03', 'host',         'ofppt.eu.cc',            'block', 'Base64 redirector, 2026-08-23 spam ring',              'incident-2026-08-23', 'migration'),
  ('bl_2026_08_23_04', 'host',         'steptrea.com',           'block', 'Affiliate CPA network, 2026-08-23 spam ring',          'incident-2026-08-23', 'migration'),
  ('bl_2026_08_23_05', 'host',         'exploredomainpole.com',  'block', 'Affiliate CPA network, 2026-08-23 spam ring',          'incident-2026-08-23', 'migration'),
  ('bl_2026_08_23_06', 'path_segment', '26w1z61t',               'block', 'Affiliate sub-id reused across 6 ring accounts',       'incident-2026-08-23', 'migration'),
  ('bl_2026_08_23_07', 'path_segment', '3nkhwhb',                'block', 'Affiliate sub-id reused across 6 ring accounts',       'incident-2026-08-23', 'migration');
