/**
 * Conversion Tracking Routes (v1)
 *
 * Handles conversion goals and tracking:
 * - GET /conversions/goals - List conversion goals
 * - POST /conversions/goals - Create conversion goal
 * - GET /conversions/goals/:id - Get conversion goal
 * - PATCH /conversions/goals/:id - Update conversion goal
 * - DELETE /conversions/goals/:id - Delete conversion goal
 * - POST /conversions/track - Track a conversion (server-side)
 * - GET /conversions/stats - Get conversion statistics
 * - GET /conversions/link/:linkId - Get conversions for a link
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok, created, noContent, notFound, forbidden, badRequest } from "../../lib/response.js";

const conversions = new Hono<{ Bindings: Env }>();

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const conversionGoalTypes = [
  "page_view",
  "signup",
  "purchase",
  "lead",
  "download",
  "custom",
] as const;

const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(conversionGoalTypes),
  urlPattern: z.string().max(500).optional(),
  eventName: z.string().max(100).optional(),
  attributionWindow: z.number().int().min(1).max(365).default(30),
  hasValue: z.boolean().default(false),
  defaultValue: z.number().int().min(0).optional(),
  currency: z.string().length(3).default("usd"),
});

const updateGoalSchema = createGoalSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const trackConversionSchema = z.object({
  // Identify the click/link
  linkId: z.string().uuid().optional(),
  clickId: z.string().uuid().optional(),
  // Or use tracking cookie
  trackingId: z.string().optional(),
  // Conversion details
  type: z.enum(conversionGoalTypes),
  eventName: z.string().max(100).optional(),
  goalId: z.string().uuid().optional(),
  // Value
  value: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  // External references
  externalId: z.string().max(200).optional(),
  customerId: z.string().max(200).optional(),
  // Metadata
  metadata: z.record(z.unknown()).optional(),
});

const statsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.enum(conversionGoalTypes).optional(),
  goalId: z.string().uuid().optional(),
});

// -----------------------------------------------------------------------------
// Public Routes (No Auth - for client-side tracking)
// -----------------------------------------------------------------------------

const publicConversions = new Hono<{ Bindings: Env }>();

/**
 * POST /conversions/track
 * Track a conversion event (can be called from client-side)
 */
publicConversions.post("/track", zValidator("json", trackConversionSchema), async (c) => {
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // We need either linkId, clickId, or trackingId
  if (!input.linkId && !input.clickId && !input.trackingId) {
    return badRequest(c, "Must provide linkId, clickId, or trackingId");
  }

  let linkId = input.linkId;
  let clickId = input.clickId;
  let clickData: {
    country?: string;
    device?: string;
    browser?: string;
    referrer?: string;
    timestamp?: string;
  } = {};

  // If trackingId provided, look up the click
  if (input.trackingId && !clickId) {
    // Tracking ID format: linkId:timestamp or just clickId
    const parts = input.trackingId.split(":");
    if (parts.length === 2) {
      linkId = parts[0];
    } else {
      // Assume it's a click ID
      const click = await db
        .select()
        .from(schema.clicks)
        .where(eq(schema.clicks.id, input.trackingId))
        .limit(1);

      if (click[0]) {
        clickId = click[0].id;
        linkId = click[0].linkId;
        clickData = {
          country: click[0].country ?? undefined,
          device: click[0].device ?? undefined,
          browser: click[0].browser ?? undefined,
          referrer: click[0].referrer ?? undefined,
          timestamp: click[0].timestamp,
        };
      }
    }
  }

  // If clickId provided, get click data
  if (clickId && !clickData.timestamp) {
    const click = await db
      .select()
      .from(schema.clicks)
      .where(eq(schema.clicks.id, clickId))
      .limit(1);

    if (click[0]) {
      linkId = click[0].linkId;
      clickData = {
        country: click[0].country ?? undefined,
        device: click[0].device ?? undefined,
        browser: click[0].browser ?? undefined,
        referrer: click[0].referrer ?? undefined,
        timestamp: click[0].timestamp,
      };
    }
  }

  if (!linkId) {
    return badRequest(c, "Could not identify the link for this conversion");
  }

  // Verify the link exists
  const link = await db
    .select({ id: schema.links.id, userId: schema.links.userId })
    .from(schema.links)
    .where(eq(schema.links.id, linkId))
    .limit(1);

  if (!link[0]) {
    return badRequest(c, "Link not found");
  }

  // Check attribution window if goal specified
  if (input.goalId) {
    const goal = await db
      .select()
      .from(schema.conversionGoals)
      .where(eq(schema.conversionGoals.id, input.goalId))
      .limit(1);

    if (goal[0]?.attributionWindow && clickData.timestamp) {
      const clickTime = new Date(clickData.timestamp);
      const windowEnd = new Date(clickTime);
      windowEnd.setDate(windowEnd.getDate() + goal[0].attributionWindow);

      if (new Date() > windowEnd) {
        return badRequest(c, "Conversion outside attribution window");
      }
    }
  }

  const conversionId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newConversion: schema.NewConversion = {
    id: conversionId,
    linkId,
    clickId,
    goalId: input.goalId,
    type: input.type,
    eventName: input.eventName,
    attributedAt: clickData.timestamp,
    convertedAt: now,
    value: input.value,
    currency: input.currency ?? "usd",
    externalId: input.externalId,
    customerId: input.customerId,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    country: clickData.country,
    device: clickData.device,
    browser: clickData.browser,
    referrer: clickData.referrer,
    createdAt: now,
  };

  await db.insert(schema.conversions).values(newConversion);

  return created(c, {
    id: conversionId,
    linkId,
    type: input.type,
    value: input.value,
    convertedAt: now,
  });
});

