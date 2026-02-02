/**
 * User Routes (v1)
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { createD1Repositories } from "@repo/db/d1";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok, notFound, forbidden } from "../../lib/response.js";

const users = new Hono<{ Bindings: Env }>();

// All routes require authentication
users.use("/*", apiKeyAuthMiddleware());

/**
 * GET /users/me
 * Get current user profile
 */
users.get("/me", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });
  const repos = createD1Repositories(db);

  const profile = await repos.users.findById(user.id);

  if (!profile) {
    return notFound(c, "User not found");
  }

  return ok(c, profile);
});

/**
 * PATCH /users/me
 * Update current user profile
 */
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

users.patch("/me", zValidator("json", updateProfileSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });
  const repos = createD1Repositories(db);

  const updated = await repos.users.update(user.id, input);

  return ok(c, updated);
});

/**
 * GET /users/me/preferences
 * Get current user's app preferences
 */
users.get("/me/preferences", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });

  // Try to find existing preferences
  const preferences = await db.query.userPreferences.findFirst({
    where: eq(schema.userPreferences.userId, user.id),
  });

  // If no preferences exist, return defaults
  if (!preferences) {
    return ok(c, {
      userId: user.id,
      defaultDomainId: null,
      defaultTrackAnalytics: true,
      defaultPublicStats: false,
      defaultFolderId: null,
      emailNotificationsEnabled: true,
      emailUsageAlerts: true,
      emailWeeklyDigest: false,
      emailMarketing: true,
      theme: "system",
      defaultTimeRange: "30d",
      itemsPerPage: 25,
    });
  }

  return ok(c, preferences);
});

/**
 * PATCH /users/me/preferences
 * Update current user's app preferences
 */
const updatePreferencesSchema = z.object({
  // Link defaults
  defaultDomainId: z.string().nullable().optional(),
  defaultTrackAnalytics: z.boolean().optional(),
  defaultPublicStats: z.boolean().optional(),
  defaultFolderId: z.string().nullable().optional(),
  // Notifications
  emailNotificationsEnabled: z.boolean().optional(),
  emailUsageAlerts: z.boolean().optional(),
  emailWeeklyDigest: z.boolean().optional(),
  emailMarketing: z.boolean().optional(),
  // Appearance
  theme: z.enum(["light", "dark", "system"]).optional(),
  defaultTimeRange: z.enum(["7d", "30d", "90d", "all"]).optional(),
  itemsPerPage: z.number().int().min(10).max(100).optional(),
});

users.patch(
  "/me/preferences",
  zValidator("json", updatePreferencesSchema),
  async (c) => {
    const user = c.get("user");
    const input = c.req.valid("json");
    const db = drizzle(c.env.DB, { schema });
    const now = new Date().toISOString();

    // Check if preferences exist
    const existing = await db.query.userPreferences.findFirst({
      where: eq(schema.userPreferences.userId, user.id),
    });

    let preferences;

    if (existing) {
      // Update existing preferences
      await db
        .update(schema.userPreferences)
        .set({
          ...input,
          updatedAt: now,
        })
        .where(eq(schema.userPreferences.userId, user.id));

      preferences = await db.query.userPreferences.findFirst({
        where: eq(schema.userPreferences.userId, user.id),
      });
    } else {
      // Create new preferences
      await db.insert(schema.userPreferences).values({
        userId: user.id,
        ...input,
        createdAt: now,
        updatedAt: now,
      });

      preferences = await db.query.userPreferences.findFirst({
        where: eq(schema.userPreferences.userId, user.id),
      });
    }

    return ok(c, preferences);
  },
);

/**
 * GET /users/:id
 * Get user by ID (admin only for now)
 */
users.get("/:id", async (c) => {
  const currentUser = c.get("user");
  const userId = c.req.param("id");

  // Only allow users to view their own profile
  // TODO: Add admin check
  if (currentUser.id !== userId) {
    return forbidden(c, "Cannot view other users");
  }

  const db = drizzle(c.env.DB, { schema });
  const repos = createD1Repositories(db);

  const user = await repos.users.findById(userId);

  if (!user) {
    return notFound(c, "User not found");
  }

  return ok(c, user);
});

export { users };
