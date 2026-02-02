/**
 * Feature Gating Utilities
 *
 * Centralized utilities for checking feature access based on subscription plan.
 * Used by components and pages to determine what users can access.
 */

import { planLimits, type PlanId } from "@repo/config";

/**
 * Features that can be gated by plan
 */
export type Feature =
  | "bioPages"
  | "customDomains"
  | "geoTargeting"
  | "deviceTargeting"
  | "abTesting"
  | "teamMembers"
  | "webhooks"
  | "pixelTracking"
  | "apiAccess"
  | "realTimeAnalytics"
  | "conversionTracking"
  | "folders"
  | "passwordProtection"
  | "linkExpiration"
  | "linkCloaking"
  | "deepLinks"
  | "tags";

/**
 * Feature metadata for display in locked states
 */
export interface FeatureInfo {
  name: string;
  description: string;
  requiredPlan: PlanId;
  benefits: string[];
}

/**
 * Map of features to their metadata
 */
export const featureInfo: Record<Feature, FeatureInfo> = {
  bioPages: {
    name: "Link in Bio",
    description: "Create beautiful bio pages to share with your audience",
    requiredPlan: "pro",
    benefits: [
      "Customizable bio page design",
      "Add unlimited links to your page",
      "Track clicks and engagement",
      "Custom themes and styling",
    ],
  },
  customDomains: {
    name: "Custom Domains",
    description: "Use your own branded domain for short links",
    requiredPlan: "free", // Available on all plans, different limits
    benefits: ["Build brand recognition", "Increase link trust", "Professional appearance"],
  },
  geoTargeting: {
    name: "Geo Targeting",
    description: "Redirect users based on their location",
    requiredPlan: "pro",
    benefits: [
      "Target specific countries",
      "Localized landing pages",
      "Regional marketing campaigns",
    ],
  },
  deviceTargeting: {
    name: "Device Targeting",
    description: "Redirect users based on their device type",
    requiredPlan: "pro",
    benefits: ["iOS vs Android redirects", "Mobile vs desktop experiences", "App store deep links"],
  },
  abTesting: {
    name: "A/B Testing",
    description: "Test different destinations to optimize conversions",
    requiredPlan: "business",
    benefits: [
      "Split traffic between variants",
      "Track conversion rates",
      "Data-driven optimization",
    ],
  },
  teamMembers: {
    name: "Team Members",
    description: "Collaborate with your team on link management",
    requiredPlan: "business",
    benefits: [
      "Invite team members",
      "Role-based permissions",
      "Shared workspaces",
      "Activity logs",
    ],
  },
  webhooks: {
    name: "Webhooks",
    description: "Receive real-time notifications for link events",
    requiredPlan: "pro",
    benefits: [
      "Real-time click notifications",
      "Integration with your apps",
      "Custom event handling",
    ],
  },
  pixelTracking: {
    name: "Pixel Tracking",
    description: "Add retargeting pixels to track conversions",
    requiredPlan: "pro",
    benefits: [
      "Facebook Pixel support",
      "Google Ads tracking",
      "TikTok, LinkedIn, and more",
      "Conversion attribution",
    ],
  },
  apiAccess: {
    name: "API Access",
    description: "Programmatic access to manage links",
    requiredPlan: "free", // Available on all plans, different rate limits
    benefits: ["Create links programmatically", "Integrate with your tools", "Automate workflows"],
  },
  realTimeAnalytics: {
    name: "Real-time Analytics",
    description: "View analytics data as it happens",
    requiredPlan: "business",
    benefits: ["Live click tracking", "Instant insights", "No data delay"],
  },
  conversionTracking: {
    name: "Conversion Tracking",
    description: "Track conversions and revenue from your links",
    requiredPlan: "business",
    benefits: ["Track purchases and signups", "Revenue attribution", "ROI measurement"],
  },
  folders: {
    name: "Link Folders",
    description: "Organize your links into folders for better management",
    requiredPlan: "pro",
    benefits: [
      "Organize links by project or campaign",
      "Quick filtering and search",
      "Better team collaboration",
      "Folder-level analytics",
    ],
  },
  passwordProtection: {
    name: "Password Protection",
    description: "Protect your links with a password",
    requiredPlan: "pro",
    benefits: [
      "Restrict access to sensitive links",
      "Share privately with password",
      "Control who can access content",
    ],
  },
  linkExpiration: {
    name: "Link Expiration",
    description: "Set links to expire after a certain time or date",
    requiredPlan: "pro",
    benefits: [
      "Time-limited campaigns",
      "Automatic link deactivation",
      "Custom expiration redirect",
    ],
  },
  linkCloaking: {
    name: "Link Cloaking",
    description: "Hide the destination URL in the browser address bar",
    requiredPlan: "pro",
    benefits: ["Keep destination URL hidden", "Maintain brand presence", "Prevent URL bypass"],
  },
  deepLinks: {
    name: "Deep Links",
    description: "Redirect users to specific pages in mobile apps",
    requiredPlan: "pro",
    benefits: [
      "iOS app deep linking",
      "Android app deep linking",
      "Smart app routing",
      "Fallback to web if app not installed",
    ],
  },
  tags: {
    name: "Link Tags",
    description: "Organize and categorize your links with tags",
    requiredPlan: "free", // Available on all plans, different limits
    benefits: ["Categorize links easily", "Filter by tags", "Campaign organization"],
  },
};

