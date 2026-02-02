/**
 * Analytics Routes (v1)
 *
 * Provides link click analytics data:
 * - GET /analytics/overview - Summary stats
 * - GET /analytics/clicks - Clicks over time
 * - GET /analytics/geo - Geographic breakdown
 * - GET /analytics/devices - Device/browser breakdown
 * - GET /analytics/referrers - Traffic sources
 * - GET /analytics/top-links - Top performing links
 */

import { Hono } from "hono";
import { eq, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok } from "../../lib/response.js";

const analytics = new Hono<{ Bindings: Env }>();

// All routes require authentication (supports both API keys and session auth)
analytics.use("/*", apiKeyAuthMiddleware());

/**
 * GET /analytics/overview
 * Get summary analytics for user's links
 */
analytics.get("/overview", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });
  const period = c.req.query("period") || "30d";

  // Calculate date range
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  // Get user's link IDs
  const userLinks = await db
    .select({ id: schema.links.id })
    .from(schema.links)
    .where(eq(schema.links.userId, user.id));

  if (userLinks.length === 0) {
    return ok(c, {
      totalClicks: 0,
      uniqueVisitors: 0,
      topCountry: null,
      topDevice: null,
      clicksTrend: 0,
    });
  }

  const linkIds = userLinks.map((l) => l.id);
  const linkIdsStr = linkIds.map((id) => `'${id}'`).join(",");

  // Get total clicks in period
  const clicksResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${startDateStr}`
    );

  // Get unique visitors (by IP hash)
  const uniqueResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${schema.clicks.ipHash})` })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${startDateStr}`
    );

  // Get top country
  const topCountryResult = await db
    .select({
      country: schema.clicks.country,
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${startDateStr} AND ${schema.clicks.country} IS NOT NULL`
    )
    .groupBy(schema.clicks.country)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(1);

  // Get top device
  const topDeviceResult = await db
    .select({
      device: schema.clicks.device,
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${startDateStr} AND ${schema.clicks.device} IS NOT NULL`
    )
    .groupBy(schema.clicks.device)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(1);

  // Calculate trend (compare current period to previous period)
  const prevStartDate = new Date();
  prevStartDate.setDate(prevStartDate.getDate() - days * 2);
  const prevEndDate = startDate;

  const prevClicksResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${prevStartDate.toISOString()} AND ${schema.clicks.timestamp} < ${prevEndDate.toISOString()}`
    );

  const currentClicks = Number(clicksResult[0]?.count) || 0;
  const prevClicks = Number(prevClicksResult[0]?.count) || 0;
  const clicksTrend =
    prevClicks > 0 ? Math.round(((currentClicks - prevClicks) / prevClicks) * 100) : 0;

  return ok(c, {
    totalClicks: currentClicks,
    uniqueVisitors: Number(uniqueResult[0]?.count) || 0,
    topCountry: topCountryResult[0]?.country || null,
    topDevice: topDeviceResult[0]?.device || null,
    clicksTrend,
  });
});

/**
 * GET /analytics/clicks
 * Get clicks over time for charts
 */
analytics.get("/clicks", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });
  const period = c.req.query("period") || "30d";

  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get user's link IDs
  const userLinks = await db
    .select({ id: schema.links.id })
    .from(schema.links)
    .where(eq(schema.links.userId, user.id));

  if (userLinks.length === 0) {
    return ok(c, { data: [] });
  }

  const linkIds = userLinks.map((l) => l.id);
  const linkIdsStr = linkIds.map((id) => `'${id}'`).join(",");

  // Group by date
  const clicksByDate = await db
    .select({
      date: sql<string>`DATE(${schema.clicks.timestamp})`,
      clicks: sql<number>`COUNT(*)`,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${startDate.toISOString()}`
    )
    .groupBy(sql`DATE(${schema.clicks.timestamp})`)
    .orderBy(sql`DATE(${schema.clicks.timestamp})`);

  // Fill in missing dates with 0 clicks
  const data: { date: string; clicks: number }[] = [];
  const clicksMap = new Map(clicksByDate.map((r) => [r.date, Number(r.clicks)]));

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().split("T")[0];
    data.push({
      date: dateStr,
      clicks: clicksMap.get(dateStr) || 0,
    });
  }

  return ok(c, { data });
});

/**
 * GET /analytics/geo
 * Get geographic breakdown of clicks
 */
analytics.get("/geo", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });
  const period = c.req.query("period") || "30d";

  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get user's link IDs
  const userLinks = await db
    .select({ id: schema.links.id })
    .from(schema.links)
    .where(eq(schema.links.userId, user.id));

  if (userLinks.length === 0) {
    return ok(c, { data: [] });
  }

  const linkIds = userLinks.map((l) => l.id);
  const linkIdsStr = linkIds.map((id) => `'${id}'`).join(",");

  const geoData = await db
    .select({
      country: schema.clicks.country,
      clicks: sql<number>`COUNT(*)`,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${startDate.toISOString()} AND ${schema.clicks.country} IS NOT NULL`
    )
    .groupBy(schema.clicks.country)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  return ok(c, {
    data: geoData.map((r) => ({
      country: r.country,
      clicks: Number(r.clicks),
    })),
  });
});

