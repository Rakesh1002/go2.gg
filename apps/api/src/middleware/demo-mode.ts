/**
 * Demo / Preview Mode Middleware
 *
 * When DEMO_MODE=true, blocks all write operations (POST/PUT/PATCH/DELETE) to
 * mutation endpoints unless the request is authenticated as an admin user.
 * Used to ship a public, clickable demo (e.g. demo.go2.gg) without exposing
 * write access.
 */

import type { MiddlewareHandler } from "hono";
import type { Env } from "../bindings.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Endpoints that must remain writable even in demo mode (auth flows, billing
 * webhooks, contact form, etc.). Demo banners on the frontend should already
 * funnel users away from real writes — this list is just a safety net.
 */
const ALLOWLIST_PATTERNS: RegExp[] = [
  /^\/api\/v1\/auth\//,
  /^\/billing\/webhooks/,
  /^\/api\/v1\/contact/,
  /^\/api\/v1\/newsletter/,
  /^\/api\/v1\/waitlist/,
  /^\/api\/v1\/anonymous-links/,
  /^\/health/,
];

export function demoModeMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    if (c.env.DEMO_MODE !== "true") return next();
    if (!WRITE_METHODS.has(c.req.method)) return next();

    const path = new URL(c.req.url).pathname;
    if (ALLOWLIST_PATTERNS.some((re) => re.test(path))) return next();

    // Admins still get full access (so the demo can be seeded and managed).
    const user = c.get("user");
    if (user && (user as { isAdmin?: boolean }).isAdmin) return next();

    return c.json(
      {
        error: "demo_mode",
        message:
          "This is a read-only demo. Sign up to create and manage your own links.",
      },
      { status: 403 },
    );
  };
}
