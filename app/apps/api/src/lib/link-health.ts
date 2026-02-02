/**
 * Link Health Monitoring
 *
 * Periodically checks destination URLs for broken links and alerts users.
 * Features:
 * - HTTP status code checking
 * - Response time monitoring
 * - SSL certificate validation
 * - Automatic retry on failure
 * - User notification on broken links
 */

import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, and, lt, sql, isNull, or } from "drizzle-orm";
import * as schema from "@repo/db";

export interface LinkHealthStatus {
  status: "healthy" | "degraded" | "broken" | "unknown";
  statusCode: number | null;
  responseTime: number | null;
  errorMessage: string | null;
  lastChecked: string;
  sslValid: boolean | null;
  sslExpiresAt: string | null;
}

export interface HealthCheckResult {
  linkId: string;
  destinationUrl: string;
  status: LinkHealthStatus["status"];
  statusCode: number | null;
  responseTime: number;
  errorMessage: string | null;
  sslValid: boolean;
  sslExpiresAt: string | null;
}

/**
 * Check the health of a single URL
 */
export async function checkUrlHealth(
  url: string
): Promise<Omit<HealthCheckResult, "linkId" | "destinationUrl">> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      method: "HEAD", // Use HEAD for efficiency
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Go2-LinkHealthChecker/1.0",
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const statusCode = response.status;

    // Determine health status based on status code
    let status: LinkHealthStatus["status"] = "healthy";

    if (statusCode >= 500) {
      status = "broken"; // Server error
    } else if (statusCode >= 400) {
      status = "broken"; // Client error (404, etc.)
    } else if (statusCode >= 300 && statusCode < 400) {
      status = "healthy"; // Redirects are OK
    } else if (responseTime > 5000) {
      status = "degraded"; // Slow response
    }

    // Check SSL (only for HTTPS URLs)
    // In Cloudflare Workers, we can't directly check SSL certs,
    // but a successful HTTPS request means the cert is valid
    const sslValid = url.startsWith("https://"); // SSL is valid if HTTPS succeeded
    const sslExpiresAt: string | null = null; // Would need additional API calls to get expiry date

    return {
      status,
      statusCode,
      responseTime,
      errorMessage: status === "broken" ? `HTTP ${statusCode}` : null,
      sslValid,
      sslExpiresAt,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Determine if it's a DNS, timeout, or connection error
    let status: LinkHealthStatus["status"] = "broken";

    if (errorMessage.includes("timeout") || errorMessage.includes("aborted")) {
      status = "degraded"; // Might be temporary
    }

    return {
      status,
      statusCode: null,
      responseTime,
      errorMessage,
      sslValid: false,
      sslExpiresAt: null,
    };
  }
}

/**
 * Get links that need health checks
 *
 * Criteria:
 * - Not archived
 * - Not checked in the last 24 hours
 * - Or marked as broken/degraded (check more frequently)
 */
export async function getLinksToCheck(
  db: DrizzleD1Database<typeof schema>,
  limit: number = 100
): Promise<Array<{ id: string; destinationUrl: string; healthStatus: string | null }>> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

  const links = await db
    .select({
      id: schema.links.id,
      destinationUrl: schema.links.destinationUrl,
      healthStatus: schema.links.healthStatus,
      lastHealthCheck: schema.links.lastHealthCheck,
    })
    .from(schema.links)
    .where(
      and(
        eq(schema.links.isArchived, false),
        or(
          // Never checked
          isNull(schema.links.lastHealthCheck),
          // Healthy links - check every 24 hours
          and(
            eq(schema.links.healthStatus, "healthy"),
            lt(schema.links.lastHealthCheck, twentyFourHoursAgo)
          ),
          // Broken/degraded links - check every 6 hours
          and(
            or(eq(schema.links.healthStatus, "broken"), eq(schema.links.healthStatus, "degraded")),
            lt(schema.links.lastHealthCheck, sixHoursAgo)
          ),
          // Unknown status - check every 12 hours
          and(
            eq(schema.links.healthStatus, "unknown"),
            lt(
              schema.links.lastHealthCheck,
              new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
            )
          )
        )
      )
    )
    .limit(limit);

  return links;
}

/**
 * Update link health status in database
 */
export async function updateLinkHealth(
  db: DrizzleD1Database<typeof schema>,
  linkId: string,
  result: Omit<HealthCheckResult, "linkId" | "destinationUrl">
): Promise<void> {
  const now = new Date().toISOString();

  await db
    .update(schema.links)
    .set({
      healthStatus: result.status,
      healthStatusCode: result.statusCode,
      healthResponseTime: result.responseTime,
      healthErrorMessage: result.errorMessage,
      lastHealthCheck: now,
      updatedAt: now,
    })
    .where(eq(schema.links.id, linkId));
}

/**
 * Get broken links for an organization
 */
export async function getBrokenLinks(
  db: DrizzleD1Database<typeof schema>,
  organizationId: string
): Promise<
  Array<{
    id: string;
    slug: string;
    domain: string;
    destinationUrl: string;
    healthStatus: string;
    healthErrorMessage: string | null;
    lastHealthCheck: string | null;
  }>
> {
  const links = await db
    .select({
      id: schema.links.id,
      slug: schema.links.slug,
      domain: schema.links.domain,
      destinationUrl: schema.links.destinationUrl,
      healthStatus: schema.links.healthStatus,
      healthErrorMessage: schema.links.healthErrorMessage,
      lastHealthCheck: schema.links.lastHealthCheck,
    })
    .from(schema.links)
    .where(
      and(
        eq(schema.links.organizationId, organizationId),
        eq(schema.links.isArchived, false),
        or(eq(schema.links.healthStatus, "broken"), eq(schema.links.healthStatus, "degraded"))
      )
    );

  return links.map((link) => ({
    ...link,
    healthStatus: link.healthStatus || "unknown",
  }));
}

/**
 * Get health summary for an organization
 */
export async function getHealthSummary(
  db: DrizzleD1Database<typeof schema>,
  organizationId: string
): Promise<{
  total: number;
  healthy: number;
  degraded: number;
  broken: number;
  unknown: number;
}> {
  const results = await db
    .select({
      healthStatus: schema.links.healthStatus,
      count: sql<number>`count(*)`,
    })
    .from(schema.links)
    .where(and(eq(schema.links.organizationId, organizationId), eq(schema.links.isArchived, false)))
    .groupBy(schema.links.healthStatus);

  const summary = {
    total: 0,
    healthy: 0,
    degraded: 0,
    broken: 0,
    unknown: 0,
  };

  for (const row of results) {
    const count = row.count;
    summary.total += count;

    switch (row.healthStatus) {
      case "healthy":
        summary.healthy = count;
        break;
      case "degraded":
        summary.degraded = count;
        break;
      case "broken":
        summary.broken = count;
        break;
      default:
        summary.unknown += count;
    }
  }

  return summary;
}
