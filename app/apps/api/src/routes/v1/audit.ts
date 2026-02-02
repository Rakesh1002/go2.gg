/**
 * Audit Logs API Routes (v1)
 *
 * Enterprise audit logging:
 * - GET /audit/logs - Get audit logs with filtering
 * - GET /audit/logs/:id - Get single audit log entry
 * - GET /audit/export - Export audit logs to CSV
 * - GET /audit/actions - Get available action types
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../../bindings.js";
import { ok, forbidden, notFound } from "../../lib/response.js";
import {
  getAuditLogs,
  getResourceAuditLogs,
  exportAuditLogsToCSV,
  getActionTypes,
  getActionLabel,
} from "../../lib/audit.js";
import { createD1Repositories } from "@repo/db/d1";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@repo/db";
import { eq, and } from "drizzle-orm";

const audit = new Hono<{ Bindings: Env }>();

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const auditLogsQuerySchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * GET /audit/logs
 * Get audit logs with filtering
 */
audit.get("/logs", zValidator("query", auditLogsQuerySchema), async (c) => {
  const user = c.get("user");
  const query = c.req.valid("query");
  const repos = createD1Repositories(c.env);

  if (!user?.organizationId) {
    return forbidden(c, "Organization required");
  }

  // Check if user is admin/owner
  const membership = await repos.organizations.getMember(user.organizationId, user.id);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return forbidden(c, "Admin access required");
  }

  const db = drizzle(c.env.DB, { schema });
  const { logs, total } = await getAuditLogs(
    db,
    user.organizationId,
    {
      userId: query.userId,
      action: query.action,
      resourceType: query.resourceType,
      resourceId: query.resourceId,
      startDate: query.startDate,
      endDate: query.endDate,
      search: query.search,
    },
    query.limit,
    query.offset
  );

  // Enrich logs with user info
  const userIds = [...new Set(logs.map((l) => l.userId).filter((id): id is string => !!id))];
  const users =
    userIds.length > 0 && userIds[0]
      ? await db
          .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name })
          .from(schema.users)
          .where(eq(schema.users.id, userIds[0]))
      : [];

  const usersMap = new Map(users.map((u) => [u.id, u]));

  const enrichedLogs = logs.map((log) => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null,
    actionLabel: getActionLabel(log.action),
    user: log.userId ? usersMap.get(log.userId) : null,
  }));

  return ok(c, {
    logs: enrichedLogs,
    total,
    limit: query.limit,
    offset: query.offset,
  });
});

/**
 * GET /audit/logs/:id
 * Get single audit log entry
 */
audit.get("/logs/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const repos = createD1Repositories(c.env);

  if (!user?.organizationId) {
    return forbidden(c, "Organization required");
  }

  // Check if user is admin/owner
  const membership = await repos.organizations.getMember(user.organizationId, user.id);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return forbidden(c, "Admin access required");
  }

  const db = drizzle(c.env.DB, { schema });
  const logs = await db
    .select()
    .from(schema.auditLogs)
    .where(
      and(eq(schema.auditLogs.id, id), eq(schema.auditLogs.organizationId, user.organizationId))
    )
    .limit(1);

  const log = logs[0];
  if (!log) {
    return notFound(c, "Audit log not found");
  }

  // Get user info if available
  let logUser = null;
  if (log.userId) {
    const users = await db
      .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.id, log.userId))
      .limit(1);
    logUser = users[0] || null;
  }

  return ok(c, {
    log: {
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
      actionLabel: getActionLabel(log.action),
      user: logUser,
    },
  });
});

/**
 * GET /audit/resource/:type/:id
 * Get audit logs for a specific resource
 */
audit.get("/resource/:type/:id", async (c) => {
  const user = c.get("user");
  const resourceType = c.req.param("type");
  const resourceId = c.req.param("id");
  const repos = createD1Repositories(c.env);

  if (!user?.organizationId) {
    return forbidden(c, "Organization required");
  }

  // Check if user is admin/owner
  const membership = await repos.organizations.getMember(user.organizationId, user.id);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return forbidden(c, "Admin access required");
  }

  const db = drizzle(c.env.DB, { schema });
  const logs = await getResourceAuditLogs(db, user.organizationId, resourceType, resourceId);

  const enrichedLogs = logs.map((log) => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null,
    actionLabel: getActionLabel(log.action),
  }));

  return ok(c, { logs: enrichedLogs });
});

/**
 * GET /audit/export
 * Export audit logs to CSV
 */
audit.get(
  "/export",
  zValidator("query", auditLogsQuerySchema.omit({ limit: true, offset: true })),
  async (c) => {
    const user = c.get("user");
    const query = c.req.valid("query");
    const repos = createD1Repositories(c.env);

    if (!user?.organizationId) {
      return forbidden(c, "Organization required");
    }

    // Check if user is admin/owner
    const membership = await repos.organizations.getMember(user.organizationId, user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return forbidden(c, "Admin access required");
    }

    const db = drizzle(c.env.DB, { schema });
    const { logs } = await getAuditLogs(
      db,
      user.organizationId,
      {
        userId: query.userId,
        action: query.action,
        resourceType: query.resourceType,
        resourceId: query.resourceId,
        startDate: query.startDate,
        endDate: query.endDate,
        search: query.search,
      },
      10000, // Max export limit
      0
    );

    const csv = exportAuditLogsToCSV(logs);

    c.header("Content-Type", "text/csv");
    c.header(
      "Content-Disposition",
      `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`
    );

    return c.text(csv);
  }
);

/**
 * GET /audit/actions
 * Get available action types for filtering
 */
audit.get("/actions", async (c) => {
  const actions = getActionTypes();

  // Group by category
  const grouped = actions.reduce(
    (acc, action) => {
      if (!acc[action.category]) {
        acc[action.category] = [];
      }
      acc[action.category].push({ value: action.value, label: action.label });
      return acc;
    },
    {} as Record<string, { value: string; label: string }[]>
  );

  return ok(c, {
    actions,
    grouped,
  });
});

export { audit };
