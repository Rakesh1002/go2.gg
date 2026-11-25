import * as schema from "@repo/db";
import { and, asc, eq, gt, isNull, ne, or, sql } from "drizzle-orm";
/**
 * Periodic threat rescan
 *
 * Re-checks active destinations against Google Safe Browsing + Cloudflare URL
 * Scanner. Phishing pages often go live AFTER the link is created (cloaking
 * attack), so the create-time check isn't enough on its own.
 *
 * Strategy:
 *   - Short-URL pass: every active short URL goes to Safe Browsing in batches
 *     of 500. Google pins a phishing chain on its entry URL, so `go2.gg/<slug>`
 *     can be listed while the destination reads clean — the destination check
 *     alone never sees that verdict.
 *   - Round-robin: pick the N links whose threat_last_checked is oldest (or
 *     null) and not currently disabled.
 *   - Run checks for CONCURRENCY links in parallel via Promise.all (each
 *     check itself runs Safe Browsing + URL Scanner in parallel internally).
 *   - On a flagged verdict: disable the link, update KV with isDisabled (so
 *     the resolver still renders the 410 explanation page), queue an owner
 *     notification email, then escalate on the owner: the first flag re-checks
 *     their other live links this run, a second Safe Browsing flag within
 *     THREAT_FLAG_WINDOW_DAYS suspends the account.
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
import { logEvent } from "./axiom.js";
import {
  SB_MAX_ENTRIES,
  checkDestinationThreat,
  lookupSafeBrowsing,
  submitUrlScan,
} from "./safe-browsing.js";
import {
  type ThreatType,
  attributeShortUrlFlags,
  domainRootOf,
  shortUrlOf,
} from "./threat-verdict.js";

export interface RescanResult {
  scanned: number;
  flagged: number;
  notified: number;
  suspended: number;
  bailedOnBudget: boolean;
}

const RESCAN_BATCH_SIZE = 200;
const RESCAN_CONCURRENCY = 10;
const SCAN_INTERVAL_HOURS = 4;
const BUDGET_MS = 25_000;
/**
 * Short-URL listings spread over more owners than this in one pass look like a
 * misattribution, not abuse — a human decides. Counted per owner so a single
 * abuser with many listed links cannot switch the pass off for everyone.
 */
const MAX_SHORT_URL_FLAGGED_OWNERS_PER_RUN = 5;
const THREAT_FLAGS_BEFORE_SUSPENSION = 2;
const THREAT_FLAG_WINDOW_DAYS = 30;
/** abuse_strikes.signal for the threat-flag ledger. Rows use action "flag", so the behavioral strike ladder never counts them. */
const THREAT_FLAG_SIGNAL = "threat_safe_browsing";

type Db = DrizzleD1Database<typeof schema>;

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

type RunState = {
  counters: { flagged: number; notified: number; suspended: number };
  queue: CandidateLink[];
  queued: Set<string>;
  suspending: Set<string>;
};

const candidateColumns = {
  id: schema.links.id,
  domain: schema.links.domain,
  slug: schema.links.slug,
  destinationUrl: schema.links.destinationUrl,
  userId: schema.links.userId,
  organizationId: schema.links.organizationId,
  threatStatus: schema.links.threatStatus,
  threatLastChecked: schema.links.threatLastChecked,
};

// Expired links already 410 at the resolver; scanning them only burns quota,
// and flagging them would count toward an owner's auto-suspension.
const isLive = () => {
  const now = new Date().toISOString();
  return and(
    eq(schema.links.isArchived, false),
    or(eq(schema.links.isDisabled, false), isNull(schema.links.isDisabled)),
    or(isNull(schema.links.expiresAt), gt(schema.links.expiresAt, now)),
    or(isNull(schema.links.policyExpiresAt), gt(schema.links.policyExpiresAt, now))
  );
};

function enqueue(state: RunState, link: CandidateLink): void {
  if (state.queued.has(link.id)) return;
  state.queued.add(link.id);
  state.queue.push(link);
}

async function disableFlaggedLink(
  env: Env,
  db: Db,
  link: CandidateLink,
  reason: string,
  state: RunState
): Promise<void> {
  const now = new Date().toISOString();
  state.counters.flagged += 1;
  await db
    .update(schema.links)
    .set({
      isDisabled: true,
      disabledAt: now,
      disabledReason: reason,
      threatStatus: "flagged",
      threatVerdict: reason,
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
          disabledReason: reason,
          threatStatus: "flagged",
        })
      );
    }
  } catch (err) {
    console.error("rescan: failed to update KV", err);
  }

  // Guest links have no owner to notify or escalate on.
  if (!link.userId) return;

  if (env.BACKGROUND_QUEUE) {
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
              shortUrl: shortUrlOf(link),
              destinationUrl: link.destinationUrl,
              reason,
              dashboardUrl: `${env.APP_URL}/dashboard/links?filter=disabled`,
            },
          },
        });
        state.counters.notified += 1;
      } catch (err) {
        console.error("rescan: failed to queue notification email", err);
      }
    }
  }

  await escalateOwner(env, db, link, link.userId, reason, state);
}

