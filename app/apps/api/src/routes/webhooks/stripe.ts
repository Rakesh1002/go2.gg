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

// Price ID to Plan mapping
// Go2.gg products under Roushan, Inc. Stripe account
const PRICE_TO_PLAN: Record<string, string> = {
  // Go2 Pro - $9/mo or $86/year
  price_1StPxBKhC7le8Qv5GZJLpbSE: "pro", // Pro Monthly
  price_1StPxCKhC7le8Qv5tZmIkrfr: "pro", // Pro Annual
  // Go2 Business - $49/mo or $470/year (current pricing)
  price_1SviefKhC7le8Qv5J0S9rtEG: "business", // Business Monthly $49
  price_1SvielKhC7le8Qv59j7SgNkS: "business", // Business Annual $470
  // Legacy Business prices (for existing subscribers - keep for backwards compat)
  price_1StRhYKhC7le8Qv5Dk1Bq0St: "business", // Business Monthly (legacy)
  price_1StRhYKhC7le8Qv5JZpEy18W: "business", // Business Annual (legacy)
  price_1StPxCKhC7le8Qv5UThExH2B: "business", // Business Monthly (legacy $24)
  price_1StPxDKhC7le8Qv5Z13t5TDG: "business", // Business Annual (legacy $230)
  // Go2 Enterprise - $499/mo or $4790/year
  price_1StPxEKhC7le8Qv5JMeDQX7R: "enterprise", // Enterprise Monthly
  price_1StPxFKhC7le8Qv550ckHwp1: "enterprise", // Enterprise Annual
};

type SubscriptionPlan = "free" | "pro" | "business" | "enterprise";

function getPlanFromPriceId(priceId: string): SubscriptionPlan {
  // Check exact matches first
  const plan = PRICE_TO_PLAN[priceId];
  if (plan === "starter" || plan === "pro" || plan === "enterprise") {
    // Map starter to pro for DB compatibility
    return plan === "starter" ? "pro" : plan;
  }

  // Fallback: try to extract plan from price ID pattern
  const lower = priceId.toLowerCase();
  if (lower.includes("enterprise")) return "enterprise";
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

  // Log event for observability
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "stripe_webhook",
      type: event.type,
      id: event.id,
    })
  );

  const db = drizzle(c.env.DB, { schema });
  const repos = createD1Repositories(db);

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(repos, session, c.env);
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(repos, subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(repos, subscription);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(repos, invoice, c.env);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoiceFailed(repos, invoice, c.env);
      break;
    }

    case "payment_intent.succeeded": {
      // Handle one-time payment success (boilerplate purchases)
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentSuccess(repos, paymentIntent, c.env);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
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

  console.log(`Checkout completed for org ${orgId}, customer ${customerId}`);
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
  const licenseName = licenseId.charAt(0).toUpperCase() + licenseId.slice(1) + " License";
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

    console.log(`Boilerplate purchase recorded: ${email}, ${licenseId}`);

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
  subscription: Stripe.Subscription
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

  if (existingSub) {
    await repos.subscriptions.update(existingSub.id, subData);
    console.log(`Subscription updated: ${subscription.id}, plan: ${plan}`);
  } else {
    // Find organization by customer ID
    const org = await repos.organizations.findByStripeCustomerId(subscription.customer as string);

    if (org) {
      await repos.subscriptions.create({
        id: crypto.randomUUID(),
        organizationId: org.id,
        ...subData,
      });
      console.log(`Subscription created: ${subscription.id}, org: ${org.id}, plan: ${plan}`);
    }
  }
}

async function handleSubscriptionDeleted(
  repos: ReturnType<typeof createD1Repositories>,
  subscription: Stripe.Subscription
) {
  const existingSub = await repos.subscriptions.findByStripeSubscriptionId(subscription.id);

  if (existingSub) {
    await repos.subscriptions.update(existingSub.id, {
      status: "canceled",
    });
    console.log(`Subscription canceled: ${subscription.id}`);
  }
}

async function handleInvoicePaid(
  _repos: ReturnType<typeof createD1Repositories>,
  invoice: Stripe.Invoice,
  env: Env
) {
  console.log(`Invoice paid: ${invoice.id} for customer ${invoice.customer}`);

  // Resolve any dunning records for this invoice
  try {
    const { resolveDunning } = await import("../../lib/dunning.js");
    const drizzle = await import("drizzle-orm/d1");
    const db = drizzle.drizzle(env.DB, { schema });

    await resolveDunning(db, invoice.id);
    console.log(`Dunning resolved for invoice ${invoice.id}`);
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

      console.log(`Dunning record created for invoice ${invoice.id}`);

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
  paymentIntent: Stripe.PaymentIntent,
  _env: Env
) {
  // One-time payment succeeded
  console.log(`Payment succeeded: ${paymentIntent.id}, amount: ${paymentIntent.amount}`);

  // The actual purchase record is created in checkout.session.completed
  // This event is mainly for logging and additional processing if needed
}

export { stripeWebhooks };
