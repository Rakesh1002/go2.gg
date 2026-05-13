/**
 * ShipQuest License Configuration
 *
 * IMPORTANT: All license tiers include the COMPLETE codebase.
 * There is no feature gating based on license type.
 *
 * The license tiers differ only in:
 * - Usage rights (personal vs commercial/client projects)
 * - Team size (1 / 5 / unlimited developers)
 * - Support level (community / priority email / dedicated)
 *
 * This file provides license utilities for customers who want
 * to implement their own license-based gating in their products.
 */

export type LicenseType = "starter" | "professional" | "business";

export interface LicenseInfo {
  /** License tier */
  type: LicenseType;
  /** Display name */
  name: string;
  /** Customer email */
  email?: string;
  /** Purchase date */
  purchasedAt?: string;
  /** License key (for validation) */
  key?: string;
}

/**
 * License tier details
 */
export const licenseTiers: Record<
  LicenseType,
  {
    name: string;
    teamSize: string;
    clientProjects: boolean;
    support: string;
  }
> = {
  starter: {
    name: "Starter",
    teamSize: "1 developer",
    clientProjects: false,
    support: "Community Discord",
  },
  professional: {
    name: "Professional",
    teamSize: "Up to 5 developers",
    clientProjects: true,
    support: "Priority email (48h)",
  },
  business: {
    name: "Business",
    teamSize: "Unlimited",
    clientProjects: true,
    support: "Dedicated Slack channel",
  },
};

/**
 * Get license info from environment
 * Customers can set these in their .env to track their license
 */
export function getLicenseInfo(): LicenseInfo | null {
  const licenseKey = process.env.SHIPQUEST_LICENSE_KEY;
  const licenseType = process.env.SHIPQUEST_LICENSE as LicenseType;

  if (!licenseType) {
    return null;
  }

  return {
    type: licenseType,
    name: licenseTiers[licenseType]?.name ?? licenseType,
    key: licenseKey,
  };
}

/**
 * Check if a valid license is configured
 */
export function hasLicense(): boolean {
  return getLicenseInfo() !== null;
}

/**
 * ============================================
 * CUSTOMER LICENSE SYSTEM (for your SaaS)
 * ============================================
 *
 * The code below is for YOU to use if you want to
 * build a license-based product (like ShipQuest itself).
 *
 * This is NOT used to gate ShipQuest features.
 */

/**
 * Example: Create a license key
 * You would use this in your purchase webhook
 */
export function generateLicenseKey(data: {
  email: string;
  tier: string;
  purchaseId: string;
}): string {
  // Simple example - in production, use proper cryptographic signing
  const payload = Buffer.from(
    JSON.stringify({
      ...data,
      issuedAt: new Date().toISOString(),
    })
  ).toString("base64");

  return `SQ_${payload}`;
}

/**
 * Example: Validate a license key
 */
export function validateLicenseKey(key: string): {
  valid: boolean;
  data?: { email: string; tier: string; purchaseId: string };
  error?: string;
} {
  if (!key.startsWith("SQ_")) {
    return { valid: false, error: "Invalid license key format" };
  }

  try {
    const payload = key.slice(3);
    const data = JSON.parse(Buffer.from(payload, "base64").toString());
    return { valid: true, data };
  } catch {
    return { valid: false, error: "Could not decode license key" };
  }
}

/**
 * Backward compatibility exports
 * These are kept for existing code that might reference them
 */
export type { LicenseType as OldLicenseType };
export const isPremiumEnabled = () => true; // All features always enabled
export const hasFeature = () => true; // All features always enabled
export const requirePremium = () => {}; // No-op, everything is available
export const gatePremiumFeature = (_feature?: string) => {}; // No-op, everything is available

// Legacy type alias
export type PremiumFeature = string;

// Legacy error class (kept for compatibility but never thrown)
export class PremiumFeatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PremiumFeatureError";
  }
}
