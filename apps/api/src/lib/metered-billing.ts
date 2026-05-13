/**
 * Stripe metered billing for the Scale tier.
 *
 * The Scale tier is sold as "$0.40 per 1,000 agent-attributed events"
 * (`pricingPlans` in @repo/config). The metered SKU is implemented as a
 * Stripe Billing **Meter** + tiered Price:
 *   - meter event_name: `go2_attributed_event` (one per attributed click)
 *   - tier 1: 0–500,000 raw events → free (matches the marketing claim)
 *   - tier 2: 500,001+ events → 0.04¢ each (= $0.40 per 1,000)
 *
 * As of Stripe API version 2025-03-31.basil, metered Prices must be
 * backed by a Meter and we report via `POST /v1/billing/meter_events`,
 * not the deprecated `subscriptionItems.createUsageRecord`. We aggregate
 * one calendar day at a time and post a single sum event keyed on the
 * org's Stripe customer id, which is enough fidelity for daily invoicing
 * while keeping the API call count low.
 *
 * Stripe wiring (one-time, already done in production):
 *   1. Product `go2_scale` + Meter `mtr_…` + Price `price_…` created via
 *      the API. Price ID is stamped into the `STRIPE_METERED_PRICE_ID_SCALE`
 *      Worker secret.
 *   2. When a customer subscribes via the metered Price, the
 *      stripe.ts webhook handler stamps `subscriptions.stripe_subscription_item_id`
 *      and `plan="scale"` on their org row.
 *   3. The daily 02:00 UTC cron sees the populated row and posts one
 *      meter event per (org, day) covering the prior day's clicks.
 *
 * Why daily, not real-time:
 *   - Per-event metering would 100x our Stripe API call rate for almost
 *     no invoicing benefit. The Meters API treats `aggregate=sum` as
 *     append-only, so one daily sum produces the same monthly total.
 *   - Idempotency key per (org, day) — retries don't double-bill.
 */

import type { DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle } from "drizzle-orm/d1";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../bindings.js";
import { logEvent, logError } from "./axiom.js";

const SCALE_FREE_TIER_EVENTS = 500_000; // baked into the flat fee, see /pricing
const SCALE_REPORTABLE_PLANS = new Set(["scale", "enterprise"]);

/**
 * Aggregate one calendar day's clicks for a Scale-tier org and post a
 * single Meter Event. Idempotency is handled by Stripe's `identifier` —
 * same (org, day) string always produces the same identifier, so retries
 * collapse to a single event.
 */
export async function reportScaleUsageForOrg(
  env: Env,
  params: {
    organizationId: string;
    /** Stripe customer id stamped on the org's subscription row */
    stripeCustomerId: string;
    /** YYYY-MM-DD — the calendar day we're reporting */
    day: string;
  },
): Promise<{ reported: number; skipped: boolean }> {
  if (!env.STRIPE_METERED_PRICE_ID_SCALE) {
    // Harness present but the metered SKU isn't wired yet — gate on first inbound.
    return { reported: 0, skipped: true };
  }

  const db = drizzle(env.DB, { schema });
  const dayStart = new Date(`${params.day}T00:00:00.000Z`).toISOString();
  const dayEnd = new Date(`${params.day}T23:59:59.999Z`).toISOString();

  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.clicks)
    .where(
      and(
        eq(schema.clicks.organizationId, params.organizationId),
        gte(schema.clicks.timestamp, dayStart),
        lt(schema.clicks.timestamp, dayEnd),
      ),
    );

  const eventCount = Number(result[0]?.count) || 0;
  if (eventCount === 0) {
    return { reported: 0, skipped: false };
  }

  // Meter Events: POST /v1/billing/meter_events with form-encoded body.
  // The Stripe SDK exposes this as stripe.billing.meterEvents.create() but
  // we hit the REST endpoint directly to avoid pinning to a specific SDK
  // shape — the Meters API is still evolving in @types.
  const identifier = `scale-usage:${params.organizationId}:${params.day}`;
  const timestamp = Math.floor(
    new Date(`${params.day}T12:00:00.000Z`).getTime() / 1000,
  );

  const body = new URLSearchParams();
  body.set("event_name", "go2_attributed_event");
  body.set("identifier", identifier);
  body.set("timestamp", String(timestamp));
  body.set("payload[stripe_customer_id]", params.stripeCustomerId);
  body.set("payload[value]", String(eventCount));

  const res = await fetch("https://api.stripe.com/v1/billing/meter_events", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${env.STRIPE_SECRET_KEY}:`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Stripe meter_events ${res.status}: ${detail.slice(0, 240)}`);
  }

  await logEvent(env, "metered-billing: usage reported", {
    organizationId: params.organizationId,
    day: params.day,
    quantity: eventCount,
    stripeCustomerId: params.stripeCustomerId,
  });

  return { reported: eventCount, skipped: false };
}

/**
 * Cron entrypoint — find every Scale-tier org with a populated
 * `stripe_subscription_item_id` and report yesterday's usage.
 *
 * Returns the number of orgs reported and the total events. Safe to call
 * even when there are zero Scale customers — short-circuits in <1 D1 query.
 */
export async function runDailyScaleUsageReport(
  env: Env,
  now: Date = new Date(),
): Promise<{
  orgs: number;
  totalEvents: number;
  errors: number;
}> {
  if (!env.STRIPE_METERED_PRICE_ID_SCALE) {
    // No metered SKU — first inbound hasn't happened yet.
    return { orgs: 0, totalEvents: 0, errors: 0 };
  }

  const db: DrizzleD1Database<typeof schema> = drizzle(env.DB, { schema });

  // Look up the Stripe customer id per Scale-tier subscription. The
  // metered Meter is keyed on stripe_customer_id; the subscription-item id
  // is no longer the right join key in the new Meters world.
  const subs = await db
    .select({
      organizationId: schema.subscriptions.organizationId,
      stripeSubscriptionId: schema.subscriptions.stripeSubscriptionId,
      plan: schema.subscriptions.plan,
      status: schema.subscriptions.status,
    })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.status, "active"));

  const targets = subs.filter((s) => SCALE_REPORTABLE_PLANS.has(s.plan));
  if (targets.length === 0) {
    return { orgs: 0, totalEvents: 0, errors: 0 };
  }

  // "Yesterday" in UTC — usage cron runs at 02:00 UTC, so this report
  // captures the full prior calendar day.
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const day = yesterday.toISOString().slice(0, 10);

  // Resolve Stripe customer ids in one batch via the Stripe API. We avoid
  // adding a new column for this — the subscription id resolves to the
  // customer in a single retrieve call.
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });

  let totalEvents = 0;
  let errors = 0;
  for (const t of targets) {
    try {
      const sub = await stripe.subscriptions.retrieve(t.stripeSubscriptionId);
      const customer =
        typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      const r = await reportScaleUsageForOrg(env, {
        organizationId: t.organizationId,
        stripeCustomerId: customer,
        day,
      });
      totalEvents += r.reported;
    } catch (err) {
      errors += 1;
      await logError(env, "metered-billing: report failed", {
        organizationId: t.organizationId,
        day,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { orgs: targets.length, totalEvents, errors };
}

export const SCALE_PRICING = {
  freeTierEvents: SCALE_FREE_TIER_EVENTS,
  unitPriceCents: 40, // $0.40 per 1,000
  unit: 1000,
} as const;
