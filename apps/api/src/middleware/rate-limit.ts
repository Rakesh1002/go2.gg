/**
 * Rate Limiting Middleware
 *
 * Uses Durable Objects for distributed rate limiting across Cloudflare edge.
 * Falls back to a no-op when rate limiting is disabled.
 */

import type { MiddlewareHandler } from "hono";
import type { Env } from "../bindings.js";

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  window: number;
  /** Key generator function (default: IP address) */
  keyGenerator?: (c: { req: { header: (name: string) => string | undefined } }) => string;
}

/**
 * Rate limiting middleware using Durable Objects.
 *
 * @example
 * ```typescript
 * // Limit to 100 requests per minute
 * app.use("/api/*", rateLimitMiddleware({ limit: 100, window: 60 }));
 *
 * // Custom key generator
 * app.use("/api/*", rateLimitMiddleware({
 *   limit: 1000,
 *   window: 3600,
 *   keyGenerator: (c) => c.get("user")?.id ?? c.req.header("CF-Connecting-IP") ?? "anonymous"
 * }));
 * ```
 */
export function rateLimitMiddleware(config: RateLimitConfig): MiddlewareHandler<{ Bindings: Env }> {
  const { limit, window, keyGenerator } = config;

  return async (c, next) => {
    // Skip rate limiting if disabled
    if (c.env.RATE_LIMIT_ADAPTER === "none") {
      return next();
    }

    // Skip rate limiting if Durable Object not available
    if (!c.env.RATE_LIMITER) {
      console.warn("Rate limiter Durable Object not available");
      return next();
    }

    // Generate rate limit key
    const key = keyGenerator
      ? keyGenerator(c)
      : (c.req.header("CF-Connecting-IP") ??
        c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
        "unknown");

    try {
      // Get Durable Object stub
      const id = c.env.RATE_LIMITER.idFromName(key);
      const stub = c.env.RATE_LIMITER.get(id);

      // Check rate limit
      const response = await stub.fetch(
        new Request(`http://rate-limiter/check?limit=${limit}&window=${window}`)
      );

      const result = (await response.json()) as {
        allowed: boolean;
        remaining: number;
        resetAt: number;
      };

      // Set rate limit headers
      c.header("X-RateLimit-Limit", String(limit));
      c.header("X-RateLimit-Remaining", String(result.remaining));
      c.header("X-RateLimit-Reset", String(result.resetAt));

      if (!result.allowed) {
        c.header("Retry-After", String(result.resetAt - Math.floor(Date.now() / 1000)));

        return c.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: "Too many requests. Please try again later.",
            },
          },
          429
        );
      }
    } catch (error) {
      // Log but don't block on rate limiter errors
      console.error("Rate limiter error:", error);
    }

    return next();
  };
}

/**
 * Stricter rate limit for auth endpoints.
 */
export function authRateLimitMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return rateLimitMiddleware({
    limit: 10,
    window: 60,
    keyGenerator: (c) =>
      c.req.header("CF-Connecting-IP") ??
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
      "unknown",
  });
}

/**
 * Very strict rate limit for password reset.
 */
export function passwordResetRateLimitMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return rateLimitMiddleware({
    limit: 3,
    window: 3600, // 3 per hour
  });
}
