/**
 * Public Link Routes (v1)
 *
 * Anonymous/guest link creation for the landing page demo.
 * These links are temporary and encourage signup for full features.
 *
 * - POST /public/links - Create a link without authentication
 *
 * Guest Link Tracking:
 * - Links are created with userId = null
 * - A claim token is stored in KV to track session
 * - Link ID is returned to frontend (stored in localStorage)
 * - After signup, user can claim links via /claim/by-ids or /claim/by-token
 */

import { zValidator } from "@hono/zod-validator";
import * as schema from "@repo/db";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../../bindings.js";
import { generateSingleAISlug } from "../../lib/ai-slug.js";
import { cachedLinkKey, serializeCachedLink } from "../../lib/cached-link.js";
import { badRequest, created } from "../../lib/response.js";
import {
  checkDestinationThreat,
  shouldBlockOnCreate,
  submitUrlScan,
} from "../../lib/safe-browsing.js";
import { generateSlug, isReservedSlug } from "../../lib/slug.js";
import { httpUrl } from "../../lib/url-schemas.js";
import { rateLimitMiddleware } from "../../middleware/rate-limit.js";
import { turnstileMiddleware } from "../../middleware/turnstile.js";

const publicLinks = new Hono<{ Bindings: Env }>();

// Validation schema for guest link creation (simpler than authenticated)
const createGuestLinkSchema = z.object({
  destinationUrl: httpUrl("Invalid URL"),
  claimToken: z.string().min(32).max(64).optional(), // Optional session token for claiming
});

/**
 * POST /public/links
 * Create a guest link without authentication
 *
 * Guest links:
 * - Have no owner (userId = null)
 * - Use default domain only
 * - Limited features (no custom slug, password, etc.)
 * - Expire after 24 hours
 * - Show "Sign up to claim this link" message
 */
publicLinks.post(
  "/",
  // Durable Object limiter: atomic, unlike the previous KV read-then-write
  // counter that concurrent requests raced straight past. Namespaced so it
  // doesn't share a window with the global /api/* limiter on the same IP.
  rateLimitMiddleware({
    limit: 10,
    window: 3600,
    keyGenerator: (c) =>
      `guest-links:${c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ?? "unknown"}`,
  }),
  // Anonymous creation is the path phishing campaigns spray; require a
  // Turnstile token (invisible widget on the landing-page demo). No-op when
  // TURNSTILE_SECRET_KEY is unset, so dev/self-host keep working.
  turnstileMiddleware(),
  zValidator("json", createGuestLinkSchema),
  async (c) => {
    const input = c.req.valid("json");
    const db = drizzle(c.env.DB, { schema });

    const domain = c.env.DEFAULT_DOMAIN ?? "go2.gg";

    // Destination threat pre-flight — same guard as the authenticated path,
    // applied here too because guest creation is the path that gets sprayed by
    // phishing campaigns (no auth = no friction).
    const threatVerdict = await checkDestinationThreat(c.env, input.destinationUrl);
    if (shouldBlockOnCreate(threatVerdict)) {
      return badRequest(c, "This destination is flagged as malicious. We can't shorten it.");
    }
    if (threatVerdict.status === "unknown") {
      c.executionCtx.waitUntil(submitUrlScan(c.env, input.destinationUrl));
    }

    // Generate AI-powered slug for memorable short URLs
    let slug: string;
    try {
      slug = await generateSingleAISlug(c.env, input.destinationUrl, 8);
    } catch {
      // Fall back to random slug if AI fails
      slug = generateSlug(6);
    }

    // Check if reserved (unlikely but safe)
    if (isReservedSlug(slug)) {
      slug = generateSlug(7);
    }

    // Ensure the slug is free. AI slugs are largely deterministic per-URL, so a
    // repeat destination (e.g. a popular domain) collides every time —
    // regenerate with a random slug instead of re-dispatching the request,
    // which consumed its body and 404'd against this sub-app's "/" route.
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await db
        .select({ id: schema.links.id })
        .from(schema.links)
        .where(and(eq(schema.links.domain, domain), eq(schema.links.slug, slug)))
        .limit(1);
      if (existing.length === 0) break;
      slug = generateSlug(7 + attempt);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Guest links expire in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const newLink = {
      id,
      userId: null, // Guest link - no owner
      organizationId: null,
      slug,
      destinationUrl: input.destinationUrl,
      domain,
      title: null,
      description: "Guest link - Sign up to claim!",
      expiresAt,
      isPublic: true,
      threatStatus: threatVerdict.status,
      threatVerdict: threatVerdict.verdict || null,
      threatLastChecked: threatVerdict.status === "unknown" ? null : now,
      createdAt: now,
      updatedAt: now,
    } satisfies schema.NewLink;

    await db.insert(schema.links).values(newLink);

    // Sync the full row shape to KV. The TTL matches the guest link's own 24h
    // expiry, so aging out of cache is correct here. Serializing the full row
    // carries threatStatus/createdAt, which the resolver's interstitial gates
    // read — the old partial entry made even clean guest links interstitial.
    const cachedLink = serializeCachedLink(newLink);
    await c.env.LINKS_KV.put(cachedLinkKey(cachedLink), JSON.stringify(cachedLink), {
      expirationTtl: 60 * 60 * 24,
    });

    // If claim token provided, associate this link with the token
    // This allows claiming links after signup via /claim/by-token
    if (input.claimToken) {
      const tokenKey = `claim_token:${input.claimToken}`;
      const existingLinks = (await c.env.KV_CONFIG.get(tokenKey, "json")) as string[] | null;
      const updatedLinks = existingLinks ? [...existingLinks, id] : [id];
      await c.env.KV_CONFIG.put(tokenKey, JSON.stringify(updatedLinks), {
        expirationTtl: 60 * 60 * 24 * 7, // 7 days to claim
      });
    }

    const shortUrl = `https://${domain}/${slug}`;

    return created(c, {
      id,
      shortUrl,
      destinationUrl: input.destinationUrl,
      slug,
      domain,
      expiresAt,
      isGuest: true,
      claimable: true,
      message: "Link created! Sign up to claim it and get analytics, custom slugs, and more.",
    });
  }
);

