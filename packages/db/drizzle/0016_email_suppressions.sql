-- Migration: Email suppression list
-- Created: 2026-04-28
--
-- One row per recipient we've decided not to email. `sendEmail` consults
-- this table before dispatching to the CF Email binding and upserts a row
-- when the binding throws a hard-bounce-class error.
--
-- Manual entries (test accounts that leaked into prod, abuse reports,
-- explicit unsubscribe-from-all) use reason='manual'. Auto-suppressions
-- from CF send failures use reason='hard_bounce' or 'invalid'.
--
-- The PK is the lowercased email itself: cheap idempotent upsert, no
-- coordinated UUIDs needed across writers (queue consumer, admin tool,
-- one-off scripts).

CREATE TABLE `email_suppressions` (
  `email` text PRIMARY KEY NOT NULL,
  `reason` text NOT NULL,
  `source` text,
  `last_error` text,
  `failure_count` integer NOT NULL DEFAULT 1,
  `first_seen_at` text NOT NULL DEFAULT (datetime('now')),
  `last_seen_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX `email_suppressions_reason_idx` ON `email_suppressions` (`reason`);
