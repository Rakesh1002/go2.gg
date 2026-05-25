import * as schema from "@repo/db";
import { and, asc, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
/**
 * Periodic threat rescan
 *
 * Re-checks active destinations against Google Safe Browsing + Cloudflare URL
 * Scanner. Phishing pages often go live AFTER the link is created (cloaking
 * attack), so the create-time check isn't enough on its own.
 *
 * Strategy:
 *   - Round-robin: pick the N links whose threat_last_checked is oldest (or
 *     null) and not currently disabled.
 *   - Run checks for CONCURRENCY links in parallel via Promise.all (each
 *     check itself runs Safe Browsing + URL Scanner in parallel internally).
 *   - On a flagged verdict: disable the link, update KV with isDisabled (so
 *     the resolver still renders the 410 explanation page), queue an owner
 *     notification email.
 *   - On unknown/clean: bump threat_last_checked so the round-robin keeps
 *     moving — never get stuck on the same set.
 *   - Honour a per-invocation wall-clock budget so a slow upstream doesn't
 *     blow the Worker's 30s scheduled-trigger ceiling.
 *
 * Capacity (per invocation, default RESCAN_BATCH_SIZE=200, CONCURRENCY=10):
 *   - 200 links / 10 concurrent = 20 sequential batches
 *   - Median per-batch ~500ms (one checkDestinationThreat fires SB+scanner
 *     in parallel) → ~10s wall time for a full batch
 *   - Budget cutoff at 25s leaves headroom; partial run is fine, next
 *     invocation picks up the remaining stale links.
 * Triggered every 4h via the existing `0 * /4 * * *` cron in index.ts.
 */
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { Env } from "../bindings.js";
import { checkDestinationThreat } from "./safe-browsing.js";

export interface RescanResult {
  scanned: number;
  flagged: number;
  notified: number;
  bailedOnBudget: boolean;
}

const RESCAN_BATCH_SIZE = 200;
const RESCAN_CONCURRENCY = 10;
const SCAN_INTERVAL_HOURS = 4;
const BUDGET_MS = 25_000;

type CandidateLink = {
  id: string;
  domain: string;
  slug: string;
  destinationUrl: string;
  userId: string | null;
  organizationId: string | null;
  threatStatus: string | null;
  threatLastChecked: string | null;
};

async function processOne(
  env: Env,
  db: DrizzleD1Database<typeof schema>,
  link: CandidateLink,
  counters: { flagged: number; notified: number }
): Promise<void> {
  const verdict = await checkDestinationThreat(env, link.destinationUrl);
  const now = new Date().toISOString();

  if (verdict.status === "flagged") {
    counters.flagged += 1;
    await db
      .update(schema.links)
      .set({
        isDisabled: true,
        disabledAt: now,
        disabledReason: verdict.verdict,
        threatStatus: "flagged",
        threatVerdict: verdict.verdict,
        threatLastChecked: now,
        updatedAt: now,
      })
      .where(eq(schema.links.id, link.id));

    // Update KV with isDisabled marker (don't delete — resolver needs the
    // entry to render the 410 explanation page with disabled_reason).
    try {
      const key = `${link.domain}:${link.slug}`;
      const cached = await env.LINKS_KV.get<{ [k: string]: unknown }>(key, "json");
      if (cached) {
        await env.LINKS_KV.put(
          key,
          JSON.stringify({
            ...cached,
            isDisabled: true,
            disabledReason: verdict.verdict,
            threatStatus: "flagged",
          })
        );
      }
    } catch (err) {
      console.error("rescan: failed to update KV", err);
    }

    // Notify owner (best-effort). Guest links have no owner.
    if (link.userId && env.BACKGROUND_QUEUE) {
      const owner = await db
        .select({ email: schema.users.email, name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, link.userId))
        .limit(1);

      if (owner[0]?.email) {
        try {
          await env.BACKGROUND_QUEUE.send({
            type: "email:send",
            payload: {
              to: owner[0].email,
              template: "link-disabled-for-safety",
              data: {
                customerName: owner[0].name || "there",
                shortUrl: `https://${link.domain}/${link.slug}`,
                destinationUrl: link.destinationUrl,
                reason: verdict.verdict,
                dashboardUrl: `${env.APP_URL}/dashboard/links?filter=disabled`,
              },
            },
          });
          counters.notified += 1;
        } catch (err) {
          console.error("rescan: failed to queue notification email", err);
        }
      }
    }
    return;
  }

  // Clean or unknown — bump threat_last_checked so round-robin keeps moving
  // and persist any verdict string we have.
  await db
    .update(schema.links)
    .set({
      threatStatus: verdict.status,
      threatLastChecked: now,
      ...(verdict.verdict ? { threatVerdict: verdict.verdict } : {}),
      updatedAt: now,
    })
    .where(eq(schema.links.id, link.id));
}

export async function rescanLinkBatch(
  env: Env,
  db: DrizzleD1Database<typeof schema>
): Promise<RescanResult> {
  const start = Date.now();
  const cutoff = new Date(start - SCAN_INTERVAL_HOURS * 60 * 60 * 1000).toISOString();

  const candidates = await db
    .select({
      id: schema.links.id,
      domain: schema.links.domain,
      slug: schema.links.slug,
      destinationUrl: schema.links.destinationUrl,
      userId: schema.links.userId,
      organizationId: schema.links.organizationId,
      threatStatus: schema.links.threatStatus,
      threatLastChecked: schema.links.threatLastChecked,
    })
    .from(schema.links)
    .where(
      and(
        eq(schema.links.isArchived, false),
        or(eq(schema.links.isDisabled, false), isNull(schema.links.isDisabled)),
        or(
          isNull(schema.links.threatLastChecked),
          sql`${schema.links.threatLastChecked} < ${cutoff}`
        )
      )
    )
    .orderBy(asc(schema.links.threatLastChecked))
    .limit(RESCAN_BATCH_SIZE);

  const counters = { flagged: 0, notified: 0 };
  let scanned = 0;
  let bailedOnBudget = false;

  // Chunk into batches of CONCURRENCY and process each batch in parallel.
  // We check the wall-clock budget between batches so a stuck upstream
  // doesn't blow the Worker's 30s scheduled-trigger ceiling.
  for (let i = 0; i < candidates.length; i += RESCAN_CONCURRENCY) {
    if (Date.now() - start > BUDGET_MS) {
      bailedOnBudget = true;
      break;
    }
    const batch = candidates.slice(i, i + RESCAN_CONCURRENCY);
    await Promise.all(batch.map((link) => processOne(env, db, link, counters)));
    scanned += batch.length;
  }

  void isNotNull;

  return { scanned, flagged: counters.flagged, notified: counters.notified, bailedOnBudget };
}
