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

import * as schema from "@repo/db";
import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import type { Env } from "../../bindings.js";
import { checkFolderAccess } from "../../lib/folders.js";
import { forbidden, notFound, ok } from "../../lib/response.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";

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

  // Get total clicks in period
  const clicksResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.userId} = ${user.id} AND ${schema.clicks.timestamp} >= ${startDateStr}`
    );

  // Get unique visitors (by IP hash)
  const uniqueResult = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${schema.clicks.ipHash})` })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.userId} = ${user.id} AND ${schema.clicks.timestamp} >= ${startDateStr}`
    );

  // Get top country
  const topCountryResult = await db
    .select({
      country: schema.clicks.country,
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.userId} = ${user.id} AND ${schema.clicks.timestamp} >= ${startDateStr} AND ${schema.clicks.country} IS NOT NULL`
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
      sql`${schema.clicks.userId} = ${user.id} AND ${schema.clicks.timestamp} >= ${startDateStr} AND ${schema.clicks.device} IS NOT NULL`
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
      sql`${schema.clicks.userId} = ${user.id} AND ${schema.clicks.timestamp} >= ${prevStartDate.toISOString()} AND ${schema.clicks.timestamp} < ${prevEndDate.toISOString()}`
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
  const compare = c.req.query("compare") === "previous";

  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const previousStart = new Date();
  previousStart.setDate(previousStart.getDate() - days * 2);

  // Pull current and (optionally) previous period in parallel.
  const startIso = startDate.toISOString();
  const previousStartIso = previousStart.toISOString();

  const [currentRows, previousRows] = await Promise.all([
    db
      .select({
        date: sql<string>`DATE(${schema.clicks.timestamp})`,
        clicks: sql<number>`COUNT(*)`,
      })
      .from(schema.clicks)
      .where(
        sql`${schema.clicks.userId} = ${user.id} AND ${schema.clicks.timestamp} >= ${startIso}`
      )
      .groupBy(sql`DATE(${schema.clicks.timestamp})`)
      .orderBy(sql`DATE(${schema.clicks.timestamp})`),
    compare
      ? db
          .select({
            date: sql<string>`DATE(${schema.clicks.timestamp})`,
            clicks: sql<number>`COUNT(*)`,
          })
          .from(schema.clicks)
          .where(
            sql`${schema.clicks.userId} = ${user.id} AND ${schema.clicks.timestamp} >= ${previousStartIso} AND ${schema.clicks.timestamp} < ${startIso}`
          )
          .groupBy(sql`DATE(${schema.clicks.timestamp})`)
          .orderBy(sql`DATE(${schema.clicks.timestamp})`)
      : Promise.resolve([] as { date: string; clicks: number }[]),
  ]);

  // Fill in missing dates with 0 clicks. We expose `data` aligned to the
  // current window and (when compare=previous) `previous` aligned to the
  // matching offset day-by-day so the FE can plot both series with a
  // shared x-axis.
  const data: { date: string; clicks: number }[] = [];
  const previous: { date: string; clicks: number }[] = [];
  const currentMap = new Map(currentRows.map((r) => [r.date, Number(r.clicks)]));
  const previousMap = new Map(previousRows.map((r) => [r.date, Number(r.clicks)]));

  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().split("T")[0];
    data.push({ date: dateStr, clicks: currentMap.get(dateStr) || 0 });

    if (compare) {
      const pd = new Date();
      pd.setDate(pd.getDate() - (days - 1 - i) - days);
      const previousDateStr = pd.toISOString().split("T")[0];
      previous.push({
        date: dateStr, // align to current window for FE overlay
        clicks: previousMap.get(previousDateStr) || 0,
      });
    }
  }

  return ok(c, compare ? { data, previous } : { data });
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

  const geoData = await db
    .select({
      country: schema.clicks.country,
      clicks: sql<number>`COUNT(*)`,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.userId} = ${user.id} AND ${schema.clicks.timestamp} >= ${startDate.toISOString()} AND ${schema.clicks.country} IS NOT NULL`
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

  // Device breakdown
  const deviceData = await db
    .select({
      device: schema.clicks.device,
      clicks: sql<number>`COUNT(*)`,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.userId} = ${user.id} AND ${schema.clicks.timestamp} >= ${startDate.toISOString()} AND ${schema.clicks.device} IS NOT NULL`
    )
    .groupBy(schema.clicks.device)
    .orderBy(desc(sql`COUNT(*)`));

  // Browser breakdown — bumped to top 12 so the dashboard can render a
  // proper browser matrix instead of just a 5-row legend.
  const browserData = await db
    .select({
      browser: schema.clicks.browser,
      clicks: sql<number>`COUNT(*)`,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.userId} = ${user.id} AND ${schema.clicks.timestamp} >= ${startDate.toISOString()} AND ${schema.clicks.browser} IS NOT NULL`
    )
    .groupBy(schema.clicks.browser)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(12);

  // OS breakdown
  const osData = await db
    .select({
      os: schema.clicks.os,
      clicks: sql<number>`COUNT(*)`,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.userId} = ${user.id} AND ${schema.clicks.timestamp} >= ${startDate.toISOString()} AND ${schema.clicks.os} IS NOT NULL`
    )
    .groupBy(schema.clicks.os)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(12);

  // Browser × OS matrix — flat rows, FE can pivot.
  const matrix = await db
    .select({
      browser: schema.clicks.browser,
      os: schema.clicks.os,
      clicks: sql<number>`COUNT(*)`,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.userId} = ${user.id} AND ${schema.clicks.timestamp} >= ${startDate.toISOString()} AND ${schema.clicks.browser} IS NOT NULL AND ${schema.clicks.os} IS NOT NULL`
    )
    .groupBy(schema.clicks.browser, schema.clicks.os)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(50);

  return ok(c, {
    devices: deviceData.map((r) => ({
      device: r.device,
      clicks: Number(r.clicks),
    })),
    browsers: browserData.map((r) => ({
      browser: r.browser,
      clicks: Number(r.clicks),
    })),
    os: osData.map((r) => ({
      os: r.os,
      clicks: Number(r.clicks),
    })),
    matrix: matrix.map((r) => ({
      browser: r.browser,
      os: r.os,
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

  const referrerData = await db
    .select({
      referrer: sql<string>`COALESCE(${schema.clicks.referrerDomain}, 'Direct')`,
      clicks: sql<number>`COUNT(*)`,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.userId} = ${user.id} AND ${schema.clicks.timestamp} >= ${startDate.toISOString()}`
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

/**
 * GET /analytics/folders/:id
 * Folder-scoped analytics rollup. Aggregates over every link currently in
 * the folder, plus a breakdown of clicks per link.
 */
analytics.get("/folders/:id", async (c) => {
  const user = c.get("user");
  const folderId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });
  const period = c.req.query("period") || "30d";

  const folder = await db
    .select()
    .from(schema.folders)
    .where(eq(schema.folders.id, folderId))
    .limit(1);

  if (!folder[0]) return notFound(c, "Folder not found");

  const access = checkFolderAccess(folder[0], user, "read");
  if (!access.allowed) return forbidden(c, access.reason);

  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  const folderLinks = await db
    .select({ id: schema.links.id, slug: schema.links.slug, title: schema.links.title })
    .from(schema.links)
    .where(eq(schema.links.folderId, folderId));

  if (folderLinks.length === 0) {
    return ok(c, {
      folder: {
        id: folder[0].id,
        name: folder[0].name,
        color: folder[0].color,
        linkCount: 0,
      },
      totalClicks: 0,
      uniqueVisitors: 0,
      topCountry: null,
      topDevice: null,
      topLinks: [],
    });
  }

  const linkIds = folderLinks.map((l) => l.id);
  const linkIdsStr = linkIds.map((id) => `'${id}'`).join(",");

  const [clicksResult, uniqueResult, topCountryResult, topDeviceResult, topLinksResult] =
    await Promise.all([
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.clicks)
        .where(
          sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${startDateStr}`
        ),
      db
        .select({ count: sql<number>`COUNT(DISTINCT ${schema.clicks.ipHash})` })
        .from(schema.clicks)
        .where(
          sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${startDateStr}`
        ),
      db
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
        .limit(1),
      db
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
        .limit(1),
      db
        .select({
          linkId: schema.clicks.linkId,
          clicks: sql<number>`COUNT(*)`,
        })
        .from(schema.clicks)
        .where(
          sql`${schema.clicks.linkId} IN (${sql.raw(linkIdsStr)}) AND ${schema.clicks.timestamp} >= ${startDateStr}`
        )
        .groupBy(schema.clicks.linkId)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(10),
    ]);

  const linkLookup = new Map(folderLinks.map((l) => [l.id, l]));

  return ok(c, {
    folder: {
      id: folder[0].id,
      name: folder[0].name,
      color: folder[0].color,
      linkCount: folderLinks.length,
    },
    totalClicks: Number(clicksResult[0]?.count) || 0,
    uniqueVisitors: Number(uniqueResult[0]?.count) || 0,
    topCountry: topCountryResult[0]?.country || null,
    topDevice: topDeviceResult[0]?.device || null,
    topLinks: topLinksResult.map((row) => {
      const link = linkLookup.get(row.linkId);
      return {
        id: row.linkId,
        slug: link?.slug ?? null,
        title: link?.title ?? null,
        clicks: Number(row.clicks),
      };
    }),
  });
});

