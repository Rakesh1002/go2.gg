/**
 * @repo/analytics - Analytics & Feature Flags Package
 *
 * This package provides:
 * - PostHog client-side tracking
 * - PostHog server-side tracking
 * - Feature flag evaluation
 * - Typed event definitions
 *
 * Usage:
 * ```typescript
 * // Client-side
 * import { initAnalytics, track, identify } from "@repo/analytics/client";
 *
 * initAnalytics({ apiKey: "..." });
 * identify(userId, { email, name });
 * track("subscription_started", { plan: "pro" });
 *
 * // Server-side
 * import { initServerAnalytics, trackServer } from "@repo/analytics/server";
 *
 * initServerAnalytics({ apiKey: "..." });
 * trackServer(userId, "subscription_started", { plan: "pro" });
 * ```
 */

// Events
export {
  AuthEvents,
  OrgEvents,
  BillingEvents,
  FeatureEvents,
  PageEvents,
  type AuthEventProperties,
  type OrgEventProperties,
  type BillingEventProperties,
  type FeatureEventProperties,
  type AnalyticsEvent,
  type EventProperties,
} from "./events.js";

// Client exports
export {
  initAnalytics,
  identify,
  reset,
  track,
  trackPageView,
  setUserProperties,
  setOrganization,
  isFeatureEnabled,
  getFeatureFlagPayload,
  reloadFeatureFlags,
  posthog,
  type AnalyticsConfig,
} from "./client.js";

// Server exports
export {
  initServerAnalytics,
  getAnalyticsClient,
  trackServer,
  identifyServer,
  groupServer,
  isFeatureEnabledServer,
  getAllFeatureFlagsServer,
  flushAnalytics,
  shutdownAnalytics,
  type ServerAnalyticsConfig,
} from "./server.js";
