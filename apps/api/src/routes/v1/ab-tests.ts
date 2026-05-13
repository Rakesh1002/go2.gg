/**
 * A/B Test Routes (v1)
 *
 * CRUD operations for A/B tests:
 * - POST /ab-tests - Create a new A/B test
 * - GET /ab-tests - List user's A/B tests
 * - GET /ab-tests/:id - Get A/B test by ID
 * - PATCH /ab-tests/:id - Update A/B test
 * - DELETE /ab-tests/:id - Delete A/B test
 * - POST /ab-tests/:id/start - Start an A/B test
 * - POST /ab-tests/:id/stop - Stop an A/B test
 * - GET /ab-tests/:id/results - Get A/B test results
 */

import { zValidator } from "@hono/zod-validator";
import * as schema from "@repo/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import type { CachedLink, Env } from "../../bindings.js";
import { deleteABTestFromKV } from "../../lib/analytics.js";
import { getPlanCapabilities } from "../../lib/plan-capabilities.js";
import { badRequest, created, forbidden, noContent, notFound, ok } from "../../lib/response.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";

const abTests = new Hono<{ Bindings: Env }>();

/**
 * Patch the abTestId/abVariant/destinationUrl fields on each link's cached
 * KV snapshot. We READ-MODIFY-WRITE rather than delete because the redirect
 * handler does not fall back to D1 on KV miss — a deleted entry would 404
 * the link until the next link PATCH repopulates the cache.
 *
 * `patch` is applied on top of the existing CachedLink. Pass `abTestId: null`
 * to clear the FK; pass `destinationUrl` to swap the default URL (e.g. when
 * picking a winner).
 */
interface LinkKVPatch {
  abTestId?: string | null;
  abVariant?: string | null;
  destinationUrl?: string;
}

async function patchLinkKV(
  env: Env,
  links: Array<{ domain: string; slug: string }>,
  patch: LinkKVPatch
): Promise<void> {
  await Promise.all(
    links.map(async (l) => {
      const key = `${l.domain}:${l.slug}`;
      const cached = await env.LINKS_KV.get<CachedLink>(key, "json");
      if (!cached) {
        // Nothing to patch — the link will be repopulated on its next write.
        return;
      }
      const updated: CachedLink = {
        ...cached,
        ...(patch.abTestId === null
          ? { abTestId: undefined }
          : patch.abTestId !== undefined
            ? { abTestId: patch.abTestId }
            : {}),
        ...(patch.abVariant === null
          ? { abVariant: undefined }
          : patch.abVariant !== undefined
            ? { abVariant: patch.abVariant }
            : {}),
        ...(patch.destinationUrl !== undefined
          ? { destinationUrl: patch.destinationUrl }
          : {}),
      };
      await env.LINKS_KV.put(key, JSON.stringify(updated));
    })
  );
}

/**
 * Invalidate the abtest KV cache so the next redirect re-reads fresh state.
 * The link KV is patched (not deleted) by callers that touch the link row.
 */
async function invalidateABCache(env: Env, testId: string): Promise<void> {
  await deleteABTestFromKV(env.LINKS_KV, testId);
}

// All routes require authentication
abTests.use("/*", apiKeyAuthMiddleware());

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const variantSchema = z.object({
  id: z.string().optional(), // Auto-generated if not provided
  url: z.string().url("Invalid URL"),
  weight: z.number().min(1).max(100).default(50),
  name: z.string().max(100).optional(),
});

const createABTestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  linkId: z.string().uuid().optional(), // Optional - can attach to existing link
  variants: z
    .array(variantSchema)
    .min(2, "At least 2 variants required")
    .max(4, "Maximum 4 variants allowed"),
  trafficPercentage: z.number().min(10).max(100).default(100),
});

const updateABTestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  variants: z
    .array(variantSchema)
    .min(2, "At least 2 variants required")
    .max(4, "Maximum 4 variants allowed")
    .optional(),
  trafficPercentage: z.number().min(10).max(100).optional(),
});

const listABTestsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(["draft", "running", "paused", "completed"]).optional(),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * POST /ab-tests
 * Create a new A/B test
 */
