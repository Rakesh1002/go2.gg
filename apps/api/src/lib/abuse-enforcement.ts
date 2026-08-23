/**
 * Graduated enforcement for behavioral abuse detections.
 *
 * Ladder: strike 1 and 2 disable the offending links and warn the owner;
 * strike 3 suspends the account via the existing banUser().
 *
 * Two reversibility rules that matter:
 *   1. Links disabled here carry ABUSE_DISABLED_REASON, deliberately NOT
 *      SUSPENSION_DISABLED_REASON. unbanUser() only re-enables links matching
 *      the latter, so an unban cannot silently resurrect spam links, and
 *      revoking a strike has its own re-enable path below.
 *   2. Evidence is never deleted. Revoking a strike flips status and stamps
 *      the reviewer — the row survives for the appeal.
 */
import * as schema from "@repo/db";
import { and, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { Env } from "../bindings.js";
import { ABUSE_THRESHOLDS, type SignalHit } from "./abuse-signals.js";
import { logEvent } from "./axiom.js";
import { cachedLinkKey, serializeCachedLink } from "./cached-link.js";

export const ABUSE_DISABLED_REASON =
  "Disabled: automated detection of bulk-email / open-tracking abuse";

type Db = DrizzleD1Database<typeof schema>;

/**
 * Disable links in D1 and rewrite their KV entries.
 *
 * Must go through serializeCachedLink — a hand-rolled partial CachedLink has
 * already caused one live safety bug (a PATCH that dropped isDisabled silently
 * re-enabled a Safe-Browsing-disabled link at the edge).
 */
export async function disableLinksForAbuse(env: Env, db: Db, linkIds: string[]): Promise<number> {
  if (linkIds.length === 0) return 0;
  const now = new Date().toISOString();

  await db
    .update(schema.links)
    .set({
      isDisabled: true,
      disabledAt: now,
      disabledReason: ABUSE_DISABLED_REASON,
      // Rebase the velocity baseline so a later re-enable doesn't instantly
      // re-trip on the stale delta.
      abuseScanClicks: sql`click_count`,
      abuseScanAt: now,
      updatedAt: now,
    })
    .where(inArray(schema.links.id, linkIds));

  const rows = await db.select().from(schema.links).where(inArray(schema.links.id, linkIds));
  for (const row of rows) {
    const cached = serializeCachedLink({
      ...row,
      isDisabled: true,
      disabledReason: ABUSE_DISABLED_REASON,
    });
    await env.LINKS_KV.put(cachedLinkKey(cached), JSON.stringify(cached));
  }
  return rows.length;
}

/** Re-enable links this module disabled. Used when a strike is revoked. */
export async function reenableLinksForAbuse(env: Env, db: Db, linkIds: string[]): Promise<number> {
  if (linkIds.length === 0) return 0;
  const now = new Date().toISOString();

  // Only touch links still disabled for THIS reason — anything the threat
  // scanner or an admin disabled separately stays disabled.
  const rows = await db
    .select()
    .from(schema.links)
    .where(
      and(inArray(schema.links.id, linkIds), eq(schema.links.disabledReason, ABUSE_DISABLED_REASON))
    );
  if (rows.length === 0) return 0;

  const ids = rows.map((r) => r.id);
  await db
    .update(schema.links)
    .set({ isDisabled: false, disabledAt: null, disabledReason: null, updatedAt: now })
    .where(inArray(schema.links.id, ids));

  for (const row of rows) {
    const cached = serializeCachedLink({ ...row, isDisabled: false, disabledReason: null });
    await env.LINKS_KV.put(cachedLinkKey(cached), JSON.stringify(cached));
  }
  return ids.length;
}

/** Active, unexpired strikes that count toward the ladder. */
export async function countActiveStrikes(db: Db, userId: string): Promise<number> {
  const rows = await db
    .select({ id: schema.abuseStrikes.id })
    .from(schema.abuseStrikes)
    .where(
      and(
        eq(schema.abuseStrikes.userId, userId),
        eq(schema.abuseStrikes.status, "active"),
        inArray(schema.abuseStrikes.action, ["strike", "suspend"]),
        or(
          isNull(schema.abuseStrikes.expiresAt),
          gt(schema.abuseStrikes.expiresAt, new Date().toISOString())
        )
      )
    );
  return rows.length;
}

/**
 * True when the user took a strike inside the cooldown window.
 *
 * Without this, a single campaign detected on three consecutive hourly passes
 * burns all three strikes before the first warning email is even opened, which
 * makes "3 offences despite 2 warnings" untrue.
 */
export async function isInStrikeCooldown(db: Db, userId: string): Promise<boolean> {
  const since = new Date(
    Date.now() - ABUSE_THRESHOLDS.STRIKE_COOLDOWN_HOURS * 3_600_000
  ).toISOString();
  const rows = await db
    .select({ id: schema.abuseStrikes.id })
    .from(schema.abuseStrikes)
    .where(
      and(
        eq(schema.abuseStrikes.userId, userId),
        inArray(schema.abuseStrikes.action, ["strike", "suspend"]),
        gt(schema.abuseStrikes.createdAt, since)
      )
    )
    .limit(1);
  return rows.length > 0;
}

export interface EnforcementOutcome {
  action: "strike" | "suspend" | "flag" | "shadow";
  strikeNumber: number;
  linksDisabled: number;
  strikeId: string | null;
}

/**
 * Apply the ladder for one user's detection event.
 *
 * One detection pass = one strike, however many links it covers. Per-link
 * striking would take an operator from zero to banned in a single afternoon on
 * their first campaign, which is not a warning system.
 */
export async function enforceForUser(
  env: Env,
  db: Db,
  params: {
    userId: string;
    organizationId: string | null;
    hits: SignalHit[];
    linkIds: string[];
    mode: "shadow" | "enforce";
  }
): Promise<EnforcementOutcome> {
  const { userId, organizationId, hits, linkIds, mode } = params;
  const now = new Date();
  const nowIso = now.toISOString();
  const dedupeKey = `${userId}:${nowIso.slice(0, 10)}`;
  const signal = hits.map((h) => h.signal).join(",");

  if (mode === "shadow") {
    const id = crypto.randomUUID();
    await db
      .insert(schema.abuseStrikes)
      .values({
        id,
        userId,
        organizationId,
        strikeNumber: 0,
        signal,
        tier: "high",
        action: "shadow",
        status: "active",
        evidence: JSON.stringify(hits),
        linkIds: JSON.stringify(linkIds),
        linksDisabled: 0,
        dedupeKey: `shadow:${dedupeKey}`,
        createdAt: nowIso,
      })
      .onConflictDoNothing();
    return { action: "shadow", strikeNumber: 0, linksDisabled: 0, strikeId: id };
  }

  // Inside cooldown: still kill the newly-offending links, but do not advance
  // the ladder. Recorded as a flag so the evidence is preserved.
  if (await isInStrikeCooldown(db, userId)) {
    const disabled = await disableLinksForAbuse(env, db, linkIds);
    const id = crypto.randomUUID();
    await db
      .insert(schema.abuseStrikes)
      .values({
        id,
        userId,
        organizationId,
        strikeNumber: 0,
        signal,
        tier: "high",
        action: "flag",
        status: "active",
        evidence: JSON.stringify(hits),
        linkIds: JSON.stringify(linkIds),
        linksDisabled: disabled,
        dedupeKey: `flag:${dedupeKey}:${id.slice(0, 8)}`,
        createdAt: nowIso,
      })
      .onConflictDoNothing();
    return { action: "flag", strikeNumber: 0, linksDisabled: disabled, strikeId: id };
  }

  const priorStrikes = await countActiveStrikes(db, userId);
  const strikeNumber = priorStrikes + 1;
  const suspend = strikeNumber >= ABUSE_THRESHOLDS.STRIKES_BEFORE_SUSPENSION;

  // Disable the offending links first so link_ids evidence is accurate and
  // those rows keep ABUSE_DISABLED_REASON rather than the suspension reason.
  const linksDisabled = await disableLinksForAbuse(env, db, linkIds);

  const strikeId = crypto.randomUUID();
  const expiresAt = new Date(
    now.getTime() + ABUSE_THRESHOLDS.STRIKE_TTL_DAYS * 86_400_000
  ).toISOString();

  await db
    .insert(schema.abuseStrikes)
    .values({
      id: strikeId,
      userId,
      organizationId,
      strikeNumber,
      signal,
      tier: "high",
      action: suspend ? "suspend" : "strike",
      status: "active",
      evidence: JSON.stringify(hits),
      linkIds: JSON.stringify(linkIds),
      linksDisabled,
      dedupeKey,
      notifiedAt: nowIso,
      expiresAt,
      createdAt: nowIso,
    })
    .onConflictDoNothing();

  if (suspend) {
    const { banUser } = await import("./suspension.js");
    const result = await banUser(
      env,
      db,
      userId,
      `Automated: ${ABUSE_THRESHOLDS.STRIKES_BEFORE_SUSPENSION}rd abuse strike — bulk-email spam`
    );
    await logEvent(
      env,
      "abuse.suspension.auto",
      {
        userId,
        strikeId,
        linksDisabledByDetector: linksDisabled,
        linksDisabledByBan: result.linksDisabled,
        apiKeysExpired: result.apiKeysExpired,
        sessionsRevoked: result.sessionsRevoked,
      },
      "error"
    ).catch(() => undefined);
  }

  await queueEnforcementEmail(env, db, {
    userId,
    strikeNumber,
    suspend,
    hits,
    linkIds,
  });

  await logEvent(
    env,
    "abuse.strike.issued",
    { userId, strikeId, strikeNumber, signal, linksDisabled, priorStrikes },
    "warn"
  ).catch(() => undefined);

  return {
    action: suspend ? "suspend" : "strike",
    strikeNumber,
    linksDisabled,
    strikeId,
  };
}

async function queueEnforcementEmail(
  env: Env,
  db: Db,
  params: {
    userId: string;
    strikeNumber: number;
    suspend: boolean;
    hits: SignalHit[];
    linkIds: string[];
  }
): Promise<void> {
  if (!env.BACKGROUND_QUEUE) return;

  const [user] = await db
    .select({ email: schema.users.email, name: schema.users.name })
    .from(schema.users)
    .where(eq(schema.users.id, params.userId))
    .limit(1);
  if (!user?.email) return;

  const links = await db
    .select({
      slug: schema.links.slug,
      domain: schema.links.domain,
      destinationUrl: schema.links.destinationUrl,
      clickCount: schema.links.clickCount,
      createdAt: schema.links.createdAt,
    })
    .from(schema.links)
    .where(inArray(schema.links.id, params.linkIds.slice(0, 20)));

  const priorStrikes = await db
    .select({
      createdAt: schema.abuseStrikes.createdAt,
      signal: schema.abuseStrikes.signal,
    })
    .from(schema.abuseStrikes)
    .where(
      and(
        eq(schema.abuseStrikes.userId, params.userId),
        inArray(schema.abuseStrikes.action, ["strike", "suspend"])
      )
    );

  const payload = {
    to: user.email,
    template: params.suspend ? "account-suspended" : "abuse-strike-warning",
    data: {
      customerName: user.name ?? user.email.split("@")[0],
      strikeNumber: params.strikeNumber,
      strikesBeforeSuspension: ABUSE_THRESHOLDS.STRIKES_BEFORE_SUSPENSION,
      strikeCount: priorStrikes.length,
      priorStrikes: priorStrikes.map((s) => ({ date: s.createdAt, signalSummary: s.signal })),
      linksDisabled: params.linkIds.length,
      links: links.map((l) => ({
        shortUrl: `https://${l.domain}/${l.slug}`,
        destinationUrl: l.destinationUrl,
        clicks: l.clickCount,
        createdAt: l.createdAt,
      })),
      signalSummary: params.hits.map((h) => h.detail).join("; "),
      appealUrl: "mailto:abuse@go2.gg",
    },
  };

  try {
    await env.BACKGROUND_QUEUE.send({ type: "email:send", payload });
  } catch {
    // Queue failure is non-fatal — the strike row is the source of truth.
  }
}
