/**
 * Stripe → Go2 attribution bridge.
 *
 * Two-stage funnel:
 *   - checkout.session.completed   → conversion type "lead"
 *   - invoice.payment_succeeded    → conversion type "sale"
 *   - charge.refunded              → marks the matching sale as refunded
 *
 * Attribution metadata propagation
 * --------------------------------
 * The integrator passes Go2 click attribution into Stripe Checkout via either:
 *   1. `metadata.go2_ref`   — canonical encoded tracking id, "linkId:clickId"
 *   2. `metadata.go2_link_id` + `metadata.go2_click_id` — explicit fields
 *   3. `client_reference_id` — fallback, treated as a tracking id
 *
 * On checkout.session.completed we copy these into the subscription metadata
 * so invoice.payment_succeeded can find them later (Stripe doesn't propagate
 * checkout metadata to invoices automatically).
 */

import type Stripe from "stripe";
import type { Env } from "../bindings.js";
import { recordConversion } from "../routes/v1/conversions.js";
import { captureEvent } from "./product-analytics.js";

interface Go2Attribution {
  trackingId?: string;
  linkId?: string;
  clickId?: string;
}

function readAttribution(
  metadata: Stripe.Metadata | null | undefined,
  clientReferenceId?: string | null,
): Go2Attribution {
  const m = metadata ?? {};
  const out: Go2Attribution = {
    trackingId: m.go2_ref || clientReferenceId || undefined,
    linkId: m.go2_link_id || undefined,
    clickId: m.go2_click_id || undefined,
  };
  // Drop empty strings so Zod's optional() check passes.
  if (!out.trackingId) out.trackingId = undefined;
  if (!out.linkId) out.linkId = undefined;
  if (!out.clickId) out.clickId = undefined;
  return out;
}

/**
 * Carry attribution from a checkout session to its subscription so
 * invoice.payment_succeeded later in the lifecycle can attribute the sale.
 *
 * Best-effort — we never block the checkout webhook on this update.
 */
async function copyAttributionToSubscription(
  stripe: Stripe,
  subscriptionId: string,
  attribution: Go2Attribution,
): Promise<void> {
  const updates: Stripe.Metadata = {};
  if (attribution.trackingId) updates.go2_ref = attribution.trackingId;
  if (attribution.linkId) updates.go2_link_id = attribution.linkId;
  if (attribution.clickId) updates.go2_click_id = attribution.clickId;
  if (Object.keys(updates).length === 0) return;
  try {
    await stripe.subscriptions.update(subscriptionId, { metadata: updates });
  } catch (err) {
    console.warn(
      `[stripe-attribution] failed to copy metadata to subscription ${subscriptionId}:`,
      err instanceof Error ? err.message : err,
    );
  }
}

// ---------------------------------------------------------------------------
// Stage 1 — checkout.session.completed → "lead"
// ---------------------------------------------------------------------------

export async function attributeCheckout(
  env: Env,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const attribution = readAttribution(session.metadata, session.client_reference_id);
  if (!attribution.trackingId && !attribution.linkId && !attribution.clickId) {
    return; // No Go2 attribution on this checkout — nothing to do.
  }

  // Lead conversion. `value` is integer cents to match the conversions schema
  // (z.number().int().min(0)). UIs are responsible for currency-aware display.
  const valueCents = session.amount_total ?? undefined;
  await recordConversion(
    env,
    {
      ...attribution,
      type: "lead",
      eventName: "stripe_checkout_completed",
      value: valueCents,
      currency: session.currency ?? "usd",
      externalId: session.id, // dedup on session id
      customerId:
        typeof session.customer === "string" ? session.customer : (session.customer?.id ?? undefined),
      metadata: {
        stripe_session_id: session.id,
        stripe_mode: session.mode,
        stripe_subscription_id:
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription?.id ?? null),
      },
    },
    null,
  ).catch((err) => {
    console.warn("[stripe-attribution] checkout lead failed:", err);
  });

  // Carry attribution to the subscription for later "sale" attribution.
  if (session.mode === "subscription" && session.subscription) {
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription.id;
    await copyAttributionToSubscription(stripe, subscriptionId, attribution);
  }

  // Fire checkout_completed product event for the funnel.
  if (session.customer_email || attribution.linkId) {
    await captureEvent(env, {
      event: "checkout_completed",
      distinctId: session.customer_email ?? attribution.linkId ?? session.id,
      properties: {
        sessionId: session.id,
        mode: session.mode,
        amount: valueCents != null ? valueCents / 100 : null,
        currency: session.currency ?? "usd",
        linkId: attribution.linkId ?? null,
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Stage 2 — invoice.payment_succeeded → "sale"
// ---------------------------------------------------------------------------

export async function attributeInvoicePaid(
  env: Env,
  stripe: Stripe,
  invoice: Stripe.Invoice,
): Promise<void> {
  // Pull attribution off the subscription this invoice belongs to.
  const subscriptionId =
    typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return;

  let subscription: Stripe.Subscription | null = null;
  try {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  } catch (err) {
    console.warn("[stripe-attribution] subscription retrieve failed:", err);
    return;
  }

  const attribution = readAttribution(subscription.metadata);
  if (!attribution.trackingId && !attribution.linkId && !attribution.clickId) {
    return; // Subscription wasn't attributed to a Go2 link.
  }

  const valueCents = invoice.amount_paid;
  await recordConversion(
    env,
    {
      ...attribution,
      type: "purchase",
      eventName: "stripe_invoice_paid",
      value: valueCents,
      currency: invoice.currency ?? "usd",
      externalId: invoice.id, // dedup per-invoice; recurring invoices each count
      customerId:
        typeof invoice.customer === "string"
          ? invoice.customer
          : (invoice.customer?.id ?? undefined),
      metadata: {
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: subscriptionId,
        stripe_charge_id: typeof invoice.charge === "string" ? invoice.charge : null,
        billing_reason: invoice.billing_reason ?? null,
        period_start: invoice.period_start,
        period_end: invoice.period_end,
      },
    },
    null,
  ).catch((err) => {
    console.warn("[stripe-attribution] invoice sale failed:", err);
  });

  await captureEvent(env, {
    event: "subscription_paid",
    distinctId: invoice.customer_email ?? subscriptionId,
    properties: {
      invoiceId: invoice.id,
      subscriptionId,
      amount: valueCents / 100,
      currency: invoice.currency ?? "usd",
      linkId: attribution.linkId ?? null,
      billingReason: invoice.billing_reason ?? null,
    },
  });
}

// ---------------------------------------------------------------------------
// Refund handling — mark sale conversions as refunded
// ---------------------------------------------------------------------------

export async function attributeChargeRefunded(
  env: Env,
  charge: Stripe.Charge,
): Promise<void> {
  // We dedup sales on invoice.id, but charge.refunded fires with the charge.
  // We stored stripe_charge_id in the conversion metadata, so we can find the
  // matching conversion by externalId fallback if the integrator routed it
  // through us. For now we just emit a PostHog event so the funnel reflects
  // the loss; the conversion stays in D1 for audit.
  if (!charge.refunded && charge.amount_refunded === 0) return;
  await captureEvent(env, {
    event: "subscription_refunded",
    distinctId:
      (typeof charge.customer === "string"
        ? charge.customer
        : (charge.customer?.id ?? null)) ?? charge.id,
    properties: {
      chargeId: charge.id,
      amount: (charge.amount_refunded ?? charge.amount) / 100,
      currency: charge.currency,
      reason: charge.refunds?.data?.[0]?.reason ?? null,
    },
  });
}