abTests.post("/", zValidator("json", createABTestSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Check plan capabilities - A/B testing requires Business+
  const capabilities = getPlanCapabilities(user.plan);
  if (!capabilities.canUseABTesting) {
    return forbidden(c, "A/B testing requires a Business plan or higher");
  }

  // Normalize variant weights to sum to 100
  const totalWeight = input.variants.reduce((sum, v) => sum + v.weight, 0);
  const normalizedVariants = input.variants.map((v) => ({
    id: v.id || crypto.randomUUID(),
    url: v.url,
    weight: Math.round((v.weight / totalWeight) * 100),
    name: v.name || `Variant ${v.id?.slice(-4) || ""}`,
    clicks: 0,
    conversions: 0,
  }));

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newTest: schema.NewABTest = {
    id,
    userId: user.id,
    organizationId: user.organizationId,
    name: input.name,
    description: input.description,
    status: "draft",
    variants: JSON.stringify(normalizedVariants),
    trafficPercentage: input.trafficPercentage,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.abTests).values(newTest);

  // If linkId provided, attach test to link
  if (input.linkId) {
    await db
      .update(schema.links)
      .set({
        abTestId: id,
        updatedAt: now,
      })
      .where(and(eq(schema.links.id, input.linkId), eq(schema.links.userId, user.id)));

    // Patch the link's KV snapshot so the redirect path picks up abTestId
    // without losing the rest of the cached link (a delete would 404 the
    // link until its next PATCH).
    const linkRow = await db
      .select({ domain: schema.links.domain, slug: schema.links.slug })
      .from(schema.links)
      .where(eq(schema.links.id, input.linkId))
      .limit(1);
    if (linkRow[0]) {
      await patchLinkKV(c.env, [linkRow[0]], { abTestId: id });
    }
  }

  const result = await db.select().from(schema.abTests).where(eq(schema.abTests.id, id)).limit(1);

  return created(c, formatABTest(result[0]));
});

/**
 * GET /ab-tests
 * List user's A/B tests
 */
abTests.get("/", zValidator("query", listABTestsSchema), async (c) => {
  const user = c.get("user");
  const { page, perPage, status } = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  const offset = (page - 1) * perPage;

  const conditions = [eq(schema.abTests.userId, user.id)];
  if (status) {
    conditions.push(eq(schema.abTests.status, status));
  }

  const results = await db
    .select()
    .from(schema.abTests)
    .where(and(...conditions))
    .orderBy(desc(schema.abTests.createdAt))
    .limit(perPage)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.abTests)
    .where(and(...conditions));

  const total = countResult[0]?.count ?? 0;

  return ok(c, results.map(formatABTest), {
    page,
    perPage,
    total,
    hasMore: offset + results.length < total,
  });
});

/**
 * GET /ab-tests/:id
 * Get A/B test by ID
 */
