/**
 * Plan Capabilities for API
 *
 * Check if user's plan allows access to specific features.
 * Mirror of the web app's plan-capabilities.ts for API-side checks.
 */

import { type PlanId, planLimits } from "@repo/config/pricing";

const KNOWN_PLANS = new Set<string>(Object.keys(planLimits));

export function normalizePlan(plan: string | undefined | null): PlanId {
  if (!plan) return "free";
  if (plan === "starter") return "pro";
  if (KNOWN_PLANS.has(plan)) return plan as PlanId;
  return "free";
}

export interface PlanCapabilities {
  // Pro+ features
  canUsePasswordProtection: boolean;
  canUseLinkExpiration: boolean;
  canUseLinkCloaking: boolean;
  canUseGeoTargeting: boolean;
  canUseDeviceTargeting: boolean;
  canUseDeepLinks: boolean;
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
 */
export function getPlanCapabilities(plan: string | undefined | null): PlanCapabilities {
  const p = normalizePlan(plan);

  return {
    // Pro+ features
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

    // Business+ features
    canUseABTesting: !["free", "pro"].includes(p),
    canTrackConversions: !["free", "pro"].includes(p),
    canManageTeam: !["free", "pro"].includes(p),
    canUseRealTimeAnalytics: !["free", "pro"].includes(p),
    canManageFolderPermissions: !["free", "pro"].includes(p),

    // Scale/Enterprise features (mirrors billing entitlements: Scale gets
    // SSO + audit on top of everything in Business)
    canExportAuditLogs: ["scale", "enterprise"].includes(p),
    canUseSSO: ["scale", "enterprise"].includes(p),
  };
}

/**
 * Check if a feature requires plan upgrade
 */
export function checkFeatureAccess(
  plan: string | undefined | null,
  feature: keyof PlanCapabilities
): { allowed: boolean; requiredPlan?: string } {
  const capabilities = getPlanCapabilities(plan);

  if (capabilities[feature]) {
    return { allowed: true };
  }

  // Determine required plan
  const proFeatures: (keyof PlanCapabilities)[] = [
    "canUsePasswordProtection",
    "canUseLinkExpiration",
    "canUseLinkCloaking",
    "canUseGeoTargeting",
    "canUseDeviceTargeting",
    "canUseDeepLinks",
    "canAddFolder",
    "canUseBioPages",
    "canUsePixelTracking",
    "canCreateWebhooks",
  ];

  const businessFeatures: (keyof PlanCapabilities)[] = [
    "canUseABTesting",
    "canTrackConversions",
    "canManageTeam",
    "canUseRealTimeAnalytics",
    "canManageFolderPermissions",
  ];

  if (proFeatures.includes(feature)) {
    return { allowed: false, requiredPlan: "pro" };
  }

  if (businessFeatures.includes(feature)) {
    return { allowed: false, requiredPlan: "business" };
  }

  return { allowed: false, requiredPlan: "enterprise" };
}
