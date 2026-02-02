/**
 * Claim Links Routes
 *
 * Allows users to claim guest-created links after signing up.
 * Uses a claim token stored in the browser to associate anonymous links.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, isNull, inArray } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok, badRequest, notFound } from "../../lib/response.js";

const claimLinks = new Hono<{ Bindings: Env }>();

// Claim endpoints require authentication (except /pending check)
claimLinks.use("/by-ids", apiKeyAuthMiddleware());
claimLinks.use("/by-token", apiKeyAuthMiddleware());

const claimByIdsSchema = z.object({
  linkIds: z.array(z.string().uuid()).min(1).max(50),
});

const claimByTokenSchema = z.object({
  claimToken: z.string().min(32).max(64),
});

/**
 * POST /claim/by-ids
 * Claim multiple links by their IDs
 *
 * The frontend stores link IDs in localStorage after guest creation.
 * When the user signs up, we transfer ownership of those links.
 */
claimLinks.post("/by-ids", zValidator("json", claimByIdsSchema), async (c) => {
  const user = c.get("user");
  const { linkIds } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  if (!user) {
    return badRequest(c, "Authentication required");
  }

  // Find all guest links (userId is null) with matching IDs
  const guestLinks = await db
    .select({ id: schema.links.id, slug: schema.links.slug })
    .from(schema.links)
    .where(and(inArray(schema.links.id, linkIds), isNull(schema.links.userId)));

  if (guestLinks.length === 0) {
    return ok(c, {
      claimed: 0,
      message: "No claimable links found. Links may have expired or already been claimed.",
    });
  }

  const now = new Date().toISOString();
  const claimedIds = guestLinks.map((l) => l.id);

  // Transfer ownership to the authenticated user
  await db
    .update(schema.links)
    .set({
      userId: user.id,
      organizationId: user.organizationId ?? null,
      description: null, // Remove "Guest link" description
      expiresAt: null, // Remove 24hr expiration
      updatedAt: now,
    })
    .where(inArray(schema.links.id, claimedIds));

  // Update KV cache to remove expiration
  for (const link of guestLinks) {
    const kvKey = `go2.gg:${link.slug}`;
    const cached = await c.env.LINKS_KV.get(kvKey, "json");
    if (cached) {
      const updatedCache = { ...(cached as object), expiresAt: undefined };
      await c.env.LINKS_KV.put(kvKey, JSON.stringify(updatedCache));
    }
  }

  return ok(c, {
    claimed: claimedIds.length,
    linkIds: claimedIds,
    message: `Successfully claimed ${claimedIds.length} link${claimedIds.length > 1 ? "s" : ""}!`,
  });
});

/**
 * POST /claim/by-token
 * Claim links by a session token (stored in cookie)
 *
 * Alternative approach using a server-side session token.
 */
claimLinks.post("/by-token", zValidator("json", claimByTokenSchema), async (c) => {
  const user = c.get("user");
  const { claimToken } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  if (!user) {
    return badRequest(c, "Authentication required");
  }

  // Look up links associated with this claim token
  const tokenKey = `claim_token:${claimToken}`;
  const storedLinkIds = await c.env.KV_CONFIG.get(tokenKey, "json");

  if (!storedLinkIds || !Array.isArray(storedLinkIds)) {
    return notFound(c, "No links found for this claim token");
  }

  // Find claimable links
  const guestLinks = await db
    .select({ id: schema.links.id, slug: schema.links.slug })
    .from(schema.links)
    .where(and(inArray(schema.links.id, storedLinkIds as string[]), isNull(schema.links.userId)));

  if (guestLinks.length === 0) {
    // Clean up expired token
    await c.env.KV_CONFIG.delete(tokenKey);
    return ok(c, {
      claimed: 0,
      message: "No claimable links found. Links may have expired.",
    });
  }

  const now = new Date().toISOString();
  const claimedIds = guestLinks.map((l) => l.id);

  // Transfer ownership
  await db
    .update(schema.links)
    .set({
      userId: user.id,
      organizationId: user.organizationId ?? null,
      description: null,
      expiresAt: null,
      updatedAt: now,
    })
    .where(inArray(schema.links.id, claimedIds));

  // Clean up the claim token
  await c.env.KV_CONFIG.delete(tokenKey);

  // Update KV cache
  for (const link of guestLinks) {
    const kvKey = `go2.gg:${link.slug}`;
    const cached = await c.env.LINKS_KV.get(kvKey, "json");
    if (cached) {
      const updatedCache = { ...(cached as object), expiresAt: undefined };
      await c.env.LINKS_KV.put(kvKey, JSON.stringify(updatedCache));
    }
  }

  return ok(c, {
    claimed: claimedIds.length,
    linkIds: claimedIds,
    message: `Successfully claimed ${claimedIds.length} link${claimedIds.length > 1 ? "s" : ""}!`,
  });
});

/**
 * GET /claim/pending
 * Check if there are any claimable links for a token
 */
claimLinks.get("/pending/:token", async (c) => {
  const claimToken = c.req.param("token");

  const tokenKey = `claim_token:${claimToken}`;
  const storedLinkIds = await c.env.KV_CONFIG.get(tokenKey, "json");

  if (!storedLinkIds || !Array.isArray(storedLinkIds)) {
    return ok(c, { pending: 0, linkIds: [] });
  }

  const db = drizzle(c.env.DB, { schema });

  // Check how many are still claimable
  const guestLinks = await db
    .select({ id: schema.links.id })
    .from(schema.links)
    .where(and(inArray(schema.links.id, storedLinkIds as string[]), isNull(schema.links.userId)));

  return ok(c, {
    pending: guestLinks.length,
    linkIds: guestLinks.map((l) => l.id),
  });
});

export { claimLinks };
