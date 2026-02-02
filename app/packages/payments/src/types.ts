/**
 * Payment Types
 */

import { z } from "zod";

// -----------------------------------------------------------------------------
// Product & Price Types
// -----------------------------------------------------------------------------

export const planSchema = z.enum(["free", "starter", "pro", "enterprise"]);
export type Plan = z.infer<typeof planSchema>;

export const billingIntervalSchema = z.enum(["month", "year"]);
export type BillingInterval = z.infer<typeof billingIntervalSchema>;

export interface Product {
  id: string;
  name: string;
  description?: string;
  plan: Plan;
  features: string[];
}

export interface Price {
  id: string;
  productId: string;
  unitAmount: number;
  currency: string;
  interval: BillingInterval;
  intervalCount: number;
}

// -----------------------------------------------------------------------------
// Subscription Types
// -----------------------------------------------------------------------------

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

export interface Subscription {
  id: string;
  customerId: string;
  status: SubscriptionStatus;
  plan: Plan;
  priceId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
}

// -----------------------------------------------------------------------------
// Checkout Types
// -----------------------------------------------------------------------------

export interface CreateCheckoutParams {
  customerId?: string;
  customerEmail?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  trialDays?: number;
  allowPromotionCodes?: boolean;
}

export interface CheckoutSession {
  id: string;
  url: string;
  customerId?: string;
  subscriptionId?: string;
}

// -----------------------------------------------------------------------------
// Customer Portal Types
// -----------------------------------------------------------------------------

export interface CreatePortalParams {
  customerId: string;
  returnUrl: string;
}

export interface PortalSession {
  id: string;
  url: string;
}

// -----------------------------------------------------------------------------
// Entitlements
// -----------------------------------------------------------------------------

export interface Entitlements {
  plan: Plan;
  features: Record<string, boolean | number>;
  limits: {
    seats?: number;
    storage?: number;
    apiCalls?: number;
  };
}

export const planEntitlements: Record<Plan, Entitlements> = {
  free: {
    plan: "free",
    features: {
      basicFeatures: true,
      advancedFeatures: false,
      prioritySupport: false,
      sso: false,
      audit: false,
    },
    limits: {
      seats: 1,
      storage: 100, // MB
      apiCalls: 1000,
    },
  },
  starter: {
    plan: "starter",
    features: {
      basicFeatures: true,
      advancedFeatures: true,
      prioritySupport: false,
      sso: false,
      audit: false,
    },
    limits: {
      seats: 5,
      storage: 1000, // MB
      apiCalls: 10000,
    },
  },
  pro: {
    plan: "pro",
    features: {
      basicFeatures: true,
      advancedFeatures: true,
      prioritySupport: true,
      sso: false,
      audit: true,
    },
    limits: {
      seats: 20,
      storage: 10000, // MB
      apiCalls: 100000,
    },
  },
  enterprise: {
    plan: "enterprise",
    features: {
      basicFeatures: true,
      advancedFeatures: true,
      prioritySupport: true,
      sso: true,
      audit: true,
    },
    limits: {
      seats: undefined, // Unlimited
      storage: undefined, // Unlimited
      apiCalls: undefined, // Unlimited
    },
  },
};
