/**
 * Billing Routes
 *
 * Stripe checkout and subscription management.
 */

import { zValidator } from "@hono/zod-validator";
import { getOveragePriceIdForPrice } from "@repo/config/pricing";
import * as schema from "@repo/db";
import { createD1Repositories } from "@repo/db/d1";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import Stripe from "stripe";
import { z } from "zod";
import type { Env } from "../bindings.js";
import { badRequest, forbidden, notFound, ok } from "../lib/response.js";
import { syncSubscriptionFromStripe } from "../lib/subscription-sync.js";
import { authMiddleware } from "../middleware/auth.js";

const billing = new Hono<{ Bindings: Env }>();

// All billing routes require authentication
billing.use("*", authMiddleware());

// -----------------------------------------------------------------------------
// Helper to create Stripe client
// -----------------------------------------------------------------------------

function getStripe(env: Env): Stripe {
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
  });
}

// -----------------------------------------------------------------------------
// Schemas
// -----------------------------------------------------------------------------

const checkoutSchema = z.object({
  priceId: z.string().min(1),
  organizationId: z.string().uuid().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const portalSchema = z.object({
  organizationId: z.string().uuid(),
});

const confirmSchema = z.object({
  sessionId: z.string().min(1),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * POST /billing/checkout
 * Create a Stripe Checkout session
 */
billing.post("/checkout", zValidator("json", checkoutSchema), async (c) => {
  const user = c.get("user");
  const { priceId, organizationId, successUrl, cancelUrl } = c.req.valid("json");
  const stripe = getStripe(c.env);
  const db = drizzle(c.env.DB, { schema });
  const repos = createD1Repositories(db);

  let customerId: string | undefined;
  let orgId = organizationId;

  // If organization specified, verify the caller belongs to it — every other
  // billing route checks membership; checkout must too, or anyone could bind
  // a subscription to a victim org's customer record.
  if (orgId) {
    const membership = await c.env.DB.prepare(
      `SELECT role FROM organization_members
         WHERE user_id = ? AND organization_id = ?
         LIMIT 1`
    )
      .bind(user.id, orgId)
      .first<{ role: string }>();
    if (!membership) {
      return forbidden(c, "You don't have access to this organization");
    }
    const org = await repos.organizations.findById(orgId);
    if (org?.stripeCustomerId) {
      customerId = org.stripeCustomerId;
    }
  }

  // Create or get user's personal organization if none specified
  if (!orgId) {
    // Find user's default organization
    const membership = await c.env.DB.prepare(
      `SELECT organization_id FROM organization_members 
         WHERE user_id = ? AND role = 'owner' 
         LIMIT 1`
    )
      .bind(user.id)
      .first<{ organization_id: string }>();

    orgId = membership?.organization_id;
  }

  // Attach the plan's metered overage SKU as a second line item so usage
  // beyond the included quota bills at $0.40/1K (the meter cron reports usage).
  // Plans without an overage SKU (Free upgrades, Scale is already metered)
  // resolve to null and ship a single line item.
  const overagePriceId = getOveragePriceIdForPrice(priceId);
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: priceId, quantity: 1 },
  ];
  if (overagePriceId) {
    lineItems.push({ price: overagePriceId });
  }

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url:
        successUrl ??
        `${c.env.APP_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${c.env.APP_URL}/dashboard/billing?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: {
        organizationId: orgId ?? "",
        userId: user.id,
      },
      // Stamp the org on the subscription itself so the subscription webhook
      // (and the /confirm reconcile) can resolve the org directly, instead of
      // depending on checkout.session.completed having already written the
      // customer→org mapping. Without this, when Stripe delivers
      // customer.subscription.created before checkout.session.completed, the
      // subscription record was silently never created.
      subscription_data: {
        metadata: {
          organizationId: orgId ?? "",
          userId: user.id,
        },
      },
    };

    // Use the org's existing customer when there is one. Otherwise just pass
    // the email — subscription mode always creates a customer on its own,
    // and customer_creation is payment-mode-only (Stripe 400s on it here,
    // which broke the first upgrade for every org without a customer yet).
    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return ok(c, {
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return badRequest(
      c,
      error instanceof Error ? error.message : "Failed to create checkout session",
      "CHECKOUT_FAILED"
    );
  }
});

/**
 * POST /billing/confirm
 * Reconcile a completed checkout synchronously from its session id.
 *
 * Stripe webhooks are eventually-consistent: the user is redirected back to the
 * billing page a beat before the subscription webhook lands, so the page would
 * otherwise still read "Free". This endpoint retrieves the session's
 * subscription straight from Stripe and upserts the local record on demand, so
 * the upgrade is reflected the instant the success page loads. It is idempotent
 * with (and a safety net for) the webhook.
 */
billing.post("/confirm", zValidator("json", confirmSchema), async (c) => {
  const user = c.get("user");
  const { sessionId } = c.req.valid("json");
  const stripe = getStripe(c.env);
  const db = drizzle(c.env.DB, { schema });
  const repos = createD1Repositories(db);

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error("Confirm: failed to retrieve session:", error);
    return notFound(c, "Checkout session not found");
  }

  const orgId = session.metadata?.organizationId;
  if (!orgId) {
    return badRequest(c, "Checkout session is not linked to an organization", "NO_ORG");
  }

  // The session id is a bearer-ish secret, but verify membership anyway so a
  // leaked/guessed session id can't be used to read another org's plan state.
  const membership = await c.env.DB.prepare(
    `SELECT role FROM organization_members
       WHERE user_id = ? AND organization_id = ?
       LIMIT 1`
  )
    .bind(user.id, orgId)
    .first<{ role: string }>();
  if (!membership) {
    return forbidden(c, "You don't have access to this organization");
  }

  // Persist the customer→org mapping if the webhook hasn't yet (powers the
  // portal + the customer-id fallback path).
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (customerId) {
    await repos.organizations.update(orgId, { stripeCustomerId: customerId });
  }

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subscriptionId) {
    // Not a subscription checkout (or not yet created) — report current state.
    const current = await repos.subscriptions.findActiveByOrganization(orgId);
    return ok(c, { plan: current?.plan ?? "free", pending: session.payment_status !== "paid" });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const result = await syncSubscriptionFromStripe(c.env, repos, subscription, {
      hintOrgId: orgId,
    });
    return ok(c, { plan: result?.plan ?? "free", pending: false });
  } catch (error) {
    console.error("Confirm: failed to sync subscription:", error);
    return badRequest(
      c,
      error instanceof Error ? error.message : "Failed to confirm subscription",
      "CONFIRM_FAILED"
    );
  }
});

/**
 * POST /billing/portal
 * Create a Stripe Customer Portal session
 */
billing.post("/portal", zValidator("json", portalSchema), async (c) => {
  const user = c.get("user");
  const { organizationId } = c.req.valid("json");
  const stripe = getStripe(c.env);
  const db = drizzle(c.env.DB, { schema });
  const repos = createD1Repositories(db);

  // Verify user has access to this organization
  const membership = await c.env.DB.prepare(
    `SELECT * FROM organization_members 
       WHERE organization_id = ? AND user_id = ? 
       AND role IN ('owner', 'admin')`
  )
    .bind(organizationId, user.id)
    .first();

  if (!membership) {
    return c.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You don't have billing access to this organization",
        },
      },
      403
    );
  }

  // Get organization
  const org = await repos.organizations.findById(organizationId);

  if (!org?.stripeCustomerId) {
    return badRequest(c, "No billing account found", "NO_BILLING_ACCOUNT");
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${c.env.APP_URL}/dashboard/billing`,
    });

    return ok(c, { url: session.url });
  } catch (error) {
    console.error("Portal error:", error);
    return badRequest(
      c,
      error instanceof Error ? error.message : "Failed to create portal session",
      "PORTAL_FAILED"
    );
  }
});

