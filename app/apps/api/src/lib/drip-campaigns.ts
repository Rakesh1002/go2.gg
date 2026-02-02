/**
 * Drip Campaign Service
 *
 * Handles lifecycle email automation for user onboarding,
 * activation, engagement, and upgrades.
 */

import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, and, lt, isNull, or, desc } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../bindings.js";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface DripCampaignConfig {
  id: string;
  name: string;
  trigger: DripTrigger;
  emails: DripEmailConfig[];
}

export interface DripEmailConfig {
  sequence: number;
  delayMinutes: number;
  templateName: string;
  subject: string;
  skipCondition?: SkipCondition;
}

export type DripTrigger =
  | "signup" // New user registration
  | "trial_start" // Started a trial
  | "inactive_7d" // 7 days of inactivity
  | "inactive_14d" // 14 days of inactivity
  | "upgrade_eligible"; // High usage on free plan

export interface SkipCondition {
  hasCreatedLink?: boolean;
  hasCustomDomain?: boolean;
  hasPaidPlan?: boolean;
  linksCreatedMin?: number;
}

export interface UserActivity {
  userId: string;
  email: string;
  name: string | null;
  createdAt: string;
  lastActivityAt: string | null;
  linksCreated: number;
  hasCustomDomain: boolean;
  plan: string;
}

// -----------------------------------------------------------------------------
// Default Campaign Configurations
// -----------------------------------------------------------------------------

export const DEFAULT_CAMPAIGNS: DripCampaignConfig[] = [
  {
    id: "onboarding",
    name: "New User Onboarding",
    trigger: "signup",
    emails: [
      {
        sequence: 1,
        delayMinutes: 0, // Immediately
        templateName: "drip-welcome",
        subject: "Welcome to Go2 - Let's get started!",
      },
      {
        sequence: 2,
        delayMinutes: 24 * 60, // 1 day
        templateName: "drip-first-link",
        subject: "Ready to create your first link?",
        skipCondition: { linksCreatedMin: 5 }, // Skip if already active
      },
      {
        sequence: 3,
        delayMinutes: 3 * 24 * 60, // 3 days
        templateName: "drip-features",
        subject: "3 features you might not know about",
      },
      {
        sequence: 4,
        delayMinutes: 7 * 24 * 60, // 7 days
        templateName: "drip-custom-domain",
        subject: "Why branded links get 34% more clicks",
        skipCondition: { hasCustomDomain: true },
      },
    ],
  },
  {
    id: "reengagement_7d",
    name: "7-Day Inactive Re-engagement",
    trigger: "inactive_7d",
    emails: [
      {
        sequence: 1,
        delayMinutes: 0,
        templateName: "drip-reengagement",
        subject: "Quick check-in - everything okay?",
        skipCondition: { hasPaidPlan: true }, // Don't bug paying customers
      },
    ],
  },
  {
    id: "reengagement_14d",
    name: "14-Day Inactive Re-engagement",
    trigger: "inactive_14d",
    emails: [
      {
        sequence: 1,
        delayMinutes: 0,
        templateName: "drip-reengagement",
        subject: "We miss you! Your links are waiting",
        skipCondition: { hasPaidPlan: true },
      },
    ],
  },
  {
    id: "upgrade_nudge",
    name: "Upgrade Eligible Users",
    trigger: "upgrade_eligible",
    emails: [
      {
        sequence: 1,
        delayMinutes: 0,
        templateName: "drip-upgrade",
        subject: "You're making great progress!",
        skipCondition: { hasPaidPlan: true },
      },
    ],
  },
];

// -----------------------------------------------------------------------------
// Campaign Processing
// -----------------------------------------------------------------------------

/**
 * Initialize default campaigns in database if not exists
 */