abTests.get("/:id", async (c) => {
  const user = c.get("user");
  const testId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const result = await db
    .select()
    .from(schema.abTests)
    .where(eq(schema.abTests.id, testId))
    .limit(1);

  if (!result[0]) {
    return notFound(c, "A/B test not found");
  }

  if (result[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this A/B test");
  }

  return ok(c, formatABTest(result[0]));
});

/**
 * PATCH /ab-tests/:id
 * Update A/B test
 */
abTests.patch("/:id", zValidator("json", updateABTestSchema), async (c) => {
  const user = c.get("user");
  const testId = c.req.param("id");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.abTests)
    .where(eq(schema.abTests.id, testId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "A/B test not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this A/B test");
  }

  // Can't update running tests (only pause/stop)
  if (existing[0].status === "running" && input.variants) {
    return badRequest(c, "Cannot modify variants while test is running");
  }

  let normalizedVariants = input.variants;
  if (input.variants) {
    const totalWeight = input.variants.reduce((sum, v) => sum + v.weight, 0);
    normalizedVariants = input.variants.map((v) => ({
      id: v.id || crypto.randomUUID(),
      url: v.url,
      weight: Math.round((v.weight / totalWeight) * 100),
      name: v.name || `Variant ${v.id?.slice(-4) || ""}`,
      clicks: 0,
      conversions: 0,
    }));
  }

  const updateData: Partial<schema.NewABTest> = {
    ...(input.name && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    ...(normalizedVariants && { variants: JSON.stringify(normalizedVariants) }),
    ...(input.trafficPercentage !== undefined && {
      trafficPercentage: input.trafficPercentage,
    }),
    updatedAt: new Date().toISOString(),
  };

  await db.update(schema.abTests).set(updateData).where(eq(schema.abTests.id, testId));

  // Variants/weights/traffic% are cached in KV; invalidate so the next redirect
  // re-reads the new shape.
  await invalidateABCache(c.env, testId);

  const result = await db
    .select()
    .from(schema.abTests)
    .where(eq(schema.abTests.id, testId))
    .limit(1);

  return ok(c, formatABTest(result[0]));
});

/**
 * DELETE /ab-tests/:id
 * Delete A/B test
 */
abTests.delete("/:id", async (c) => {
  const user = c.get("user");
  const testId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.abTests)
    .where(eq(schema.abTests.id, testId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "A/B test not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this A/B test");
  }

  // Capture linked links BEFORE clearing the FK so we can patch their KV.
  const linkedLinks = await db
    .select({ domain: schema.links.domain, slug: schema.links.slug })
    .from(schema.links)
    .where(eq(schema.links.abTestId, testId));

  // Remove test from any associated links
  await db
    .update(schema.links)
    .set({ abTestId: null, abVariant: null, updatedAt: new Date().toISOString() })
    .where(eq(schema.links.abTestId, testId));

  // Delete the test
  await db.delete(schema.abTests).where(eq(schema.abTests.id, testId));

  await invalidateABCache(c.env, testId);
  await patchLinkKV(c.env, linkedLinks, { abTestId: null, abVariant: null });

  return noContent(c);
});

/**
 * POST /ab-tests/:id/start
 * Start an A/B test
 */
abTests.post("/:id/start", async (c) => {
  const user = c.get("user");
  const testId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.abTests)
    .where(eq(schema.abTests.id, testId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "A/B test not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this A/B test");
  }

  if (existing[0].status === "running") {
    return badRequest(c, "Test is already running");
  }

  if (existing[0].status === "completed") {
    return badRequest(c, "Cannot restart a completed test");
  }

  const now = new Date().toISOString();

  await db
    .update(schema.abTests)
    .set({
      status: "running",
      startedAt: existing[0].startedAt ?? now,
      updatedAt: now,
    })
    .where(eq(schema.abTests.id, testId));

  // Test status flipping draft/paused → running is what enables variant
  // selection at redirect time. Cached state must be refreshed.
  await invalidateABCache(c.env, testId);

  const result = await db
    .select()
    .from(schema.abTests)
    .where(eq(schema.abTests.id, testId))
    .limit(1);

  return ok(c, formatABTest(result[0]));
});

/**
 * POST /ab-tests/:id/stop
 * Stop/pause an A/B test
 */
abTests.post("/:id/stop", async (c) => {
  const user = c.get("user");
  const testId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.abTests)
    .where(eq(schema.abTests.id, testId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "A/B test not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this A/B test");
  }

  const now = new Date().toISOString();

  await db
    .update(schema.abTests)
    .set({
      status: "paused",
      updatedAt: now,
    })
    .where(eq(schema.abTests.id, testId));

  await invalidateABCache(c.env, testId);

  const result = await db
    .select()
    .from(schema.abTests)
    .where(eq(schema.abTests.id, testId))
    .limit(1);

  return ok(c, formatABTest(result[0]));
});

/**
 * POST /ab-tests/:id/complete
 * Complete an A/B test and pick a winner
 */
