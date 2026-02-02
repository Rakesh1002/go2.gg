/**
 * Global Error Handler
 *
 * Handles all uncaught errors and formats them consistently.
 */

import type { ErrorHandler } from "hono";
import type { Env } from "../bindings.js";
import { AuthError } from "@repo/auth";

/**
 * Centralized error handler for the API.
 * Logs errors and returns consistent error responses.
 */
export const errorHandler: ErrorHandler<{ Bindings: Env }> = (err, c) => {
  const requestId = c.get("requestId") ?? "unknown";

  // Log the error
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      requestId,
      message: err.message,
      name: err.name,
      stack: c.env.APP_ENV !== "production" ? err.stack : undefined,
      path: c.req.path,
      method: c.req.method,
    })
  );

  // Handle known error types
  if (err instanceof AuthError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          requestId,
        },
      },
      err.status as 400 | 401 | 403
    );
  }

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: (err as { issues?: unknown }).issues,
          requestId,
        },
      },
      400
    );
  }

  // Handle HTTP errors from Hono
  if ("status" in err && typeof err.status === "number") {
    return c.json(
      {
        success: false,
        error: {
          code: "HTTP_ERROR",
          message: err.message,
          requestId,
        },
      },
      err.status as 400 | 500
    );
  }

  // Default to 500 for unknown errors
  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: c.env.APP_ENV === "production" ? "An internal error occurred" : err.message,
        requestId,
      },
    },
    500
  );
};
