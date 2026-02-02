/**
 * AI Routes (v1)
 *
 * AI-powered features:
 * - POST /ai/preview - Generate AI link preview
 * - GET /ai/scheduling - Get scheduling recommendations
 * - GET /ai/suggestions - Get content suggestions
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, sql } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok, badRequest } from "../../lib/response.js";
import {
  generateAILinkPreview,
  analyzeClickPatterns,
  generateSchedulingRecommendation,
  generateContentSuggestions,
} from "../../lib/ai-slug.js";

const aiRouter = new Hono<{ Bindings: Env }>();

// All routes require authentication
aiRouter.use("/*", apiKeyAuthMiddleware());

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const previewSchema = z.object({
  url: z.string().url("Invalid URL"),
  pageContent: z.string().max(2000).optional(),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * POST /ai/preview
 * Generate AI-powered OG metadata for a URL
 */
aiRouter.post("/preview", zValidator("json", previewSchema), async (c) => {
  const { url, pageContent } = c.req.valid("json");

  try {
    const preview = await generateAILinkPreview(c.env.AI, url); // Removed pageContent as it fetches it
    return ok(c, preview);
  } catch (error) {
    console.error("AI preview generation failed:", error);
    return badRequest(c, "Failed to generate preview");
  }
});

/**
 * GET /ai/scheduling
 * Get scheduling recommendations based on click patterns
 */
aiRouter.get("/scheduling", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });

  // Get user's links
  const links = await db
    .select({ id: schema.links.id })
    .from(schema.links)
    .where(eq(schema.links.userId, user.id));

  // Return null when user has no links - frontend should hide the component
  if (links.length === 0) {
    return ok(c, null);
  }

  const linkIds = links.map((l) => l.id);

  // Get recent clicks (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const clicks = await db
    .select({
      timestamp: schema.clicks.timestamp,
      country: schema.clicks.country,
    })
    .from(schema.clicks)
    .where(
      sql`${schema.clicks.linkId} IN (${sql.raw(linkIds.map((id) => `'${id}'`).join(","))}) AND ${schema.clicks.timestamp} > ${thirtyDaysAgo.toISOString()}`
    )
    .limit(1000);

  /*
   * Enhanced with AI Summary
   */
  const analysis = analyzeClickPatterns(
    clicks.map((c) => ({
      timestamp: c.timestamp,
      country: c.country ?? undefined,
    }))
  );

  // If we have enough confidence, generate AI summary
  let aiSummary = analysis.reasoning;
  if (analysis.confidence > 0.4) {
    try {
      // Group clicks by hour for the prompt
      const hourlyData: Record<string, number> = {};
      clicks.forEach((c) => {
        const d = new Date(c.timestamp);
        const k = `${d.getUTCDay()}-${d.getUTCHours()}`;
        hourlyData[k] = (hourlyData[k] || 0) + 1;
      });

      const topSlots = Object.entries(hourlyData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, count]) => {
          const [day, hour] = k.split("-").map(Number);
          return { dayOfWeek: day, hour, count };
        });

      const recommendation = await generateSchedulingRecommendation(c.env.AI, topSlots);
      aiSummary = recommendation.summary;
    } catch (e) {
      console.error("AI scheduling summary failed", e);
    }
  }

  return ok(c, {
    ...analysis,
    reasoning: aiSummary, // Override reasoning with AI version if successful
  });
});

/**
 * GET /ai/suggestions
 * Get AI-powered content suggestions
 */
aiRouter.get("/suggestions", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });

  // Get top performing links
  const topLinks = await db
    .select({
      url: schema.links.destinationUrl,
      clicks: schema.links.clickCount,
      title: schema.links.title,
    })
    .from(schema.links)
    .where(eq(schema.links.userId, user.id))
    .orderBy(desc(schema.links.clickCount))
    .limit(5);

  // Get low performing links (with at least 7 days old)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const lowLinks = await db
    .select({
      url: schema.links.destinationUrl,
      clicks: schema.links.clickCount,
      title: schema.links.title,
    })
    .from(schema.links)
    .where(
      sql`${schema.links.userId} = ${user.id} AND ${schema.links.createdAt} < ${sevenDaysAgo.toISOString()}`
    )
    .orderBy(schema.links.clickCount)
    .limit(5);

  const suggestions = await generateContentSuggestions(
    c.env.AI,
    topLinks.map((l) => ({
      url: l.url,
      clicks: l.clicks ?? 0,
      title: l.title ?? undefined,
    })),
    lowLinks.map((l) => ({
      url: l.url,
      clicks: l.clicks ?? 0,
      title: l.title ?? undefined,
    }))
  );

  return ok(c, {
    suggestions,
    topPerformers: topLinks.slice(0, 3),
    needsAttention: lowLinks.filter((l) => (l.clicks ?? 0) < 5).slice(0, 3),
  });
});

export { aiRouter };
