/**
 * Dashboard Stats Routes (v1)
 *
 * Provides real-time statistics for the user dashboard.
 */

import { Hono } from "hono";
import { eq, and, count, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok } from "../../lib/response.js";
import { ensureUserHasOrganization } from "../../lib/ensure-organization.js";

const stats = new Hono<{ Bindings: Env }>();

// All routes require authentication (supports both API keys and session auth)
stats.use("/*", apiKeyAuthMiddleware());

/**
 * GET /stats/dashboard
 * Get dashboard statistics for current user
 */
stats.get("/dashboard", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });

  // Ensure user has an organization (fallback for failed signup hooks)
  // This creates a personal org with 14-day Pro trial if missing
  try {
    await ensureUserHasOrganization(db, user.id, user.email, user.name);
  } catch (error) {
    console.error("[Stats] Failed to ensure organization:", error);
    // Continue anyway - we'll handle missing org gracefully below
  }

  // Get user's organizations
  const memberships = await db
    .select({
      organizationId: schema.organizationMembers.organizationId,
      role: schema.organizationMembers.role,
    })
    .from(schema.organizationMembers)
    .where(eq(schema.organizationMembers.userId, user.id));

  const orgIds = memberships.map((m) => m.organizationId);

  // Get link stats for the user (only non-archived links)
  const linkStats = await db
    .select({
      totalLinks: count(),
      totalClicks: sql<number>`COALESCE(SUM(${schema.links.clickCount}), 0)`,
    })
    .from(schema.links)
    .where(and(eq(schema.links.userId, user.id), eq(schema.links.isArchived, false)));

  const totalLinks = linkStats[0]?.totalLinks ?? 0;
  const totalClicks = Number(linkStats[0]?.totalClicks) || 0;

  // Get active links count (not expired and not archived)
  const now = new Date().toISOString();
  const activeLinksResult = await db
    .select({ count: count() })
    .from(schema.links)
    .where(
      and(
        eq(schema.links.userId, user.id),
        eq(schema.links.isArchived, false),
        sql`(${schema.links.expiresAt} IS NULL OR ${schema.links.expiresAt} > ${now})`
      )
    );
  const activeLinks = activeLinksResult[0]?.count ?? 0;

  // Get custom domains count
  const domainsResult = await db
    .select({ count: count() })
    .from(schema.domains)
    .where(eq(schema.domains.userId, user.id));
  const customDomains = domainsResult[0]?.count ?? 0;

  // Get user's link IDs for clicks table queries
  const userLinks = await db
    .select({ id: schema.links.id })
    .from(schema.links)
    .where(eq(schema.links.userId, user.id));

  const linkIds = userLinks.map((l) => l.id);
  let clicksToday = 0;
  let clicksTrend = 0;

  if (linkIds.length > 0) {
    const linkIdsStr = linkIds.map((id) => `'${id}'`).join(",");

    // Get today's clicks from clicks table
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const clicksTodayResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.clicks)
      .where(
        sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${todayIso}`
      );

    clicksToday = Number(clicksTodayResult[0]?.count) || 0;

    // Get yesterday's clicks for trend calculation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const yesterdayIso = yesterday.toISOString();

    const clicksYesterdayResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.clicks)
      .where(
        sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${yesterdayIso} AND ${schema.clicks.timestamp} < ${todayIso}`
      );

    const clicksYesterday = Number(clicksYesterdayResult[0]?.count) || 0;

    // Calculate trend percentage
    if (clicksYesterday > 0) {
      clicksTrend = Math.round(((clicksToday - clicksYesterday) / clicksYesterday) * 100);
    } else if (clicksToday > 0) {
      clicksTrend = 100; // 100% increase from 0
    }
  }

  // Get organization count
  const organizationCount = memberships.length;

  // Get team members count across all orgs
  let teamMemberCount = 0;
  if (orgIds.length > 0) {
    const teamMembers = await db
      .select({ count: count() })
      .from(schema.organizationMembers)
      .where(inArray(schema.organizationMembers.organizationId, orgIds));
    teamMemberCount = teamMembers[0]?.count ?? 0;
  }

  // Get active subscription info
  let activeSubscriptionPlan = "free"; // Lowercase for consistent PlanId
  let activeSubscriptionDisplay = "Free"; // Display name
  let subscriptionStatus = "active";
  let trialEndsAt: string | null = null;
  if (orgIds.length > 0) {
    const subscriptions = await db
      .select({
        plan: schema.subscriptions.plan,
        status: schema.subscriptions.status,
        currentPeriodEnd: schema.subscriptions.currentPeriodEnd,
      })
      .from(schema.subscriptions)
      .where(
        and(
          inArray(schema.subscriptions.organizationId, orgIds),
          sql`(${schema.subscriptions.status} = 'active' OR ${schema.subscriptions.status} = 'trialing')`
        )
      )
      .limit(1);

    if (subscriptions.length > 0) {
      const sub = subscriptions[0];
      activeSubscriptionPlan = sub.plan; // Keep lowercase
      activeSubscriptionDisplay = sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1);
      subscriptionStatus = sub.status;
      // For trials, the currentPeriodEnd is the trial end date
      if (sub.status === "trialing" && sub.currentPeriodEnd) {
        trialEndsAt = sub.currentPeriodEnd;
      }
    }
  }

  // Get API key count
  let apiKeyCount = 0;
  if (orgIds.length > 0) {
    const apiKeys = await db
      .select({ count: count() })
      .from(schema.apiKeys)
      .where(inArray(schema.apiKeys.organizationId, orgIds));
    apiKeyCount = apiKeys[0]?.count ?? 0;
  }

  // Get pending invitations count
  let pendingInvitations = 0;
  if (orgIds.length > 0) {
    const invitations = await db
      .select({ count: count() })
      .from(schema.invitations)
      .where(
        and(
          inArray(schema.invitations.organizationId, orgIds),
          eq(schema.invitations.status, "pending")
        )
      );
    pendingInvitations = invitations[0]?.count ?? 0;
  }

  // Build recent activity (simulated from recent data)
  const recentActivity: Array<{
    id: string;
    action: string;
    timestamp: string;
    type: string;
  }> = [];

  // Get recent invitations as activity
  if (orgIds.length > 0) {
    const recentInvites = await db
      .select({
        id: schema.invitations.id,
        email: schema.invitations.email,
        createdAt: schema.invitations.createdAt,
        status: schema.invitations.status,
      })
      .from(schema.invitations)
      .where(inArray(schema.invitations.organizationId, orgIds))
      .orderBy(sql`${schema.invitations.createdAt} DESC`)
      .limit(3);

    for (const invite of recentInvites) {
      recentActivity.push({
        id: invite.id,
        action: `Invited ${invite.email}`,
        timestamp: invite.createdAt,
        type: "invitation",
      });
    }
  }

  // Add user's own signup as activity
  const userProfile = await db
    .select({ createdAt: schema.users.createdAt })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .limit(1);

  if (userProfile.length > 0) {
    recentActivity.push({
      id: "signup",
      action: "Signed up",
      timestamp: userProfile[0].createdAt,
      type: "auth",
    });
  }

  // Sort activity by timestamp
  recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return ok(c, {
    // Link stats for dashboard cards
    totalLinks,
    totalClicks,
    activeLinks,
    customDomains,
    clicksToday,
    clicksTrend,
    // Organization/team stats
    teamMembers: teamMemberCount,
    organizations: organizationCount,
    subscription: {
      plan: activeSubscriptionPlan,
      displayName: activeSubscriptionDisplay,
      status: subscriptionStatus,
      trialEndsAt,
    },
    apiKeys: apiKeyCount,
    pendingInvitations,
    recentActivity: recentActivity.slice(0, 5),
  });
});

