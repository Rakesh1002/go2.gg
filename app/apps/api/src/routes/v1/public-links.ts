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

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env, CachedLink } from "../../bindings.js";
import { created, badRequest } from "../../lib/response.js";
import { generateSlug, isReservedSlug } from "../../lib/slug.js";
import { generateSingleAISlug } from "../../lib/ai-slug.js";

const publicLinks = new Hono<{ Bindings: Env }>();

// Simple rate limiting counter (in production use Durable Objects)
const GUEST_RATE_LIMIT = 10; // links per hour per IP

// Validation schema for guest link creation (simpler than authenticated)
const createGuestLinkSchema = z.object({
  destinationUrl: z.string().url("Invalid URL"),
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
publicLinks.post("/", zValidator("json", createGuestLinkSchema), async (c) => {
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Get client IP for rate limiting
  const clientIP = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
  const rateLimitKey = `guest_links:${clientIP}`;

  // Check rate limit using KV
  const currentCount = await c.env.KV_CONFIG.get(rateLimitKey);
  if (currentCount && parseInt(currentCount, 10) >= GUEST_RATE_LIMIT) {
    return badRequest(c, "Rate limit exceeded. Sign up for unlimited links!");
  }

  const domain = c.env.DEFAULT_DOMAIN ?? "go2.gg";

  // Generate AI-powered slug for memorable short URLs
  let slug: string;
  try {
    slug = await generateSingleAISlug(c.env.AI, input.destinationUrl, 8);
  } catch {
    // Fall back to random slug if AI fails
    slug = generateSlug(6);
  }

  // Check if reserved (unlikely but safe)
  if (isReservedSlug(slug)) {
    slug = generateSlug(7);
  }

  // Check if slug already exists (very unlikely with random generation)
  const existing = await db
    .select({ id: schema.links.id })
    .from(schema.links)
    .where(and(eq(schema.links.domain, domain), eq(schema.links.slug, slug)))
    .limit(1);

  if (existing.length > 0) {
    // Regenerate - shouldn't happen often
    return publicLinks.fetch(c.req.raw, c.env, c.executionCtx);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Guest links expire in 24 hours
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const newLink: schema.NewLink = {
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
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.links).values(newLink);

  // Sync to KV for fast edge lookups
  const cachedLink: CachedLink = {
    id,
    destinationUrl: input.destinationUrl,
    domain,
    slug,
    expiresAt,
  };

  await c.env.LINKS_KV.put(`${domain}:${slug}`, JSON.stringify(cachedLink), {
    expirationTtl: 60 * 60 * 24, // 24 hours
  });

  // Increment rate limit counter
  const newCount = currentCount ? parseInt(currentCount, 10) + 1 : 1;
  await c.env.KV_CONFIG.put(rateLimitKey, newCount.toString(), {
    expirationTtl: 60 * 60, // 1 hour
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
});

export { publicLinks };
