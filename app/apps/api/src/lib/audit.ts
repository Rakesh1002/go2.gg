/**
 * Audit Logging Service
 *
 * Tracks team actions for compliance and security monitoring.
 * Features:
 * - Comprehensive action tracking
 * - Request context capture (IP, user agent)
 * - Filterable audit trail
 * - Export capabilities
 */

import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, and, gte, lte, desc, sql, or, like } from "drizzle-orm";
import * as schema from "@repo/db";

export type AuditActionType = (typeof schema.auditActionTypes)[number];

export interface AuditContext {
  organizationId: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditLogInput {
  action: AuditActionType;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * Log an audit event
 */
export async function logAuditEvent(
  db: DrizzleD1Database<typeof schema>,
  context: AuditContext,
  input: AuditLogInput
): Promise<void> {
  await db.insert(schema.auditLogs).values({
    id: crypto.randomUUID(),
    organizationId: context.organizationId,
    userId: context.userId ?? null,
    action: input.action,
    resourceType: input.resourceType ?? null,
    resourceId: input.resourceId ?? null,
    details: input.details ? JSON.stringify(input.details) : null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Get audit logs for an organization with filtering
 */
export async function getAuditLogs(
  db: DrizzleD1Database<typeof schema>,
  organizationId: string,
  filters: AuditLogFilters = {},
  limit: number = 50,
  offset: number = 0
): Promise<{
  logs: schema.AuditLog[];
  total: number;
}> {
  const conditions = [eq(schema.auditLogs.organizationId, organizationId)];

  if (filters.userId) {
    conditions.push(eq(schema.auditLogs.userId, filters.userId));
  }

  if (filters.action) {
    conditions.push(eq(schema.auditLogs.action, filters.action));
  }

  if (filters.resourceType) {
    conditions.push(eq(schema.auditLogs.resourceType, filters.resourceType));
  }

  if (filters.resourceId) {
    conditions.push(eq(schema.auditLogs.resourceId, filters.resourceId));
  }

  if (filters.startDate) {
    conditions.push(gte(schema.auditLogs.createdAt, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(schema.auditLogs.createdAt, filters.endDate));
  }

  if (filters.search) {
    const searchCondition = or(
      like(schema.auditLogs.action, `%${filters.search}%`),
      like(schema.auditLogs.resourceType, `%${filters.search}%`),
      like(schema.auditLogs.details, `%${filters.search}%`)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const whereClause = and(...conditions);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.auditLogs)
    .where(whereClause);

  const total = countResult[0]?.count ?? 0;

  // Get paginated logs
  const logs = await db
    .select()
    .from(schema.auditLogs)
    .where(whereClause)
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return { logs, total };
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
  db: DrizzleD1Database<typeof schema>,
  organizationId: string,
  resourceType: string,
  resourceId: string,
  limit: number = 20
): Promise<schema.AuditLog[]> {
  return db
    .select()
    .from(schema.auditLogs)
    .where(
      and(
        eq(schema.auditLogs.organizationId, organizationId),
        eq(schema.auditLogs.resourceType, resourceType),
        eq(schema.auditLogs.resourceId, resourceId)
      )
    )
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(limit);
}

/**
 * Get audit logs by user
 */
export async function getUserAuditLogs(
  db: DrizzleD1Database<typeof schema>,
  organizationId: string,
  userId: string,
  limit: number = 50
): Promise<schema.AuditLog[]> {
  return db
    .select()
    .from(schema.auditLogs)
    .where(
      and(eq(schema.auditLogs.organizationId, organizationId), eq(schema.auditLogs.userId, userId))
    )
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(limit);
}

/**
 * Export audit logs to CSV format
 */
export function exportAuditLogsToCSV(logs: schema.AuditLog[]): string {
  const headers = [
    "ID",
    "Date",
    "User ID",
    "Action",
    "Resource Type",
    "Resource ID",
    "Details",
    "IP Address",
    "User Agent",
  ];

  const rows = logs.map((log) => [
    log.id,
    log.createdAt,
    log.userId || "",
    log.action,
    log.resourceType || "",
    log.resourceId || "",
    log.details ? log.details.replace(/"/g, '""') : "",
    log.ipAddress || "",
    log.userAgent || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Get available action types
 */
export function getActionTypes(): { value: string; label: string; category: string }[] {
  return [
    // Authentication
    { value: "auth.login", label: "User Login", category: "Authentication" },
    { value: "auth.logout", label: "User Logout", category: "Authentication" },
    { value: "auth.sso_login", label: "SSO Login", category: "Authentication" },
    { value: "auth.password_change", label: "Password Changed", category: "Authentication" },
    { value: "auth.mfa_enabled", label: "MFA Enabled", category: "Authentication" },
    { value: "auth.mfa_disabled", label: "MFA Disabled", category: "Authentication" },
    // Organization
    { value: "org.created", label: "Organization Created", category: "Organization" },
    { value: "org.updated", label: "Organization Updated", category: "Organization" },
    { value: "org.deleted", label: "Organization Deleted", category: "Organization" },
    { value: "org.member_invited", label: "Member Invited", category: "Organization" },
    { value: "org.member_removed", label: "Member Removed", category: "Organization" },
    { value: "org.member_role_changed", label: "Member Role Changed", category: "Organization" },
    // Links
    { value: "link.created", label: "Link Created", category: "Links" },
    { value: "link.updated", label: "Link Updated", category: "Links" },
    { value: "link.deleted", label: "Link Deleted", category: "Links" },
    { value: "link.archived", label: "Link Archived", category: "Links" },
    { value: "link.restored", label: "Link Restored", category: "Links" },
    // Domains
    { value: "domain.added", label: "Domain Added", category: "Domains" },
    { value: "domain.verified", label: "Domain Verified", category: "Domains" },
    { value: "domain.removed", label: "Domain Removed", category: "Domains" },
    // API Keys
    { value: "api_key.created", label: "API Key Created", category: "API Keys" },
    { value: "api_key.revoked", label: "API Key Revoked", category: "API Keys" },
    // Billing
    { value: "billing.subscription_created", label: "Subscription Created", category: "Billing" },
    { value: "billing.subscription_updated", label: "Subscription Updated", category: "Billing" },
    { value: "billing.subscription_canceled", label: "Subscription Canceled", category: "Billing" },
    {
      value: "billing.payment_method_updated",
      label: "Payment Method Updated",
      category: "Billing",
    },
    // Settings
    { value: "settings.sso_configured", label: "SSO Configured", category: "Settings" },
    { value: "settings.webhook_created", label: "Webhook Created", category: "Settings" },
    { value: "settings.webhook_deleted", label: "Webhook Deleted", category: "Settings" },
    // Data
    { value: "data.exported", label: "Data Exported", category: "Data" },
    { value: "data.imported", label: "Data Imported", category: "Data" },
  ];
}

/**
 * Get human-readable label for action type
 */
export function getActionLabel(action: string): string {
  const actionType = getActionTypes().find((a) => a.value === action);
  return actionType?.label || action;
}

/**
 * Helper to create audit middleware context
 */
export function createAuditContext(
  organizationId: string,
  userId?: string | null,
  request?: Request
): AuditContext {
  return {
    organizationId,
    userId,
    ipAddress:
      request?.headers.get("cf-connecting-ip") ||
      request?.headers.get("x-forwarded-for")?.split(",")[0] ||
      null,
    userAgent: request?.headers.get("user-agent") || null,
  };
}
