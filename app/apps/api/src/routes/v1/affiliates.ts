/**
 * Affiliate Routes (v1)
 *
 * Affiliate program management:
 * - GET /affiliates/me - Get current user's affiliate status
 * - POST /affiliates/apply - Apply to become an affiliate
 * - GET /affiliates/referrals - List referrals and earnings
 * - PUT /affiliates/payout-info - Update payout information
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok, notFound, conflict } from "../../lib/response.js";

const affiliates = new Hono<{ Bindings: Env }>();

// All routes require authentication
affiliates.use("/*", apiKeyAuthMiddleware());

// Validation schemas
const applySchema = z.object({
  paypalEmail: z.string().email().optional(),
});

const payoutInfoSchema = z.object({
  paypalEmail: z.string().email("Invalid PayPal email"),
});

/**
 * Generate a unique affiliate code
 */
function generateAffiliateCode(userId: string): string {
  const prefix = "GO2";
  const hash = userId.slice(0, 6).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${hash}-${random}`;
}

/**
 * GET /affiliates/me
 * Get current user's affiliate status
 */
affiliates.get("/me", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });

  const affiliate = await db
    .select()
    .from(schema.affiliates)
    .where(eq(schema.affiliates.userId, user.id))
    .limit(1);

  if (affiliate.length === 0) {
    return ok(c, {
      isAffiliate: false,
      status: null,
      affiliate: null,
    });
  }

  const aff = affiliate[0];

  // Get referral stats
  const referralStats = await db
    .select({
      total: sql<number>`COUNT(*)`,
      paid: sql<number>`SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)`,
      pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
    })
    .from(schema.affiliateReferrals)
    .where(eq(schema.affiliateReferrals.affiliateId, aff.id));

  return ok(c, {
    isAffiliate: true,
    status: aff.status,
    affiliate: {
      id: aff.id,
      code: aff.code,
      commissionRate: aff.commissionRate,
      totalEarnings: aff.totalEarnings,
      paidEarnings: aff.paidEarnings,
      pendingEarnings: aff.pendingEarnings,
      paypalEmail: aff.paypalEmail,
      createdAt: aff.createdAt,
    },
    stats: {
      totalReferrals: Number(referralStats[0]?.total) || 0,
      paidReferrals: Number(referralStats[0]?.paid) || 0,
      pendingReferrals: Number(referralStats[0]?.pending) || 0,
    },
  });
});

/**
 * POST /affiliates/apply
 * Apply to become an affiliate
 */
affiliates.post("/apply", zValidator("json", applySchema), async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });
  const { paypalEmail } = c.req.valid("json");

  // Check if user already has an affiliate account
  const existing = await db
    .select({ id: schema.affiliates.id, status: schema.affiliates.status })
    .from(schema.affiliates)
    .where(eq(schema.affiliates.userId, user.id))
    .limit(1);

  if (existing.length > 0) {
    return conflict(c, `You already have an affiliate application (status: ${existing[0].status})`);
  }

  // Create affiliate application
  const affiliateId = crypto.randomUUID();
  const code = generateAffiliateCode(user.id);
  const now = new Date().toISOString();

  await db.insert(schema.affiliates).values({
    id: affiliateId,
    userId: user.id,
    code,
    commissionRate: 0.4, // 40% commission
    status: "pending",
    paypalEmail: paypalEmail || null,
    totalEarnings: 0,
    paidEarnings: 0,
    pendingEarnings: 0,
    createdAt: now,
    updatedAt: now,
  });

  return ok(c, {
    message: "Affiliate application submitted successfully",
    affiliate: {
      id: affiliateId,
      code,
      status: "pending",
      commissionRate: 0.4,
    },
  });
});

/**
 * GET /affiliates/referrals
 * List referrals and earnings
 */
affiliates.get("/referrals", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });

  // Get affiliate
  const affiliate = await db
    .select()
    .from(schema.affiliates)
    .where(eq(schema.affiliates.userId, user.id))
    .limit(1);

  if (affiliate.length === 0) {
    return notFound(c, "Not an affiliate");
  }

  const aff = affiliate[0];

  // Get referrals with user info
  const referrals = await db
    .select({
      id: schema.affiliateReferrals.id,
      referredUserId: schema.affiliateReferrals.referredUserId,
      subscriptionId: schema.affiliateReferrals.subscriptionId,
      commissionAmount: schema.affiliateReferrals.commissionAmount,
      status: schema.affiliateReferrals.status,
      paidAt: schema.affiliateReferrals.paidAt,
      createdAt: schema.affiliateReferrals.createdAt,
      userName: schema.users.name,
      userEmail: schema.users.email,
    })
    .from(schema.affiliateReferrals)
    .leftJoin(schema.users, eq(schema.affiliateReferrals.referredUserId, schema.users.id))
    .where(eq(schema.affiliateReferrals.affiliateId, aff.id))
    .orderBy(desc(schema.affiliateReferrals.createdAt))
    .limit(50);

  return ok(c, {
    referrals: referrals.map((r) => ({
      id: r.id,
      user: r.referredUserId
        ? {
            name: r.userName,
            email: r.userEmail ? `${r.userEmail.slice(0, 3)}***@***` : null, // Obfuscate email
          }
        : null,
      commissionAmount: r.commissionAmount,
      status: r.status,
      paidAt: r.paidAt,
      createdAt: r.createdAt,
    })),
  });
});

/**
 * PUT /affiliates/payout-info
 * Update payout information
 */
affiliates.put("/payout-info", zValidator("json", payoutInfoSchema), async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });
  const { paypalEmail } = c.req.valid("json");

  // Get affiliate
  const affiliate = await db
    .select({ id: schema.affiliates.id })
    .from(schema.affiliates)
    .where(eq(schema.affiliates.userId, user.id))
    .limit(1);

  if (affiliate.length === 0) {
    return notFound(c, "Not an affiliate");
  }

  // Update payout info
  await db
    .update(schema.affiliates)
    .set({
      paypalEmail,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.affiliates.id, affiliate[0].id));

  return ok(c, {
    message: "Payout information updated",
    paypalEmail,
  });
});

export { affiliates as affiliatesRouter };
