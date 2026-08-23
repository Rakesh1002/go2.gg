/**
 * Behavioral abuse detection pass.
 *
 * Runs hourly. Modeled on threat-rescan.ts (batch + wall-clock budget + bail
 * and resume), but with no network calls — the budget here protects D1 round
 * trips, and every signal is computed from data already in hand.
 *
 * Defaults to SHADOW mode: it evaluates everything and records what it would
 * have done, but disables nothing and emails nobody. Flip to enforce with
 * `PUT /admin/flags/abuse_enforcement {"value":"enforce"}` once the corpus
 * replay and a shadow window both come back clean. The KV flag beats the env
 * var so the kill switch needs no deploy in either direction.
 */
import * as schema from "@repo/db";
import { and, asc, eq, inArray, isNull, like, or, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { Env } from "../bindings.js";
import { enforceForUser } from "./abuse-enforcement.js";
import {
  ABUSE_THRESHOLDS,
  type LinkSample,
  type SignalHit,
  clicksPerHour,
  destinationFingerprint,
  evaluateAccount,
  evaluateLink,
  findRingFingerprints,
  highestTier,
} from "./abuse-signals.js";
import { logEvent } from "./axiom.js";

const ABUSE_BATCH_SIZE = 500;
const BUDGET_MS = 15_000;
const WRITEBACK_CHUNK = 50;
/** Bounds the ring-expansion fan-out so one pass can't scan the table N times. */
const MAX_RING_FINGERPRINTS = 10;

export const ABUSE_FLAG_KEY = "flag:abuse_enforcement";

export type AbuseMode = "shadow" | "enforce";

export interface AbusePassResult {
  mode: AbuseMode;
  linksScanned: number;
  usersEvaluated: number;
  highHits: number;
  mediumHits: number;
  strikesIssued: number;
  suspensions: number;
  linksDisabled: number;
  exemptSkipped: number;
  bailedOnBudget: boolean;
  durationMs: number;
}

async function resolveMode(env: Env, forced?: AbuseMode): Promise<AbuseMode> {
  if (forced) return forced;
  try {
    const flag = await env.KV_CONFIG.get(ABUSE_FLAG_KEY);
    if (flag === "enforce" || flag === "shadow") return flag;
  } catch {
    // KV unavailable — fall through to the env var, then to the safe default.
  }
  return env.ABUSE_ENFORCEMENT_MODE === "enforce" ? "enforce" : "shadow";
}

export async function runAbuseDetectionPass(
  env: Env,
  db: DrizzleD1Database<typeof schema>,
  opts?: { forceMode?: AbuseMode; userId?: string; skipWriteback?: boolean }
): Promise<AbusePassResult> {
  const startedAt = Date.now();
  const mode = await resolveMode(env, opts?.forceMode);
  const deadline = startedAt + BUDGET_MS;

  const result: AbusePassResult = {
    mode,
    linksScanned: 0,
    usersEvaluated: 0,
    highHits: 0,
    mediumHits: 0,
    strikesIssued: 0,
    suspensions: 0,
    linksDisabled: 0,
    exemptSkipped: 0,
    bailedOnBudget: false,
    durationMs: 0,
  };

  const baseFilter = and(
    eq(schema.links.isArchived, false),
    or(eq(schema.links.isDisabled, false), isNull(schema.links.isDisabled))
  );

  const rows = await db
    .select({
      id: schema.links.id,
      userId: schema.links.userId,
      organizationId: schema.links.organizationId,
      destinationUrl: schema.links.destinationUrl,
      clickCount: schema.links.clickCount,
      abuseScanAt: schema.links.abuseScanAt,
      abuseScanClicks: schema.links.abuseScanClicks,
    })
    .from(schema.links)
    .where(opts?.userId ? and(baseFilter, eq(schema.links.userId, opts.userId)) : baseFilter)
    // Oldest bookmark first — true round-robin, same as the rescan cron.
    .orderBy(asc(schema.links.abuseScanAt))
    .limit(ABUSE_BATCH_SIZE);

  result.linksScanned = rows.length;
  if (rows.length === 0) {
    result.durationMs = Date.now() - startedAt;
    return result;
  }

  const nowMs = Date.now();
  const samples: Array<LinkSample & { organizationId: string | null }> = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    organizationId: row.organizationId,
    destinationUrl: row.destinationUrl,
    clickCount: row.clickCount,
    clicksPerHour: clicksPerHour(
      row.clickCount,
      row.abuseScanClicks ?? null,
      row.abuseScanAt ?? null,
      nowMs
    ),
  }));

  // --- Evaluate (pure, no I/O) ------------------------------------------
  const hitsByUser = new Map<string, SignalHit[]>();
  const addHit = (userId: string, hit: SignalHit) => {
    const list = hitsByUser.get(userId) ?? [];
    list.push(hit);
    hitsByUser.set(userId, list);
  };

  for (const sample of samples) {
    if (!sample.userId) continue;
    for (const hit of evaluateLink(sample)) addHit(sample.userId, hit);
  }

  const byUser = new Map<string, typeof samples>();
  for (const sample of samples) {
    if (!sample.userId) continue;
    const list = byUser.get(sample.userId) ?? [];
    list.push(sample);
    byUser.set(sample.userId, list);
  }
  for (const [userId, userLinks] of byUser) {
    for (const hit of evaluateAccount(userId, userLinks)) addHit(userId, hit);
  }
  result.usersEvaluated = byUser.size;

  // Ring fingerprints standing alone are informational only — medium tier,
  // never enforced. At this platform's size an agency running one client's
  // affiliate links across three seats is a real collision.
  for (const hit of findRingFingerprints(samples)) {
    const owners = new Set(samples.filter((s) => hit.linkIds.includes(s.id)).map((s) => s.userId));
    for (const owner of owners) if (owner) addHit(owner, hit);
  }

  // --- Ring expansion ----------------------------------------------------
  // Once an account trips a high-tier signal on its own merits, every OTHER
  // account sharing a destination fingerprint with one of its offending links
  // inherits that tier. This is what collapses a 12-account ring in one pass
  // instead of never: measured against the real corpus, volume signals alone
  // catch only the 5 high-traffic accounts, because the other 7 individually
  // look like modest users. It is safe precisely because it inherits an
  // already-confirmed seed rather than manufacturing a signal from nothing.
  const seedUsers = [...hitsByUser.entries()]
    .filter(([, hits]) => highestTier(hits) === "high")
    .map(([userId]) => userId);

  if (seedUsers.length > 0) {
    const seedFingerprints = new Set<string>();
    for (const userId of seedUsers) {
      for (const hit of hitsByUser.get(userId) ?? []) {
        if (hit.tier !== "high") continue;
        for (const linkId of hit.linkIds) {
          const sample = samples.find((s) => s.id === linkId);
          if (!sample) continue;
          const fingerprint = destinationFingerprint(sample.destinationUrl);
          if (fingerprint) seedFingerprints.add(fingerprint);
        }
      }
    }

    for (const fingerprint of [...seedFingerprints].slice(0, MAX_RING_FINGERPRINTS)) {
      const matches = await db
        .select({
          id: schema.links.id,
          userId: schema.links.userId,
          destinationUrl: schema.links.destinationUrl,
        })
        .from(schema.links)
        .where(and(baseFilter, like(schema.links.destinationUrl, `%${fingerprint}%`)))
        .limit(200);

      // Re-derive the fingerprint rather than trusting the LIKE: the substring
      // could match inside a query string or a longer, unrelated path.
      const confirmed = matches.filter(
        (m) => m.userId && destinationFingerprint(m.destinationUrl) === fingerprint
      );
      const expandedUsers = new Set(
        confirmed.map((m) => m.userId).filter((u): u is string => !!u && !seedUsers.includes(u))
      );
      if (expandedUsers.size === 0) continue;

      // Require the fingerprint to look like a ring in its own right before
      // enforcing on it. Without this, ONE legitimate link that happens to go
      // viral (>= LINK_LIFETIME_HARD) would make its fingerprint a seed, and
      // every other account linking to that same URL would be auto-disabled
      // and struck. Real corpus check: dub.sh, wa.link, github.com and
      // r2.dev destinations all produce fingerprints, so this is a live risk,
      // not a theoretical one. The 2026-08-23 ring shared its fingerprints
      // across 6 and 5 accounts, so this guard costs nothing against it.
      const distinctOwners = new Set(
        confirmed.map((m) => m.userId).filter((u): u is string => !!u)
      );
      if (distinctOwners.size < ABUSE_THRESHOLDS.RING_MIN_ACCOUNTS) {
        await logEvent(
          env,
          "abuse.ring.expansion_skipped",
          {
            mode,
            fingerprint,
            distinctOwners: distinctOwners.size,
            required: ABUSE_THRESHOLDS.RING_MIN_ACCOUNTS,
          },
          "info"
        ).catch(() => undefined);
        continue;
      }

      await logEvent(
        env,
        "abuse.ring.expanded",
        {
          mode,
          fingerprint,
          seedUsers,
          matchedUserIds: [...expandedUsers],
          matchedLinkCount: confirmed.length,
        },
        "warn"
      ).catch(() => undefined);

      for (const userId of expandedUsers) {
        addHit(userId, {
          signal: "ring_fingerprint",
          tier: "high",
          linkIds: confirmed.filter((m) => m.userId === userId).map((m) => m.id),
          measured: expandedUsers.size + seedUsers.length,
          threshold: 1,
          detail: `shares destination fingerprint "${fingerprint}" with an account already enforced for abuse`,
        });
      }
    }
  }

  // --- Enforce -----------------------------------------------------------
  for (const [userId, hits] of hitsByUser) {
    const tier = highestTier(hits);
    if (tier === "high") result.highHits++;
    else if (tier === "medium") result.mediumHits++;

    if (tier !== "high") {
      await logEvent(
        env,
        "abuse.quarantine.flagged",
        { mode, userId, signals: hits.map((h) => h.signal), details: hits.map((h) => h.detail) },
        "warn"
      ).catch(() => undefined);
      continue;
    }

    if (Date.now() >= deadline) {
      result.bailedOnBudget = true;
      break;
    }

    const [meta] = await db
      .select({
        isAdmin: schema.userMetadata.isAdmin,
        isBanned: schema.userMetadata.isBanned,
        abuseExempt: schema.userMetadata.abuseExempt,
      })
      .from(schema.userMetadata)
      .where(eq(schema.userMetadata.userId, userId))
      .limit(1);

    if (meta?.isBanned) continue;
    if (meta?.isAdmin || meta?.abuseExempt) {
      result.exemptSkipped++;
      await logEvent(
        env,
        "abuse.exempt.skipped",
        { userId, signals: hits.map((h) => h.signal), details: hits.map((h) => h.detail) },
        "warn"
      ).catch(() => undefined);
      continue;
    }

    // Enforce only on the links that actually carry a high-tier hit — never
    // every link the account owns.
    const offendingIds = [
      ...new Set(hits.filter((h) => h.tier === "high").flatMap((h) => h.linkIds)),
    ];
    const organizationId = byUser.get(userId)?.[0]?.organizationId ?? null;

    const outcome = await enforceForUser(env, db, {
      userId,
      organizationId,
      hits,
      linkIds: offendingIds,
      mode,
    });

    result.linksDisabled += outcome.linksDisabled;
    if (outcome.action === "strike") result.strikesIssued++;
    if (outcome.action === "suspend") {
      result.strikesIssued++;
      result.suspensions++;
    }

    for (const hit of hits) {
      await logEvent(
        env,
        "abuse.signal.hit",
        {
          mode,
          userId,
          signal: hit.signal,
          tier: hit.tier,
          measured: hit.measured,
          threshold: hit.threshold,
          detail: hit.detail,
          wouldAction: outcome.action,
        },
        "warn"
      ).catch(() => undefined);
    }
  }

  // --- Write back the velocity baseline, last ---------------------------
  // Deliberately last: a budget bail leaves stale baselines, so the NEXT pass
  // sees a larger delta over a longer window. The failure mode is more
  // sensitive, never less.
  if (!opts?.skipWriteback) {
    const stampedAt = new Date().toISOString();
    // `abuse_scan_clicks = click_count` is self-referential per row, so the
    // whole chunk collapses into a single statement — one D1 write per chunk
    // rather than one per link. It also re-reads the live counter, so clicks
    // that landed during the pass are not silently swallowed.
    for (let i = 0; i < samples.length; i += WRITEBACK_CHUNK) {
      const ids = samples.slice(i, i + WRITEBACK_CHUNK).map((s) => s.id);
      await db
        .update(schema.links)
        .set({ abuseScanClicks: sql`click_count`, abuseScanAt: stampedAt })
        .where(inArray(schema.links.id, ids));
    }
  }

  result.durationMs = Date.now() - startedAt;

  await logEvent(
    env,
    "abuse.scan.completed",
    { ...result },
    result.highHits > 0 ? "warn" : "info"
  ).catch(() => undefined);

  return result;
}
