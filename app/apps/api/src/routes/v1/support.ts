/**
 * Support Agent API Routes (v1)
 *
 * AI-powered support with RAG over documentation:
 * - POST /support/query - Submit a support query
 * - POST /support/feedback - Provide feedback on a response
 * - POST /support/ticket - Submit a support ticket (stored in DB)
 * - GET /support/tickets - List support tickets (admin only)
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { desc, eq } from "drizzle-orm";
import type { Env } from "../../bindings.js";
import { ok, error } from "../../lib/response.js";
import {
  processSupportQuery,
  getCannedResponse,
  type SupportQuery,
  type TicketCategory,
} from "../../lib/support-agent.js";
import * as schema from "@repo/db";

const support = new Hono<{ Bindings: Env }>();

// Admin email for receiving support ticket notifications
const ADMIN_EMAIL = "rakesh@go2.gg";

// Categories that should always be forwarded to admin
const HIGH_PRIORITY_CATEGORIES = ["urgent", "billing", "enterprise"];

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const supportQuerySchema = z.object({
  message: z.string().min(1).max(5000),
  category: z
    .enum([
      "how_to",
      "bug_report",
      "billing",
      "feature_request",
      "account",
      "api",
      "urgent",
    ] as const)
    .optional(),
  userEmail: z.string().email().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const supportTicketSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  name: z.string().min(2).max(100).optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  message: z.string().min(20, "Message must be at least 20 characters").max(5000),
  category: z
    .enum([
      "how_to",
      "bug_report",
      "billing",
      "feature_request",
      "account",
      "api",
      "urgent",
      "enterprise",
      "other",
    ] as const)
    .optional(),
  priority: z.enum(["low", "medium", "high", "urgent"] as const).optional(),
});

const feedbackSchema = z.object({
  queryId: z.string().uuid(),
  helpful: z.boolean(),
  comment: z.string().max(1000).optional(),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * POST /support/query
 * Submit a support query and get an AI-powered response
 */
support.post("/query", zValidator("json", supportQuerySchema), async (c) => {
  const input = c.req.valid("json");
  const user = c.get("user");

  // Build query object
  const query: SupportQuery = {
    message: input.message,
    category: input.category,
    userEmail: input.userEmail || user?.email,
    userId: user?.id,
    organizationId: user?.organizationId ?? undefined,
    metadata: input.metadata,
  };

  // First, try canned responses for common questions (faster)
  const cannedResponse = getCannedResponse(input.message);
  if (cannedResponse) {
    return ok(c, {
      queryId: crypto.randomUUID(),
      response: cannedResponse,
      cached: true,
    });
  }

  // Process with AI
  try {
    const response = await processSupportQuery(c.env, query);

    return ok(c, {
      queryId: crypto.randomUUID(),
      response,
      cached: false,
    });
  } catch (err) {
    console.error("Support query error:", err);
    return error(c, "Failed to process support query", 500);
  }
});

/**
 * POST /support/feedback
 * Provide feedback on a support response
 */
support.post("/feedback", zValidator("json", feedbackSchema), async (c) => {
  const input = c.req.valid("json");

  // Log feedback for analysis
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "support_feedback",
      queryId: input.queryId,
      helpful: input.helpful,
      comment: input.comment,
    })
  );

  // In a full implementation, you would:
  // 1. Store feedback in database
  // 2. Use feedback to improve responses
  // 3. Flag unhelpful responses for review

  return ok(c, {
    message: "Thank you for your feedback!",
    received: true,
  });
});

/**
 * GET /support/categories
 * Get available support categories
 */
support.get("/categories", async (c) => {
  const categories: Array<{
    id: TicketCategory | "enterprise" | "other";
    name: string;
    description: string;
  }> = [
    {
      id: "how_to",
      name: "How To",
      description: "Questions about using Go2 features",
    },
    {
      id: "bug_report",
      name: "Bug Report",
      description: "Report an issue or unexpected behavior",
    },
    {
      id: "billing",
      name: "Billing",
      description: "Subscription, payments, and invoices",
    },
    {
      id: "feature_request",
      name: "Feature Request",
      description: "Suggest a new feature or improvement",
    },
    {
      id: "account",
      name: "Account",
      description: "Login, password, and account settings",
    },
    {
      id: "api",
      name: "API & Integrations",
      description: "API usage, webhooks, and integrations",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Enterprise plans, SSO, and custom solutions",
    },
    {
      id: "urgent",
      name: "Urgent",
      description: "Critical issues requiring immediate attention",
    },
    {
      id: "other",
      name: "Other",
      description: "General inquiries and other topics",
    },
  ];

  return ok(c, { categories });
});

