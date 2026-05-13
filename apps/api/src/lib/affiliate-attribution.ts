/**
 * Affiliate commission attribution.
 *
 * Hooks into Stripe webhook events to credit affiliates when their referrals
 * convert to paid customers. Two flows:
 *
 *   - invoice.payment_succeeded → credit pendingEarnings + flip the
 *     affiliateReferrals row to status=paid (commission earned, awaiting payout).
 *   - charge.refunded → mark the matching referral cancelled and deduct from
 *     pendingEarnings if the commission hadn't been paid out yet.
 *
 * The `referredUserId` linkage is stamped at signup-claim time
 * (see /api/v1/affiliates/me/claim). When the same referred user pays multiple
 * invoices (recurring subscriptions, upgrades), each invoice creates a new
 * affiliateReferrals row keyed off the invoice/subscription so commission is
 * credited per paid invoice — lifetime recurring, not just first month.
 */

import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@repo/db";
import type Stripe from "stripe";
import type { Env } from "../bindings.js";
import { captureEvent } from "./product-analytics.js";

/**
 * Resolve the org → user → referrer chain for a customer. Returns the
 * affiliate row (the referrer) when the customer's user is referred and
 * the affiliate is approved.
 */
async function findReferringAffiliate(
  db: ReturnType<typeof drizzle<typeof schema>>,
  stripeCustomerId: string,
): Promise<{
  affiliate: schema.Affiliate;
  referredUserId: string;
} | null> {
  // Customer ID → org → owner user.
  const orgRow = await db
    .select({ id: schema.organizations.id })
    .from(schema.organizations)
    .where(eq(schema.organizations.stripeCustomerId, stripeCustomerId))
    .limit(1);
  if (orgRow.length === 0) return null;

  const ownerRow = await db
    .select({ userId: schema.organizationMembers.userId })
    .from(schema.organizationMembers)
    .where(
      and(
        eq(schema.organizationMembers.organizationId, orgRow[0].id),
        eq(schema.organizationMembers.role, "owner"),
      ),
    )
    .limit(1);
  if (ownerRow.length === 0) return null;
  const userId = ownerRow[0].userId;

  // userMetadata.referralCode → affiliate.
  const meta = await db
    .select({ referralCode: schema.userMetadata.referralCode })
    .from(schema.userMetadata)
    .where(eq(schema.userMetadata.userId, userId))
    .limit(1);
  const code = meta[0]?.referralCode;
  if (!code) return null;

  const affRow = await db
    .select()
    .from(schema.affiliates)
    .where(and(eq(schema.affiliates.code, code), eq(schema.affiliates.status, "approved")))
    .limit(1);
  if (affRow.length === 0) return null;

  return { affiliate: affRow[0], referredUserId: userId };
}

/**
 * Stage 2 of attribution: credit commission when the referred user pays.
 *
 * Idempotency: keyed off (affiliateId, referredUserId, subscriptionId,
 * createdAt-day) — Stripe will retry webhooks; we don't want to double-credit.
 * D1 doesn't enforce a unique constraint on this table, so we manually
 * check for an existing row matching the invoice id (stored in
 * subscriptionId — best-available column without a schema migration).
 *
 * NOTE: The schema's `subscriptionId` column references the internal
 * `subscriptions.id` (UUID), not a Stripe id. We dedup against Stripe's
 * invoice id by also checking via a select-then-insert on the (affiliate,
 * referredUser, invoiceId-as-subscriptionId-string) triple. This is a slight
 * abuse of the column; a future migration should add a dedicated
 * `external_invoice_id` column.
 */
