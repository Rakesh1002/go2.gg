/**
 * @repo/payments - Payment Processing Package
 *
 * This package provides:
 * - Stripe integration (checkout, subscriptions, portal)
 * - Entitlement system for feature gating
 * - Type definitions for payments
 *
 * Usage:
 * ```typescript
 * import { createStripeClient, createCheckoutSession } from "@repo/payments/stripe";
 *
 * const stripe = createStripeClient({ secretKey: "..." });
 *
 * const session = await createCheckoutSession(stripe, {
 *   priceId: "price_xxx",
 *   successUrl: "https://app.example.com/success",
 *   cancelUrl: "https://app.example.com/cancel",
 * });
 * ```
 */

// Types
export {
  planSchema,
  billingIntervalSchema,
  planEntitlements,
  type Plan,
  type BillingInterval,
  type Product,
  type Price,
  type Subscription,
  type SubscriptionStatus,
  type CreateCheckoutParams,
  type CheckoutSession,
  type CreatePortalParams,
  type PortalSession,
  type Entitlements,
} from "./types.js";

// Stripe exports
export * from "./stripe/index.js";

// -----------------------------------------------------------------------------
// Entitlement Helpers
// -----------------------------------------------------------------------------

import { planEntitlements, type Plan, type Entitlements } from "./types.js";

/**
 * Get entitlements for a plan.
 */
export function getEntitlements(plan: Plan): Entitlements {
  return planEntitlements[plan];
}

/**
 * Check if a plan has a specific feature.
 */
export function hasFeature(plan: Plan, feature: string): boolean {
  const entitlements = getEntitlements(plan);
  return !!entitlements.features[feature];
}

/**
 * Check if within a limit.
 */
export function withinLimit(
  plan: Plan,
  limit: keyof Entitlements["limits"],
  current: number
): boolean {
  const entitlements = getEntitlements(plan);
  const max = entitlements.limits[limit];

  // Undefined means unlimited
  if (max === undefined) {
    return true;
  }

  return current < max;
}
