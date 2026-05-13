/**
 * Health Check Routes
 */

import { Hono } from "hono";
import type { Env } from "../bindings.js";

const health = new Hono<{ Bindings: Env }>();

/**
 * Basic health check
 */
health.get("/", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: c.env.APP_ENV,
  });
});

/**
 * Detailed health check with dependency status
 */
health.get("/ready", async (c) => {
  const checks: Record<string, { status: "healthy" | "unhealthy"; latency?: number }> = {};

  // Check D1 database
  if (c.env.DB) {
    const start = Date.now();
    try {
      await c.env.DB.prepare("SELECT 1").first();
      checks.database = { status: "healthy", latency: Date.now() - start };
    } catch {
      checks.database = { status: "unhealthy", latency: Date.now() - start };
    }
  }

  // Check KV
  if (c.env.KV_CONFIG) {
    const start = Date.now();
    try {
      await c.env.KV_CONFIG.get("health-check");
      checks.kv = { status: "healthy", latency: Date.now() - start };
    } catch {
      checks.kv = { status: "unhealthy", latency: Date.now() - start };
    }
  }

  const isHealthy = Object.values(checks).every((check) => check.status === "healthy");

  return c.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    isHealthy ? 200 : 503
  );
});

export { health };
