/**
 * Webhooks Routes (v1)
 *
 * CRUD operations for outgoing webhooks:
 * - POST /webhooks - Create a new webhook
 * - GET /webhooks - List user's webhooks
 * - GET /webhooks/:id - Get webhook by ID
 * - PATCH /webhooks/:id - Update webhook
 * - DELETE /webhooks/:id - Delete webhook
 * - POST /webhooks/:id/test - Send test event
 * - GET /webhooks/:id/deliveries - Get delivery history
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, desc, sql } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok, created, noContent, notFound, forbidden, badRequest } from "../../lib/response.js";
import { generateWebhookSecret, sendTestWebhook } from "../../lib/webhook-dispatcher.js";

const webhooksRouter = new Hono<{ Bindings: Env }>();

// All routes require authentication
webhooksRouter.use("/*", apiKeyAuthMiddleware());

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const webhookEvents = [
  "click",
  "link.created",
  "link.updated",
  "link.deleted",
  "domain.verified",
  "qr.scanned",
  "*",
] as const;

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url("Invalid webhook URL"),
  events: z.array(z.enum(webhookEvents)).min(1, "At least one event is required"),
});

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url("Invalid webhook URL").optional(),
  events: z.array(z.enum(webhookEvents)).min(1).optional(),
  isActive: z.boolean().optional(),
});

const listWebhooksSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * POST /webhooks
 * Create a new webhook
 */
webhooksRouter.post("/", zValidator("json", createWebhookSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  const id = crypto.randomUUID();
  const secret = generateWebhookSecret();
  const now = new Date().toISOString();

  const newWebhook: schema.NewWebhook = {
    id,
    userId: user.id,
    organizationId: user.organizationId,
    name: input.name,
    url: input.url,
    events: JSON.stringify(input.events),
    secret,
    isActive: true,
    failureCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.webhooks).values(newWebhook);

  // Return with secret visible only on creation
  return created(c, {
    id,
    name: input.name,
    url: input.url,
    events: input.events,
    secret, // Only shown on creation!
    isActive: true,
    failureCount: 0,
    createdAt: now,
  });
});

/**
 * GET /webhooks
 * List user's webhooks
 */
webhooksRouter.get("/", zValidator("query", listWebhooksSchema), async (c) => {
  const user = c.get("user");
  const { page, perPage } = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  const offset = (page - 1) * perPage;

  const conditions = [eq(schema.webhooks.userId, user.id)];

  const results = await db
    .select({
      id: schema.webhooks.id,
      name: schema.webhooks.name,
      url: schema.webhooks.url,
      events: schema.webhooks.events,
      isActive: schema.webhooks.isActive,
      lastTriggeredAt: schema.webhooks.lastTriggeredAt,
      lastStatus: schema.webhooks.lastStatus,
      failureCount: schema.webhooks.failureCount,
      createdAt: schema.webhooks.createdAt,
    })
    .from(schema.webhooks)
    .where(and(...conditions))
    .orderBy(desc(schema.webhooks.createdAt))
    .limit(perPage)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.webhooks)
    .where(and(...conditions));

  const total = countResult[0]?.count ?? 0;

  return ok(
    c,
    results.map((w) => ({
      ...w,
      events: JSON.parse(w.events),
    })),
    {
      page,
      perPage,
      total,
      hasMore: offset + results.length < total,
    }
  );
});

/**
 * GET /webhooks/:id
 * Get webhook by ID
 */
webhooksRouter.get("/:id", async (c) => {
  const user = c.get("user");
  const webhookId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const result = await db
    .select({
      id: schema.webhooks.id,
      name: schema.webhooks.name,
      url: schema.webhooks.url,
      events: schema.webhooks.events,
      isActive: schema.webhooks.isActive,
      lastTriggeredAt: schema.webhooks.lastTriggeredAt,
      lastStatus: schema.webhooks.lastStatus,
      failureCount: schema.webhooks.failureCount,
      createdAt: schema.webhooks.createdAt,
      updatedAt: schema.webhooks.updatedAt,
    })
    .from(schema.webhooks)
    .where(eq(schema.webhooks.id, webhookId))
    .limit(1);

  if (!result[0]) {
    return notFound(c, "Webhook not found");
  }

  // Verify ownership
  const fullWebhook = await db
    .select()
    .from(schema.webhooks)
    .where(eq(schema.webhooks.id, webhookId))
    .limit(1);

  if (fullWebhook[0]?.userId !== user.id) {
    return forbidden(c, "You don't have access to this webhook");
  }

  return ok(c, {
    ...result[0],
    events: JSON.parse(result[0].events),
  });
});

