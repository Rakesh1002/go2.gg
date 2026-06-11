-- Migration: Drop unused secondary indexes on clicks
-- Created: 2026-06-11
--
-- D1 bills one "row written" per index entry, so the 13 indexes on clicks made
-- every click insert cost 14 billed rows (~$14/M clicks of the ~$29/M total)
-- and roughly doubled the table's storage footprint against the 10GB D1 cap.
--
-- A query audit (docs/product/cost-benefit-analysis.md, 2026-06) found the
-- seven indexes below are never chosen by any query plan: every analytics
-- aggregation filters by linkId/organizationId/userId + timestamp first, and
-- SQLite uses a single index per table access, so standalone indexes on
-- GROUP BY dimensions (country, device, browser, os, referrer, trigger) were
-- dead weight. identity_hash uniqueness is resolved via the KV dedup marker
-- on the hot path and COUNT(DISTINCT ...) under a linkId filter in analytics;
-- no predicate hits the index.
--
-- Kept: clicks_link_idx, clicks_user_idx, clicks_org_idx,
-- clicks_timestamp_idx, clicks_agent_id_idx, clicks_agent_run_id_idx —
-- all serve WHERE predicates (analytics scoping, usage metering, retention
-- pruning, agent-run attribution).
--
-- Effect on click-insert cost: 14 -> 7 billed rows per click.

DROP INDEX IF EXISTS clicks_country_idx;
DROP INDEX IF EXISTS clicks_device_idx;
DROP INDEX IF EXISTS clicks_browser_idx;
DROP INDEX IF EXISTS clicks_os_idx;
DROP INDEX IF EXISTS clicks_referrer_idx;
DROP INDEX IF EXISTS clicks_trigger_idx;
DROP INDEX IF EXISTS clicks_identity_idx;