/**
 * GET /public/links/:id/stats
 * Lightweight analytics for guest / public-stats links. Read-only: no PII,
 * no IP hashes, just counts + the chart series the playground needs.
 *
 * Allowed when:
 *   - the link is a guest link (userId IS NULL — used by /agents/playground), OR
 *   - the link explicitly opted into publicStats=true
 */
publicLinks.get("/:id/stats", async (c) => {
  const id = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const link = await db
    .select({
      id: schema.links.id,
      domain: schema.links.domain,
      slug: schema.links.slug,
      destinationUrl: schema.links.destinationUrl,
      userId: schema.links.userId,
      publicStats: schema.links.publicStats,
      expiresAt: schema.links.expiresAt,
      clickCount: schema.links.clickCount,
      createdAt: schema.links.createdAt,
    })
    .from(schema.links)
    .where(eq(schema.links.id, id))
    .limit(1);

  if (!link[0]) {
    return badRequest(c, "Link not found");
  }
  // Guest links are public by design; otherwise the link must have opted in.
  if (link[0].userId !== null && !link[0].publicStats) {
    return badRequest(c, "Stats are not public for this link");
  }

  // 7-day window keeps the JSON small for a public endpoint.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  const { sql } = await import("drizzle-orm");

  const [todayRow, weekRow, byDateRows, byCountry] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.clicks)
      .where(
        sql`${schema.clicks.linkId} = ${id} AND ${schema.clicks.timestamp} >= ${todayUtc.toISOString()}`
      ),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.clicks)
      .where(
        sql`${schema.clicks.linkId} = ${id} AND ${schema.clicks.timestamp} >= ${sevenDaysAgo.toISOString()}`
      ),
    db
      .select({
        date: sql<string>`DATE(${schema.clicks.timestamp})`,
        clicks: sql<number>`COUNT(*)`,
      })
      .from(schema.clicks)
      .where(
        sql`${schema.clicks.linkId} = ${id} AND ${schema.clicks.timestamp} >= ${sevenDaysAgo.toISOString()}`
      )
      .groupBy(sql`DATE(${schema.clicks.timestamp})`)
      .orderBy(sql`DATE(${schema.clicks.timestamp})`),
    db
      .select({ country: schema.clicks.country, clicks: sql<number>`COUNT(*)` })
      .from(schema.clicks)
      .where(sql`${schema.clicks.linkId} = ${id} AND ${schema.clicks.country} IS NOT NULL`)
      .groupBy(schema.clicks.country)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(5),
  ]);

  // Fill missing dates so the chart has a continuous 7-day axis.
  const dateMap = new Map(byDateRows.map((r) => [r.date, Number(r.clicks)]));
  const clicksByDate: { date: string; clicks: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    clicksByDate.push({ date: dateStr, clicks: dateMap.get(dateStr) ?? 0 });
  }

  // Cache for 5s — playground polls every 5s, so we coalesce floods.
  c.header("Cache-Control", "public, max-age=5");

  return c.json({
    success: true,
    data: {
      id: link[0].id,
      shortUrl: `https://${link[0].domain}/${link[0].slug}`,
      destinationUrl: link[0].destinationUrl,
      totalClicks: link[0].clickCount ?? 0,
      clicksToday: Number(todayRow[0]?.count) || 0,
      clicksThisWeek: Number(weekRow[0]?.count) || 0,
      clicksByDate,
      topCountries: byCountry
        .filter((r) => r.country)
        .map((r) => ({ country: r.country as string, clicks: Number(r.clicks) })),
      isGuest: link[0].userId === null,
      expiresAt: link[0].expiresAt,
      createdAt: link[0].createdAt,
    },
  });
});

export { publicLinks };
