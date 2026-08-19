/**
 * Subscription sync
 *
 * Single source of truth for turning a Stripe subscription into our local
 * subscription record + downstream entitlement side effects (link retention,
 * click-quota flags, funnel analytics).
 *
 * Used by three callers that previously each had their own partial logic:
 *   - the `customer.subscription.*` webhook
 *   - `checkout.session.completed` (eager upsert the instant checkout lands)
 *   - `POST /billing/confirm` (synchronous reconcile on the success redirect)
 *
 * The org is resolved without depending on webhook ordering. The old code
 * created the record only in the subscription webhook and only via
 * findByStripeCustomerId — which is null until checkout.session.completed sets
 * it. When Stripe delivered subscription.created first (it usually does), the
 * record was silently never created and the customer stayed on Free despite
 * paying. Org resolution now prefers the subscription/session metadata, so any
 * single event is enough.
 */

import { pricingPlans } from "@repo/config/pricing";
import * as schema from "@repo/db";
import type { createD1Repositories } from "@repo/db/d1";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type Stripe from "stripe";
import type { Env } from "../bindings.js";
import { captureEvent } from "./product-analytics.js";
import { applyRetentionForOrg } from "./retention.js";

type Repos = ReturnType<typeof createD1Repositories>;

export type SubscriptionPlan = "free" | "pro" | "business" | "scale" | "enterprise";

// Price ID to Plan mapping for go2.gg products under acct_1TgyIg43jurh1T6b.
// Keep in sync with @repo/config/pricing.
const PRICE_TO_PLAN: Record<string, SubscriptionPlan> = {
  // Go2 Pro - $9/mo or $86/year
  price_1TgyYu43jurh1T6btCXxDvfE: "pro", // Pro Monthly
  price_1TgyYu43jurh1T6bVJMu9GM9: "pro", // Pro Annual
  // Go2 Business - $49/mo or $470/year
  price_1TgyYw43jurh1T6brxnKqpg6: "business", // Business Monthly
  price_1TgyYx43jurh1T6bkOVdlYup: "business", // Business Annual
  // Go2 Scale - usage-based via Meter (first 500K events free, then $0.40/1K)
  price_1TgyYz43jurh1T6bOzGBALt1: "scale",
};

/**
 * Returns null for unrecognized price IDs. A misconfigured price must never
 * silently grant a paid plan — callers treat null as "log loudly, change
 * nothing."
 */
export function getPlanFromPriceId(priceId: string): SubscriptionPlan | null {
  const plan = PRICE_TO_PLAN[priceId];
  if (plan) return plan;

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

/**
 * Subscriptions carry two items — the flat plan price and a metered overage
 * price. The plan comes from the flat (non-metered) item; the overage price
 * must not be mistaken for the plan. Matching on usage_type also covers
 * env-provisioned prices absent from PRICE_TO_PLAN.
 */
export function getFlatPriceId(subscription: Stripe.Subscription): string {
  const flatItem = subscription.items.data.find(
    (it) => it.price.recurring?.usage_type !== "metered"
  );
  return flatItem?.price.id ?? subscription.items.data[0]?.price.id ?? "";
}

/**
 * Resolve the owning org without relying on Stripe event ordering. Priority:
 *   1. an existing local record for this subscription (updates/renewals)
 *   2. metadata stamped on the subscription or carried from the checkout session
 *   3. the customer→org mapping (set by checkout.session.completed)
 */
export function resolveOrganizationId(args: {
  existingOrgId?: string | null;
  metadataOrgId?: string | null;
  hintOrgId?: string | null;
  customerOrgId?: string | null;
}): string | null {
  return args.existingOrgId || args.hintOrgId || args.metadataOrgId || args.customerOrgId || null;
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

/**
 * A paid plan absorbs click overage through the usage meter, so the free-tier
 * degrade flag written by the usage cron must lift immediately on upgrade —
 * both the org-scoped flag and the owner's personal-scope flag (links created
 * outside an org carry only userId).
 */
async function clearClickQuotaFlags(env: Env, organizationId: string): Promise<void> {
  if (!env.LINKS_KV) return;
  try {
    const { getClicksQuotaFlagKey } = await import("./usage.js");
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

/**
 * Upsert the local subscription record from a Stripe subscription and apply the
 * resulting entitlements. Idempotent: keyed on stripeSubscriptionId, so running
 * it from both the webhook and the synchronous confirm path converges to the
 * same row without duplicate funnel events (plan-change events only fire when
 * the plan actually changes).
 *
 * Returns the resolved plan + org, or null when the price is unknown or no org
 * could be resolved (both logged).
 */
export async function syncSubscriptionFromStripe(
  env: Env,
  repos: Repos,
  subscription: Stripe.Subscription,
  opts: { hintOrgId?: string | null } = {}
): Promise<{ plan: SubscriptionPlan; organizationId: string } | null> {
  const priceId = getFlatPriceId(subscription);
  const plan = getPlanFromPriceId(priceId);
  if (plan === null) {
    console.error(`Stripe sync: unknown price ID ${priceId} on sub ${subscription.id}`);
    const { logEvent } = await import("./axiom.js");
    await logEvent(
      env,
      "stripe.unknown_price",
      { priceId, subscriptionId: subscription.id, customerId: String(subscription.customer) },
      "error"
    ).catch(() => undefined);
    return null;
  }

  const existingSub = await repos.subscriptions.findByStripeSubscriptionId(subscription.id);

  const metadataOrgId =
    typeof subscription.metadata?.organizationId === "string"
      ? subscription.metadata.organizationId
      : null;
  let customerOrgId: string | null = null;
  if (!existingSub && !opts.hintOrgId && !metadataOrgId && subscription.customer) {
    const org = await repos.organizations.findByStripeCustomerId(subscription.customer as string);
    customerOrgId = org?.id ?? null;
  }

  const organizationId = resolveOrganizationId({
    existingOrgId: existingSub?.organizationId,
    metadataOrgId,
    hintOrgId: opts.hintOrgId,
    customerOrgId,
  });

  if (!organizationId) {
    console.error(
      `Stripe sync: could not resolve org for sub ${subscription.id} (customer ${String(
        subscription.customer
      )})`
    );
    const { logEvent } = await import("./axiom.js");
    await logEvent(
      env,
      "stripe.unresolved_org",
      { subscriptionId: subscription.id, customerId: String(subscription.customer), priceId },
      "error"
    ).catch(() => undefined);
    return null;
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

  const previousPlan: SubscriptionPlan = (existingSub?.plan as SubscriptionPlan) ?? "free";

  if (existingSub) {
    await repos.subscriptions.update(existingSub.id, subData);
  } else {
    await repos.subscriptions.create({
      id: crypto.randomUUID(),
      organizationId,
      ...subData,
    });
  }

  // Reapply retention: active/trialing plans count as "the current plan";
  // anything else (canceled, past_due) reverts to free retention.
  const effectivePlan: SubscriptionPlan =
    subData.status === "active" || subData.status === "trialing" ? plan : "free";
  try {
    const db = drizzle(env.DB, { schema });
    await applyRetentionForOrg(db, organizationId, effectivePlan);
  } catch (error) {
    console.error(`Failed to apply retention for org ${organizationId}:`, error);
  }

  if (effectivePlan !== "free") {
    await clearClickQuotaFlags(env, organizationId);
  }

  // Funnel event — fire only on an actual plan change. This also dedupes the
  // webhook vs. confirm double-sync: the second sync sees previousPlan === plan.
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

  return { plan, organizationId };
}
