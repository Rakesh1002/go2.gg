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
import { captureEvent } from "../../lib/product-analytics.js";
import { ok, notFound, conflict } from "../../lib/response.js";

const affiliates = new Hono<{ Bindings: Env }>();

/**
 * GET /affiliates/lookup/:code
 *
 * Public, no-auth lookup used by the /r/<code> landing page to validate a
 * sharing link before setting the cookie. Returns minimal info — never
 * exposes the affiliate's user id or earnings. Approved-only matches return
 * `exists: true`; everything else returns `exists: false` so a leaked code
 * can't be enumerated for affiliate identities.
 *
 * NOTE: Mounted before the apiKeyAuthMiddleware so it stays public.
 */
affiliates.get("/lookup/:code", async (c) => {
  const code = c.req.param("code").toUpperCase();
  if (!/^[A-Z0-9-]{6,32}$/.test(code)) {
    return ok(c, { exists: false });
  }

  const db = drizzle(c.env.DB, { schema });
  const row = await db
    .select({
      status: schema.affiliates.status,
      userName: schema.users.name,
    })
    .from(schema.affiliates)
    .leftJoin(schema.users, eq(schema.affiliates.userId, schema.users.id))
    .where(eq(schema.affiliates.code, code))
    .limit(1);

  if (row.length === 0 || row[0].status !== "approved") {
    return ok(c, { exists: false });
  }

  return ok(c, {
    exists: true,
    status: row[0].status,
    affiliateName: row[0].userName ?? null,
  });
});

// All routes below require authentication
affiliates.use("/*", apiKeyAuthMiddleware());

// Validation schemas
const applySchema = z.object({
  paypalEmail: z.string().email().optional(),
});

const payoutInfoSchema = z.object({
  paypalEmail: z.string().email("Invalid PayPal email"),
});

const claimSchema = z.object({
  code: z.string().min(6).max(32),
});

/**
 * Default commission rate. Affiliate keeps 40% of every paid invoice from
 * referred users for the lifetime of their subscription.
 */
const DEFAULT_COMMISSION_RATE = 0.4;

/** Build the public share URL for an affiliate code. */
function shareUrl(env: Env, code: string): string {
  const base = (env.APP_URL || "https://go2.gg").replace(/\/+$/, "");
  return `${base}/r/${code}`;
}

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
      shareUrl: shareUrl(c.env, aff.code),
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

  // Auto-approve unless AFFILIATE_AUTO_APPROVE=false. Friction at apply-time
  // is what kills affiliate funnels — gate later on payout instead, where we
  // already need a manual review of PayPal email + earnings totals.
  const autoApprove = c.env.AFFILIATE_AUTO_APPROVE !== "false";
  const status: "approved" | "pending" = autoApprove ? "approved" : "pending";

  const affiliateId = crypto.randomUUID();
  const code = generateAffiliateCode(user.id);
  const now = new Date().toISOString();

  await db.insert(schema.affiliates).values({
    id: affiliateId,
    userId: user.id,
    code,
    commissionRate: DEFAULT_COMMISSION_RATE,
    status,
    paypalEmail: paypalEmail || null,
    totalEarnings: 0,
    paidEarnings: 0,
    pendingEarnings: 0,
    createdAt: now,
    updatedAt: now,
  });

  // Funnel event for product analytics.
  await captureEvent(c.env, {
    event: "affiliate_applied",
    distinctId: user.id,
    properties: {
      affiliateCode: code,
      autoApproved: autoApprove,
      status,
    },
  });

  // Welcome / approved email — only when auto-approved. Pending applicants
  // get an email from the admin approval action instead.
  if (autoApprove && c.env.BACKGROUND_QUEUE && user.email) {
    await c.env.BACKGROUND_QUEUE.send({
      type: "email:send",
      payload: {
        to: user.email,
        template: "affiliate-approved",
        data: {
          name: user.name ?? user.email.split("@")[0],
          shareUrl: shareUrl(c.env, code),
          code,
          commissionPercent: Math.round(DEFAULT_COMMISSION_RATE * 100),
        },
      },
    });
  }

  return ok(c, {
    message: autoApprove
      ? "You're in! Start sharing your link."
      : "Affiliate application submitted — we'll review and email you.",
    affiliate: {
      id: affiliateId,
      code,
      status,
      shareUrl: shareUrl(c.env, code),
      commissionRate: DEFAULT_COMMISSION_RATE,
    },
  });
});