/**
 * GET /conversions/script.js
 * Return the client-side tracking script
 */
publicConversions.get("/script.js", (c) => {
  const appUrl = c.env.APP_URL ?? "https://go2.gg";

  const script = `
// Go2 Conversion Tracking Script
(function() {
  'use strict';

  var GO2_API = '${appUrl}/api/v1/conversions';
  var GO2_COOKIE = 'go2_tid';
  var GO2_CLICK_PARAM = 'go2_ref';

  // Get tracking ID from URL or cookie
  function getTrackingId() {
    var urlParams = new URLSearchParams(window.location.search);
    var urlTid = urlParams.get(GO2_CLICK_PARAM);

    if (urlTid) {
      // Store in cookie
      document.cookie = GO2_COOKIE + '=' + urlTid + ';max-age=' + (30 * 24 * 60 * 60) + ';path=/;SameSite=Lax';
      return urlTid;
    }

    // Check cookie
    var match = document.cookie.match(new RegExp('(^| )' + GO2_COOKIE + '=([^;]+)'));
    return match ? match[2] : null;
  }

  // Track conversion
  function track(type, data) {
    var trackingId = getTrackingId();
    if (!trackingId) {
      console.warn('Go2: No tracking ID found');
      return Promise.resolve(null);
    }

    var payload = Object.assign({
      trackingId: trackingId,
      type: type
    }, data || {});

    return fetch(GO2_API + '/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(r) { return r.json(); })
      .catch(function(e) { console.error('Go2 tracking error:', e); });
  }

  // Public API
  window.go2 = {
    track: track,
    trackPageView: function() { return track('page_view'); },
    trackSignup: function(data) { return track('signup', data); },
    trackPurchase: function(value, currency, orderId) {
      return track('purchase', {
        value: Math.round(value * 100), // Convert to cents
        currency: currency || 'usd',
        externalId: orderId
      });
    },
    trackLead: function(data) { return track('lead', data); },
    trackDownload: function(data) { return track('download', data); },
    trackCustom: function(eventName, data) {
      return track('custom', Object.assign({ eventName: eventName }, data || {}));
    },
    getTrackingId: getTrackingId
  };

  // Auto-track page view if enabled
  if (document.currentScript && document.currentScript.getAttribute('data-auto-track') === 'true') {
    window.go2.trackPageView();
  }
})();
`.trim();

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

// -----------------------------------------------------------------------------
// Authenticated Routes
// -----------------------------------------------------------------------------

// All remaining routes require authentication
conversions.use("/*", apiKeyAuthMiddleware());

/**
 * GET /conversions/goals
 * List conversion goals
 */
conversions.get("/goals", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });

  const goals = await db
    .select()
    .from(schema.conversionGoals)
    .where(eq(schema.conversionGoals.userId, user.id))
    .orderBy(desc(schema.conversionGoals.createdAt));

  return ok(c, goals);
});

/**
 * POST /conversions/goals
 * Create a conversion goal
 */
conversions.post("/goals", zValidator("json", createGoalSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newGoal: schema.NewConversionGoal = {
    id,
    userId: user.id,
    organizationId: user.organizationId,
    name: input.name,
    type: input.type,
    urlPattern: input.urlPattern,
    eventName: input.eventName,
    attributionWindow: input.attributionWindow,
    hasValue: input.hasValue,
    defaultValue: input.defaultValue,
    currency: input.currency,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.conversionGoals).values(newGoal);

  return created(c, newGoal);
});

/**
 * GET /conversions/goals/:id
 * Get a conversion goal
 */