/**
 * GET /stats/links
 * Get link-specific statistics for the links page
 */
stats.get("/links", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });

  // Get link stats for the user (only active/non-archived links)
  const linkStats = await db
    .select({
      totalLinks: count(),
      totalClicks: sql<number>`COALESCE(SUM(${schema.links.clickCount}), 0)`,
    })
    .from(schema.links)
    .where(and(eq(schema.links.userId, user.id), eq(schema.links.isArchived, false)));

  const totalLinks = linkStats[0]?.totalLinks ?? 0;
  const totalClicks = Number(linkStats[0]?.totalClicks) || 0;

  // Get user's link IDs for clicks table queries
  const userLinks = await db
    .select({ id: schema.links.id })
    .from(schema.links)
    .where(eq(schema.links.userId, user.id));

  const linkIds = userLinks.map((l) => l.id);
  let clicksToday = 0;
  let topCountry: string | null = null;

  if (linkIds.length > 0) {
    const linkIdsStr = linkIds.map((id) => `'${id}'`).join(",");

    // Get clicks today from the clicks table
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    const clicksTodayResult = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(schema.clicks)
      .where(
        sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${todayIso}`
      );

    clicksToday = Number(clicksTodayResult[0]?.count) || 0;

    // Get top country from clicks table (last 30 days for relevance)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

    const topCountryResult = await db
      .select({
        country: schema.clicks.country,
        count: sql<number>`COUNT(*)`,
      })
      .from(schema.clicks)
      .where(
        sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${thirtyDaysAgoIso} AND ${schema.clicks.country} IS NOT NULL`
      )
      .groupBy(schema.clicks.country)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(1);

    topCountry = topCountryResult[0]?.country ?? null;
  }

  return ok(c, {
    totalLinks,
    totalClicks,
    clicksToday,
    topCountry,
  });
});

/**
 * GET /stats/organization/:orgId
 * Get statistics for a specific organization
 */
stats.get("/organization/:orgId", async (c) => {
  const user = c.get("user");
  const orgId = c.req.param("orgId");
  const db = drizzle(c.env.DB, { schema });

  // Check membership
  const [membership] = await db
    .select()
    .from(schema.organizationMembers)
    .where(
      and(
        eq(schema.organizationMembers.organizationId, orgId),
        eq(schema.organizationMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!membership) {
    return c.json({ success: false, error: { code: "FORBIDDEN", message: "Not a member" } }, 403);
  }

  // Get member count
  const memberCount = await db
    .select({ count: count() })
    .from(schema.organizationMembers)
    .where(eq(schema.organizationMembers.organizationId, orgId));

  // Get subscription (check for both active and trialing)
  const [subscription] = await db
    .select()
    .from(schema.subscriptions)
    .where(
      and(
        eq(schema.subscriptions.organizationId, orgId),
        sql`(${schema.subscriptions.status} = 'active' OR ${schema.subscriptions.status} = 'trialing')`
      )
    )
    .limit(1);

  // Get API key count
  const apiKeyCount = await db
    .select({ count: count() })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.organizationId, orgId));

  // Get pending invitations
  const invitationCount = await db
    .select({ count: count() })
    .from(schema.invitations)
    .where(
      and(eq(schema.invitations.organizationId, orgId), eq(schema.invitations.status, "pending"))
    );

  return ok(c, {
    members: memberCount[0]?.count ?? 0,
    subscription: subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }
      : { plan: "free", status: "active" },
    apiKeys: apiKeyCount[0]?.count ?? 0,
    pendingInvitations: invitationCount[0]?.count ?? 0,
  });
});

export { stats };
