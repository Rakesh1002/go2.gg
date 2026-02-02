/**
 * Slug Suggestion Routes
 *
 * AI-powered and quick slug generation for short links.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { ok, badRequest } from "../../lib/response.js";
import {
  generateAISlugs,
  generateQuickSuggestions,
  generateAILinkPreview,
  generateSchedulingRecommendation,
} from "../../lib/ai-slug.js";
import { isReservedSlug, isValidSlug } from "../../lib/slug.js";

const slugs = new Hono<{ Bindings: Env }>();

const suggestSchema = z.object({
  url: z.string().url("Valid URL required"),
  count: z.number().min(1).max(10).optional().default(5),
  style: z.enum(["short", "memorable", "professional"]).optional(),
  maxLength: z.number().min(3).max(50).optional().default(12),
});

const checkSchema = z.object({
  slug: z.string().min(1).max(50),
  domain: z.string().optional(),
});

/**
 * POST /slugs/suggest
 * Get AI-powered slug suggestions for a URL
 */
slugs.post("/suggest", zValidator("json", suggestSchema), async (c) => {
  const input = c.req.valid("json");

  try {
    // First return quick suggestions for instant feedback
    const quick = generateQuickSuggestions(input.url, 2);

    // Then get AI-powered suggestions
    const aiSuggestions = await generateAISlugs(c.env.AI, input.url, {
      count: input.count,
      style: input.style,
      maxLength: input.maxLength,
    });

    // Combine and dedupe
    const allSuggestions = [...new Set([...quick, ...aiSuggestions])];

    // Check availability for each suggestion
    const db = drizzle(c.env.DB, { schema });
    const domain = c.env.DEFAULT_DOMAIN ?? "go2.gg";

    const available: string[] = [];
    const taken: string[] = [];

    for (const slug of allSuggestions) {
      const exists = await db
        .select({ id: schema.links.id })
        .from(schema.links)
        .where(and(eq(schema.links.domain, domain), eq(schema.links.slug, slug)))
        .limit(1);

      if (exists.length === 0 && !isReservedSlug(slug)) {
        available.push(slug);
      } else {
        taken.push(slug);
      }
    }

    return ok(c, {
      suggestions: available.slice(0, input.count),
      taken,
      domain,
    });
  } catch (error) {
    console.error("Slug suggestion error:", error);
    // Fall back to quick suggestions only
    const quick = generateQuickSuggestions(input.url, input.count);
    return ok(c, {
      suggestions: quick,
      taken: [],
      domain: c.env.DEFAULT_DOMAIN ?? "go2.gg",
    });
  }
});

/**
 * POST /slugs/quick
 * Get instant slug suggestions without AI (faster, no API calls)
 */
slugs.post("/quick", zValidator("json", suggestSchema), async (c) => {
  const input = c.req.valid("json");

  const suggestions = generateQuickSuggestions(input.url, input.count);
  const domain = c.env.DEFAULT_DOMAIN ?? "go2.gg";

  // Check availability
  const db = drizzle(c.env.DB, { schema });
  const available: string[] = [];

  for (const slug of suggestions) {
    const exists = await db
      .select({ id: schema.links.id })
      .from(schema.links)
      .where(and(eq(schema.links.domain, domain), eq(schema.links.slug, slug)))
      .limit(1);

    if (exists.length === 0 && !isReservedSlug(slug)) {
      available.push(slug);
    }
  }

  return ok(c, {
    suggestions: available,
    domain,
  });
});

/**
 * POST /slugs/check
 * Check if a slug is available
 */
slugs.post("/check", zValidator("json", checkSchema), async (c) => {
  const input = c.req.valid("json");
  const slug = input.slug.toLowerCase();

  // Validate format
  if (!isValidSlug(slug)) {
    return ok(c, {
      available: false,
      reason: "Invalid format. Use only letters, numbers, hyphens, and underscores.",
    });
  }

  // Check reserved
  if (isReservedSlug(slug)) {
    return ok(c, {
      available: false,
      reason: "This slug is reserved.",
    });
  }

  // Check database
  const db = drizzle(c.env.DB, { schema });
  const domain = input.domain ?? c.env.DEFAULT_DOMAIN ?? "go2.gg";

  const exists = await db
    .select({ id: schema.links.id })
    .from(schema.links)
    .where(and(eq(schema.links.domain, domain), eq(schema.links.slug, slug)))
    .limit(1);

  if (exists.length > 0) {
    return ok(c, {
      available: false,
      reason: "This slug is already in use.",
    });
  }

  return ok(c, {
    available: true,
    slug,
    domain,
  });
});

// -----------------------------------------------------------------------------
// AI Preview Generation
// -----------------------------------------------------------------------------

const previewSchema = z.object({
  url: z.string().url("Valid URL required"),
});

/**
 * POST /slugs/preview
 * Generate AI-powered link preview (title, description)
 */
slugs.post("/preview", zValidator("json", previewSchema), async (c) => {
  const input = c.req.valid("json");

  try {
    const preview = await generateAILinkPreview(c.env.AI, input.url);

    return ok(c, {
      title: preview.title,
      description: preview.description,
      suggestedImage: preview.suggestedImage,
      url: input.url,
    });
  } catch (error) {
    console.error("AI preview generation error:", error);

    // Fallback to basic info
    try {
      const url = new URL(input.url);
      return ok(c, {
        title: url.hostname,
        description: `Visit ${url.hostname}`,
        suggestedImage: null,
        url: input.url,
      });
    } catch {
      return badRequest(c, "Failed to generate preview");
    }
  }
});

/**
 * POST /slugs/scheduling
 * Get AI scheduling recommendations based on click data
 */
slugs.post("/scheduling", async (c) => {
  try {
    const body = await c.req.json<{
      clickData: Array<{ hour: number; dayOfWeek: number; count: number }>;
    }>();

    if (!body.clickData || !Array.isArray(body.clickData)) {
      return badRequest(c, "Click data is required");
    }

    const recommendations = await generateSchedulingRecommendation(c.env.AI, body.clickData);

    return ok(c, recommendations);
  } catch (error) {
    console.error("Scheduling recommendation error:", error);
    return ok(c, {
      bestTimes: [],
      summary: "Unable to generate recommendations. Need more click data.",
    });
  }
});

export { slugs };
