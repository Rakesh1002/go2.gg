/**
 * Request Logging Middleware
 *
 * Structured JSON logging for all requests.
 */

import type { MiddlewareHandler } from "hono";
import type { Env } from "../bindings.js";

export interface LogContext {
  requestId: string;
  method: string;
  path: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

/**
 * Logs all requests in structured JSON format.
 */
export function loggerMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const start = Date.now();
    const requestId = c.get("requestId") ?? crypto.randomUUID();

    // Log request start
    const context: LogContext = {
      requestId,
      method: c.req.method,
      path: c.req.path,
      userAgent: c.req.header("User-Agent"),
      ip:
        c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For")?.split(",")[0]?.trim(),
    };

    // Execute the handler
    await next();

    // Calculate duration
    const duration = Date.now() - start;

    // Get user ID if available
    const user = c.get("user") as { id?: string } | undefined;

    // Log request completion
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: c.res.status >= 500 ? "error" : c.res.status >= 400 ? "warn" : "info",
        ...context,
        userId: user?.id,
        status: c.res.status,
        duration: `${duration}ms`,
      })
    );
  };
}