/**
 * One flagged link can be an innocent user's compromised destination; two
 * Safe Browsing flags in a month is the phishing-account pattern
 * (go2.gg/botrss and go2.gg/scanit came from one account, 18 minutes apart,
 * and the second stayed live 15 days).
 *
 * Only Safe Browsing verdicts count: the brand heuristic, blocklist and URL
 * Scanner still disable the link, but a new blocklist entry must not ban
 * every agency with two links to one compromised client site.
 *
 * Flags are counted from abuse_strikes, not from links.threat_status: an owner
 * can repoint a disabled link (PATCH rewrites threat_status) or archive it and
 * reclaim the slug (hard-deletes the row), and either would erase the evidence.
 */
async function escalateOwner(
  env: Env,
  db: Db,
  link: CandidateLink,
  userId: string,
  reason: string,
  state: RunState
): Promise<void> {
  const [meta] = await db
    .select({ isBanned: schema.userMetadata.isBanned, exempt: schema.userMetadata.abuseExempt })
    .from(schema.userMetadata)
    .where(eq(schema.userMetadata.userId, userId))
    .limit(1);
  if (meta?.isBanned) return;

  if (reason.startsWith("safe_browsing:")) {
    const now = new Date().toISOString();
    await db
      .insert(schema.abuseStrikes)
      .values({
        id: crypto.randomUUID(),
        userId,
        organizationId: link.organizationId,
        strikeNumber: 0,
        signal: THREAT_FLAG_SIGNAL,
        tier: "high",
        action: "flag",
        status: "active",
        evidence: JSON.stringify([
          {
            signal: THREAT_FLAG_SIGNAL,
            tier: "high",
            linkIds: [link.id],
            measured: 1,
            threshold: THREAT_FLAGS_BEFORE_SUSPENSION,
            detail: `${reason} on ${shortUrlOf(link)} -> ${link.destinationUrl}`,
          },
        ]),
        linkIds: JSON.stringify([link.id]),
        linksDisabled: 1,
        dedupeKey: `threat:${link.id}`,
        createdAt: now,
      })
      .onConflictDoNothing();

    const since = new Date(Date.now() - THREAT_FLAG_WINDOW_DAYS * 86_400_000).toISOString();
    const [{ flags }] = await db
      .select({ flags: sql<number>`count(*)` })
      .from(schema.abuseStrikes)
      .where(
        and(
          eq(schema.abuseStrikes.userId, userId),
          eq(schema.abuseStrikes.signal, THREAT_FLAG_SIGNAL),
          eq(schema.abuseStrikes.status, "active"),
          gt(schema.abuseStrikes.createdAt, since)
        )
      );

    // Checked and claimed synchronously: two flags from one owner in the same
    // Promise.all batch would otherwise both run banUser.
    if (flags >= THREAT_FLAGS_BEFORE_SUSPENSION && !meta?.exempt) {
      if (state.suspending.has(userId)) return;
      state.suspending.add(userId);
      const { banUser } = await import("./suspension.js");
      const result = await banUser(
        env,
        db,
        userId,
        `Automated: ${flags} Safe Browsing flags within ${THREAT_FLAG_WINDOW_DAYS} days`
      );
      state.counters.suspended += 1;
      await logEvent(env, "threat.suspension.auto", { userId, flags, ...result }, "error").catch(
        () => undefined
      );
      return;
    }
  }

  // Re-check the owner's other live links this run instead of waiting their
  // turn in the round-robin. Nulling threat_last_checked puts any the budget
  // cuts off at the front of the next pass.
  // Scoped by predicate, not an id list: D1 caps a query at 100 bound params.
  const siblingScope = and(eq(schema.links.userId, userId), ne(schema.links.id, link.id), isLive());
  const siblings = await db.select(candidateColumns).from(schema.links).where(siblingScope);
  if (siblings.length === 0) return;
  await db.update(schema.links).set({ threatLastChecked: null }).where(siblingScope);
  for (const sibling of siblings) enqueue(state, sibling);
}