/**
 * POST /affiliates/me/claim
 *
 * Records the referral attribution for the currently-authenticated user.
 * Called from the dashboard once after signup with the code stored in the
 * `go2_ref_code` cookie. Idempotent: subsequent calls for an already-attributed
 * user are no-ops. Self-referral is rejected. Sets a clearing Set-Cookie so
 * the browser drops the cookie after a successful claim.
 */
affiliates.post("/me/claim", zValidator("json", claimSchema), async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });
  const code = c.req.valid("json").code.toUpperCase();

  // 1. Already attributed? No-op.
  const existingMeta = await db
    .select({ referralCode: schema.userMetadata.referralCode })
    .from(schema.userMetadata)
    .where(eq(schema.userMetadata.userId, user.id))
    .limit(1);
  if (existingMeta[0]?.referralCode) {
    return clearCookieAndOk(c, { status: "already_claimed" });
  }

  // 2. Look up the affiliate by code (must be approved).
  const affiliateRow = await db
    .select({ id: schema.affiliates.id, userId: schema.affiliates.userId, status: schema.affiliates.status })
    .from(schema.affiliates)
    .where(eq(schema.affiliates.code, code))
    .limit(1);
  if (affiliateRow.length === 0 || affiliateRow[0].status !== "approved") {
    return clearCookieAndOk(c, { status: "invalid_code" });
  }

  // 3. Reject self-referral.
  if (affiliateRow[0].userId === user.id) {
    return clearCookieAndOk(c, { status: "self_referral_rejected" });
  }

  const now = new Date().toISOString();

  // 4. Stamp userMetadata.referralCode (upsert).
  await db
    .insert(schema.userMetadata)
    .values({ userId: user.id, referralCode: code, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: schema.userMetadata.userId,
      set: { referralCode: code, updatedAt: now },
    });

  // 5. Create the pending affiliateReferrals row. The commission_amount stays
  // null until the first paid invoice fires — see lib/affiliate-attribution.ts.
  await db.insert(schema.affiliateReferrals).values({
    id: crypto.randomUUID(),
    affiliateId: affiliateRow[0].id,
    referredUserId: user.id,
    subscriptionId: null,
    commissionAmount: null,
    status: "pending",
    paidAt: null,
    createdAt: now,
  });

  await captureEvent(c.env, {
    event: "affiliate_referral_claimed",
    distinctId: user.id,
    properties: {
      referredBy: affiliateRow[0].userId,
      affiliateCode: code,
    },
  });

  return clearCookieAndOk(c, { status: "claimed", affiliateCode: code });
});

/**
 * Helper: clears the go2_ref_code cookie on success/no-op responses so the
 * browser doesn't keep retrying the claim every dashboard load.
 */
function clearCookieAndOk(
  c: Parameters<typeof ok>[0],
  payload: Record<string, unknown>,
) {
  const response = ok(c, payload);
  response.headers.append(
    "Set-Cookie",
    "go2_ref_code=; Path=/; Max-Age=0; SameSite=Lax",
  );
  return response;
}

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

// ---------------------------------------------------------------------------
// Admin endpoints
// ---------------------------------------------------------------------------

/**
 * Tiny admin gate. Mirrors the (admin) layout's check against the
 * ADMIN_EMAILS env var so the API and web stay in sync without a
 * shared middleware. Returns true when the caller is allowed.
 */
function isAdmin(env: Env, email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(email);
}

/**
 * GET /affiliates/admin/payouts
 *
 * Lists every affiliate with `pendingEarnings > 0` for the manual payout
 * workflow. Admin-only. Returns the affiliate plus owner email + paypal so
 * the admin can copy/paste into PayPal Mass Payouts (no integration yet).
 */