/**
 * GET /billing/subscription
 * Get current subscription for an organization
 */
billing.get("/subscription", async (c) => {
  const user = c.get("user");
  const organizationId = c.req.query("organizationId");
  const db = drizzle(c.env.DB, { schema });
  const repos = createD1Repositories(db);

  if (!organizationId) {
    return badRequest(c, "Organization ID required", "MISSING_ORG_ID");
  }

  // Verify membership
  const membership = await c.env.DB.prepare(
    `SELECT * FROM organization_members 
       WHERE organization_id = ? AND user_id = ?`
  )
    .bind(organizationId, user.id)
    .first();

  if (!membership) {
    return c.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Not a member of this organization" },
      },
      403
    );
  }

  // Get subscription
  const subscription = await repos.subscriptions.findActiveByOrganization(organizationId);

  // Get entitlements based on plan
  const plan = subscription?.plan ?? "free";
  const entitlements = getEntitlements(plan);

  return ok(c, {
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          plan: subscription.plan,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        }
      : null,
    plan,
    entitlements,
  });
});

/**
 * POST /billing/cancel
 * Cancel subscription at period end
 */
billing.post("/cancel", async (c) => {
  const user = c.get("user");
  const organizationId = c.req.query("organizationId");
  const db = drizzle(c.env.DB, { schema });
  const repos = createD1Repositories(db);
  const stripe = getStripe(c.env);

  if (!organizationId) {
    return badRequest(c, "Organization ID required", "MISSING_ORG_ID");
  }

  // Verify ownership
  const membership = await c.env.DB.prepare(
    `SELECT * FROM organization_members 
       WHERE organization_id = ? AND user_id = ? 
       AND role IN ('owner', 'admin')`
  )
    .bind(organizationId, user.id)
    .first();

  if (!membership) {
    return c.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Only admins can cancel subscriptions" },
      },
      403
    );
  }

  // Get subscription
  const subscription = await repos.subscriptions.findActiveByOrganization(organizationId);

  if (!subscription) {
    return notFound(c, "No active subscription found");
  }

  try {
    // Cancel at period end in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update local record
    await repos.subscriptions.update(subscription.id, {
      cancelAtPeriodEnd: true,
    });

    return ok(c, {
      message: "Subscription will be canceled at the end of the billing period",
      cancelAt: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error("Cancel error:", error);
    return badRequest(
      c,
      error instanceof Error ? error.message : "Failed to cancel subscription",
      "CANCEL_FAILED"
    );
  }
});