conversions.get("/goals/:id", async (c) => {
  const user = c.get("user");
  const goalId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const goal = await db
    .select()
    .from(schema.conversionGoals)
    .where(eq(schema.conversionGoals.id, goalId))
    .limit(1);

  if (!goal[0]) {
    return notFound(c, "Conversion goal not found");
  }

  if (goal[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this goal");
  }

  return ok(c, goal[0]);
});

/**
 * PATCH /conversions/goals/:id
 * Update a conversion goal
 */
conversions.patch("/goals/:id", zValidator("json", updateGoalSchema), async (c) => {
  const user = c.get("user");
  const goalId = c.req.param("id");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.conversionGoals)
    .where(eq(schema.conversionGoals.id, goalId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Conversion goal not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this goal");
  }

  const updateData: Partial<schema.NewConversionGoal> = {
    ...(input.name && { name: input.name }),
    ...(input.type && { type: input.type }),
    ...(input.urlPattern !== undefined && { urlPattern: input.urlPattern }),
    ...(input.eventName !== undefined && { eventName: input.eventName }),
    ...(input.attributionWindow !== undefined && { attributionWindow: input.attributionWindow }),
    ...(input.hasValue !== undefined && { hasValue: input.hasValue }),
    ...(input.defaultValue !== undefined && { defaultValue: input.defaultValue }),
    ...(input.currency !== undefined && { currency: input.currency }),
    ...(input.isActive !== undefined && { isActive: input.isActive }),
    updatedAt: new Date().toISOString(),
  };

  await db
    .update(schema.conversionGoals)
    .set(updateData)
    .where(eq(schema.conversionGoals.id, goalId));

  const updated = await db
    .select()
    .from(schema.conversionGoals)
    .where(eq(schema.conversionGoals.id, goalId))
    .limit(1);

  return ok(c, updated[0]);
});

/**
 * DELETE /conversions/goals/:id
 * Delete a conversion goal
 */
conversions.delete("/goals/:id", async (c) => {
  const user = c.get("user");
  const goalId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.conversionGoals)
    .where(eq(schema.conversionGoals.id, goalId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Conversion goal not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this goal");
  }

  await db.delete(schema.conversionGoals).where(eq(schema.conversionGoals.id, goalId));

  return noContent(c);
});

/**
 * GET /conversions/stats
 * Get conversion statistics
 */
conversions.get("/stats", zValidator("query", statsQuerySchema), async (c) => {
  const user = c.get("user");
  const { startDate, endDate, type, goalId } = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  // Get user's links
  const userLinks = await db
    .select({ id: schema.links.id })
    .from(schema.links)
    .where(eq(schema.links.userId, user.id));

  const linkIds = userLinks.map((l) => l.id);

  if (linkIds.length === 0) {
    return ok(c, {
      totalConversions: 0,
      totalValue: 0,
      byType: [],
      byGoal: [],
      overTime: [],
    });
  }

  // Build conditions
  const conditions = [];

  if (startDate) {
    conditions.push(gte(schema.conversions.convertedAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(schema.conversions.convertedAt, endDate));
  }
  if (type) {
    conditions.push(eq(schema.conversions.type, type));
  }
  if (goalId) {
    conditions.push(eq(schema.conversions.goalId, goalId));
  }

  // Total conversions and value
  const totals = await db
    .select({
      count: sql<number>`count(*)`,
      totalValue: sql<number>`sum(value)`,
    })
    .from(schema.conversions)
    .where(and(sql`link_id IN (${sql.raw(linkIds.map(() => "?").join(","))})`, ...conditions));

  // By type
  const byType = await db
    .select({
      type: schema.conversions.type,
      count: sql<number>`count(*)`,
      totalValue: sql<number>`sum(value)`,
    })
    .from(schema.conversions)
    .where(and(sql`link_id IN (${sql.raw(linkIds.map(() => "?").join(","))})`, ...conditions))
    .groupBy(schema.conversions.type);

  // Over time (last 30 days)
  const overTime = await db
    .select({
      date: sql<string>`date(converted_at)`,
      count: sql<number>`count(*)`,
      totalValue: sql<number>`sum(value)`,
    })
    .from(schema.conversions)
    .where(and(sql`link_id IN (${sql.raw(linkIds.map(() => "?").join(","))})`, ...conditions))
    .groupBy(sql`date(converted_at)`)
    .orderBy(sql`date(converted_at)`)
    .limit(30);

  return ok(c, {
    totalConversions: totals[0]?.count ?? 0,
    totalValue: totals[0]?.totalValue ?? 0,
    byType,
    overTime,
  });
});

/**
 * GET /conversions/link/:linkId
 * Get conversions for a specific link
 */
conversions.get("/link/:linkId", async (c) => {
  const user = c.get("user");
  const linkId = c.req.param("linkId");
  const db = drizzle(c.env.DB, { schema });

  // Verify link ownership
  const link = await db.select().from(schema.links).where(eq(schema.links.id, linkId)).limit(1);

  if (!link[0]) {
    return notFound(c, "Link not found");
  }

  if (link[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this link");
  }

  // Get conversions
  const linkConversions = await db
    .select()
    .from(schema.conversions)
    .where(eq(schema.conversions.linkId, linkId))
    .orderBy(desc(schema.conversions.convertedAt))
    .limit(100);

  // Get stats
  const stats = await db
    .select({
      count: sql<number>`count(*)`,
      totalValue: sql<number>`sum(value)`,
    })
    .from(schema.conversions)
    .where(eq(schema.conversions.linkId, linkId));

  return ok(c, {
    conversions: linkConversions.map((conv) => ({
      ...conv,
      metadata: conv.metadata ? JSON.parse(conv.metadata) : null,
    })),
    stats: {
      totalConversions: stats[0]?.count ?? 0,
      totalValue: stats[0]?.totalValue ?? 0,
    },
  });
});

export { conversions, publicConversions };