export async function initializeCampaigns(
  db: DrizzleD1Database<typeof schema>,
): Promise<void> {
  for (const campaign of DEFAULT_CAMPAIGNS) {
    // Check if campaign exists
    const existing = await db
      .select({ id: schema.dripCampaigns.id })
      .from(schema.dripCampaigns)
      .where(eq(schema.dripCampaigns.id, campaign.id))
      .get();

    if (existing) continue;

    // Create campaign
    await db.insert(schema.dripCampaigns).values({
      id: campaign.id,
      name: campaign.name,
      trigger: campaign.trigger,
      isActive: true,
    });

    // Create emails
    for (const email of campaign.emails) {
      await db.insert(schema.dripEmails).values({
        id: crypto.randomUUID(),
        campaignId: campaign.id,
        sequence: email.sequence,
        delayMinutes: email.delayMinutes,
        templateName: email.templateName,
        subject: email.subject,
        skipCondition: email.skipCondition
          ? JSON.stringify(email.skipCondition)
          : null,
        isActive: true,
      });
    }

    console.log(`[Drip] Initialized campaign: ${campaign.name}`);
  }
}

/**
 * Enroll a user in a campaign
 */
export async function enrollUserInCampaign(
  db: DrizzleD1Database<typeof schema>,
  userId: string,
  campaignId: string,
): Promise<boolean> {
  // Check if already enrolled
  const existing = await db
    .select({ id: schema.userDripState.id })
    .from(schema.userDripState)
    .where(
      and(
        eq(schema.userDripState.userId, userId),
        eq(schema.userDripState.campaignId, campaignId),
      ),
    )
    .get();

  if (existing) {
    console.log(`[Drip] User ${userId} already enrolled in ${campaignId}`);
    return false;
  }

  // Get first email in campaign
  const firstEmail = await db
    .select()
    .from(schema.dripEmails)
    .where(
      and(
        eq(schema.dripEmails.campaignId, campaignId),
        eq(schema.dripEmails.isActive, true),
      ),
    )
    .orderBy(schema.dripEmails.sequence)
    .limit(1)
    .get();

  if (!firstEmail) {
    console.error(`[Drip] No emails found for campaign ${campaignId}`);
    return false;
  }

  // Calculate next email time
  const now = new Date();
  const nextEmailAt = new Date(
    now.getTime() + firstEmail.delayMinutes * 60 * 1000,
  );

  // Create enrollment
  await db.insert(schema.userDripState).values({
    id: crypto.randomUUID(),
    userId,
    campaignId,
    status: "active",
    currentEmailId: firstEmail.id,
    nextEmailAt: nextEmailAt.toISOString(),
    emailsSent: 0,
  });

  console.log(`[Drip] Enrolled user ${userId} in campaign ${campaignId}`);
  return true;
}

/**
 * Get user activity data for drip decisions
 */
export async function getUserActivity(
  db: DrizzleD1Database<typeof schema>,
  userId: string,
): Promise<UserActivity | null> {
  const user = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get();

  if (!user) return null;

  // Get link count
  const linkCount = await db
    .select({ count: schema.links.id })
    .from(schema.links)
    .where(eq(schema.links.userId, userId))
    .all();

  // Get custom domains
  const domains = await db
    .select({ id: schema.domains.id })
    .from(schema.domains)
    .innerJoin(
      schema.organizationMembers,
      eq(
        schema.domains.organizationId,
        schema.organizationMembers.organizationId,
      ),
    )
    .where(eq(schema.organizationMembers.userId, userId))
    .limit(1)
    .get();

  // Get subscription
  const subscription = await db
    .select({ plan: schema.subscriptions.plan })
    .from(schema.subscriptions)
    .innerJoin(
      schema.organizationMembers,
      eq(
        schema.subscriptions.organizationId,
        schema.organizationMembers.organizationId,
      ),
    )
    .where(eq(schema.organizationMembers.userId, userId))
    .limit(1)
    .get();

  // Get last activity (most recent link creation or click)
  const lastLink = await db
    .select({ createdAt: schema.links.createdAt })
    .from(schema.links)
    .where(eq(schema.links.userId, userId))
    .orderBy(desc(schema.links.createdAt))
    .limit(1)
    .get();

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    lastActivityAt: lastLink?.createdAt || user.createdAt,
    linksCreated: linkCount.length,
    hasCustomDomain: !!domains,
    plan: subscription?.plan || "free",
  };
}

