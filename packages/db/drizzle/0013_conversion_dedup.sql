-- Race-safe conversion dedup
--
-- Prevents duplicate conversion rows when an integrator retries with the same
-- externalId (Stripe charge, order ID, etc). Coalescing goal_id makes NULL
-- goals participate in the dedup so an unmatched conversion can't slip in
-- twice. The partial WHERE clause leaves rows without externalId untouched —
-- those are intentionally not deduplicated.

CREATE UNIQUE INDEX IF NOT EXISTS conversions_dedup_idx
  ON conversions (link_id, COALESCE(goal_id, ''), external_id)
  WHERE external_id IS NOT NULL;
