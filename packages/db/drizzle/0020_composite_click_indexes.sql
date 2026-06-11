-- Migration: Replace single-column clicks scope indexes with composites
-- Created: 2026-06-11
--
-- Every hot aggregation on clicks filters by a scope AND a time window:
--   - usage metering / Stripe meter:  organization_id + timestamp >= ?
--   - retention pruning:              organization_id + timestamp < ?
--   - per-link analytics:             link_id + timestamp >= ?
--   - dashboard analytics:            user_id + timestamp >= ?
--
-- With single-column indexes, COUNT(*) over a window does an index probe on
-- the scope column then fetches and filters EVERY retained row for that
-- scope — at Pro retention (365d) that walks millions of rows daily and
-- heads at D1's statement-time ceiling. A (scope, timestamp) composite makes
-- these range scans index-only.
--
-- Cost-neutral with migration 0019's accounting: three indexes are dropped
-- and three created, so click inserts still cost 7 billed rows. Composites
-- serve plain scope-only predicates too (leftmost prefix rule).

DROP INDEX IF EXISTS clicks_link_idx;
DROP INDEX IF EXISTS clicks_user_idx;
DROP INDEX IF EXISTS clicks_org_idx;

CREATE INDEX IF NOT EXISTS clicks_link_ts_idx ON clicks (link_id, timestamp);
CREATE INDEX IF NOT EXISTS clicks_user_ts_idx ON clicks (user_id, timestamp);
CREATE INDEX IF NOT EXISTS clicks_org_ts_idx ON clicks (organization_id, timestamp);