/**
 * GET /analytics/devices
 * Get device and browser breakdown
 */
analytics.get("/devices", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });
  const period = c.req.query("period") || "30d";

  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get user's link IDs
  const userLinks = await db
    .select({ id: schema.links.id })
    .from(schema.links)
    .where(eq(schema.links.userId, user.id));

  if (userLinks.length === 0) {
    return ok(c, { devices: [], browsers: [] });
  }

  const linkIds = userLinks.map((l) => l.id);
  const linkIdsStr = linkIds.map((id) => `'${id}'`).join(",");

  // Device breakdown
  const deviceData = await db
    .select({
      device: schema.clicks.device,
      clicks: sql<number>`COUNT(*)`,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${startDate.toISOString()} AND ${schema.clicks.device} IS NOT NULL`
    )
    .groupBy(schema.clicks.device)
    .orderBy(desc(sql`COUNT(*)`));

  // Browser breakdown
  const browserData = await db
    .select({
      browser: schema.clicks.browser,
      clicks: sql<number>`COUNT(*)`,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${startDate.toISOString()} AND ${schema.clicks.browser} IS NOT NULL`
    )
    .groupBy(schema.clicks.browser)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(5);

  return ok(c, {
    devices: deviceData.map((r) => ({
      device: r.device,
      clicks: Number(r.clicks),
    })),
    browsers: browserData.map((r) => ({
      browser: r.browser,
      clicks: Number(r.clicks),
    })),
  });
});

/**
 * GET /analytics/referrers
 * Get traffic source breakdown
 */
analytics.get("/referrers", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });
  const period = c.req.query("period") || "30d";

  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get user's link IDs
  const userLinks = await db
    .select({ id: schema.links.id })
    .from(schema.links)
    .where(eq(schema.links.userId, user.id));

  if (userLinks.length === 0) {
    return ok(c, { data: [] });
  }

  const linkIds = userLinks.map((l) => l.id);
  const linkIdsStr = linkIds.map((id) => `'${id}'`).join(",");

  const referrerData = await db
    .select({
      referrer: sql<string>`COALESCE(${schema.clicks.referrerDomain}, 'Direct')`,
      clicks: sql<number>`COUNT(*)`,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${startDate.toISOString()}`
    )
    .groupBy(sql`COALESCE(${schema.clicks.referrerDomain}, 'Direct')`)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  return ok(c, {
    data: referrerData.map((r) => ({
      referrer: r.referrer,
      clicks: Number(r.clicks),
    })),
  });
});

/**
 * GET /analytics/top-links
 * Get top performing links
 */
analytics.get("/top-links", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });
  const period = c.req.query("period") || "30d";

  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get top links with click count in period
  const topLinks = await db
    .select({
      id: schema.links.id,
      slug: schema.links.slug,
      destinationUrl: schema.links.destinationUrl,
      title: schema.links.title,
      clicks: sql<number>`(
        SELECT COUNT(*) FROM clicks 
        WHERE clicks.link_id = ${schema.links.id} 
        AND clicks.timestamp >= ${startDate.toISOString()}
      )`,
    })
    .from(schema.links)
    .where(eq(schema.links.userId, user.id))
    .orderBy(
      desc(sql`(
      SELECT COUNT(*) FROM clicks 
      WHERE clicks.link_id = ${schema.links.id} 
      AND clicks.timestamp >= ${startDate.toISOString()}
    )`)
    )
    .limit(5);

  return ok(c, {
    data: topLinks.map((l) => ({
      id: l.id,
      slug: l.slug,
      destinationUrl: l.destinationUrl,
      title: l.title,
      clicks: Number(l.clicks),
    })),
  });
});

export { analytics as analyticsRouter };
