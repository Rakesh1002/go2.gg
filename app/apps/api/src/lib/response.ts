/**
 * Standardized API Response Helpers
 *
 * Provides consistent response formats across all endpoints.
 */

import type { Context } from "hono";

// -----------------------------------------------------------------------------
// Response Types
// -----------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ResponseMeta {
  page?: number;
  perPage?: number;
  total?: number;
  hasMore?: boolean;
}

// -----------------------------------------------------------------------------
// Success Responses
// -----------------------------------------------------------------------------

export function ok<T>(c: Context, data: T, meta?: ResponseMeta) {
  return c.json<ApiResponse<T>>({
    success: true,
    data,
    meta,
  });
}

export function created<T>(c: Context, data: T) {
  return c.json<ApiResponse<T>>(
    {
      success: true,
      data,
    },
    201
  );
}

export function noContent(c: Context) {
  return c.body(null, 204);
}

// -----------------------------------------------------------------------------
// Error Responses
// -----------------------------------------------------------------------------

export function badRequest(c: Context, message: string, code = "BAD_REQUEST", details?: unknown) {
  return c.json<ApiResponse>(
    {
      success: false,
      error: { code, message, details },
    },
    400
  );
}

export function unauthorized(c: Context, message = "Unauthorized", code = "UNAUTHORIZED") {
  return c.json<ApiResponse>(
    {
      success: false,
      error: { code, message },
    },
    401
  );
}

export function forbidden(c: Context, message = "Forbidden", code = "FORBIDDEN") {
  return c.json<ApiResponse>(
    {
      success: false,
      error: { code, message },
    },
    403
  );
}

export function notFound(c: Context, message = "Not found", code = "NOT_FOUND") {
  return c.json<ApiResponse>(
    {
      success: false,
      error: { code, message },
    },
    404
  );
}

export function conflict(c: Context, message: string, code = "CONFLICT") {
  return c.json<ApiResponse>(
    {
      success: false,
      error: { code, message },
    },
    409
  );
}

export function paymentRequired(
  c: Context,
  message: string,
  details?: { limit?: number; current?: number; upgradeUrl?: string }
) {
  return c.json<ApiResponse>(
    {
      success: false,
      error: {
        code: "PAYMENT_REQUIRED",
        message,
        details,
      },
    },
    402
  );
}

export function tooManyRequests(c: Context, message = "Too many requests", retryAfter?: number) {
  const headers: Record<string, string> = {};
  if (retryAfter) {
    headers["Retry-After"] = String(retryAfter);
  }

  return c.json<ApiResponse>(
    {
      success: false,
      error: { code: "RATE_LIMITED", message },
    },
    { status: 429, headers }
  );
}

export function internalError(c: Context, message = "Internal server error") {
  return c.json<ApiResponse>(
    {
      success: false,
      error: { code: "INTERNAL_ERROR", message },
    },
    500
  );
}

/**
 * Generic error response with custom status code
 */
export function error(c: Context, status: number, message: string, code = "ERROR") {
  return c.json<ApiResponse>(
    {
      success: false,
      error: { code, message },
    },
    status as 400 | 401 | 403 | 404 | 409 | 500
  );
}

// -----------------------------------------------------------------------------
// Validation Error
// -----------------------------------------------------------------------------

export function validationError(c: Context, errors: Record<string, string[]>) {
  return c.json<ApiResponse>(
    {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: errors,
      },
    },
    400
  );
}
