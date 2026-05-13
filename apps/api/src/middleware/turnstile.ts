/**
 * Turnstile Bot Protection Middleware
 *
 * Verifies Cloudflare Turnstile tokens for bot protection.
 */

import type { MiddlewareHandler } from "hono";
import type { Env } from "../bindings.js";

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Middleware to verify Cloudflare Turnstile tokens
 *
 * Usage:
 * ```ts
 * app.post("/signup", turnstileMiddleware(), async (c) => { ... })
 * ```
 *
 * Client must send the token in the `cf-turnstile-response` header
 * or in the request body as `turnstileToken`.
 */
export function turnstileMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    // Skip if Turnstile is not configured
    if (!c.env.TURNSTILE_SECRET_KEY) {
      console.debug("Turnstile not configured, skipping verification");
      return next();
    }

    // Skip in development if explicitly allowed
    if (c.env.APP_ENV === "development" && !c.env.TURNSTILE_SECRET_KEY) {
      return next();
    }

    // Get token from header or body
    let token = c.req.header("cf-turnstile-response");

    if (!token) {
      try {
        const body = await c.req.json<{ turnstileToken?: string }>();
        token = body.turnstileToken;
      } catch {
        // Body parsing failed or no body
      }
    }

    if (!token) {
      return c.json(
        {
          success: false,
          error: {
            code: "TURNSTILE_REQUIRED",
            message: "Bot verification required",
          },
        },
        400
      );
    }

    // Verify with Cloudflare
    const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const ip = c.req.header("CF-Connecting-IP") ?? "";

    try {
      const response = await fetch(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: c.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: ip,
        }),
      });

      const result = await response.json<TurnstileResponse>();

      if (!result.success) {
        console.warn("Turnstile verification failed:", result["error-codes"]);

        return c.json(
          {
            success: false,
            error: {
              code: "TURNSTILE_FAILED",
              message: "Bot verification failed. Please try again.",
            },
          },
          400
        );
      }

      // Verification successful
      return next();
    } catch (error) {
      console.error("Turnstile verification error:", error);

      // Fail open in case of API issues (configurable)
      const failOpen = c.env.TURNSTILE_FAIL_OPEN === "true";

      if (failOpen) {
        console.warn("Turnstile API error, failing open");
        return next();
      }

      return c.json(
        {
          success: false,
          error: {
            code: "TURNSTILE_ERROR",
            message: "Bot verification service unavailable",
          },
        },
        503
      );
    }
  };
}

/**
 * Optional Turnstile middleware - doesn't block if verification fails
 * but sets a flag in the context
 */
export function optionalTurnstileMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    if (!c.env.TURNSTILE_SECRET_KEY) {
      c.set("turnstileVerified" as never, false as never);
      return next();
    }

    const token = c.req.header("cf-turnstile-response");

    if (!token) {
      c.set("turnstileVerified" as never, false as never);
      return next();
    }

    const verifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    try {
      const response = await fetch(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: c.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      });

      const result = await response.json<TurnstileResponse>();
      c.set("turnstileVerified" as never, result.success as never);
    } catch {
      c.set("turnstileVerified" as never, false as never);
    }

    return next();
  };
}