/**
 * Plan hierarchy for comparison
 */
const planHierarchy: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  business: 2,
  enterprise: 3,
};

/**
 * Check if a plan has access to a feature
 */
export function canAccessFeature(userPlan: PlanId, feature: Feature): boolean {
  const requiredPlan = featureInfo[feature].requiredPlan;
  return planHierarchy[userPlan] >= planHierarchy[requiredPlan];
}

/**
 * Get the minimum required plan for a feature
 */
export function getRequiredPlan(feature: Feature): PlanId {
  return featureInfo[feature].requiredPlan;
}

/**
 * Get the limit for a specific plan feature
 */
export function getFeatureLimit<K extends keyof (typeof planLimits)["free"]>(
  plan: PlanId,
  limitKey: K
): (typeof planLimits)["free"][K] {
  return planLimits[plan][limitKey] as (typeof planLimits)["free"][K];
}

/**
 * Check if user has reached a specific limit
 * Returns false for unlimited (-1) or null limits
 */
export function hasReachedLimit(
  plan: PlanId,
  limitKey: keyof (typeof planLimits)["free"],
  currentUsage: number
): boolean {
  const limit = planLimits[plan][limitKey];
  if (limit === null || limit === -1) return false; // Unlimited
  return currentUsage >= limit;
}

/**
 * Get the display name for a plan
 */
export function getPlanDisplayName(plan: PlanId): string {
  const names: Record<PlanId, string> = {
    free: "Free",
    pro: "Pro",
    business: "Business",
    enterprise: "Enterprise",
  };
  return names[plan];
}

/**
 * Get the upgrade target plan for a feature
 */
export function getUpgradePlan(feature: Feature): PlanId {
  return featureInfo[feature].requiredPlan;
}

/**
 * Check if a plan is higher than another
 */
export function isPlanHigher(plan1: PlanId, plan2: PlanId): boolean {
  return planHierarchy[plan1] > planHierarchy[plan2];
}

/**
 * Get all features available on a plan
 */
export function getAvailableFeatures(plan: PlanId): Feature[] {
  return (Object.keys(featureInfo) as Feature[]).filter((feature) =>
    canAccessFeature(plan, feature)
  );
}

/**
 * Get all features locked on a plan
 */
export function getLockedFeatures(plan: PlanId): Feature[] {
  return (Object.keys(featureInfo) as Feature[]).filter(
    (feature) => !canAccessFeature(plan, feature)
  );
}

export type { PlanId };
