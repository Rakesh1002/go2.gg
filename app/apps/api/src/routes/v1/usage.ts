/**
 * Usage Routes (v1)
 *
 * Organization usage stats and limits:
 * - GET /usage - Get current usage stats
 */

import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok } from "../../lib/response.js";
import { getOrgUsage, getUsageStats } from "../../lib/usage.js";
import { ensureUserHasOrganization } from "../../lib/ensure-organization.js";

const usage = new Hono<{ Bindings: Env }>();

// All routes require authentication
usage.use("/*", apiKeyAuthMiddleware());

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * GET /usage
 * Get current organization usage stats
 */
usage.get("/", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });

  // Ensure user has an organization with a trial subscription
  // This is a fallback for when the auth hook fails during signup
  let organizationId = user.organizationId;
  try {
    const ensureResult = await ensureUserHasOrganization(db, user.id, user.email, user.name);
    organizationId = ensureResult.organizationId;
  } catch (error) {
    console.error("[Usage] Failed to ensure organization:", error);
    // Continue with existing organizationId
  }

  const orgUsage = await getOrgUsage(db, user.id, organizationId);
  const stats = getUsageStats(orgUsage);

  return ok(c, stats);
});

export { usage };
