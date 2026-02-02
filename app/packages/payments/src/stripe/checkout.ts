/**
 * Stripe Checkout
 */

import type Stripe from "stripe";
import type { CreateCheckoutParams, CheckoutSession } from "../types.js";

/**
 * Create a Stripe Checkout session for subscription.
 */
export async function createCheckoutSession(
  stripe: Stripe,
  params: CreateCheckoutParams
): Promise<CheckoutSession> {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
    allow_promotion_codes: params.allowPromotionCodes ?? true,
  };

  // Set customer
  if (params.customerId) {
    sessionParams.customer = params.customerId;
  } else if (params.customerEmail) {
    sessionParams.customer_email = params.customerEmail;
  }

  // Set trial
  if (params.trialDays) {
    sessionParams.subscription_data = {
      trial_period_days: params.trialDays,
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    id: session.id,
    url: session.url ?? "",
    customerId: session.customer as string | undefined,
    subscriptionId: session.subscription as string | undefined,
  };
}

/**
 * Create a Checkout session for one-time payment.
 */
export async function createOneTimeCheckout(
  stripe: Stripe,
  params: {
    priceId: string;
    quantity?: number;
    successUrl: string;
    cancelUrl: string;
    customerId?: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }
): Promise<CheckoutSession> {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: params.quantity ?? 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
  };

  if (params.customerId) {
    sessionParams.customer = params.customerId;
  } else if (params.customerEmail) {
    sessionParams.customer_email = params.customerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return {
    id: session.id,
    url: session.url ?? "",
    customerId: session.customer as string | undefined,
  };
}

/**
 * Retrieve a Checkout session.
 */
export async function getCheckoutSession(
  stripe: Stripe,
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription", "customer"],
  });
}
