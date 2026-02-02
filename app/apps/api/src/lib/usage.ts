/**
 * Usage Tracking and Limit Enforcement
 *
 * Tracks organization usage and enforces plan limits.
 *
 * Model (like Dub.co):
 * - linksThisMonth: New links created this month
 * - trackedClicksThisMonth: Clicks tracked this month
 * - domains: Custom domains
 * - teamMembers: Team members (for Business+)
 */

import { eq, and, sql, gte } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@repo/db";
import { planLimits, type PlanId } from "@repo/config/pricing";

export interface OrgUsage {
  linksThisMonth: number;
  trackedClicksThisMonth: number;
  domains: number;
  teamMembers: number;
  plan: PlanId;
}

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
  upgradeRequired?: boolean;
}

/**
 * Get current usage for an organization
 */
export async function getOrgUsage(
  db: DrizzleD1Database<typeof schema>,
  userId: string,
  organizationId: string | null | undefined
): Promise<OrgUsage> {
  // Get the start of the current month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Query links created this month
  const monthlyLinksQuery = organizationId
    ? await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.links)
        .where(
          and(
            eq(schema.links.organizationId, organizationId),
            gte(schema.links.createdAt, monthStart)
          )
        )
    : await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.links)
        .where(and(eq(schema.links.userId, userId), gte(schema.links.createdAt, monthStart)));

  // Query tracked clicks this month
  // Sum of clickCount on links that received clicks this month
  // For more accurate tracking, we'd use Analytics Engine, but this is a good approximation
  const clicksQuery = organizationId
    ? await db
        .select({
          clicks: sql<number>`COALESCE(SUM(${schema.links.clickCount}), 0)`,
        })
        .from(schema.links)
        .where(
          and(
            eq(schema.links.organizationId, organizationId),
            gte(schema.links.lastClickedAt, monthStart)
          )
        )
    : await db
        .select({
          clicks: sql<number>`COALESCE(SUM(${schema.links.clickCount}), 0)`,
        })
        .from(schema.links)
        .where(and(eq(schema.links.userId, userId), gte(schema.links.lastClickedAt, monthStart)));

  // Query domains
  const domainsQuery = organizationId
    ? await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.domains)
        .where(eq(schema.domains.organizationId, organizationId))
    : await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.domains)
        .where(eq(schema.domains.userId, userId));

  // Query team members (organization only)
  let teamMembers = 1;
  if (organizationId) {
    const membersQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.organizationMembers)
      .where(eq(schema.organizationMembers.organizationId, organizationId));
    teamMembers = membersQuery[0]?.count ?? 1;
  }

  // Get organization plan (check for both active and trialing subscriptions)
  let plan: PlanId = "free";
  if (organizationId) {
    const subQuery = await db
      .select({
        plan: schema.subscriptions.plan,
        status: schema.subscriptions.status,
      })
      .from(schema.subscriptions)
      .where(
        and(
          eq(schema.subscriptions.organizationId, organizationId),
          sql`(${schema.subscriptions.status} = 'active' OR ${schema.subscriptions.status} = 'trialing')`
        )
      )
      .limit(1);
    if (subQuery[0]?.plan) {
      plan = subQuery[0].plan as PlanId;
    }
  }

  return {
    linksThisMonth: monthlyLinksQuery[0]?.count ?? 0,
    trackedClicksThisMonth: Number(clicksQuery[0]?.clicks) || 0,
    domains: domainsQuery[0]?.count ?? 0,
    teamMembers,
    plan,
  };
}

/**
 * Check if link creation is allowed
 */
