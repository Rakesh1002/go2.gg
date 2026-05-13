/**
 * CSRF Protection Middleware
 *
 * Implements Double Submit Cookie pattern for CSRF protection.
 */

import type { MiddlewareHandler } from "hono";
import type { Env } from "../bindings.js";

const CSRF_COOKIE_NAME = "__csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";

/**
 * Generates a cryptographically secure CSRF token.
 */
async function generateToken(secret: string): Promise<string> {
  const data = new TextEncoder().encode(`${secret}:${Date.now()}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * CSRF protection middleware using Double Submit Cookie pattern.
 *
 * How it works:
 * 1. On GET requests, set a CSRF cookie with a token
 * 2. On state-changing requests (POST, PUT, PATCH, DELETE),
 *    verify the token in the header matches the cookie
 *
 * @example
 * ```typescript
 * app.use("/api/*", csrfMiddleware());
 * ```
 */
export function csrfMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const method = c.req.method.toUpperCase();
    const secret = c.env.CSRF_SECRET ?? "default-csrf-secret-change-in-production";

    // Skip CSRF for safe methods
    if (["GET", "HEAD", "OPTIONS"].includes(method)) {
      // Generate and set CSRF token cookie on safe methods
      const token = await generateToken(secret);
      c.header(
        "Set-Cookie",
        `${CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Secure`,
        { append: true }
      );
      return next();
    }

    // Skip CSRF for webhooks (they have their own signature verification)
    if (c.req.path.startsWith("/webhooks")) {
      return next();
    }

    // Verify CSRF token for state-changing methods
    const cookieHeader = c.req.header("Cookie") ?? "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [key, ...val] = c.trim().split("=");
        return [key, val.join("=")];
      })
    );

    const cookieToken = cookies[CSRF_COOKIE_NAME];
    const headerToken = c.req.header(CSRF_HEADER_NAME);

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return c.json(
        {
          success: false,
          error: {
            code: "CSRF_ERROR",
            message: "Invalid or missing CSRF token",
          },
        },
        403
      );
    }

    // Generate new token after successful verification (token rotation)
    const newToken = await generateToken(secret);
    c.header(
      "Set-Cookie",
      `${CSRF_COOKIE_NAME}=${newToken}; Path=/; HttpOnly; SameSite=Strict; Secure`,
      { append: true }
    );

    return next();
  };
}

/**
 * Generate a CSRF token for client-side usage.
 * Call this endpoint to get a token for forms/fetch.
 */
export function csrfTokenHandler(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c) => {
    const secret = c.env.CSRF_SECRET ?? "default-csrf-secret-change-in-production";
    const token = await generateToken(secret);

    // Set the cookie
    c.header(
      "Set-Cookie",
      `${CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Secure`,
      { append: true }
    );

    return c.json({ token });
  };
}