/**
 * POST /billing/resume
 * Resume a canceled subscription
 */
billing.post("/resume", async (c) => {
  const user = c.get("user");
  const organizationId = c.req.query("organizationId");
  const db = drizzle(c.env.DB, { schema });
  const repos = createD1Repositories(db);
  const stripe = getStripe(c.env);

  if (!organizationId) {
    return badRequest(c, "Organization ID required", "MISSING_ORG_ID");
  }

  // Verify ownership
  const membership = await c.env.DB.prepare(
    `SELECT * FROM organization_members 
       WHERE organization_id = ? AND user_id = ? 
       AND role IN ('owner', 'admin')`
  )
    .bind(organizationId, user.id)
    .first();

  if (!membership) {
    return c.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Only admins can manage subscriptions" },
      },
      403
    );
  }

  // Get subscription
  const subscription = await repos.subscriptions.findByOrganization(organizationId);

  if (!subscription || !subscription.cancelAtPeriodEnd) {
    return badRequest(c, "No subscription to resume", "NOTHING_TO_RESUME");
  }

  try {
    // Resume in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Update local record
    await repos.subscriptions.update(subscription.id, {
      cancelAtPeriodEnd: false,
    });

    return ok(c, { message: "Subscription resumed" });
  } catch (error) {
    console.error("Resume error:", error);
    return badRequest(
      c,
      error instanceof Error ? error.message : "Failed to resume subscription",
      "RESUME_FAILED"
    );
  }
});

/**
 * GET /billing/invoices
 * Get invoices for an organization
 */
billing.get("/invoices", async (c) => {
  const user = c.get("user");
  const organizationId = c.req.query("organizationId");
  const db = drizzle(c.env.DB, { schema });
  const repos = createD1Repositories(db);
  const stripe = getStripe(c.env);

  if (!organizationId) {
    return badRequest(c, "Organization ID required", "MISSING_ORG_ID");
  }

  // Verify membership
  const membership = await c.env.DB.prepare(
    `SELECT * FROM organization_members 
       WHERE organization_id = ? AND user_id = ?`
  )
    .bind(organizationId, user.id)
    .first();

  if (!membership) {
    return c.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Not a member of this organization" },
      },
      403
    );
  }

  // Get organization
  const org = await repos.organizations.findById(organizationId);

  if (!org?.stripeCustomerId) {
    return ok(c, { invoices: [] });
  }

  try {
    const invoices = await stripe.invoices.list({
      customer: org.stripeCustomerId,
      limit: 12,
    });

    return ok(c, {
      invoices: invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        amount: inv.amount_due,
        currency: inv.currency,
        created: new Date(inv.created * 1000).toISOString(),
        pdfUrl: inv.invoice_pdf,
        hostedUrl: inv.hosted_invoice_url,
      })),
    });
  } catch (error) {
    console.error("Invoices error:", error);
    return ok(c, { invoices: [] });
  }
});

