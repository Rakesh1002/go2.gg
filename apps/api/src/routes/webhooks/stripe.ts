/**
 * Stripe Webhook Handler
 *
 * Handles all Stripe webhooks for subscription lifecycle events and one-time purchases.
 * All events are verified using Stripe's webhook signature.
 */

import * as schema from "@repo/db";
import { createD1Repositories } from "@repo/db/d1";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import Stripe from "stripe";
import type { Env } from "../../bindings.js";
import {
  creditAffiliateForInvoice,
  reverseAffiliateOnRefund,
} from "../../lib/affiliate-attribution.js";
import { captureEvent } from "../../lib/product-analytics.js";
import { applyRetentionForOrg } from "../../lib/retention.js";
import {
  attributeChargeRefunded,
  attributeCheckout,
  attributeInvoicePaid,
} from "../../lib/stripe-attribution.js";
import { syncSubscriptionFromStripe } from "../../lib/subscription-sync.js";

const stripeWebhooks = new Hono<{ Bindings: Env }>();

stripeWebhooks.post("/", async (c) => {
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });

  const signature = c.req.header("stripe-signature");
  const body = await c.req.text();

  if (!signature) {
    return c.json({ error: "Missing signature" }, 400);
  }

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, c.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return c.json({ error: "Invalid signature" }, 400);
  }

  // Idempotency: Stripe retries on any non-2xx, and several handlers have
  // side effects (queued emails, affiliate credits) that must not re-run.
  // Processed event IDs are remembered for 72h — Stripe's retry horizon.
  const dedupeKey = `stripe-event:${event.id}`;
  if (await c.env.KV_CONFIG.get(dedupeKey)) {
    return c.json({ received: true, duplicate: true });
  }

  const db = drizzle(c.env.DB, { schema });
  const repos = createD1Repositories(db);

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(stripe, repos, session, c.env);
      // Two-stage attribution: fire "lead" conversion + carry attribution to
      // the subscription so invoice.payment_succeeded can attribute the sale.
      await attributeCheckout(c.env, stripe, session);
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      if (await isStaleSubscriptionEvent(c.env, subscription.id, event.created)) {
        // Subscription events carry no ordering guarantee — a retried
        // "updated" landing after "deleted" would resurrect a canceled plan.
        break;
      }
      await syncSubscriptionFromStripe(c.env, repos, subscription);
      await recordSubscriptionEventClock(c.env, subscription.id, event.created);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      if (await isStaleSubscriptionEvent(c.env, subscription.id, event.created)) {
        break;
      }
      await handleSubscriptionDeleted(repos, subscription, c.env);
      await recordSubscriptionEventClock(c.env, subscription.id, event.created);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(repos, invoice, c.env);
      // Stage 2: fire "sale" conversion if the underlying subscription was
      // attributed to a Go2 link.
      await attributeInvoicePaid(c.env, stripe, invoice);
      // Affiliate program: credit the referrer's commission, if any.
      await creditAffiliateForInvoice(c.env, invoice);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoiceFailed(repos, invoice, c.env);
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await attributeChargeRefunded(c.env, charge);
      // Affiliate program: reverse pending commission if any.
      await reverseAffiliateOnRefund(c.env, charge);
      break;
    }

    case "payment_intent.succeeded": {
      // Handle one-time payment success (boilerplate purchases)
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(repos, paymentIntent, c.env);
      break;
    }

    default:
  }

  // Marked processed only on success: a thrown handler bubbles to the error
  // handler (non-2xx), Stripe retries, and the absent dedupe key lets the
  // retry run the handlers again.
  c.executionCtx.waitUntil(c.env.KV_CONFIG.put(dedupeKey, "1", { expirationTtl: 60 * 60 * 72 }));

  return c.json({ received: true });
});

// Per-subscription event clock (Stripe's event.created, unix seconds) used
// to drop out-of-order deliveries. Strict less-than: equal timestamps pass,
// since exact replays are already caught by the event.id dedupe above.
const SUB_CLOCK_PREFIX = "stripe-sub-clock:";

async function isStaleSubscriptionEvent(
  env: Env,
  subscriptionId: string,
  eventCreated: number
): Promise<boolean> {
  const stored = await env.KV_CONFIG.get(`${SUB_CLOCK_PREFIX}${subscriptionId}`);
  return stored !== null && eventCreated < Number.parseInt(stored, 10);
}