/**
 * Check if email should be skipped based on conditions
 */
export function shouldSkipEmail(
  skipCondition: string | null,
  activity: UserActivity,
): boolean {
  if (!skipCondition) return false;

  try {
    const condition: SkipCondition = JSON.parse(skipCondition);

    if (condition.hasCreatedLink && activity.linksCreated > 0) return true;
    if (condition.hasCustomDomain && activity.hasCustomDomain) return true;
    if (condition.hasPaidPlan && activity.plan !== "free") return true;
    if (
      condition.linksCreatedMin &&
      activity.linksCreated >= condition.linksCreatedMin
    )
      return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Process pending drip emails - called by cron
 */
export async function processDripEmails(
  db: DrizzleD1Database<typeof schema>,
  env: Env,
): Promise<{ sent: number; skipped: number; errors: number }> {
  const now = new Date().toISOString();
  const stats = { sent: 0, skipped: 0, errors: 0 };

  // Get all pending emails that are due
  const pendingStates = await db
    .select()
    .from(schema.userDripState)
    .where(
      and(
        eq(schema.userDripState.status, "active"),
        lt(schema.userDripState.nextEmailAt, now),
      ),
    )
    .limit(100); // Process in batches

  console.log(`[Drip] Processing ${pendingStates.length} pending emails`);

  for (const state of pendingStates) {
    try {
      // Get user activity
      const activity = await getUserActivity(db, state.userId);
      if (!activity) {
        console.error(`[Drip] User ${state.userId} not found`);
        stats.errors++;
        continue;
      }

      // Get current email
      const email = await db
        .select()
        .from(schema.dripEmails)
        .where(eq(schema.dripEmails.id, state.currentEmailId!))
        .get();

      if (!email) {
        console.error(`[Drip] Email ${state.currentEmailId} not found`);
        stats.errors++;
        continue;
      }

      // Check skip condition
      if (shouldSkipEmail(email.skipCondition, activity)) {
        console.log(
          `[Drip] Skipping email ${email.id} for user ${state.userId}`,
        );

        // Log skipped email
        await db.insert(schema.dripEmailLog).values({
          id: crypto.randomUUID(),
          userId: state.userId,
          campaignId: state.campaignId,
          emailId: email.id,
          status: "skipped",
        });

        stats.skipped++;
      } else {
        // Send the email
        if (env.BACKGROUND_QUEUE) {
          await env.BACKGROUND_QUEUE.send({
            type: "email:send",
            payload: {
              to: activity.email,
              template: email.templateName,
              subject: email.subject,
              data: {
                name: activity.name || "there",
                dashboardUrl: `${env.APP_URL}/dashboard`,
                billingUrl: `${env.APP_URL}/dashboard/billing`,
                domainsUrl: `${env.APP_URL}/dashboard/domains`,
                docsUrl: `${env.APP_URL}/docs`,
                linksCreated: activity.linksCreated,
                hasCustomDomain: activity.hasCustomDomain,
                currentPlan: activity.plan,
              },
              isMarketing: true, // Drip emails are marketing
            },
          });

          // Log sent email
          await db.insert(schema.dripEmailLog).values({
            id: crypto.randomUUID(),
            userId: state.userId,
            campaignId: state.campaignId,
            emailId: email.id,
            status: "sent",
          });

          console.log(`[Drip] Sent ${email.templateName} to ${activity.email}`);
          stats.sent++;
        }
      }

      // Get next email in sequence
      const nextEmail = await db
        .select()
        .from(schema.dripEmails)
        .where(
          and(
            eq(schema.dripEmails.campaignId, state.campaignId),
            eq(schema.dripEmails.isActive, true),
          ),
        )
        .orderBy(schema.dripEmails.sequence)
        .all();

      const currentIndex = nextEmail.findIndex((e) => e.id === email.id);
      const next = nextEmail[currentIndex + 1];

      if (next) {
        // Schedule next email
        const nextEmailAt = new Date(
          new Date().getTime() + next.delayMinutes * 60 * 1000,
        );

        await db
          .update(schema.userDripState)
          .set({
            currentEmailId: next.id,
            lastEmailSentAt: now,
            nextEmailAt: nextEmailAt.toISOString(),
            emailsSent: state.emailsSent + 1,
            updatedAt: now,
          })
          .where(eq(schema.userDripState.id, state.id));
      } else {
        // Campaign complete
        await db
          .update(schema.userDripState)
          .set({
            status: "completed",
            lastEmailSentAt: now,
            nextEmailAt: null,
            completedAt: now,
            emailsSent: state.emailsSent + 1,
            updatedAt: now,
          })
          .where(eq(schema.userDripState.id, state.id));

        console.log(
          `[Drip] Campaign ${state.campaignId} completed for user ${state.userId}`,
        );
      }
    } catch (error) {
      console.error(`[Drip] Error processing state ${state.id}:`, error);
      stats.errors++;
    }
  }

  return stats;
}

/**
 * Check for inactive users and enroll them in re-engagement campaigns
 */
export async function checkInactiveUsers(
  db: DrizzleD1Database<typeof schema>,
): Promise<{ enrolled7d: number; enrolled14d: number }> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const stats = { enrolled7d: 0, enrolled14d: 0 };

  // Find users inactive for 7 days (not already in campaign)
  const inactive7d = await db
    .select({
      userId: schema.users.id,
    })
    .from(schema.users)
    .leftJoin(
      schema.userDripState,
      and(
        eq(schema.userDripState.userId, schema.users.id),
        eq(schema.userDripState.campaignId, "reengagement_7d"),
      ),
    )
    .where(
      and(
        lt(schema.users.updatedAt, sevenDaysAgo.toISOString()),
        isNull(schema.userDripState.id),
      ),
    )
    .limit(50);

  for (const user of inactive7d) {
    const enrolled = await enrollUserInCampaign(
      db,
      user.userId,
      "reengagement_7d",
    );
    if (enrolled) stats.enrolled7d++;
  }

  // Find users inactive for 14 days
  const inactive14d = await db
    .select({
      userId: schema.users.id,
    })
    .from(schema.users)
    .leftJoin(
      schema.userDripState,
      and(
        eq(schema.userDripState.userId, schema.users.id),
        eq(schema.userDripState.campaignId, "reengagement_14d"),
      ),
    )
    .where(
      and(
        lt(schema.users.updatedAt, fourteenDaysAgo.toISOString()),
        isNull(schema.userDripState.id),
      ),
    )
    .limit(50);

  for (const user of inactive14d) {
    const enrolled = await enrollUserInCampaign(
      db,
      user.userId,
      "reengagement_14d",
    );
    if (enrolled) stats.enrolled14d++;
  }

  return stats;
}

/**
 * Check for users who should get upgrade nudges
 */
export async function checkUpgradeEligible(
  db: DrizzleD1Database<typeof schema>,
): Promise<number> {
  // Find free users with high link usage (>75%)
  // This is simplified - in production you'd check actual usage

  const eligibleUsers = await db
    .select({
      userId: schema.users.id,
    })
    .from(schema.users)
    .innerJoin(
      schema.organizationMembers,
      eq(schema.organizationMembers.userId, schema.users.id),
    )
    .innerJoin(
      schema.subscriptions,
      eq(
        schema.subscriptions.organizationId,
        schema.organizationMembers.organizationId,
      ),
    )
    .leftJoin(
      schema.userDripState,
      and(
        eq(schema.userDripState.userId, schema.users.id),
        eq(schema.userDripState.campaignId, "upgrade_nudge"),
      ),
    )
    .where(
      and(
        eq(schema.subscriptions.plan, "free"),
        isNull(schema.userDripState.id),
      ),
    )
    .limit(50);

  let enrolled = 0;
  for (const user of eligibleUsers) {
    // Get their link count
    const activity = await getUserActivity(db, user.userId);
    if (activity && activity.linksCreated >= 35) {
      // 70% of 50 free limit
      const success = await enrollUserInCampaign(
        db,
        user.userId,
        "upgrade_nudge",
      );
      if (success) enrolled++;
    }
  }

  return enrolled;
}
