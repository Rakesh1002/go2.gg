/**
 * Stripe Subscriptions
 */

import type Stripe from "stripe";
import type { Subscription, Plan, SubscriptionStatus } from "../types.js";

/**
 * Get a subscription by ID.
 */
export async function getSubscription(
  stripe: Stripe,
  subscriptionId: string
): Promise<Subscription | null> {
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    return mapSubscription(sub);
  } catch {
    return null;
  }
}

/**
 * Get subscriptions for a customer.
 */
export async function getCustomerSubscriptions(
  stripe: Stripe,
  customerId: string
): Promise<Subscription[]> {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
  });

  return subs.data.map(mapSubscription);
}

/**
 * Cancel a subscription at period end.
 */
export async function cancelSubscription(
  stripe: Stripe,
  subscriptionId: string
): Promise<Subscription> {
  const sub = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return mapSubscription(sub);
}

/**
 * Reactivate a canceled subscription.
 */
export async function reactivateSubscription(
  stripe: Stripe,
  subscriptionId: string
): Promise<Subscription> {
  const sub = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return mapSubscription(sub);
}

/**
 * Change subscription plan.
 */
export async function changeSubscriptionPlan(
  stripe: Stripe,
  subscriptionId: string,
  newPriceId: string,
  options?: {
    prorate?: boolean;
    billingCycleAnchor?: "now" | "unchanged";
  }
): Promise<Subscription> {
  // Get current subscription
  const currentSub = await stripe.subscriptions.retrieve(subscriptionId);
  const subscriptionItemId = currentSub.items.data[0]?.id;

  if (!subscriptionItemId) {
    throw new Error("Subscription has no items");
  }

  const sub = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscriptionItemId,
        price: newPriceId,
      },
    ],
    proration_behavior: options?.prorate !== false ? "create_prorations" : "none",
    billing_cycle_anchor: options?.billingCycleAnchor ?? "unchanged",
  });

  return mapSubscription(sub);
}

/**
 * Map Stripe subscription to our type.
 */
function mapSubscription(sub: Stripe.Subscription): Subscription {
  return {
    id: sub.id,
    customerId: sub.customer as string,
    status: sub.status as SubscriptionStatus,
    plan: (sub.metadata.plan as Plan) ?? "free",
    priceId: sub.items.data[0]?.price.id ?? "",
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : undefined,
  };
}
