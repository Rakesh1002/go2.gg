/**
 * API Key Management Routes
 *
 * Manages API keys for programmatic access.
 * API keys are organization-scoped.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok, badRequest, notFound, forbidden } from "../../lib/response.js";

const apiKeys = new Hono<{ Bindings: Env }>();

// All routes require authentication (supports both API keys and session auth)
apiKeys.use("/*", apiKeyAuthMiddleware());

// -----------------------------------------------------------------------------
// Schemas
// -----------------------------------------------------------------------------

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  organizationId: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function generateApiKey(): string {
  // Format: go2_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  const prefix = "go2_";
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((byte) => chars[byte % chars.length])
    .join("");
  return prefix + randomPart;
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * GET /api-keys
 * List all API keys for an organization
 */
apiKeys.get("/", async (c) => {
  const user = c.get("user");
  const organizationId = c.req.query("organizationId");
  const db = drizzle(c.env.DB, { schema });

  if (!organizationId) {
    return badRequest(c, "Organization ID required", "MISSING_ORG_ID");
  }

  // Verify user is a member of the organization
  const membership = await c.env.DB.prepare(
    `SELECT * FROM organization_members 
       WHERE organization_id = ? AND user_id = ?`
  )
    .bind(organizationId, user.id)
    .first();

  if (!membership) {
    return forbidden(c, "Not a member of this organization");
  }

  const keys = await db
    .select({
      id: schema.apiKeys.id,
      name: schema.apiKeys.name,
      keyPrefix: schema.apiKeys.keyPrefix,
      lastUsedAt: schema.apiKeys.lastUsedAt,
      expiresAt: schema.apiKeys.expiresAt,
      createdAt: schema.apiKeys.createdAt,
    })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.organizationId, organizationId));

  return ok(c, { keys });
});

/**
 * POST /api-keys
 * Create a new API key
 */
apiKeys.post("/", zValidator("json", createKeySchema), async (c) => {
  const user = c.get("user");
  const { name, organizationId, expiresAt } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Verify user has admin access to the organization
  const membership = await c.env.DB.prepare(
    `SELECT * FROM organization_members 
       WHERE organization_id = ? AND user_id = ? 
       AND role IN ('owner', 'admin')`
  )
    .bind(organizationId, user.id)
    .first();

  if (!membership) {
    return forbidden(c, "Only admins can create API keys");
  }

  // Limit number of keys per organization
  const existingKeys = await db
    .select({ id: schema.apiKeys.id })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.organizationId, organizationId));

  if (existingKeys.length >= 10) {
    return badRequest(c, "Maximum of 10 API keys per organization", "KEY_LIMIT_REACHED");
  }

  // Generate and hash the key
  const rawKey = generateApiKey();
  const hashedKey = await hashApiKey(rawKey);
  const keyPrefix = rawKey.slice(0, 12); // Store prefix for identification

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(schema.apiKeys).values({
    id,
    organizationId,
    name,
    keyHash: hashedKey,
    keyPrefix,
    expiresAt: expiresAt ?? null,
  });

  // Return the raw key only once
  return c.json(
    {
      success: true,
      data: {
        id,
        name,
        key: rawKey, // Only returned on creation
        keyPrefix,
        expiresAt,
        createdAt: now,
      },
    },
    201
  );
});

/**
 * DELETE /api-keys/:id
 * Delete an API key
 */
apiKeys.delete("/:id", async (c) => {
  const user = c.get("user");
  const keyId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  // Get the key first
  const [key] = await db.select().from(schema.apiKeys).where(eq(schema.apiKeys.id, keyId)).limit(1);

  if (!key) {
    return notFound(c, "API key not found");
  }

  // Verify user has admin access to the organization
  const membership = await c.env.DB.prepare(
    `SELECT * FROM organization_members 
       WHERE organization_id = ? AND user_id = ? 
       AND role IN ('owner', 'admin')`
  )
    .bind(key.organizationId, user.id)
    .first();

  if (!membership) {
    return forbidden(c, "Only admins can delete API keys");
  }

  await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, keyId));

  return c.body(null, 204);
});

/**
 * PATCH /api-keys/:id
 * Update an API key (name only)
 */
apiKeys.patch(
  "/:id",
  zValidator("json", z.object({ name: z.string().min(1).max(100) })),
  async (c) => {
    const user = c.get("user");
    const keyId = c.req.param("id");
    const { name } = c.req.valid("json");
    const db = drizzle(c.env.DB, { schema });

    // Get the key first
    const [key] = await db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.id, keyId))
      .limit(1);

    if (!key) {
      return notFound(c, "API key not found");
    }

    // Verify user has admin access to the organization
    const membership = await c.env.DB.prepare(
      `SELECT * FROM organization_members 
       WHERE organization_id = ? AND user_id = ? 
       AND role IN ('owner', 'admin')`
    )
      .bind(key.organizationId, user.id)
      .first();

    if (!membership) {
      return forbidden(c, "Only admins can update API keys");
    }

    await db.update(schema.apiKeys).set({ name }).where(eq(schema.apiKeys.id, keyId));

    return ok(c, { id: keyId, name });
  }
);

export { apiKeys };