async function recordSubscriptionEventClock(
  env: Env,
  subscriptionId: string,
  eventCreated: number
): Promise<void> {
  const key = `${SUB_CLOCK_PREFIX}${subscriptionId}`;
  const stored = await env.KV_CONFIG.get(key);
  const max = stored ? Math.max(eventCreated, Number.parseInt(stored, 10)) : eventCreated;
  await env.KV_CONFIG.put(key, String(max), { expirationTtl: 60 * 60 * 24 * 30 });
}

// -----------------------------------------------------------------------------
// Event Handlers
// -----------------------------------------------------------------------------

async function handleCheckoutCompleted(
  stripe: Stripe,
  repos: ReturnType<typeof createD1Repositories>,
  session: Stripe.Checkout.Session,
  env: Env
) {
  const mode = session.mode;
  const customerId = session.customer as string;

  // Handle one-time payment (boilerplate purchase)
  if (mode === "payment") {
    await handleBoilerplatePurchase(repos, session, env);
    return;
  }

  // Handle subscription checkout
  const orgId = session.metadata?.organizationId;
  if (!orgId) {
    console.error("No organizationId in checkout session metadata");
    return;
  }

  // Update organization with Stripe customer ID
  if (customerId) {
    await repos.organizations.update(orgId, {
      stripeCustomerId: customerId,
    });
  }

  // Eagerly upsert the subscription record from this session's subscription.
  // checkout.session.completed reliably carries both the org (session metadata)
  // and the subscription id, so the plan is reflected the instant checkout
  // lands — independent of whether customer.subscription.created arrives first,
  // last, or is dropped. syncSubscriptionFromStripe is idempotent.
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscriptionFromStripe(env, repos, subscription, { hintOrgId: orgId });
    } catch (error) {
      console.error(`Failed to sync subscription ${subscriptionId} from checkout:`, error);
    }
  }
}

async function handleBoilerplatePurchase(
  repos: ReturnType<typeof createD1Repositories>,
  session: Stripe.Checkout.Session,
  env: Env
) {
  const email = session.customer_email || session.customer_details?.email;
  const githubUsername = session.metadata?.githubUsername;
  const licenseId = (session.metadata?.licenseType || "personal") as
    | "personal"
    | "team"
    | "enterprise";
  const licenseName = `${licenseId.charAt(0).toUpperCase() + licenseId.slice(1)} License`;
  const amount = session.amount_total;

  if (!email) {
    console.error("No email found for boilerplate purchase");
    return;
  }

  // Create purchase record
  try {
    await repos.purchases.create({
      id: crypto.randomUUID(),
      email,
      licenseId,
      licenseName,
      amount: amount ?? 0,
      currency: session.currency || "usd",
      stripeSessionId: session.id,
      stripeCustomerId: (session.customer as string) ?? null,
      githubUsername: githubUsername || null,
      status: "completed",
    });

    // Queue welcome email with download instructions
    if (env.BACKGROUND_QUEUE) {
      await env.BACKGROUND_QUEUE.send({
        type: "email:send",
        payload: {
          to: email,
          template: "purchase-confirmation",
          data: {
            licenseId,
            licenseName,
            githubUsername,
            downloadUrl: `${env.APP_URL}/purchase/success?session_id=${session.id}`,
          },
        },
      });
    }
  } catch (error) {
    console.error("Failed to record purchase:", error);
  }
}

async function handleSubscriptionDeleted(
  repos: ReturnType<typeof createD1Repositories>,
  subscription: Stripe.Subscription,
  env: Env
) {
  const existingSub = await repos.subscriptions.findByStripeSubscriptionId(subscription.id);

  if (existingSub) {
    await repos.subscriptions.update(existingSub.id, {
      status: "canceled",
    });

    // Subscription canceled — revert org to free retention.
    try {
      const db = drizzle(env.DB, { schema });
      const result = await applyRetentionForOrg(db, existingSub.organizationId, "free");
      if (result.stamped > 0) {
      }
    } catch (error) {
      console.error(`Failed to apply free retention for org ${existingSub.organizationId}:`, error);
    }

    await captureEvent(env, {
      event: "subscription_canceled",
      distinctId: existingSub.organizationId,
      properties: {
        organizationId: existingSub.organizationId,
        previousPlan: existingSub.plan,
        stripeSubscriptionId: subscription.id,
      },
    });
  }
}

