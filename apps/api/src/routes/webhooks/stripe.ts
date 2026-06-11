/**
 * Stripe Webhook Handler
 *
 * Handles all Stripe webhooks for subscription lifecycle events and one-time purchases.
 * All events are verified using Stripe's webhook signature.
 */

import { pricingPlans } from "@repo/config/pricing";
import * as schema from "@repo/db";
import { createD1Repositories } from "@repo/db/d1";
import { and, eq } from "drizzle-orm";
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

// Price ID to Plan mapping
// Go2.gg products under acct_1TgyIg43jurh1T6b — keep in sync with
// scripts/stripe-setup.mjs and @repo/config/pricing.
const PRICE_TO_PLAN: Record<string, string> = {
  // Go2 Pro - $9/mo or $86/year
  price_1TgyYu43jurh1T6btCXxDvfE: "pro", // Pro Monthly
  price_1TgyYu43jurh1T6bVJMu9GM9: "pro", // Pro Annual
  // Go2 Business - $49/mo or $470/year
  price_1TgyYw43jurh1T6brxnKqpg6: "business", // Business Monthly
  price_1TgyYx43jurh1T6bkOVdlYup: "business", // Business Annual
  // Go2 Scale - usage-based via Meter (first 500K events free, then $0.40/1K)
  price_1TgyYz43jurh1T6bOzGBALt1: "scale",
};

type SubscriptionPlan = "free" | "pro" | "business" | "scale" | "enterprise";

/**
 * Returns null for unrecognized price IDs. The previous default-to-"pro"
 * fallback meant any misconfigured price silently granted a paid plan;
 * callers must treat null as "log loudly and change nothing."
 */
