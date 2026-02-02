/**
 * Ensure Organization Utility
 *
 * Fallback mechanism to ensure every user has a personal organization
 * and a 14-day Pro trial subscription. This catches any failures from
 * the auth hook during signup.
 */

import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@repo/db";

/**
 * Generate a URL-safe slug from a string
 *
 * Industry standard approach (like Supabase, Vercel, Linear):
 * - Use human-readable prefix from email/name
 * - Add short random suffix for uniqueness
 * - Users can change the slug later to something cleaner like "acme-inc"
 */
function generateSlug(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/@.*$/, "") // Remove email domain
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, "") // Remove leading/trailing dashes
    .substring(0, 20); // Limit length (shorter for cleaner URLs)

  // Add short random suffix to ensure uniqueness (4 chars is enough for personal workspaces)
  const suffix = crypto.randomUUID().substring(0, 4);
  return `${base}-${suffix}`;
}

export interface EnsureOrgResult {
  organizationId: string;
  wasCreated: boolean;
  plan: string;
  status: string;
}

/**
 * Ensure a user has a personal organization with a Pro trial subscription.
 * If the user already has an organization, returns the existing one.
 * If not, creates a new personal organization with 14-day Pro trial.
 *
 * This is a fallback mechanism for when the auth hook fails.
 */
export async function ensureUserHasOrganization(
  db: DrizzleD1Database<typeof schema>,
  userId: string,
  userEmail?: string,
  userName?: string
): Promise<EnsureOrgResult> {
  // Check if user already has an organization membership
  const existingMembership = await db.query.organizationMembers.findFirst({
    where: eq(schema.organizationMembers.userId, userId),
    with: {
      organization: {
        with: {
          subscriptions: true,
        },
      },
    },
  });

  if (existingMembership?.organization) {
    const subscription = existingMembership.organization.subscriptions?.[0];

    // If organization exists but has no subscription, create a 14-day Pro trial
    if (!subscription) {
      console.log(
        "[EnsureOrg] Organization exists but no subscription, creating trial:",
        existingMembership.organizationId
      );

      const now = new Date().toISOString();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      const trialEndStr = trialEnd.toISOString();

      try {
        const subscriptionId = crypto.randomUUID();
        const trialStripeId = `trial_${crypto.randomUUID()}`;
        await db.insert(schema.subscriptions).values({
          id: subscriptionId,
          organizationId: existingMembership.organizationId,
          stripeSubscriptionId: trialStripeId,
          stripePriceId: "trial_pro",
          plan: "pro",
          status: "trialing",
          currentPeriodStart: now,
          currentPeriodEnd: trialEndStr,
          createdAt: now,
          updatedAt: now,
        });

        console.log("[EnsureOrg] Created trial subscription for existing org:", {
          orgId: existingMembership.organizationId,
          trialEnd: trialEndStr,
        });

        return {
          organizationId: existingMembership.organizationId,
          wasCreated: false,
          plan: "pro",
          status: "trialing",
        };
      } catch (error) {
        console.error("[EnsureOrg] Failed to create trial subscription:", error);
        // Fall through to return free plan
      }
    }

    return {
      organizationId: existingMembership.organizationId,
      wasCreated: false,
      plan: subscription?.plan || "free",
      status: subscription?.status || "active",
    };
  }

  // User has no organization - create one
  console.log("[EnsureOrg] Creating personal workspace for orphaned user:", userId);

  const orgId = crypto.randomUUID();
  const displayName = userName || userEmail?.split("@")[0] || "User";
  const orgName = `${displayName}'s Workspace`;
  const orgSlug = generateSlug(userEmail || userId);
  const now = new Date().toISOString();

  // Calculate trial end date (14 days from now)
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);
  const trialEndStr = trialEnd.toISOString();

  try {
    // Create organization
    await db.insert(schema.organizations).values({
      id: orgId,
      name: orgName,
      slug: orgSlug,
      createdAt: now,
      updatedAt: now,
    });

    // Add user as owner
    const memberId = crypto.randomUUID();
    await db.insert(schema.organizationMembers).values({
      id: memberId,
      organizationId: orgId,
      userId: userId,
      role: "owner",
      createdAt: now,
      updatedAt: now,
    });

    // Create 14-day Pro trial subscription
    const subscriptionId = crypto.randomUUID();
    const trialStripeId = `trial_${crypto.randomUUID()}`;
    await db.insert(schema.subscriptions).values({
      id: subscriptionId,
      organizationId: orgId,
      stripeSubscriptionId: trialStripeId,
      stripePriceId: "trial_pro",
      plan: "pro",
      status: "trialing",
      currentPeriodStart: now,
      currentPeriodEnd: trialEndStr,
      createdAt: now,
      updatedAt: now,
    });

    console.log("[EnsureOrg] Personal workspace created successfully:", {
      userId,
      orgId,
      orgSlug,
      trialEnd: trialEndStr,
    });

    return {
      organizationId: orgId,
      wasCreated: true,
      plan: "pro",
      status: "trialing",
    };
  } catch (error) {
    console.error("[EnsureOrg] Failed to create personal workspace:", error);
    throw error;
  }
}

/**
 * Find all users without organizations (orphaned users).
 * Used by the cron job to detect and fix missing data.
 */
export async function findOrphanedUsers(
  db: DrizzleD1Database<typeof schema>
): Promise<Array<{ id: string; email: string; name: string | null }>> {
  // Get all users who don't have any organization membership
  const allUsers = await db.query.users.findMany({
    columns: {
      id: true,
      email: true,
      name: true,
    },
  });

  const allMemberships = await db.query.organizationMembers.findMany({
    columns: {
      userId: true,
    },
  });

  const usersWithOrg = new Set(allMemberships.map((m) => m.userId));

  return allUsers.filter((user) => !usersWithOrg.has(user.id));
}

/**
 * Fix all orphaned users by creating their personal organizations.
 * Returns the number of users fixed.
 */
export async function fixOrphanedUsers(
  db: DrizzleD1Database<typeof schema>
): Promise<{ fixed: number; errors: number }> {
  const orphanedUsers = await findOrphanedUsers(db);

  if (orphanedUsers.length === 0) {
    console.log("[EnsureOrg] No orphaned users found");
    return { fixed: 0, errors: 0 };
  }

  console.log(`[EnsureOrg] Found ${orphanedUsers.length} orphaned users`);

  let fixed = 0;
  let errors = 0;

  for (const user of orphanedUsers) {
    try {
      await ensureUserHasOrganization(db, user.id, user.email, user.name ?? undefined);
      fixed++;
    } catch (error) {
      console.error(`[EnsureOrg] Failed to fix user ${user.id}:`, error);
      errors++;
    }
  }

  console.log(`[EnsureOrg] Fixed ${fixed} users, ${errors} errors`);
  return { fixed, errors };
}