async function processOne(env: Env, db: Db, link: CandidateLink, state: RunState): Promise<void> {
  const verdict = await checkDestinationThreat(env, link.destinationUrl);

  if (verdict.status === "flagged") {
    await disableFlaggedLink(env, db, link, verdict.verdict, state);
    return;
  }

  // Clean or unknown — bump threat_last_checked so round-robin keeps moving
  // and persist any verdict string we have.
  const now = new Date().toISOString();
  await db
    .update(schema.links)
    .set({
      threatStatus: verdict.status,
      threatLastChecked: now,
      ...(verdict.verdict ? { threatVerdict: verdict.verdict } : {}),
      updatedAt: now,
    })
    .where(eq(schema.links.id, link.id));

  // Still unknown = URL Scanner has never seen this destination. Submit a
  // scan so the next pass can read a real verdict and clear the interstitial.
  if (verdict.status === "unknown") {
    await submitUrlScan(env, link.destinationUrl);
  }
}

async function flagListedShortUrls(env: Env, db: Db, state: RunState): Promise<void> {
  const live = await db.select(candidateColumns).from(schema.links).where(isLive());
  if (live.length === 0) return;

  const entries = [...new Set(live.map((l) => domainRootOf(l.domain))), ...live.map(shortUrlOf)];
  const listed = new Map<string, ThreatType[]>();
  // Sequential: Workers caps concurrent outbound connections at 6, and a
  // queued call's 4s abort timer would already be running.
  for (let i = 0; i < entries.length; i += SB_MAX_ENTRIES) {
    const result = await lookupSafeBrowsing(env, entries.slice(i, i + SB_MAX_ENTRIES));
    // All or nothing: a failed chunk may be the one holding a domain root, which
    // is what stops a whole-domain listing from being pinned on every link.
    if (!result) return;
    for (const [url, threats] of result) listed.set(url, threats);
  }

  const { hits, flaggedDomains } = attributeShortUrlFlags(live, listed);
  if (flaggedDomains.length > 0) {
    await logEvent(env, "safe_browsing.domain_listed", { domains: flaggedDomains }, "error").catch(
      () => undefined
    );
  }
  const owners = new Set(hits.map((h) => h.link.userId ?? h.link.id));
  if (owners.size > MAX_SHORT_URL_FLAGGED_OWNERS_PER_RUN) {
    await logEvent(
      env,
      "safe_browsing.short_url_flags_capped",
      {
        hits: hits.length,
        owners: owners.size,
        slugs: hits.slice(0, 50).map((h) => shortUrlOf(h.link)),
      },
      "error"
    ).catch(() => undefined);
    return;
  }

  // Mark every hit before disabling any, so an owner's sibling re-check never
  // re-runs (and overwrites the verdict of) a link this pass is about to flag.
  for (const { link } of hits) state.queued.add(link.id);
  for (const { link, threat } of hits) {
    await disableFlaggedLink(env, db, link, `safe_browsing:${threat}`, state);
  }
}

export async function rescanLinkBatch(env: Env, db: Db): Promise<RescanResult> {
  const start = Date.now();
  const state: RunState = {
    counters: { flagged: 0, notified: 0, suspended: 0 },
    queue: [],
    queued: new Set(),
    suspending: new Set(),
  };

  await flagListedShortUrls(env, db, state);

  const cutoff = new Date(start - SCAN_INTERVAL_HOURS * 60 * 60 * 1000).toISOString();
  const candidates = await db
    .select(candidateColumns)
    .from(schema.links)
    .where(
      and(
        isLive(),
        or(
          isNull(schema.links.threatLastChecked),
          sql`${schema.links.threatLastChecked} < ${cutoff}`
        )
      )
    )
    .orderBy(asc(schema.links.threatLastChecked))
    .limit(RESCAN_BATCH_SIZE);
  for (const link of candidates) enqueue(state, link);

  let scanned = 0;
  let bailedOnBudget = false;

  // Chunk into batches of CONCURRENCY and process each batch in parallel.
  // The queue can grow while it drains (owner sibling re-checks), so the
  // length is re-read every iteration. We check the wall-clock budget between
  // batches so a stuck upstream doesn't blow the 30s scheduled-trigger ceiling.
  for (let i = 0; i < state.queue.length; i += RESCAN_CONCURRENCY) {
    if (Date.now() - start > BUDGET_MS) {
      bailedOnBudget = true;
      break;
    }
    const batch = state.queue.slice(i, i + RESCAN_CONCURRENCY);
    await Promise.all(batch.map((link) => processOne(env, db, link, state)));
    scanned += batch.length;
  }

  return { scanned, ...state.counters, bailedOnBudget };
}