async function handleInvoicePaid(
  _repos: ReturnType<typeof createD1Repositories>,
  invoice: Stripe.Invoice,
  env: Env
) {
  // Resolve any dunning records for this invoice
  try {
    const { resolveDunning } = await import("../../lib/dunning.js");
    const drizzle = await import("drizzle-orm/d1");
    const db = drizzle.drizzle(env.DB, { schema });

    await resolveDunning(db, invoice.id);
  } catch (error) {
    console.error("Failed to resolve dunning:", error);
  }

  // Queue receipt email. Pass fully-formed display data — the previous payload
  // omitted customerName and items, so the template fell back to "Hi Customer"
  // and a hardcoded "Pro Plan - Monthly $49.00" line for every customer, and
  // sent the amount as a bare "9.00" with no currency symbol.
  if (env.BACKGROUND_QUEUE && invoice.customer_email) {
    const currency = invoice.currency || "usd";
    const items = (invoice.lines?.data ?? [])
      .filter((line) => typeof line.amount === "number")
      .map((line) => ({
        description: line.description || "Subscription",
        amount: formatMoney(line.amount, currency),
      }));

    await env.BACKGROUND_QUEUE.send({
      type: "email:send",
      payload: {
        to: invoice.customer_email,
        template: "invoice",
        data: {
          customerName: invoice.customer_name || undefined,
          invoiceNumber: invoice.number,
          amount: formatMoney(invoice.amount_paid, currency),
          currency: currency.toUpperCase(),
          items: items.length > 0 ? items : undefined,
          invoiceUrl: invoice.hosted_invoice_url,
          pdfUrl: invoice.invoice_pdf,
          paidOn: new Date(
            (invoice.status_transitions?.paid_at ?? invoice.created) * 1000
          ).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        },
      },
    });
  }
}

/**
 * Format a Stripe minor-unit amount (e.g. cents) into a display string with the
 * correct currency symbol, e.g. (900, "usd") -> "$9.00".
 */
function formatMoney(amountMinor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountMinor / 100);
  } catch {
    const symbols: Record<string, string> = { usd: "$", eur: "€", gbp: "£", inr: "₹" };
    const symbol = symbols[currency.toLowerCase()] ?? "";
    return `${symbol}${(amountMinor / 100).toFixed(2)} ${currency.toUpperCase()}`.trim();
  }
}

async function handleInvoiceFailed(
  repos: ReturnType<typeof createD1Repositories>,
  invoice: Stripe.Invoice,
  env: Env
) {
  console.error(`Invoice payment failed: ${invoice.id} for customer ${invoice.customer}`);

  const customerId = invoice.customer as string;
  const customerEmail = invoice.customer_email;

  // Find organization by customer ID
  const org = await repos.organizations.findByStripeCustomerId(customerId);

  if (org && customerEmail) {
    // Create dunning record
    try {
      const { createDunningRecord } = await import("../../lib/dunning.js");
      const drizzle = await import("drizzle-orm/d1");
      const db = drizzle.drizzle(env.DB, { schema });

      await createDunningRecord(db, {
        organizationId: org.id,
        stripeCustomerId: customerId,
        stripeInvoiceId: invoice.id,
        email: customerEmail,
        amount: invoice.amount_due,
        currency: invoice.currency || "usd",
      });

      // Queue initial payment failed notification
      if (env.BACKGROUND_QUEUE) {
        await env.BACKGROUND_QUEUE.send({
          type: "email:send",
          payload: {
            to: customerEmail,
            template: "payment-failed",
            data: {
              invoiceNumber: invoice.number,
              amount: (invoice.amount_due / 100).toFixed(2),
              currency: invoice.currency?.toUpperCase(),
              updatePaymentUrl: invoice.hosted_invoice_url,
              retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }
              ),
            },
          },
        });
      }
    } catch (error) {
      console.error("Failed to create dunning record:", error);

      // Still send the basic email if dunning record creation fails
      if (env.BACKGROUND_QUEUE && customerEmail) {
        await env.BACKGROUND_QUEUE.send({
          type: "email:send",
          payload: {
            to: customerEmail,
            template: "payment-failed",
            data: {
              invoiceNumber: invoice.number,
              amount: (invoice.amount_due / 100).toFixed(2),
              currency: invoice.currency?.toUpperCase(),
              updatePaymentUrl: invoice.hosted_invoice_url,
            },
          },
        });
      }
    }
  }
}

async function handlePaymentSuccess(
  _repos: ReturnType<typeof createD1Repositories>,
  _paymentIntent: Stripe.PaymentIntent,
  _env: Env
) {
  // The actual purchase record is created in checkout.session.completed
  // This event is mainly for logging and additional processing if needed
}

export { stripeWebhooks };