/**
 * GET /billing/usage
 * Get current usage for an organization
 */
billing.get("/usage", async (c) => {
  const user = c.get("user");
  const organizationId = c.req.query("organizationId");
  const _db = drizzle(c.env.DB, { schema });

  if (!organizationId) {
    return badRequest(c, "Organization ID required", "MISSING_ORG_ID");
  }

  // Verify membership
  const membership = await c.env.DB.prepare(
    `SELECT * FROM organization_members 
       WHERE organization_id = ? AND user_id = ?`
  )
    .bind(organizationId, user.id)
    .first();

  if (!membership) {
    return c.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Not a member of this organization" },
      },
      403
    );
  }

  // Get usage from KV (reset monthly)
  const now = new Date();
  const monthKey = `usage:${organizationId}:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let usage = {
    apiCalls: 0,
    storage: 0,
    seats: 1,
  };

  if (c.env.KV_CONFIG) {
    const storedUsage = await c.env.KV_CONFIG.get(monthKey);
    if (storedUsage) {
      usage = JSON.parse(storedUsage);
    }
  }

  return ok(c, { usage, period: monthKey });
});

/**
 * POST /billing/usage/report
 * Report usage (internal, for metered billing)
 */
billing.post("/usage/report", async (c) => {
  // This endpoint would typically be called from other services
  // to report usage. For security, it should use an internal API key.
  const apiKey = c.req.header("X-Internal-API-Key");

  // Fail closed: with INTERNAL_API_KEY unset, `undefined !== undefined` let
  // any caller omitting the header straight through.
  if (!c.env.INTERNAL_API_KEY || !apiKey || apiKey !== c.env.INTERNAL_API_KEY) {
    return c.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid API key" } },
      401
    );
  }

  const body = await c.req.json<{
    organizationId: string;
    metric: "apiCalls" | "storage";
    amount: number;
  }>();

  const { organizationId, metric, amount } = body;

  // Update usage in KV
  const now = new Date();
  const monthKey = `usage:${organizationId}:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (c.env.KV_CONFIG) {
    const storedUsage = await c.env.KV_CONFIG.get(monthKey);
    const usage = storedUsage ? JSON.parse(storedUsage) : { apiCalls: 0, storage: 0, seats: 1 };

    usage[metric] = (usage[metric] ?? 0) + amount;

    await c.env.KV_CONFIG.put(monthKey, JSON.stringify(usage), {
      expirationTtl: 60 * 60 * 24 * 45, // 45 days
    });
  }

  return ok(c, { recorded: true });
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

type Plan = "free" | "pro" | "business" | "scale" | "enterprise";

interface Entitlements {
  features: Record<string, boolean>;
  limits: {
    seats: number | undefined;
    storage: number | undefined;
    apiCalls: number | undefined;
  };
}

function getEntitlements(plan: Plan): Entitlements {
  const entitlements: Record<Plan, Entitlements> = {
    free: {
      features: {
        basicFeatures: true,
        advancedFeatures: false,
        prioritySupport: false,
        sso: false,
        audit: false,
      },
      limits: { seats: 1, storage: 100, apiCalls: 1000 },
    },
    pro: {
      features: {
        basicFeatures: true,
        advancedFeatures: true,
        prioritySupport: false,
        sso: false,
        audit: false,
      },
      limits: { seats: 5, storage: 1000, apiCalls: 10000 },
    },
    business: {
      features: {
        basicFeatures: true,
        advancedFeatures: true,
        prioritySupport: true,
        sso: false,
        audit: true,
      },
      limits: { seats: 20, storage: 10000, apiCalls: 100000 },
    },
    scale: {
      features: {
        basicFeatures: true,
        advancedFeatures: true,
        prioritySupport: true,
        sso: true,
        audit: true,
      },
      // Scale is usage-based — limits are uncapped on the platform side; the
      // billing meter handles the per-event price tiering.
      limits: { seats: undefined, storage: undefined, apiCalls: undefined },
    },
    enterprise: {
      features: {
        basicFeatures: true,
        advancedFeatures: true,
        prioritySupport: true,
        sso: true,
        audit: true,
      },
      limits: { seats: undefined, storage: undefined, apiCalls: undefined },
    },
  };

  return entitlements[plan];
}

export { billing };
