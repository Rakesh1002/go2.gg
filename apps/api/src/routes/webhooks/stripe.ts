/**
 * Stripe Webhook Handler
 *
 * Handles all Stripe webhooks for subscription lifecycle events and one-time purchases.
 * All events are verified using Stripe's webhook signature.
 */

import { Hono } from "hono";
import Stripe from "stripe";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@repo/db";
import { createD1Repositories } from "@repo/db/d1";
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

function getPlanFromPriceId(priceId: string): SubscriptionPlan {
  const plan = PRICE_TO_PLAN[priceId];
  if (
    plan === "pro" ||
    plan === "business" ||
    plan === "scale" ||
    plan === "enterprise"
  ) {
    return plan;
  }

  // Fallback: try to extract plan from price ID pattern
  const lower = priceId.toLowerCase();
  if (lower.includes("enterprise")) return "enterprise";
  if (lower.includes("scale")) return "scale";
  if (lower.includes("business")) return "business";
  if (lower.includes("pro")) return "pro";

  return "pro"; // Default fallback
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
      await handleSubscriptionUpdated(repos, subscription, c.env);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(repos, subscription, c.env);
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

  return c.json({ received: true });
});

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
  const priceId = subscription.items.data[0]?.price.id ?? "";
  const plan = getPlanFromPriceId(priceId);

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
    const effectivePlan: "free" | "pro" | "business" | "enterprise" =
      subData.status === "active" || subData.status === "trialing"
        ? (plan as "free" | "pro" | "business" | "enterprise")
        : "free";
    try {
      const db = drizzle(env.DB, { schema });
      const result = await applyRetentionForOrg(db, organizationId, effectivePlan);
      if (result.cleared > 0 || result.stamped > 0) {
      }
    } catch (error) {
      console.error(`Failed to apply retention for org ${organizationId}:`, error);
    }

    // Funnel event — fire on plan changes (new sub, upgrade, downgrade, cancel).
    const previousPlan = existingSub?.plan ?? "free";
    if (previousPlan !== plan) {
      const eventName =
        rank(plan) > rank(previousPlan) ? "plan_upgraded" : "plan_downgraded";
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

function rank(plan: string): number {
  switch (plan) {
    case "enterprise":
      return 4;
    case "business":
      return 3;
    case "scale":
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
      console.error(
        `Failed to apply free retention for org ${existingSub.organizationId}:`,
        error
      );
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
