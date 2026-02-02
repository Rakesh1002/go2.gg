/**
 * Waitlist API Routes (v1)
 *
 * Handles waitlist signups from the marketing site:
 * - POST /waitlist - Add email to waitlist
 * - GET /waitlist - Export waitlist (admin only)
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import type { Env } from "../../bindings.js";
import { ok, error } from "../../lib/response.js";
import * as schema from "@repo/db";

const waitlist = new Hono<{ Bindings: Env }>();

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const waitlistSignupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  name: z.string().max(100).optional(),
  source: z.string().max(50).optional(), // landing, blog, footer, etc.
  referralCode: z.string().max(50).optional(),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * POST /waitlist
 * Add an email to the waitlist
 */
waitlist.post("/", zValidator("json", waitlistSignupSchema), async (c) => {
  const input = c.req.valid("json");

  try {
    const db = drizzle(c.env.DB, { schema });

    // Check if email already exists
    const existing = await db
      .select({ id: schema.waitlistEntries.id })
      .from(schema.waitlistEntries)
      .where(eq(schema.waitlistEntries.email, input.email))
      .get();

    if (existing) {
      // Already on waitlist - return success but don't add again
      return ok(c, {
        success: true,
        message: "You're already on the waitlist! We'll notify you soon.",
        alreadyExists: true,
      });
    }

    // Add to waitlist
    const id = crypto.randomUUID();
    await db.insert(schema.waitlistEntries).values({
      id,
      email: input.email,
      name: input.name || null,
      source: input.source || "website",
      referralCode: input.referralCode || null,
      notified: false,
    });

    // Queue confirmation email
    if (c.env.BACKGROUND_QUEUE) {
      await c.env.BACKGROUND_QUEUE.send({
        type: "email:send",
        payload: {
          to: input.email,
          template: "waitlist-confirmation",
          data: {
            name: input.name,
            email: input.email,
          },
          isMarketing: true,
        },
      });
    }

    console.log("[Waitlist] New signup:", {
      email: input.email,
      name: input.name,
      source: input.source,
      timestamp: new Date().toISOString(),
    });

    return ok(c, {
      success: true,
      message: "Welcome to the waitlist! Check your email for confirmation.",
    });
  } catch (err) {
    console.error("[Waitlist] Error:", err);
    return error(c, "Failed to join waitlist. Please try again.", 500);
  }
});

/**
 * GET /waitlist
 * Export waitlist (admin only, requires INTERNAL_API_KEY)
 */
waitlist.get("/", async (c) => {
  const authHeader = c.req.header("authorization");
  const adminKey = c.env.INTERNAL_API_KEY;

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return error(c, "Unauthorized", 401);
  }

  try {
    const db = drizzle(c.env.DB, { schema });

    const entries = await db
      .select()
      .from(schema.waitlistEntries)
      .orderBy(schema.waitlistEntries.createdAt);

    return ok(c, {
      success: true,
      data: entries,
      count: entries.length,
    });
  } catch (err) {
    console.error("[Waitlist] Export error:", err);
    return error(c, "Failed to export waitlist", 500);
  }
});

export { waitlist };