affiliates.get("/admin/payouts", async (c) => {
  const user = c.get("user");
  if (!isAdmin(c.env, user.email)) return notFound(c, "Not found");

  const db = drizzle(c.env.DB, { schema });
  const rows = await db
    .select({
      id: schema.affiliates.id,
      userId: schema.affiliates.userId,
      code: schema.affiliates.code,
      paypalEmail: schema.affiliates.paypalEmail,
      pendingEarnings: schema.affiliates.pendingEarnings,
      paidEarnings: schema.affiliates.paidEarnings,
      totalEarnings: schema.affiliates.totalEarnings,
      ownerEmail: schema.users.email,
      ownerName: schema.users.name,
    })
    .from(schema.affiliates)
    .leftJoin(schema.users, eq(schema.affiliates.userId, schema.users.id))
    .where(sql`${schema.affiliates.pendingEarnings} > 0`)
    .orderBy(desc(schema.affiliates.pendingEarnings));

  return ok(c, { rows });
});

/**
 * POST /affiliates/admin/:id/mark-paid
 *
 * Zeroes out the affiliate's pendingEarnings, increments paidEarnings,
 * stamps paidAt on every paid-but-not-yet-paid-out referral row. The
 * actual money transfer happens out-of-band (PayPal Mass Payouts CSV).
 *
 * Body: { amount: number, paypalEmail?: string } — `amount` is the dollars
 * actually sent (must equal pendingEarnings; we accept it explicitly so
 * the admin can't pay out more than is owed).
 */
const markPaidSchema = z.object({
  amount: z.number().positive(),
});

affiliates.post(
  "/admin/:id/mark-paid",
  zValidator("json", markPaidSchema),
  async (c) => {
    const user = c.get("user");
    if (!isAdmin(c.env, user.email)) return notFound(c, "Not found");

    const affiliateId = c.req.param("id");
    const { amount } = c.req.valid("json");
    const db = drizzle(c.env.DB, { schema });

    const aff = await db
      .select()
      .from(schema.affiliates)
      .where(eq(schema.affiliates.id, affiliateId))
      .limit(1);
    if (aff.length === 0) return notFound(c, "Affiliate not found");
    const affRow = aff[0];

    const pending = affRow.pendingEarnings ?? 0;
    if (Math.abs(amount - pending) > 0.01) {
      return conflict(
        c,
        `Amount mismatch: pending is $${pending.toFixed(2)}, you sent $${amount.toFixed(2)}`,
      );
    }

    const now = new Date().toISOString();

    await db
      .update(schema.affiliates)
      .set({
        pendingEarnings: 0,
        paidEarnings: (affRow.paidEarnings ?? 0) + amount,
        updatedAt: now,
      })
      .where(eq(schema.affiliates.id, affiliateId));

    // Stamp paidAt on every paid-but-not-yet-paid-out referral row.
    await db
      .update(schema.affiliateReferrals)
      .set({ paidAt: now })
      .where(
        sql`${schema.affiliateReferrals.affiliateId} = ${affiliateId} AND ${schema.affiliateReferrals.status} = 'paid' AND ${schema.affiliateReferrals.paidAt} IS NULL`,
      );

    // Email the affiliate.
    if (c.env.BACKGROUND_QUEUE && affRow.paypalEmail) {
      const userRow = await db
        .select({ email: schema.users.email, name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, affRow.userId))
        .limit(1);
      if (userRow[0]?.email) {
        await c.env.BACKGROUND_QUEUE.send({
          type: "email:send",
          payload: {
            to: userRow[0].email,
            template: "affiliate-payout-sent",
            data: {
              name: userRow[0].name ?? userRow[0].email.split("@")[0],
              amount: `$${amount.toFixed(2)}`,
              paypalEmail: affRow.paypalEmail,
            },
          },
        });
      }
    }

    await captureEvent(c.env, {
      event: "affiliate_payout_sent",
      distinctId: affRow.userId,
      properties: {
        affiliateId,
        amount,
        paypalEmail: affRow.paypalEmail,
      },
    });

    return ok(c, { ok: true, paidAt: now, amount });
  },
);

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
