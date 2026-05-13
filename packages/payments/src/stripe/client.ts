/**
 * Stripe Client
 */

import Stripe from "stripe";

export type StripeClient = Stripe;

export interface StripeConfig {
  secretKey: string;
  webhookSecret?: string;
  apiVersion?: string;
}

/**
 * Creates a Stripe client instance.
 */
export function createStripeClient(config: StripeConfig): StripeClient {
  return new Stripe(config.secretKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}