function getPlanFromPriceId(priceId: string): SubscriptionPlan | null {
  const plan = PRICE_TO_PLAN[priceId];
  if (plan === "pro" || plan === "business" || plan === "scale" || plan === "enterprise") {
    return plan;
  }

  // Env-provisioned prices (e.g. Scale, re-provisioned accounts) resolve via
  // the pricing config, which reads STRIPE_PRICE_* at startup.
  const configPlan = pricingPlans.find(
    (p) => p.stripePriceIdMonthly === priceId || p.stripePriceIdAnnual === priceId
  );
  if (configPlan?.id === "pro" || configPlan?.id === "business" || configPlan?.id === "scale") {
    return configPlan.id;
  }

  return null;
}

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
      await handleCheckoutCompleted(repos, session, c.env);
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
      await handleSubscriptionUpdated(repos, subscription, c.env);
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
  repos: ReturnType<typeof createD1Repositories>,
  session: Stripe.Checkout.Session,
  env: Env
) {
  const mode = session.mode;
  const customerId = session.customer as string;
  const _customerEmail = session.customer_email || session.customer_details?.email;

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

async function handleSubscriptionUpdated(
  repos: ReturnType<typeof createD1Repositories>,
  subscription: Stripe.Subscription,
  env: Env
) {
  const existingSub = await repos.subscriptions.findByStripeSubscriptionId(subscription.id);
  // Subscriptions now carry two items — the flat plan price and a metered
  // overage price. Determine the plan from the flat (non-metered) item; the
  // overage price must not be mistaken for the plan. Matching on usage_type
  // also covers env-provisioned prices absent from PRICE_TO_PLAN.
  const flatItem = subscription.items.data.find(
    (it) => it.price.recurring?.usage_type !== "metered"
  );
  const priceId = flatItem?.price.id ?? subscription.items.data[0]?.price.id ?? "";
  const plan = getPlanFromPriceId(priceId);
  if (plan === null) {
    // An unrecognized price must never silently grant a plan. Log loudly,
    // change nothing, and return 200 (a retry won't resolve a config gap).
    console.error(`Stripe webhook: unknown price ID ${priceId} on sub ${subscription.id}`);
    const { logEvent } = await import("../../lib/axiom.js");
    await logEvent(
      env,
      "stripe.unknown_price",
      { priceId, subscriptionId: subscription.id, customerId: String(subscription.customer) },
      "error"
    ).catch(() => undefined);
    return;
  }

  const subData = {
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    status: subscription.status as "active" | "trialing" | "canceled" | "past_due",
    currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    plan,
  };

  let organizationId: string | undefined;

  if (existingSub) {
    await repos.subscriptions.update(existingSub.id, subData);
    organizationId = existingSub.organizationId;
  } else {
    // Find organization by customer ID
    const org = await repos.organizations.findByStripeCustomerId(subscription.customer as string);

    if (org) {
      await repos.subscriptions.create({
        id: crypto.randomUUID(),
        organizationId: org.id,
        ...subData,
      });
      organizationId = org.id;
    }
  }

  // Reapply retention policy: paid plans clear policy_expires_at on the org's
  // links; downgrades to free re-stamp it. Active or trialing plans count as
  // "the current plan"; anything else (canceled, past_due, etc.) reverts to
  // free retention.
  if (organizationId) {
    const effectivePlan: SubscriptionPlan =
      subData.status === "active" || subData.status === "trialing" ? plan : "free";
    try {
      const db = drizzle(env.DB, { schema });
      const result = await applyRetentionForOrg(db, organizationId, effectivePlan);
      if (result.cleared > 0 || result.stamped > 0) {
      }
    } catch (error) {
      console.error(`Failed to apply retention for org ${organizationId}:`, error);
    }

    if (effectivePlan !== "free") {
      await clearClickQuotaFlags(env, organizationId);
    }

    // Funnel event — fire on plan changes (new sub, upgrade, downgrade, cancel).
    const previousPlan = existingSub?.plan ?? "free";
    if (previousPlan !== plan) {
      const eventName = rank(plan) > rank(previousPlan) ? "plan_upgraded" : "plan_downgraded";
      await captureEvent(env, {
        event: eventName,
        distinctId: organizationId,
        properties: {
          organizationId,
          previousPlan,
          newPlan: plan,
          status: subData.status,
          stripeSubscriptionId: subscription.id,
        },
      });
    }
  }
}

// A paid plan absorbs click overage through the usage meter, so the free-tier
// degrade flag written by the usage cron must lift immediately on upgrade —
// both the org-scoped flag and the owner's personal-scope flag (links created
// outside an org carry only userId).
async function clearClickQuotaFlags(env: Env, organizationId: string): Promise<void> {
  if (!env.LINKS_KV) return;
  try {
    const { getClicksQuotaFlagKey } = await import("../../lib/usage.js");
    const deletions = [env.LINKS_KV.delete(getClicksQuotaFlagKey(organizationId))];
    const db = drizzle(env.DB, { schema });
    const owner = await db
      .select({ userId: schema.organizationMembers.userId })
      .from(schema.organizationMembers)
      .where(
        and(
          eq(schema.organizationMembers.organizationId, organizationId),
          eq(schema.organizationMembers.role, "owner")
        )
      )
      .limit(1);
    if (owner[0]) {
      deletions.push(env.LINKS_KV.delete(getClicksQuotaFlagKey(owner[0].userId)));
    }
    await Promise.all(deletions);
  } catch (error) {
    console.error(`Failed to clear click-quota flag for org ${organizationId}:`, error);
  }
}

function rank(plan: string): number {
  switch (plan) {
    case "enterprise":
      return 4;
    case "scale":
      return 3;
    case "business":
      return 2;
    case "pro":
      return 1;
    default:
      return 0;
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

  // Queue invoice email
  if (env.BACKGROUND_QUEUE && invoice.customer_email) {
    await env.BACKGROUND_QUEUE.send({
      type: "email:send",
      payload: {
        to: invoice.customer_email,
        template: "invoice",
        data: {
          invoiceNumber: invoice.number,
          amount: (invoice.amount_paid / 100).toFixed(2),
          currency: invoice.currency?.toUpperCase(),
          invoiceUrl: invoice.hosted_invoice_url,
          pdfUrl: invoice.invoice_pdf,
        },
      },
    });
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