export function checkLinkLimit(usage: OrgUsage): UsageCheckResult {
  const limits = planLimits[usage.plan];

  // Check monthly links limit
  if (usage.linksThisMonth >= limits.linksPerMonth) {
    return {
      allowed: false,
      reason: `You've reached your monthly limit of ${limits.linksPerMonth} links. Upgrade or wait until next month.`,
      limit: limits.linksPerMonth,
      current: usage.linksThisMonth,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

/**
 * Check if domain creation is allowed
 */
export function checkDomainLimit(usage: OrgUsage): UsageCheckResult {
  const limits = planLimits[usage.plan];

  if (usage.domains >= limits.domains) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${limits.domains} custom domains. Upgrade to add more.`,
      limit: limits.domains,
      current: usage.domains,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

/**
 * Check if team member can be added
 */
export function checkTeamMemberLimit(usage: OrgUsage): UsageCheckResult {
  const limits = planLimits[usage.plan];

  if (limits.teamMembers !== null && usage.teamMembers >= limits.teamMembers) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${limits.teamMembers} team members. Upgrade to invite more.`,
      limit: limits.teamMembers,
      current: usage.teamMembers,
      upgradeRequired: true,
    };
  }

  return { allowed: true };
}

/**
 * Get usage stats formatted for the dashboard
 */
export function getUsageStats(usage: OrgUsage) {
  const limits = planLimits[usage.plan];

  return {
    linksThisMonth: {
      current: usage.linksThisMonth,
      limit: limits.linksPerMonth,
      percentage: Math.min(100, (usage.linksThisMonth / limits.linksPerMonth) * 100),
    },
    trackedClicksThisMonth: {
      current: usage.trackedClicksThisMonth,
      limit: limits.trackedClicksPerMonth,
      percentage: Math.min(
        100,
        (usage.trackedClicksThisMonth / limits.trackedClicksPerMonth) * 100
      ),
    },
    domains: {
      current: usage.domains,
      limit: limits.domains,
      percentage: Math.min(100, (usage.domains / limits.domains) * 100),
    },
    teamMembers: {
      current: usage.teamMembers,
      limit: limits.teamMembers,
      percentage: Math.min(100, (usage.teamMembers / limits.teamMembers) * 100),
    },
    plan: usage.plan,
  };
}

// -----------------------------------------------------------------------------
// Usage Alerts
// -----------------------------------------------------------------------------

// Alert types match schema definition
export type UsageAlertType = "links" | "linksThisMonth" | "domains" | "teamMembers";
export type UsageAlertThreshold = 80 | 90 | 100;

const ALERT_THRESHOLDS: UsageAlertThreshold[] = [80, 90, 100];

interface UsageAlertCheck {
  type: UsageAlertType;
  current: number;
  limit: number;
  percentage: number;
  threshold: UsageAlertThreshold | null;
}

/**
 * Check which usage alerts should be sent
 */
export function checkUsageAlerts(usage: OrgUsage): UsageAlertCheck[] {
  const stats = getUsageStats(usage);
  const alerts: UsageAlertCheck[] = [];

  const checkAlert = (type: UsageAlertType, current: number, limit: number, percentage: number) => {
    // Find the highest threshold that's been crossed
    const crossedThreshold = ALERT_THRESHOLDS.filter((t) => percentage >= t).sort(
      (a, b) => b - a
    )[0];

    if (crossedThreshold) {
      alerts.push({
        type,
        current,
        limit,
        percentage,
        threshold: crossedThreshold,
      });
    }
  };

  // Use "linksThisMonth" for link alerts (matches schema)
  checkAlert(
    "linksThisMonth",
    stats.linksThisMonth.current,
    stats.linksThisMonth.limit,
    stats.linksThisMonth.percentage
  );
  // Use "links" type for click alerts (closest match in schema, tracked clicks are the main metric)
  checkAlert(
    "links",
    stats.trackedClicksThisMonth.current,
    stats.trackedClicksThisMonth.limit,
    stats.trackedClicksThisMonth.percentage
  );
  checkAlert("domains", stats.domains.current, stats.domains.limit, stats.domains.percentage);
  checkAlert(
    "teamMembers",
    stats.teamMembers.current,
    stats.teamMembers.limit,
    stats.teamMembers.percentage
  );

  return alerts;
}

/**
 * Check if alert has already been sent
 */
export async function hasAlertBeenSent(
  db: DrizzleD1Database<typeof schema>,
  organizationId: string,
  alertType: UsageAlertType,
  threshold: UsageAlertThreshold,
  periodStart?: string
): Promise<boolean> {
  const result = await db
    .select({ id: schema.usageAlerts.id })
    .from(schema.usageAlerts)
    .where(
      and(
        eq(schema.usageAlerts.organizationId, organizationId),
        eq(schema.usageAlerts.alertType, alertType),
        eq(schema.usageAlerts.threshold, threshold),
        periodStart
          ? eq(schema.usageAlerts.periodStart, periodStart)
          : sql`${schema.usageAlerts.periodStart} IS NULL`
      )
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Record that an alert has been sent
 */
export async function recordAlertSent(
  db: DrizzleD1Database<typeof schema>,
  organizationId: string,
  userId: string,
  alertType: UsageAlertType,
  threshold: UsageAlertThreshold,
  periodStart?: string
): Promise<void> {
  const now = new Date().toISOString();

  await db.insert(schema.usageAlerts).values({
    id: crypto.randomUUID(),
    organizationId,
    userId,
    alertType,
    threshold,
    sentAt: now,
    periodStart: periodStart ?? null,
  });
}

/**
 * Get the current month start for period tracking
 */
export function getCurrentMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
}

/**
 * Get plan name for display
 */
export function getPlanDisplayName(plan: PlanId): string {
  const names: Record<PlanId, string> = {
    free: "Free",
    pro: "Pro",
    business: "Business",
    enterprise: "Enterprise",
  };
  return names[plan] || "Free";
}