/**
 * PATCH /webhooks/:id
 * Update webhook
 */
webhooksRouter.patch("/:id", zValidator("json", updateWebhookSchema), async (c) => {
  const user = c.get("user");
  const webhookId = c.req.param("id");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.webhooks)
    .where(eq(schema.webhooks.id, webhookId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Webhook not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this webhook");
  }

  const updateData: Partial<schema.NewWebhook> = {
    ...(input.name && { name: input.name }),
    ...(input.url && { url: input.url }),
    ...(input.events && { events: JSON.stringify(input.events) }),
    ...(input.isActive !== undefined && { isActive: input.isActive }),
    updatedAt: new Date().toISOString(),
  };

  // Reset failure count if re-enabling
  if (input.isActive === true && !existing[0].isActive) {
    updateData.failureCount = 0;
  }

  await db.update(schema.webhooks).set(updateData).where(eq(schema.webhooks.id, webhookId));

  const updated = await db
    .select({
      id: schema.webhooks.id,
      name: schema.webhooks.name,
      url: schema.webhooks.url,
      events: schema.webhooks.events,
      isActive: schema.webhooks.isActive,
      lastTriggeredAt: schema.webhooks.lastTriggeredAt,
      lastStatus: schema.webhooks.lastStatus,
      failureCount: schema.webhooks.failureCount,
      createdAt: schema.webhooks.createdAt,
      updatedAt: schema.webhooks.updatedAt,
    })
    .from(schema.webhooks)
    .where(eq(schema.webhooks.id, webhookId))
    .limit(1);

  return ok(c, {
    ...updated[0],
    events: JSON.parse(updated[0]!.events),
  });
});

/**
 * DELETE /webhooks/:id
 * Delete webhook
 */
webhooksRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  const webhookId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.webhooks)
    .where(eq(schema.webhooks.id, webhookId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Webhook not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this webhook");
  }

  await db.delete(schema.webhooks).where(eq(schema.webhooks.id, webhookId));

  return noContent(c);
});

/**
 * POST /webhooks/:id/test
 * Send a test webhook event
 */
webhooksRouter.post("/:id/test", async (c) => {
  const user = c.get("user");
  const webhookId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.webhooks)
    .where(eq(schema.webhooks.id, webhookId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Webhook not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this webhook");
  }

  const result = await sendTestWebhook(c.env, webhookId);

  return ok(c, result);
});

/**
 * GET /webhooks/:id/deliveries
 * Get webhook delivery history
 */
webhooksRouter.get("/:id/deliveries", async (c) => {
  const user = c.get("user");
  const webhookId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  // Verify ownership
  const webhook = await db
    .select()
    .from(schema.webhooks)
    .where(eq(schema.webhooks.id, webhookId))
    .limit(1);

  if (!webhook[0]) {
    return notFound(c, "Webhook not found");
  }

  if (webhook[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this webhook");
  }

  const deliveries = await db
    .select({
      id: schema.webhookDeliveries.id,
      event: schema.webhookDeliveries.event,
      statusCode: schema.webhookDeliveries.statusCode,
      duration: schema.webhookDeliveries.duration,
      success: schema.webhookDeliveries.success,
      attempts: schema.webhookDeliveries.attempts,
      createdAt: schema.webhookDeliveries.createdAt,
    })
    .from(schema.webhookDeliveries)
    .where(eq(schema.webhookDeliveries.webhookId, webhookId))
    .orderBy(desc(schema.webhookDeliveries.createdAt))
    .limit(50);

  return ok(c, deliveries);
});

/**
 * POST /webhooks/:id/rotate-secret
 * Rotate webhook secret
 */
webhooksRouter.post("/:id/rotate-secret", async (c) => {
  const user = c.get("user");
  const webhookId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.webhooks)
    .where(eq(schema.webhooks.id, webhookId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "Webhook not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this webhook");
  }

  const newSecret = generateWebhookSecret();

  await db
    .update(schema.webhooks)
    .set({
      secret: newSecret,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.webhooks.id, webhookId));

  return ok(c, { secret: newSecret });
});

export { webhooksRouter };
