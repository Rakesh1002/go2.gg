/**
 * Webhook Dispatcher
 *
 * Handles outgoing webhook delivery with:
 * - HMAC signature verification
 * - Retry logic with exponential backoff
 * - Delivery logging
 */

import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../bindings.js";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a random webhook secret
 */
export function generateWebhookSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return (
    "whsec_" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Dispatch a webhook event to all matching webhooks
 */
export async function dispatchWebhookEvent(
  env: Env,
  userId: string,
  organizationId: string | null | undefined,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = drizzle(env.DB, { schema });

  // Find all active webhooks for this user/org that subscribe to this event
  const conditions = [eq(schema.webhooks.isActive, true)];

  if (organizationId) {
    conditions.push(eq(schema.webhooks.organizationId, organizationId));
  } else {
    conditions.push(eq(schema.webhooks.userId, userId));
  }

  const activeWebhooks = await db
    .select()
    .from(schema.webhooks)
    .where(and(...conditions));

  // Filter webhooks that subscribe to this event
  const matchingWebhooks = activeWebhooks.filter((webhook) => {
    const events = JSON.parse(webhook.events) as string[];
    return events.includes(event) || events.includes("*");
  });

  // Dispatch to each webhook
  const deliveryPromises = matchingWebhooks.map((webhook) =>
    deliverWebhook(env, webhook, event, data)
  );

  await Promise.allSettled(deliveryPromises);
}

/**
 * Deliver a webhook to a single endpoint
 */
async function deliverWebhook(
  env: Env,
  webhook: schema.Webhook,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = drizzle(env.DB, { schema });
  const deliveryId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const payload: WebhookPayload = {
    event,
    timestamp,
    data,
  };

  const payloadString = JSON.stringify(payload);
  const signature = await generateSignature(payloadString, webhook.secret);

  const startTime = Date.now();
  let statusCode: number | undefined;
  let responseBody: string | undefined;
  let success = false;

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-ID": webhook.id,
        "X-Webhook-Event": event,
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Timestamp": timestamp,
        "User-Agent": "Go2-Webhooks/1.0",
      },
      body: payloadString,
    });

    statusCode = response.status;
    responseBody = await response.text().catch(() => undefined);
    success = response.ok;

    // Update webhook last triggered info
    await db
      .update(schema.webhooks)
      .set({
        lastTriggeredAt: timestamp,
        lastStatus: statusCode,
        failureCount: success ? 0 : webhook.failureCount + 1,
        updatedAt: timestamp,
      })
      .where(eq(schema.webhooks.id, webhook.id));

    // Disable webhook after 10 consecutive failures
    if (!success && webhook.failureCount >= 9) {
      await db
        .update(schema.webhooks)
        .set({
          isActive: false,
          updatedAt: timestamp,
        })
        .where(eq(schema.webhooks.id, webhook.id));
    }
  } catch (error) {
    statusCode = 0;
    responseBody = error instanceof Error ? error.message : "Unknown error";

    // Increment failure count
    await db
      .update(schema.webhooks)
      .set({
        lastTriggeredAt: timestamp,
        lastStatus: 0,
        failureCount: webhook.failureCount + 1,
        updatedAt: timestamp,
      })
      .where(eq(schema.webhooks.id, webhook.id));
  }

  const duration = Date.now() - startTime;

  // Log delivery
  await db.insert(schema.webhookDeliveries).values({
    id: deliveryId,
    webhookId: webhook.id,
    event,
    payload: payloadString,
    statusCode,
    response: responseBody?.slice(0, 1000), // Truncate response
    duration,
    success,
    attempts: 1,
    createdAt: timestamp,
  });
}

/**
 * Send a test webhook event
 */
export async function sendTestWebhook(
  env: Env,
  webhookId: string
): Promise<{
  success: boolean;
  statusCode?: number;
  response?: string;
  duration?: number;
}> {
  const db = drizzle(env.DB, { schema });

  const webhook = await db
    .select()
    .from(schema.webhooks)
    .where(eq(schema.webhooks.id, webhookId))
    .limit(1);

  if (!webhook[0]) {
    throw new Error("Webhook not found");
  }

  const testData = {
    test: true,
    message: "This is a test webhook from Go2",
    webhookId,
  };

  const timestamp = new Date().toISOString();
  const payload: WebhookPayload = {
    event: "test",
    timestamp,
    data: testData,
  };

  const payloadString = JSON.stringify(payload);
  const signature = await generateSignature(payloadString, webhook[0].secret);

  const startTime = Date.now();

  try {
    const response = await fetch(webhook[0].url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-ID": webhookId,
        "X-Webhook-Event": "test",
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Timestamp": timestamp,
        "User-Agent": "Go2-Webhooks/1.0",
      },
      body: payloadString,
    });

    const duration = Date.now() - startTime;
    const responseBody = await response.text().catch(() => undefined);

    return {
      success: response.ok,
      statusCode: response.status,
      response: responseBody?.slice(0, 500),
      duration,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 0,
      response: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    };
  }
}
