"use client";

/**
 * Client-side Analytics (PostHog)
 *
 * Browser-based analytics with privacy-first defaults.
 */

import posthog from "posthog-js";
import type { AnalyticsEvent, EventProperties } from "./events.js";

export interface AnalyticsConfig {
  apiKey: string;
  apiHost?: string;
  debug?: boolean;
  respectDNT?: boolean;
  persistence?: "localStorage" | "sessionStorage" | "memory" | "cookie";
  autocapture?: boolean;
  capturePageview?: boolean;
}

let initialized = false;

/**
 * Initialize PostHog client.
 * Call this once at app startup.
 */
export function initAnalytics(config: AnalyticsConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  if (initialized) {
    return;
  }

  posthog.init(config.apiKey, {
    api_host: config.apiHost ?? "https://us.i.posthog.com",
    loaded: (posthog) => {
      if (config.debug) {
        posthog.debug();
      }
    },
    // Privacy-first defaults
    respect_dnt: config.respectDNT ?? true,
    persistence: config.persistence ?? "localStorage",
    autocapture: config.autocapture ?? false, // Disable autocapture by default
    capture_pageview: config.capturePageview ?? false, // Manual pageviews for SPA
    disable_session_recording: true, // Disable by default
    mask_all_text: false,
    mask_all_element_attributes: false,
  });

  initialized = true;
}

/**
 * Identify a user.
 */
export function identify(
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    plan?: string;
    organizationId?: string;
    [key: string]: unknown;
  }
): void {
  if (typeof window === "undefined" || !initialized) {
    return;
  }

  posthog.identify(userId, properties);
}

/**
 * Reset user identity (on logout).
 */
export function reset(): void {
  if (typeof window === "undefined" || !initialized) {
    return;
  }

  posthog.reset();
}

/**
 * Track an event.
 */
export function track<E extends AnalyticsEvent>(
  event: E,
  properties?: E extends keyof EventProperties ? EventProperties[E] : Record<string, unknown>
): void {
  if (typeof window === "undefined" || !initialized) {
    return;
  }

  posthog.capture(event, properties);
}

/**
 * Track a page view.
 */
export function trackPageView(path?: string): void {
  if (typeof window === "undefined" || !initialized) {
    return;
  }

  posthog.capture("$pageview", {
    $current_url: path ?? window.location.href,
  });
}

/**
 * Set user properties.
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (typeof window === "undefined" || !initialized) {
    return;
  }

  posthog.people.set(properties);
}

/**
 * Set organization/group.
 */
export function setOrganization(orgId: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !initialized) {
    return;
  }

  posthog.group("organization", orgId, properties);
}

// -----------------------------------------------------------------------------
// Feature Flags
// -----------------------------------------------------------------------------

/**
 * Check if a feature flag is enabled.
 */
export function isFeatureEnabled(flagKey: string): boolean {
  if (typeof window === "undefined" || !initialized) {
    return false;
  }

  return posthog.isFeatureEnabled(flagKey) ?? false;
}

/**
 * Get feature flag payload.
 */
export function getFeatureFlagPayload<T = unknown>(flagKey: string): T | undefined {
  if (typeof window === "undefined" || !initialized) {
    return undefined;
  }

  return posthog.getFeatureFlagPayload(flagKey) as T | undefined;
}

/**
 * Reload feature flags.
 */
export function reloadFeatureFlags(): void {
  if (typeof window === "undefined" || !initialized) {
    return;
  }

  posthog.reloadFeatureFlags();
}

// Re-export posthog for advanced usage
export { posthog };
