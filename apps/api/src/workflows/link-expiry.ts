/**
 * Link Expiry Workflow.
 *
 * When a link is created with `expiresAt` set, the link route fires this
 * Workflow with `{ linkId, expiresAt }`. The Workflow sleeps until the
 * expiry timestamp using `step.sleepUntil` (durable across Worker restarts
 * — Cloudflare persists the wakeup time, not the in-memory timer), then
 * evicts the link's KV cache entry so the redirect handler returns 410 even
 * if the daily cleanup cron hasn't run yet.
 *
 * Why this exists separate from the daily cron:
 * 1. The cron runs once a day. Without a Workflow, a link expiring at 09:01
 *    keeps redirecting until the next 00:00 UTC sweep — almost 24h of
 *    after-hours traffic. The Workflow evicts within seconds of the timestamp.
 * 2. The /agents marketing page promises "expiring + revocable agent links";
 *    a synchronous policy_expires_at field doesn't deliver that promise.
 * 3. Each instance is durable: if the Worker crashes the night the link is
 *    due to expire, the Workflow resumes from the sleep step on the next
 *    runtime and still evicts.
 *
 * Triggered from:
 *   apps/api/src/routes/v1/links.ts (link create + update with expiresAt set)
 */

import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../bindings.js";
import { logEvent, logError } from "./../lib/axiom.js";

export interface LinkExpiryWorkflowParams {
  /** D1 link.id */
  linkId: string;
  /** ISO timestamp when this link should be evicted */
  expiresAt: string;
  /** ISO time the workflow was scheduled — for diagnostics */
  scheduledAt: string;
}

export class LinkExpiryWorkflow extends WorkflowEntrypoint<
  Env,
  LinkExpiryWorkflowParams
> {
  override async run(
    event: WorkflowEvent<LinkExpiryWorkflowParams>,
    step: WorkflowStep,
  ) {
    const env = this.env;
    const { linkId, expiresAt, scheduledAt } = event.payload;

    // Sleep until the expiry timestamp. Workflows persist the wakeup time
    // in their durable execution log so this survives Worker restarts.
    await step.sleepUntil("wait-for-expiry", new Date(expiresAt));

    // Re-fetch the link inside a step so the load is durable + retryable.
    const link = await step.do("load-link", async () => {
      const db = drizzle(env.DB, { schema });
      const rows = await db
        .select({
          id: schema.links.id,
          domain: schema.links.domain,
          slug: schema.links.slug,
          expiresAt: schema.links.expiresAt,
          isArchived: schema.links.isArchived,
        })
        .from(schema.links)
        .where(eq(schema.links.id, linkId))
        .limit(1);
      return rows[0] ?? null;
    });

    if (!link) {
      // Link was deleted between scheduling and now — nothing to evict.
      await logEvent(env, "link-expiry: link not found", {
        linkId,
        scheduledAt,
      });
      return { evicted: false, reason: "not-found" };
    }

    // If the user pushed expiresAt out further (or cleared it) the persisted
    // value will disagree with the workflow's payload. Trust D1.
    if (link.expiresAt && link.expiresAt !== expiresAt) {
      await logEvent(env, "link-expiry: expiry rescheduled, skipping", {
        linkId,
        plannedExpiresAt: expiresAt,
        currentExpiresAt: link.expiresAt,
      });
      return { evicted: false, reason: "rescheduled" };
    }

    if (link.isArchived) {
      // Already evicted by the user.
      return { evicted: false, reason: "already-archived" };
    }

    await step.do("evict-kv", async () => {
      await env.LINKS_KV.delete(`${link.domain}:${link.slug}`);
    });

    await logEvent(env, "link-expiry: evicted", {
      linkId,
      domain: link.domain,
      slug: link.slug,
      expiresAt,
      scheduledAt,
    });

    return { evicted: true, domain: link.domain, slug: link.slug };
  }
}

/**
 * Helper used by the link create / update routes.
 *
 * Schedules a LinkExpiryWorkflow instance for `expiresAt`. Fails open: if
 * the binding is missing in dev (no [[workflows]] entry) we log and return
 * — the daily cron is the safety net.
 */
export async function scheduleLinkExpiry(
  env: Env,
  params: { linkId: string; expiresAt: string },
): Promise<void> {
  const wf = env.LINK_EXPIRY_WORKFLOW;
  if (!wf || typeof wf.create !== "function") {
    console.warn("[link-expiry] LINK_EXPIRY_WORKFLOW binding missing");
    return;
  }
  try {
    await wf.create({
      // Stable ID per link so re-creating with the same expiresAt is a no-op
      // (Workflows reject duplicate IDs).
      id: `link-expiry:${params.linkId}:${params.expiresAt}`,
      params: {
        linkId: params.linkId,
        expiresAt: params.expiresAt,
        scheduledAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    await logError(env, "link-expiry: schedule failed", {
      linkId: params.linkId,
      expiresAt: params.expiresAt,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