/**
 * GET /analytics/recent
 *
 * Returns the most recent click rows for the user, optionally filtered by
 * `since=<iso>` so the dashboard can poll for new events without re-fetching
 * the full window. Caps at 100 rows. Used by the live-clicks card.
 */
analytics.get("/recent", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });
  const since = c.req.query("since");
  const limitRaw = Number.parseInt(c.req.query("limit") || "50", 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

  const sinceFilter = since ? sql` AND ${schema.clicks.timestamp} > ${since}` : sql``;

  const rows = await db
    .select({
      id: schema.clicks.id,
      linkId: schema.clicks.linkId,
      slug: schema.clicks.slug,
      country: schema.clicks.country,
      city: schema.clicks.city,
      device: schema.clicks.device,
      browser: schema.clicks.browser,
      os: schema.clicks.os,
      referrer: schema.clicks.referrerDomain,
      isBot: schema.clicks.isBot,
      isUnique: schema.clicks.isUnique,
      agentId: schema.clicks.agentId,
      timestamp: schema.clicks.timestamp,
    })
    .from(schema.clicks)
    .where(sql`${schema.clicks.userId} = ${user.id}${sinceFilter}`)
    .orderBy(desc(schema.clicks.timestamp))
    .limit(limit);

  return ok(c, { data: rows });
});

export { analytics as analyticsRouter };