/**
 * POST /support/ticket
 * Submit a support ticket (stored in database and forwarded to admin)
 */
support.post("/ticket", zValidator("json", supportTicketSchema), async (c) => {
  const input = c.req.valid("json");

  try {
    const db = drizzle(c.env.DB, { schema });

    // Get user info if authenticated
    const user = c.get("user");

    // Get request metadata
    const ipAddress = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for");
    const userAgent = c.req.header("user-agent");

    // Determine priority
    const category = input.category || "other";
    let priority = input.priority || "medium";

    // Auto-escalate priority for urgent/enterprise/billing categories
    if (HIGH_PRIORITY_CATEGORIES.includes(category) && priority === "medium") {
      priority = "high";
    }
    if (category === "urgent") {
      priority = "urgent";
    }

    // Store ticket in database
    const id = crypto.randomUUID();
    await db.insert(schema.supportTickets).values({
      id,
      email: input.email,
      name: input.name || null,
      subject: input.subject,
      message: input.message,
      category: category as schema.SupportTicketCategory,
      priority: priority as schema.SupportTicketPriority,
      status: "open",
      userId: user?.id || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    // Forward to admin via email
    if (c.env.BACKGROUND_QUEUE) {
      await c.env.BACKGROUND_QUEUE.send({
        type: "email:send",
        payload: {
          to: ADMIN_EMAIL,
          template: "support-ticket",
          data: {
            ticketId: id,
            name: input.name || "Anonymous",
            email: input.email,
            subject: input.subject,
            message: input.message,
            category,
            priority,
            submittedAt: new Date().toISOString(),
          },
          isMarketing: false,
          replyTo: input.email,
        },
      });
    }

    console.log("[Support Ticket] Created:", {
      id,
      email: input.email,
      category,
      priority,
      timestamp: new Date().toISOString(),
    });

    return ok(c, {
      success: true,
      message: "Your support ticket has been submitted. We'll get back to you soon!",
      ticketId: id,
    });
  } catch (err) {
    console.error("[Support Ticket] Error:", err);
    return error(c, "Failed to submit support ticket. Please try again.", 500);
  }
});

/**
 * GET /support/tickets
 * List support tickets (admin only)
 */
support.get("/tickets", async (c) => {
  const authHeader = c.req.header("authorization");
  const adminKey = c.env.INTERNAL_API_KEY;

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return error(c, "Unauthorized", 401);
  }

  try {
    const db = drizzle(c.env.DB, { schema });

    const statusFilter = c.req.query("status");
    const categoryFilter = c.req.query("category");

    // Get all tickets and filter in memory for simplicity
    const allTickets = await db
      .select()
      .from(schema.supportTickets)
      .orderBy(desc(schema.supportTickets.createdAt))
      .limit(100);

    // Filter in memory if needed
    const filteredTickets = allTickets.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (categoryFilter && t.category !== categoryFilter) return false;
      return true;
    });

    return ok(c, {
      success: true,
      data: filteredTickets,
      count: filteredTickets.length,
    });
  } catch (err) {
    console.error("[Support Tickets] List error:", err);
    return error(c, "Failed to list tickets", 500);
  }
});

/**
 * PATCH /support/tickets/:id
 * Update a support ticket (admin only)
 */
support.patch("/tickets/:id", async (c) => {
  const authHeader = c.req.header("authorization");
  const adminKey = c.env.INTERNAL_API_KEY;

  if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
    return error(c, "Unauthorized", 401);
  }

  const ticketId = c.req.param("id");
  const body = await c.req.json();

  try {
    const db = drizzle(c.env.DB, { schema });

    const updateData: Partial<schema.SupportTicket> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.status) updateData.status = body.status;
    if (body.priority) updateData.priority = body.priority;
    if (body.assignedTo) updateData.assignedTo = body.assignedTo;
    if (body.status === "resolved") {
      updateData.resolvedAt = new Date().toISOString();
    }

    await db
      .update(schema.supportTickets)
      .set(updateData)
      .where(eq(schema.supportTickets.id, ticketId));

    return ok(c, {
      success: true,
      message: "Ticket updated successfully",
    });
  } catch (err) {
    console.error("[Support Tickets] Update error:", err);
    return error(c, "Failed to update ticket", 500);
  }
});

export { support };