abTests.post("/:id/complete", async (c) => {
  const user = c.get("user");
  const testId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.abTests)
    .where(eq(schema.abTests.id, testId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "A/B test not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this A/B test");
  }

  const variants = JSON.parse(existing[0].variants) as ABVariant[];

  // Find the winner (highest conversion rate, or clicks if no conversions)
  const winner = variants.reduce((best, current) => {
    const bestRate = best.conversions > 0 ? best.conversions / best.clicks : best.clicks / 1000;
    const currentRate =
      current.conversions > 0 ? current.conversions / current.clicks : current.clicks / 1000;
    return currentRate > bestRate ? current : best;
  }, variants[0]);

  const now = new Date().toISOString();

  // Capture linked links BEFORE clearing the FK so we can invalidate their KV.
  const linkedLinks = await db
    .select({ domain: schema.links.domain, slug: schema.links.slug })
    .from(schema.links)
    .where(eq(schema.links.abTestId, testId));

  await db
    .update(schema.abTests)
    .set({
      status: "completed",
      winnerVariantId: winner.id,
      endedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.abTests.id, testId));

  // Update associated links to use the winning URL
  await db
    .update(schema.links)
    .set({
      destinationUrl: winner.url,
      abTestId: null,
      abVariant: null,
      updatedAt: now,
    })
    .where(eq(schema.links.abTestId, testId));

  await invalidateABCache(c.env, testId);
  // Rewrite linked links' KV: point destinationUrl at the winner and clear
  // the FK so the redirect short-circuits A/B logic on subsequent requests.
  await patchLinkKV(c.env, linkedLinks, {
    abTestId: null,
    abVariant: null,
    destinationUrl: winner.url,
  });

  const result = await db
    .select()
    .from(schema.abTests)
    .where(eq(schema.abTests.id, testId))
    .limit(1);

  return ok(c, formatABTest(result[0]));
});

/**
 * GET /ab-tests/:id/results
 * Get A/B test results with analytics
 */
abTests.get("/:id/results", async (c) => {
  const user = c.get("user");
  const testId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const test = await db.select().from(schema.abTests).where(eq(schema.abTests.id, testId)).limit(1);

  if (!test[0]) {
    return notFound(c, "A/B test not found");
  }

  if (test[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this A/B test");
  }

  // Get clicks for each variant from the clicks table
  const variantClicks = await db
    .select({
      variant: schema.clicks.abVariant,
      clicks: sql<number>`count(*)`,
    })
    .from(schema.clicks)
    .where(eq(schema.clicks.abTestId, testId))
    .groupBy(schema.clicks.abVariant);

  // Get conversions for each variant
  const variantConversions = await db
    .select({
      variant: schema.conversions.abVariant,
      conversions: sql<number>`count(*)`,
      revenue: sql<number>`COALESCE(SUM(${schema.conversions.value}), 0)`,
    })
    .from(schema.conversions)
    .where(eq(schema.conversions.abTestId, testId))
    .groupBy(schema.conversions.abVariant);

  const variants = JSON.parse(test[0].variants) as ABVariant[];

  // Enrich variants with stats
  const enrichedVariants = variants.map((v) => {
    const clickData = variantClicks.find((vc) => vc.variant === v.id);
    const conversionData = variantConversions.find((vc) => vc.variant === v.id);

    const clicks = clickData?.clicks ?? 0;
    const conversions = conversionData?.conversions ?? 0;
    const revenue = conversionData?.revenue ?? 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

    return {
      ...v,
      clicks,
      conversions,
      revenue,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  });

  // Calculate statistical significance (simplified)
  const totalClicks = enrichedVariants.reduce((sum, v) => sum + v.clicks, 0);
  const totalConversions = enrichedVariants.reduce((sum, v) => sum + v.conversions, 0);

  // Find current leader
  const leader = enrichedVariants.reduce((best, current) =>
    current.conversionRate > best.conversionRate ? current : best
  );

  return ok(c, {
    test: formatABTest(test[0]),
    variants: enrichedVariants,
    summary: {
      totalClicks,
      totalConversions,
      overallConversionRate:
        totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 10000) / 100 : 0,
      leaderId: leader.id,
      leaderName: leader.name,
      isSignificant: totalClicks >= 100, // Simplified significance check
    },
  });
});

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ABVariant {
  id: string;
  url: string;
  weight: number;
  name: string;
  clicks: number;
  conversions: number;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function formatABTest(test: schema.ABTest) {
  return {
    id: test.id,
    name: test.name,
    description: test.description,
    status: test.status,
    variants: JSON.parse(test.variants),
    winnerVariantId: test.winnerVariantId,
    trafficPercentage: test.trafficPercentage,
    startedAt: test.startedAt,
    endedAt: test.endedAt,
    createdAt: test.createdAt,
    updatedAt: test.updatedAt,
  };
}

export { abTests };
