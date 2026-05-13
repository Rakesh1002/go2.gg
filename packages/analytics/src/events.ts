/**
 * Typed Event Definitions
 *
 * All analytics events are defined here for type safety.
 * This ensures consistent event naming and property structure.
 */

// -----------------------------------------------------------------------------
// Auth Events
// -----------------------------------------------------------------------------

export const AuthEvents = {
  SIGNED_UP: "user_signed_up",
  SIGNED_IN: "user_signed_in",
  SIGNED_OUT: "user_signed_out",
  PASSWORD_RESET_REQUESTED: "password_reset_requested",
  PASSWORD_RESET_COMPLETED: "password_reset_completed",
  EMAIL_VERIFIED: "email_verified",
} as const;

export interface AuthEventProperties {
  [AuthEvents.SIGNED_UP]: {
    method: "email" | "google" | "github";
    referrer?: string;
  };
  [AuthEvents.SIGNED_IN]: {
    method: "email" | "google" | "github" | "magic_link";
  };
  [AuthEvents.SIGNED_OUT]: Record<string, never>;
  [AuthEvents.PASSWORD_RESET_REQUESTED]: Record<string, never>;
  [AuthEvents.PASSWORD_RESET_COMPLETED]: Record<string, never>;
  [AuthEvents.EMAIL_VERIFIED]: Record<string, never>;
}

// -----------------------------------------------------------------------------
// Organization Events
// -----------------------------------------------------------------------------

export const OrgEvents = {
  CREATED: "organization_created",
  UPDATED: "organization_updated",
  DELETED: "organization_deleted",
  MEMBER_INVITED: "organization_member_invited",
  MEMBER_JOINED: "organization_member_joined",
  MEMBER_REMOVED: "organization_member_removed",
  MEMBER_ROLE_CHANGED: "organization_member_role_changed",
} as const;

export interface OrgEventProperties {
  [OrgEvents.CREATED]: {
    organizationId: string;
  };
  [OrgEvents.UPDATED]: {
    organizationId: string;
    fields: string[];
  };
  [OrgEvents.DELETED]: {
    organizationId: string;
  };
  [OrgEvents.MEMBER_INVITED]: {
    organizationId: string;
    role: string;
  };
  [OrgEvents.MEMBER_JOINED]: {
    organizationId: string;
    role: string;
  };
  [OrgEvents.MEMBER_REMOVED]: {
    organizationId: string;
  };
  [OrgEvents.MEMBER_ROLE_CHANGED]: {
    organizationId: string;
    oldRole: string;
    newRole: string;
  };
}

// -----------------------------------------------------------------------------
// Billing Events
// -----------------------------------------------------------------------------

export const BillingEvents = {
  SUBSCRIPTION_STARTED: "subscription_started",
  SUBSCRIPTION_UPGRADED: "subscription_upgraded",
  SUBSCRIPTION_DOWNGRADED: "subscription_downgraded",
  SUBSCRIPTION_CANCELED: "subscription_canceled",
  SUBSCRIPTION_RENEWED: "subscription_renewed",
  PAYMENT_SUCCEEDED: "payment_succeeded",
  PAYMENT_FAILED: "payment_failed",
  CHECKOUT_STARTED: "checkout_started",
  CHECKOUT_COMPLETED: "checkout_completed",
  CHECKOUT_ABANDONED: "checkout_abandoned",
} as const;

export interface BillingEventProperties {
  [BillingEvents.SUBSCRIPTION_STARTED]: {
    plan: string;
    interval: string;
    value: number;
  };
  [BillingEvents.SUBSCRIPTION_UPGRADED]: {
    fromPlan: string;
    toPlan: string;
    value: number;
  };
  [BillingEvents.SUBSCRIPTION_DOWNGRADED]: {
    fromPlan: string;
    toPlan: string;
  };
  [BillingEvents.SUBSCRIPTION_CANCELED]: {
    plan: string;
    reason?: string;
  };
  [BillingEvents.SUBSCRIPTION_RENEWED]: {
    plan: string;
    value: number;
  };
  [BillingEvents.PAYMENT_SUCCEEDED]: {
    amount: number;
    currency: string;
  };
  [BillingEvents.PAYMENT_FAILED]: {
    amount: number;
    currency: string;
    reason?: string;
  };
  [BillingEvents.CHECKOUT_STARTED]: {
    plan: string;
  };
  [BillingEvents.CHECKOUT_COMPLETED]: {
    plan: string;
    value: number;
  };
  [BillingEvents.CHECKOUT_ABANDONED]: {
    plan: string;
  };
}

// -----------------------------------------------------------------------------
// Feature Usage Events
// -----------------------------------------------------------------------------

export const FeatureEvents = {
  FEATURE_USED: "feature_used",
  FEATURE_LIMIT_REACHED: "feature_limit_reached",
  FEATURE_UPGRADE_PROMPTED: "feature_upgrade_prompted",
} as const;

export interface FeatureEventProperties {
  [FeatureEvents.FEATURE_USED]: {
    feature: string;
    count?: number;
  };
  [FeatureEvents.FEATURE_LIMIT_REACHED]: {
    feature: string;
    limit: number;
    current: number;
  };
  [FeatureEvents.FEATURE_UPGRADE_PROMPTED]: {
    feature: string;
    currentPlan: string;
    requiredPlan: string;
  };
}

// -----------------------------------------------------------------------------
// Page View Events
// -----------------------------------------------------------------------------

export const PageEvents = {
  PAGE_VIEWED: "$pageview",
  PAGE_LEFT: "$pageleave",
} as const;

// -----------------------------------------------------------------------------
// All Events Union
// -----------------------------------------------------------------------------

export type AnalyticsEvent =
  | keyof AuthEventProperties
  | keyof OrgEventProperties
  | keyof BillingEventProperties
  | keyof FeatureEventProperties
  | (typeof PageEvents)[keyof typeof PageEvents];

export type EventProperties = AuthEventProperties &
  OrgEventProperties &
  BillingEventProperties &
  FeatureEventProperties;
