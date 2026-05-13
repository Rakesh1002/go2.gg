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

import { zValidator } from "@hono/zod-validator";
import * as schema from "@repo/db";
import { and, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../../bindings.js";
import { captureEvent } from "../../lib/product-analytics.js";
import { created, forbidden, noContent, notFound, ok } from "../../lib/response.js";
import { dispatchWebhookEvent } from "../../lib/webhook-dispatcher.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { rateLimitMiddleware } from "../../middleware/rate-limit.js";

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
// Shared Tracking Logic
// -----------------------------------------------------------------------------

type TrackInput = z.infer<typeof trackConversionSchema>;
type TrackResult =
  | { ok: true; status: "created" | "duplicate"; conversion: schema.Conversion }
  | { ok: false; status: number; message: string };

/**
 * Persist a conversion event with full attribution: resolves linkId via the
 * tracking ID encoded in go2_ref (linkId:clickId), pulls click context for
 * geo/device/AB-test fields, auto-matches a goal when one wasn't supplied,
 * and dedupes against (linkId, goalId, externalId) when externalId is set.
 *
 * `requireUserId` scopes the link lookup to a specific user — used by the
 * authenticated server-side route. The public route passes null to allow
 * any link's owner to receive the conversion.
 */
export async function recordConversion(
  env: Env,
  input: TrackInput,
  requireUserId: string | null
): Promise<TrackResult> {
  const db = drizzle(env.DB, { schema });

  if (!input.linkId && !input.clickId && !input.trackingId) {
    return { ok: false, status: 400, message: "Must provide linkId, clickId, or trackingId" };
  }

  let linkId = input.linkId;
  let clickId = input.clickId;
  let clickRow: schema.Click | undefined;

  // Decode go2_ref tracking ID. Canonical format is `linkId:clickId` so the
  // linkId is recoverable even when the click row is still pending insert
  // (waitUntil) at conversion time. Falls back to legacy bare-clickId form.
  if (input.trackingId && !clickId) {
    const parts = input.trackingId.split(":");
    if (parts.length === 2) {
      linkId = linkId ?? parts[0];
      clickId = parts[1];
    } else {
      clickId = input.trackingId;
    }
  }

  if (clickId) {
    const click = await db
      .select()
      .from(schema.clicks)
      .where(eq(schema.clicks.id, clickId))
      .limit(1);
    if (click[0]) {
      clickRow = click[0];
      linkId = linkId ?? click[0].linkId;
    }
  }

  if (!linkId) {
    return {
      ok: false,
      status: 400,
      message: "Could not identify the link for this conversion",
    };
  }

  const link = await db
    .select({
      id: schema.links.id,
      userId: schema.links.userId,
      organizationId: schema.links.organizationId,
    })
    .from(schema.links)
    .where(eq(schema.links.id, linkId))
    .limit(1);

  if (!link[0]) {
    return { ok: false, status: 400, message: "Link not found" };
  }
  if (requireUserId && link[0].userId !== requireUserId) {
    return { ok: false, status: 403, message: "You don't own this link" };
  }
  if (!link[0].userId) {
    return { ok: false, status: 400, message: "Link has no owner" };
  }

  // Resolve the conversion goal. If the caller passed goalId, validate it
  // belongs to the link's owner; otherwise auto-match by eventName / urlPattern
  // / type so byGoal stats actually populate.
  let goal: schema.ConversionGoal | undefined;
  if (input.goalId) {
    const explicit = await db
      .select()
      .from(schema.conversionGoals)
      .where(eq(schema.conversionGoals.id, input.goalId))
      .limit(1);
    if (explicit[0] && explicit[0].userId === link[0].userId) {
      goal = explicit[0];
    }
  }

  if (!goal) {
    // Scope candidates: if this link has explicit goal associations, only
    // those goals can match. Otherwise fall back to all of the user's goals.
    const linkGoalIds = await db
      .select({ goalId: schema.linkConversionGoals.goalId })
      .from(schema.linkConversionGoals)
      .where(eq(schema.linkConversionGoals.linkId, linkId));

    const baseConditions = [
      eq(schema.conversionGoals.userId, link[0].userId),
      eq(schema.conversionGoals.isActive, true),
      eq(schema.conversionGoals.type, input.type),
    ];
    if (linkGoalIds.length > 0) {
      baseConditions.push(
        inArray(
          schema.conversionGoals.id,
          linkGoalIds.map((row) => row.goalId)
        )
      );
    }

    const candidates = await db
      .select()
      .from(schema.conversionGoals)
      .where(and(...baseConditions));

    // Best match: exact eventName beats urlPattern beats type-only.
    goal =
      candidates.find((g) => input.eventName && g.eventName === input.eventName) ??
      candidates.find((g) => g.urlPattern && matchesUrlPattern(input.metadata, g.urlPattern)) ??
      candidates.find((g) => !g.eventName && !g.urlPattern);
  }

  // Attribution-window check (only meaningful when we have both a click
  // timestamp and a goal with a finite window).
  if (goal?.attributionWindow && clickRow?.timestamp) {
    const clickTime = new Date(clickRow.timestamp);
    const windowEnd = new Date(clickTime);
    windowEnd.setDate(windowEnd.getDate() + goal.attributionWindow);
    if (new Date() > windowEnd) {
      return { ok: false, status: 400, message: "Conversion outside attribution window" };
    }
  }

  // Idempotency: when the integrator passes an externalId (Stripe charge ID,
  // order number), don't double-count refresh / retry / duplicate webhook
  // dispatches against the same (linkId, goalId, externalId) tuple.
  if (input.externalId) {
    const existing = await db
      .select()
      .from(schema.conversions)
      .where(
        and(
          eq(schema.conversions.linkId, linkId),
          eq(schema.conversions.externalId, input.externalId),
          goal ? eq(schema.conversions.goalId, goal.id) : isNull(schema.conversions.goalId)
        )
      )
      .limit(1);
    if (existing[0]) {
      return { ok: true, status: "duplicate", conversion: existing[0] };
    }
  }

  const conversionId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newConversion: schema.NewConversion = {
    id: conversionId,
    linkId,
    clickId: clickRow?.id ?? clickId,
    goalId: goal?.id,
    type: input.type,
    eventName: input.eventName,
    attributedAt: clickRow?.timestamp,
    convertedAt: now,
    value: input.value ?? (goal?.hasValue ? goal.defaultValue : undefined),
    currency: input.currency ?? goal?.currency ?? "usd",
    externalId: input.externalId,
    customerId: input.customerId,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    country: clickRow?.country ?? undefined,
    device: clickRow?.device ?? undefined,
    browser: clickRow?.browser ?? undefined,
    referrer: clickRow?.referrer ?? undefined,
    abTestId: clickRow?.abTestId ?? undefined,
    abVariant: clickRow?.abVariant ?? undefined,
    createdAt: now,
  };

  try {
    await db.insert(schema.conversions).values(newConversion);
  } catch (err) {
    // Race-safety net for the partial unique index conversions_dedup_idx.
    // Two concurrent track calls with the same (linkId, goalId, externalId)
    // can both pass the select-then-insert dedup; the DB-level constraint is
    // the authoritative tie-breaker. Re-fetch and treat the loser as a dup.
    const message = err instanceof Error ? err.message : String(err);
    const isUniqueViolation =
      message.includes("UNIQUE constraint failed") || message.includes("conversions_dedup_idx");
    if (!isUniqueViolation || !input.externalId) throw err;

    const winner = await db
      .select()
      .from(schema.conversions)
      .where(
        and(
          eq(schema.conversions.linkId, linkId),
          eq(schema.conversions.externalId, input.externalId),
          goal ? eq(schema.conversions.goalId, goal.id) : isNull(schema.conversions.goalId)
        )
      )
      .limit(1);
    if (winner[0]) {
      return { ok: true, status: "duplicate", conversion: winner[0] };
    }
    throw err;
  }

  // Fire conversion webhook (subscribers get "conversion" or "*"). Best-effort;
  // failures are logged inside the dispatcher.
  await dispatchWebhookEvent(env, link[0].userId, link[0].organizationId, "conversion", {
    conversionId,
    linkId,
    clickId: newConversion.clickId,
    goalId: goal?.id,
    goalName: goal?.name,
    type: input.type,
    eventName: input.eventName,
    value: newConversion.value,
    currency: newConversion.currency,
    externalId: input.externalId,
    customerId: input.customerId,
    abTestId: newConversion.abTestId,
    abVariant: newConversion.abVariant,
    convertedAt: now,
  });

  // Product analytics — attribute conversion to the link OWNER so the funnel
  // shows the right user. The `value` is included as both `value` and
  // `revenue` so PostHog's revenue charts and GA4's purchase events both
  // pick it up.
  if (link[0].userId) {
    await captureEvent(env, {
      event: "conversion_tracked",
      distinctId: link[0].userId,
      properties: {
        organizationId: link[0].organizationId ?? null,
        linkId,
        clickId: newConversion.clickId,
        goalId: goal?.id ?? null,
        goalName: goal?.name ?? null,
        type: input.type,
        eventName: input.eventName ?? null,
        value: newConversion.value ?? 0,
        revenue: newConversion.value ?? 0,
        currency: newConversion.currency,
        externalId: input.externalId ?? null,
        customerId: input.customerId ?? null,
        abTestId: newConversion.abTestId ?? null,
        abVariant: newConversion.abVariant ?? null,
      },
    });
  }

  return {
    ok: true,
    status: "created",
    conversion: { ...newConversion, isActive: true } as schema.Conversion,
  };
}

/**
 * Best-effort URL-pattern check used by goal auto-matching. The public track
 * endpoint can pass `metadata.url` (the page that fired the conversion).
 * Patterns may be a glob with trailing `*` or a literal substring match.
 */
function matchesUrlPattern(
  metadata: Record<string, unknown> | undefined,
  pattern: string
): boolean {
  const url = typeof metadata?.url === "string" ? metadata.url : null;
  if (!url) return false;
  if (pattern.endsWith("*")) {
    return url.startsWith(pattern.slice(0, -1));
  }
  return url.includes(pattern);
}

// -----------------------------------------------------------------------------
// Public Routes (No Auth - for client-side tracking)
// -----------------------------------------------------------------------------

const publicConversions = new Hono<{ Bindings: Env }>();

// Tighter per-IP limit on the public conversion endpoint than the global
// /api/* default — keeps a single source from polluting a customer's data.
publicConversions.post(
  "/track",
  rateLimitMiddleware({ limit: 30, window: 60 }),
  zValidator("json", trackConversionSchema),
  async (c) => {
    const input = c.req.valid("json");
    const result = await recordConversion(c.env, input, null);
    if (!result.ok) {
      return c.json(
        { success: false, error: { message: result.message } },
        result.status as 400 | 403
      );
    }
    if (result.status === "duplicate") {
      return ok(c, {
        id: result.conversion.id,
        linkId: result.conversion.linkId,
        type: result.conversion.type,
        value: result.conversion.value,
        convertedAt: result.conversion.convertedAt,
        duplicate: true,
      });
    }
    return created(c, {
      id: result.conversion.id,
      linkId: result.conversion.linkId,
      type: result.conversion.type,
      value: result.conversion.value,
      convertedAt: result.conversion.convertedAt,
    });
  }
);

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

  var GO2_API = '${appUrl}/api/v1/public/conversions';
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
 * POST /conversions/track
 * Server-side conversion tracking. Use this from your backend (e.g. on a
 * Stripe webhook) so conversions don't depend on the browser running the
 * pixel script. Requires Bearer go2_xxx auth, scoped to the caller's links.
 */
conversions.post("/track", zValidator("json", trackConversionSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const result = await recordConversion(c.env, input, user.id);
  if (!result.ok) {
    return c.json(
      { success: false, error: { message: result.message } },
      result.status as 400 | 403
    );
  }
  if (result.status === "duplicate") {
    return ok(c, {
      id: result.conversion.id,
      linkId: result.conversion.linkId,
      type: result.conversion.type,
      value: result.conversion.value,
      convertedAt: result.conversion.convertedAt,
      duplicate: true,
    });
  }
  return created(c, {
    id: result.conversion.id,
    linkId: result.conversion.linkId,
    type: result.conversion.type,
    value: result.conversion.value,
    convertedAt: result.conversion.convertedAt,
  });
});

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
 * GET /conversions/goals/:id/links
 * List the links a goal is scoped to. Empty list = goal applies to all links.
 */
conversions.get("/goals/:id/links", async (c) => {
  const user = c.get("user");
  const goalId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const goal = await db
    .select()
    .from(schema.conversionGoals)
    .where(eq(schema.conversionGoals.id, goalId))
    .limit(1);

  if (!goal[0]) return notFound(c, "Conversion goal not found");
  if (goal[0].userId !== user.id) return forbidden(c, "You don't have access to this goal");

  const linkIds = await db
    .select({ linkId: schema.linkConversionGoals.linkId })
    .from(schema.linkConversionGoals)
    .where(eq(schema.linkConversionGoals.goalId, goalId));

  return ok(
    c,
    linkIds.map((row) => row.linkId)
  );
});

/**
 * PUT /conversions/goals/:id/links
 * Replace the set of links scoped to this goal. Empty body = unscope (goal
 * matches all of the user's links).
 */
const replaceLinksSchema = z.object({
  linkIds: z.array(z.string().uuid()),
});

conversions.put("/goals/:id/links", zValidator("json", replaceLinksSchema), async (c) => {
  const user = c.get("user");
  const goalId = c.req.param("id");
  const { linkIds } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  const goal = await db
    .select()
    .from(schema.conversionGoals)
    .where(eq(schema.conversionGoals.id, goalId))
    .limit(1);

  if (!goal[0]) return notFound(c, "Conversion goal not found");
  if (goal[0].userId !== user.id) return forbidden(c, "You don't have access to this goal");

  if (linkIds.length > 0) {
    const owned = await db
      .select({ id: schema.links.id })
      .from(schema.links)
      .where(and(eq(schema.links.userId, user.id), inArray(schema.links.id, linkIds)));
    if (owned.length !== linkIds.length) {
      return c.json(
        { success: false, error: { message: "One or more linkIds are not owned by you" } },
        400
      );
    }
  }

  await db.delete(schema.linkConversionGoals).where(eq(schema.linkConversionGoals.goalId, goalId));

  if (linkIds.length > 0) {
    const now = new Date().toISOString();
    await db.insert(schema.linkConversionGoals).values(
      linkIds.map((linkId) => ({
        id: crypto.randomUUID(),
        linkId,
        goalId,
        createdAt: now,
      }))
    );
  }

  return ok(c, { goalId, linkIds });
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
    .select({ id: schema.links.id, clickCount: schema.links.clickCount })
    .from(schema.links)
    .where(eq(schema.links.userId, user.id));

  const linkIds = userLinks.map((l) => l.id);
  const totalClicks = userLinks.reduce((sum, l) => sum + (l.clickCount ?? 0), 0);

  if (linkIds.length === 0) {
    return ok(c, {
      totalConversions: 0,
      totalRevenue: 0,
      conversionRate: 0,
      byType: [],
      byGoal: [],
      overTime: [],
      recentConversions: [],
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

  const whereClause = and(inArray(schema.conversions.linkId, linkIds), ...conditions);

  // Total conversions and value
  const totals = await db
    .select({
      count: sql<number>`count(*)`,
      totalValue: sql<number>`coalesce(sum(value), 0)`,
    })
    .from(schema.conversions)
    .where(whereClause);

  // By type
  const byType = await db
    .select({
      type: schema.conversions.type,
      count: sql<number>`count(*)`,
      totalValue: sql<number>`coalesce(sum(value), 0)`,
    })
    .from(schema.conversions)
    .where(whereClause)
    .groupBy(schema.conversions.type);

  // By goal — joins through conversion_goals so we can return the goal name.
  const byGoalRaw = await db
    .select({
      goalId: schema.conversions.goalId,
      goalName: schema.conversionGoals.name,
      conversions: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${schema.conversions.value}), 0)`,
    })
    .from(schema.conversions)
    .leftJoin(schema.conversionGoals, eq(schema.conversions.goalId, schema.conversionGoals.id))
    .where(whereClause)
    .groupBy(schema.conversions.goalId, schema.conversionGoals.name);

  const byGoal = byGoalRaw
    .filter((row) => row.goalId !== null)
    .map((row) => ({
      goalId: row.goalId as string,
      goalName: row.goalName ?? "Unknown",
      conversions: row.conversions,
      revenue: row.revenue,
    }));

  // By link — joins through links so we can return slug/domain/destination.
  const byLinkRaw = await db
    .select({
      linkId: schema.conversions.linkId,
      slug: schema.links.slug,
      domain: schema.links.domain,
      destinationUrl: schema.links.destinationUrl,
      conversions: sql<number>`count(*)`,
      revenue: sql<number>`coalesce(sum(${schema.conversions.value}), 0)`,
    })
    .from(schema.conversions)
    .leftJoin(schema.links, eq(schema.conversions.linkId, schema.links.id))
    .where(whereClause)
    .groupBy(
      schema.conversions.linkId,
      schema.links.slug,
      schema.links.domain,
      schema.links.destinationUrl
    )
    .orderBy(desc(sql`count(*)`))
    .limit(50);

  const byLink = byLinkRaw.map((row) => ({
    linkId: row.linkId,
    slug: row.slug ?? "",
    domain: row.domain ?? "",
    destinationUrl: row.destinationUrl ?? "",
    conversions: row.conversions,
    revenue: row.revenue,
  }));

  // Over time (last 30 days)
  const overTime = await db
    .select({
      date: sql<string>`date(converted_at)`,
      count: sql<number>`count(*)`,
      totalValue: sql<number>`coalesce(sum(value), 0)`,
    })
    .from(schema.conversions)
    .where(whereClause)
    .groupBy(sql`date(converted_at)`)
    .orderBy(sql`date(converted_at)`)
    .limit(30);

  // Recent conversions (last 10) for the dashboard list
  const recentConversions = await db
    .select({
      id: schema.conversions.id,
      type: schema.conversions.type,
      value: schema.conversions.value,
      createdAt: schema.conversions.convertedAt,
      linkId: schema.conversions.linkId,
    })
    .from(schema.conversions)
    .where(whereClause)
    .orderBy(desc(schema.conversions.convertedAt))
    .limit(10);

  const totalConversions = totals[0]?.count ?? 0;
  const totalRevenue = totals[0]?.totalValue ?? 0;
  const conversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;

  return ok(c, {
    totalConversions,
    totalRevenue,
    conversionRate,
    byType,
    byGoal,
    byLink,
    overTime,
    recentConversions,
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
