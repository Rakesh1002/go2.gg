/**
 * Server-side Analytics (PostHog)
 *
 * Server-side tracking for events that happen in API routes.
 */

import { PostHog } from "posthog-node";
import type { AnalyticsEvent, EventProperties } from "./events.js";

export interface ServerAnalyticsConfig {
  apiKey: string;
  host?: string;
  flushAt?: number;
  flushInterval?: number;
}

let client: PostHog | null = null;

/**
 * Initialize server-side PostHog client.
 */
export function initServerAnalytics(config: ServerAnalyticsConfig): PostHog {
  client = new PostHog(config.apiKey, {
    host: config.host ?? "https://us.i.posthog.com",
    flushAt: config.flushAt ?? 20,
    flushInterval: config.flushInterval ?? 10000,
  });

  return client;
}

/**
 * Get the PostHog client.
 */
export function getAnalyticsClient(): PostHog {
  if (!client) {
    throw new Error("Server analytics not initialized. Call initServerAnalytics first.");
  }
  return client;
}

/**
 * Track a server-side event.
 */
export function trackServer<E extends AnalyticsEvent>(
  userId: string,
  event: E,
  properties?: E extends keyof EventProperties ? EventProperties[E] : Record<string, unknown>
): void {
  if (!client) {
    return;
  }

  client.capture({
    distinctId: userId,
    event,
    properties,
  });
}

/**
 * Identify a user server-side.
 */
export function identifyServer(
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    plan?: string;
    [key: string]: unknown;
  }
): void {
  if (!client) {
    return;
  }

  client.identify({
    distinctId: userId,
    properties,
  });
}

/**
 * Associate user with an organization.
 */
export function groupServer(
  userId: string,
  organizationId: string,
  properties?: Record<string, unknown>
): void {
  if (!client) {
    return;
  }

  client.groupIdentify({
    groupType: "organization",
    groupKey: organizationId,
    properties,
  });

  // Also associate the user with the group
  client.capture({
    distinctId: userId,
    event: "$groupidentify",
    properties: {
      $group_type: "organization",
      $group_key: organizationId,
    },
  });
}

/**
 * Check a feature flag server-side.
 */
export async function isFeatureEnabledServer(
  flagKey: string,
  userId: string,
  groups?: Record<string, string>
): Promise<boolean> {
  if (!client) {
    return false;
  }

  const result = await client.isFeatureEnabled(flagKey, userId, {
    groups: groups ?? {},
  });
  return result ?? false;
}

/**
 * Get all feature flags for a user.
 */
export async function getAllFeatureFlagsServer(
  userId: string,
  groups?: Record<string, string>
): Promise<Record<string, boolean | string>> {
  if (!client) {
    return {};
  }

  return client.getAllFlags(userId, {
    groups,
  });
}

/**
 * Flush pending events.
 * Call this before worker shutdown.
 */
export async function flushAnalytics(): Promise<void> {
  if (!client) {
    return;
  }

  await client.flush();
}

/**
 * Shutdown the client.
 */
export async function shutdownAnalytics(): Promise<void> {
  if (!client) {
    return;
  }

  await client.shutdown();
  client = null;
}
