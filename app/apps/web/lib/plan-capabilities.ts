/**
 * Plan Capabilities
 *
 * Granular feature access control based on subscription plan.
 * Following Dub.co's pattern for plan-based feature gating.
 *
 * This provides a simple, flat object of boolean capabilities
 * that can be used throughout the app to check feature access.
 */

import type { PlanId } from "@repo/config";

/**
 * Plan capabilities - what each plan can do
 */
export interface PlanCapabilities {
  // Link features (Pro+)
  canUsePasswordProtection: boolean;
  canUseLinkExpiration: boolean;
  canUseLinkCloaking: boolean;
  canUseGeoTargeting: boolean;
  canUseDeviceTargeting: boolean;
  canUseDeepLinks: boolean;

  // Organization features (Pro+)
  canAddFolder: boolean;
  canUseBioPages: boolean;
  canUsePixelTracking: boolean;
  canCreateWebhooks: boolean;

  // Business+ features
  canUseABTesting: boolean;
  canTrackConversions: boolean;
  canManageTeam: boolean;
  canUseRealTimeAnalytics: boolean;
  canManageFolderPermissions: boolean;

  // Enterprise features
  canExportAuditLogs: boolean;
  canUseSSO: boolean;
}

/**
 * Get the capabilities of a plan
 *
 * @param plan - The plan ID to check
 * @returns Object with boolean capabilities for the plan
 *
 * @example
 * const caps = getPlanCapabilities('pro');
 * if (caps.canUsePasswordProtection) {
 *   // Show password field
 * }
 */
export function getPlanCapabilities(plan: PlanId | string | undefined | null): PlanCapabilities {
  const p = plan ?? "free";

  return {
    // Pro+ features (available on pro, business, enterprise)
    canUsePasswordProtection: !["free"].includes(p),
    canUseLinkExpiration: !["free"].includes(p),
    canUseLinkCloaking: !["free"].includes(p),
    canUseGeoTargeting: !["free"].includes(p),
    canUseDeviceTargeting: !["free"].includes(p),
    canUseDeepLinks: !["free"].includes(p),
    canAddFolder: !["free"].includes(p),
    canUseBioPages: !["free"].includes(p),
    canUsePixelTracking: !["free"].includes(p),
    canCreateWebhooks: !["free"].includes(p),

    // Business+ features (available on business, enterprise)
    canUseABTesting: !["free", "pro"].includes(p),
    canTrackConversions: !["free", "pro"].includes(p),
    canManageTeam: !["free", "pro"].includes(p),
    canUseRealTimeAnalytics: !["free", "pro"].includes(p),
    canManageFolderPermissions: !["free", "pro"].includes(p),

    // Enterprise features
    canExportAuditLogs: ["enterprise"].includes(p),
    canUseSSO: ["enterprise"].includes(p),
  };
}

/**
 * Link feature constants for API validation
 * Features that require Pro plan
 */
export const PRO_LINK_FEATURES = [
  "password",
  "expiresAt",
  "expiredUrl",
  "rewrite", // link cloaking
  "ios",
  "android",
  "geo",
  "proxy", // custom previews
] as const;

/**
 * Features that require Business plan
 */
export const BUSINESS_LINK_FEATURES = [
  "testVariants", // A/B testing
  "trackConversion",
] as const;

/**
 * Check if a link feature requires upgrade
 *
 * @param feature - The feature to check
 * @param plan - The current plan
 * @returns Error message if upgrade required, null if allowed
 */
export function checkLinkFeatureAccess(
  feature: string,
  plan: PlanId | string | undefined | null
): string | null {
  const p = plan ?? "free";

  if (PRO_LINK_FEATURES.includes(feature as (typeof PRO_LINK_FEATURES)[number])) {
    if (p === "free") {
      return `${feature} requires a Pro plan or higher`;
    }
  }

  if (BUSINESS_LINK_FEATURES.includes(feature as (typeof BUSINESS_LINK_FEATURES)[number])) {
    if (["free", "pro"].includes(p)) {
      return `${feature} requires a Business plan or higher`;
    }
  }

  return null;
}

/**
 * Get upgrade message for a capability
 */
export function getUpgradeMessage(capability: keyof PlanCapabilities): string {
  const messages: Record<keyof PlanCapabilities, string> = {
    canUsePasswordProtection: "Upgrade to Pro to protect your links with passwords",
    canUseLinkExpiration: "Upgrade to Pro to set link expiration dates",
    canUseLinkCloaking: "Upgrade to Pro to cloak your destination URLs",
    canUseGeoTargeting: "Upgrade to Pro to redirect users based on location",
    canUseDeviceTargeting: "Upgrade to Pro to redirect users based on device type",
    canUseDeepLinks: "Upgrade to Pro to use mobile app deep links",
    canAddFolder: "Upgrade to Pro to organize links in folders",
    canUseBioPages: "Upgrade to Pro to create link-in-bio pages",
    canUsePixelTracking: "Upgrade to Pro to add retargeting pixels",
    canCreateWebhooks: "Upgrade to Pro to receive webhook notifications",
    canUseABTesting: "Upgrade to Business to run A/B tests on your links",
    canTrackConversions: "Upgrade to Business to track conversions",
    canManageTeam: "Upgrade to Business to invite team members",
    canUseRealTimeAnalytics: "Upgrade to Business for real-time analytics",
    canManageFolderPermissions: "Upgrade to Business to set folder permissions",
    canExportAuditLogs: "Contact sales for Enterprise audit log exports",
    canUseSSO: "Contact sales for Enterprise SSO/SAML",
  };
  return messages[capability];
}