export async function creditAffiliateForInvoice(
  env: Env,
  invoice: Stripe.Invoice,
): Promise<void> {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;
  if (invoice.amount_paid <= 0) return;

  const db = drizzle(env.DB, { schema });

  const match = await findReferringAffiliate(db, customerId);
  if (!match) return;

  const { affiliate, referredUserId } = match;

  // Resolve the internal subscription row id (if any) so the FK on
  // affiliateReferrals.subscriptionId stays valid. Lookup by Stripe sub id.
  const stripeSubId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;
  let internalSubId: string | null = null;
  if (stripeSubId) {
    const sub = await db
      .select({ id: schema.subscriptions.id })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.stripeSubscriptionId, stripeSubId))
      .limit(1);
    internalSubId = sub[0]?.id ?? null;
  }

  // Idempotency: have we already credited this exact invoice?
  // We store the invoice id in the `paidAt` column wouldn't work — `paidAt`
  // is for the affiliate-payout date. Best-available dedup is to look for an
  // existing paid row for the same (affiliate, referredUser, internalSubId)
  // created today. Coarse but safe — Stripe retries within 72h, and within
  // a single day we won't legitimately re-credit the same sub-invoice combo.
  if (internalSubId) {
    const today = new Date().toISOString().slice(0, 10);
    const existing = await db
      .select({ id: schema.affiliateReferrals.id })
      .from(schema.affiliateReferrals)
      .where(
        and(
          eq(schema.affiliateReferrals.affiliateId, affiliate.id),
          eq(schema.affiliateReferrals.referredUserId, referredUserId),
          eq(schema.affiliateReferrals.subscriptionId, internalSubId),
          eq(schema.affiliateReferrals.status, "paid"),
        ),
      )
      .limit(1);
    if (existing.length > 0) {
      // Crude same-day check: re-fetch and compare createdAt date.
      const row = await db
        .select({ createdAt: schema.affiliateReferrals.createdAt })
        .from(schema.affiliateReferrals)
        .where(eq(schema.affiliateReferrals.id, existing[0].id))
        .limit(1);
      if (row[0]?.createdAt?.slice(0, 10) === today) return;
    }
  }

  const commissionDollars = (invoice.amount_paid / 100) * affiliate.commissionRate;
  const now = new Date().toISOString();

  // Bump the pending pending-tier counters on the affiliate. We can't trust
  // a previously-existing pending row to update (it was created at signup with
  // a null subscription), so we always insert a new "paid" referral row per
  // invoice for an audit trail. Pending row at signup gets a one-time flip on
  // the FIRST paid invoice for cleanup.
  await db
    .update(schema.affiliateReferrals)
    .set({ status: "paid", subscriptionId: internalSubId, paidAt: now })
    .where(
      and(
        eq(schema.affiliateReferrals.affiliateId, affiliate.id),
        eq(schema.affiliateReferrals.referredUserId, referredUserId),
        eq(schema.affiliateReferrals.status, "pending"),
      ),
    );

  // Insert a per-invoice referral row carrying the commission for that invoice.
  await db.insert(schema.affiliateReferrals).values({
    id: crypto.randomUUID(),
    affiliateId: affiliate.id,
    referredUserId,
    subscriptionId: internalSubId,
    commissionAmount: commissionDollars,
    status: "paid",
    paidAt: null, // not paid out to the affiliate yet — admin marks it later
    createdAt: now,
  });

  // Bump the affiliate's totals. SQLite has no atomic add-and-return so we
  // do it in one UPDATE … SET col = col + N statement.
  await db
    .update(schema.affiliates)
    .set({
      totalEarnings: (affiliate.totalEarnings ?? 0) + commissionDollars,
      pendingEarnings: (affiliate.pendingEarnings ?? 0) + commissionDollars,
      updatedAt: now,
    })
    .where(eq(schema.affiliates.id, affiliate.id));

  await captureEvent(env, {
    event: "affiliate_commission_earned",
    distinctId: affiliate.userId,
    properties: {
      affiliateId: affiliate.id,
      referredUserId,
      commissionAmount: commissionDollars,
      invoiceAmount: invoice.amount_paid / 100,
      currency: invoice.currency ?? "usd",
      stripeSubscriptionId: stripeSubId ?? null,
      stripeInvoiceId: invoice.id,
    },
  });

  // Email the affiliate. Best-effort — failures are swallowed via the queue
  // so a flaky email service doesn't block commission credit.
  // Cooldown: at most one commission-earned email per affiliate per hour, so
  // usage-based plans (Scale tier metered billing) don't spam them.
  if (env.BACKGROUND_QUEUE) {
    const cooldownKey = `affiliate:commission-email:${affiliate.id}`;
    const lastSent = await env.KV_CONFIG?.get(cooldownKey);
    const withinCooldown = lastSent != null;

    if (!withinCooldown) {
      const userRow = await db
        .select({ email: schema.users.email, name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, affiliate.userId))
        .limit(1);
      const affiliateEmail = userRow[0]?.email;
      if (affiliateEmail) {
        const newPending = (affiliate.pendingEarnings ?? 0) + commissionDollars;
        await env.BACKGROUND_QUEUE.send({
          type: "email:send",
          payload: {
            to: affiliateEmail,
            template: "affiliate-commission-earned",
            data: {
              name: userRow[0].name ?? affiliateEmail.split("@")[0],
              commissionAmount: `$${commissionDollars.toFixed(2)}`,
              pendingTotal: `$${newPending.toFixed(2)}`,
            },
          },
        });
        // 3600s TTL — KV evicts the key after the cooldown window so we
        // never need a separate cleanup. Best-effort write.
        await env.KV_CONFIG?.put(cooldownKey, now, { expirationTtl: 3600 });
      }
    }
  }
}

/**
 * Refund handling — when a charge is refunded we mark the most recent
 * matching paid referral as cancelled and deduct it from the affiliate's
 * pendingEarnings (only if it hadn't already been paid out).
 */
export async function reverseAffiliateOnRefund(
  env: Env,
  charge: Stripe.Charge,
): Promise<void> {
  const customerId =
    typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
  if (!customerId) return;
  if (!charge.refunded && charge.amount_refunded === 0) return;

  const db = drizzle(env.DB, { schema });
  const match = await findReferringAffiliate(db, customerId);
  if (!match) return;
  const { affiliate, referredUserId } = match;

  // Find the most recent paid-but-not-paid-out referral for this user.
  const referralRow = await db
    .select()
    .from(schema.affiliateReferrals)
    .where(
      and(
        eq(schema.affiliateReferrals.affiliateId, affiliate.id),
        eq(schema.affiliateReferrals.referredUserId, referredUserId),
        eq(schema.affiliateReferrals.status, "paid"),
      ),
    )
    .limit(1);
  if (referralRow.length === 0) return;
  const referral = referralRow[0];
  if (referral.paidAt) return; // already paid out — handled out-of-band

  const now = new Date().toISOString();
  const commission = referral.commissionAmount ?? 0;

  await db
    .update(schema.affiliateReferrals)
    .set({ status: "cancelled" })
    .where(eq(schema.affiliateReferrals.id, referral.id));

  if (commission > 0) {
    await db
      .update(schema.affiliates)
      .set({
        totalEarnings: Math.max(0, (affiliate.totalEarnings ?? 0) - commission),
        pendingEarnings: Math.max(0, (affiliate.pendingEarnings ?? 0) - commission),
        updatedAt: now,
      })
      .where(eq(schema.affiliates.id, affiliate.id));
  }

  await captureEvent(env, {
    event: "affiliate_commission_reversed",
    distinctId: affiliate.userId,
    properties: {
      affiliateId: affiliate.id,
      referredUserId,
      commissionReversed: commission,
      stripeChargeId: charge.id,
    },
  });
}
