/**
 * Contact Form API Routes (v1)
 *
 * Handles contact form submissions from the marketing site:
 * - POST /contact - Submit a contact form
 * - GET /contact - List contact submissions (admin only)
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { desc } from "drizzle-orm";
import type { Env } from "../../bindings.js";
import { ok, error } from "../../lib/response.js";
import * as schema from "@repo/db";

const contact = new Hono<{ Bindings: Env }>();

// Admin email for receiving contact form notifications
const ADMIN_EMAIL = "rakesh@go2.gg";

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  message: z.string().min(20, "Message must be at least 20 characters").max(5000),
  source: z.string().max(50).optional(), // website, enterprise, support
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * POST /contact
 * Submit a contact form
 */
contact.post("/", zValidator("json", contactFormSchema), async (c) => {
  const input = c.req.valid("json");

  try {
    const db = drizzle(c.env.DB, { schema });

    // Get user info if authenticated
    const user = c.get("user");

    // Get request metadata
    const ipAddress = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for");
    const userAgent = c.req.header("user-agent");

    // Store submission in database
    const id = crypto.randomUUID();
    await db.insert(schema.contactSubmissions).values({
      id,
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      source: input.source || "website",
      status: "new",
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      userId: user?.id || null,
    });

    // Queue email to admin (rakesh@go2.gg)
    if (c.env.BACKGROUND_QUEUE) {
      await c.env.BACKGROUND_QUEUE.send({
        type: "email:send",
        payload: {
          to: ADMIN_EMAIL,
          template: "contact-form",
          data: {
            name: input.name,
            email: input.email,
            subject: input.subject,
            message: input.message,
            submittedAt: new Date().toISOString(),
            submissionId: id,
            source: input.source || "website",
          },
          isMarketing: false,
          replyTo: input.email,
        },
      });
    }

    console.log("[Contact Form] Submission stored:", {
      id,
      email: input.email,
      subject: input.subject,
      source: input.source || "website",
      timestamp: new Date().toISOString(),
    });

    return ok(c, {
      success: true,
      message: "Your message has been sent. We'll get back to you soon!",
      id,
    });
  } catch (err) {
    console.error("[Contact Form] Error:", err);
    return error(c, "Failed to send message. Please try again.", 500);
  }
});

/**
 * GET /contact
 * List contact submissions (admin only)
 */
contact.get("/", async (c) => {
  const authHeader = c.req.header("authorization");
  const adminKey = c.env.INTERNAL_API_KEY;

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return error(c, "Unauthorized", 401);
  }

  try {
    const db = drizzle(c.env.DB, { schema });

    const submissions = await db
      .select()
      .from(schema.contactSubmissions)
      .orderBy(desc(schema.contactSubmissions.createdAt))
      .limit(100);

    return ok(c, {
      success: true,
      data: submissions,
      count: submissions.length,
    });
  } catch (err) {
    console.error("[Contact Form] List error:", err);
    return error(c, "Failed to list submissions", 500);
  }
});

export { contact };
