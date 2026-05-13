-- Bio Page Modernization (Workstreams A/B/C)
--
-- Adds:
--   * link_galleries.hide_branding   — Pro+ flag to hide "Powered by Go2"
--   * link_galleries.is_primary      — primary gallery for a custom domain
--   * gallery_items.last_clicked_at  — recency for per-item analytics
--   * gallery_items.og_title / og_description / og_fetched_at — OG-unfurl cache
--   * domains.bio_gallery_id         — bind a verified domain to a bio gallery
--   * bio_subscribers (new table)    — email signup + gate captures
--
-- Also extends gallery_items.type enum to allow 'email_signup'. The enum is
-- enforced at the application layer (drizzle text({ enum })), not at the DB
-- level — SQLite has no native enum — so no schema change is required for
-- new values to be accepted. Existing rows are unaffected.

ALTER TABLE link_galleries ADD COLUMN hide_branding INTEGER NOT NULL DEFAULT 0;
ALTER TABLE link_galleries ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0;

ALTER TABLE gallery_items ADD COLUMN last_clicked_at TEXT;
ALTER TABLE gallery_items ADD COLUMN og_title TEXT;
ALTER TABLE gallery_items ADD COLUMN og_description TEXT;
ALTER TABLE gallery_items ADD COLUMN og_fetched_at TEXT;

ALTER TABLE domains ADD COLUMN bio_gallery_id TEXT REFERENCES link_galleries(id) ON DELETE SET NULL;

CREATE TABLE bio_subscribers (
  id            TEXT PRIMARY KEY,
  gallery_id    TEXT NOT NULL REFERENCES link_galleries(id) ON DELETE CASCADE,
  item_id       TEXT REFERENCES gallery_items(id) ON DELETE SET NULL,
  email         TEXT NOT NULL,
  confirmed     INTEGER NOT NULL DEFAULT 0,
  confirm_token TEXT,
  source        TEXT NOT NULL DEFAULT 'signup',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at  TEXT
);

CREATE INDEX bio_subs_gallery_idx ON bio_subscribers (gallery_id);
CREATE UNIQUE INDEX bio_subs_unique_idx ON bio_subscribers (gallery_id, email);
