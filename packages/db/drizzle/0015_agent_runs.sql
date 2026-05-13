-- Migration: First-class agent_runs table
-- Created: 2026-04-28
--
-- Before this migration, "agent runs" were a derived view over the `clicks`
-- table — runs that created links but received no clicks were invisible to
-- /dashboard/agent-runs and the MCP `list_agent_runs` tool. This table makes
-- runs first-class so they appear immediately on link creation.
--
-- A row is auto-upserted by the link-create handler whenever a link is
-- stamped with `agent_run_id`. Lifecycle status defaults to 'running' and
-- can be transitioned by future start_run / end_run MCP tools.
--
-- Backfill is handled in two parts at the end of this migration:
--   1. Synthesise runs for any historical clicks/links that already carry
--      an agent_run_id but predate the table.
--   2. Recompute denormalised link_count and click_count for those rows.

CREATE TABLE `agent_runs` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `organization_id` text REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  `agent_id` text NOT NULL,
  `run_id` text NOT NULL,
  `actor_id` text,
  `status` text NOT NULL DEFAULT 'running',
  `link_count` integer NOT NULL DEFAULT 0,
  `click_count` integer NOT NULL DEFAULT 0,
  `metadata` text,
  `started_at` text NOT NULL DEFAULT (datetime('now')),
  `ended_at` text,
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX `agent_runs_workspace_run_idx`
  ON `agent_runs` (`user_id`, `agent_id`, `run_id`);
CREATE INDEX `agent_runs_org_idx` ON `agent_runs` (`organization_id`);
CREATE INDEX `agent_runs_status_idx` ON `agent_runs` (`status`);
CREATE INDEX `agent_runs_started_idx` ON `agent_runs` (`started_at`);
CREATE INDEX `agent_runs_actor_idx` ON `agent_runs` (`actor_id`);

-- Backfill: synthesise run rows from existing links + clicks. Use the
-- earliest (link.created_at, click.timestamp) as started_at, the latest as
-- updated_at; status defaults to 'completed' for backfilled runs since they
-- represent past activity that won't transition further.
INSERT OR IGNORE INTO `agent_runs`
  (id, user_id, organization_id, agent_id, run_id, actor_id, status,
   link_count, click_count, started_at, ended_at, updated_at)
SELECT
  lower(hex(randomblob(16))) AS id,
  l.user_id,
  l.organization_id,
  l.agent_id,
  l.agent_run_id,
  l.agent_actor_id,
  'completed' AS status,
  COUNT(DISTINCT l.id) AS link_count,
  COALESCE(SUM(l.click_count), 0) AS click_count,
  MIN(l.created_at) AS started_at,
  MAX(l.updated_at) AS ended_at,
  MAX(l.updated_at) AS updated_at
FROM `links` l
WHERE l.agent_id IS NOT NULL
  AND l.agent_run_id IS NOT NULL
  AND l.user_id IS NOT NULL
GROUP BY l.user_id, l.agent_id, l.agent_run_id;
