/**
 * Newsletter API Routes (v1)
 *
 * Handles newsletter subscriptions from the marketing site:
 * - POST /newsletter - Subscribe to newsletter
 * - DELETE /newsletter - Unsubscribe from newsletter
 * - GET /newsletter - List subscribers (admin only)
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import type { Env } from "../../bindings.js";
import { ok, error } from "../../lib/response.js";
import * as schema from "@repo/db";

const newsletter = new Hono<{ Bindings: Env }>();

// Admin email for notifications (reserved for future admin notifications)
// const ADMIN_EMAIL = "rakesh@go2.gg";

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const subscribeSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  name: z.string().max(100).optional(),
  source: z.string().max(50).optional(), // footer, blog, landing, etc.
});

const unsubscribeSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * POST /newsletter
 * Subscribe to newsletter
 */
newsletter.post("/", zValidator("json", subscribeSchema), async (c) => {
  const input = c.req.valid("json");

  try {
    const db = drizzle(c.env.DB, { schema });

    // Get request metadata
    const ipAddress = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for");

    // Check if email already exists
    const existing = await db
      .select({ id: schema.newsletterSubscribers.id, isActive: schema.newsletterSubscribers.isActive })
      .from(schema.newsletterSubscribers)
      .where(eq(schema.newsletterSubscribers.email, input.email))
      .get();

    if (existing) {
      if (existing.isActive) {
        // Already subscribed
        return ok(c, {
          success: true,
          message: "You're already subscribed! We'll keep you updated.",
          alreadyExists: true,
        });
      } else {
        // Reactivate subscription
        await db
          .update(schema.newsletterSubscribers)
          .set({
            isActive: true,
            unsubscribedAt: null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.newsletterSubscribers.id, existing.id));

        return ok(c, {
          success: true,
          message: "Welcome back! Your subscription has been reactivated.",
          reactivated: true,
        });
      }
    }

    // Add new subscriber
    const id = crypto.randomUUID();
    await db.insert(schema.newsletterSubscribers).values({
      id,
      email: input.email,
      name: input.name || null,
      source: input.source || "website",
      isActive: true,
      ipAddress: ipAddress || null,
      confirmedAt: new Date().toISOString(), // Auto-confirm for now
    });

    // Queue confirmation email
    if (c.env.BACKGROUND_QUEUE) {
      await c.env.BACKGROUND_QUEUE.send({
        type: "email:send",
        payload: {
          to: input.email,
          template: "waitlist-confirmation", // Reuse waitlist template for now
          data: {
            name: input.name,
            email: input.email,
          },
          isMarketing: true,
        },
      });
    }

    console.log("[Newsletter] New subscriber:", {
      email: input.email,
      source: input.source || "website",
      timestamp: new Date().toISOString(),
    });

    return ok(c, {
      success: true,
      message: "Thanks for subscribing! Check your email for confirmation.",
    });
  } catch (err) {
    console.error("[Newsletter] Subscribe error:", err);
    return error(c, "Failed to subscribe. Please try again.", 500);
  }
});

/**
 * DELETE /newsletter
 * Unsubscribe from newsletter
 */
newsletter.delete("/", zValidator("json", unsubscribeSchema), async (c) => {
  const input = c.req.valid("json");

  try {
    const db = drizzle(c.env.DB, { schema });

    // Find subscriber
    const subscriber = await db
      .select({ id: schema.newsletterSubscribers.id })
      .from(schema.newsletterSubscribers)
      .where(eq(schema.newsletterSubscribers.email, input.email))
      .get();

    if (!subscriber) {
      return ok(c, {
        success: true,
        message: "You have been unsubscribed.",
      });
    }

    // Mark as inactive
    await db
      .update(schema.newsletterSubscribers)
      .set({
        isActive: false,
        unsubscribedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.newsletterSubscribers.id, subscriber.id));

    console.log("[Newsletter] Unsubscribed:", {
      email: input.email,
      timestamp: new Date().toISOString(),
    });

    return ok(c, {
      success: true,
      message: "You have been unsubscribed. We're sorry to see you go!",
    });
  } catch (err) {
    console.error("[Newsletter] Unsubscribe error:", err);
    return error(c, "Failed to unsubscribe. Please try again.", 500);
  }
});

/**
 * GET /newsletter
 * List newsletter subscribers (admin only)
 */
newsletter.get("/", async (c) => {
  const authHeader = c.req.header("authorization");
  const adminKey = c.env.INTERNAL_API_KEY;

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return error(c, "Unauthorized", 401);
  }

  try {
    const db = drizzle(c.env.DB, { schema });

    const activeOnly = c.req.query("active") !== "false";

    // Get all subscribers and filter based on activeOnly
    const allSubscribers = await db
      .select()
      .from(schema.newsletterSubscribers)
      .orderBy(desc(schema.newsletterSubscribers.createdAt));

    const subscribers = activeOnly
      ? allSubscribers.filter((s) => s.isActive)
      : allSubscribers;

    return ok(c, {
      success: true,
      data: subscribers,
      count: subscribers.length,
    });
  } catch (err) {
    console.error("[Newsletter] List error:", err);
    return error(c, "Failed to list subscribers", 500);
  }
});

export { newsletter };
