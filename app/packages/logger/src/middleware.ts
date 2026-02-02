/**
 * Logging Middleware
 *
 * Provides request/response logging and tracing for Hono handlers.
 */

import type { Logger, LogContext } from "./logger.js";

export interface RequestLogContext extends LogContext {
  method: string;
  path: string;
  userAgent?: string;
  ip?: string;
  duration?: number;
  status?: number;
}

/**
 * Generate a unique request ID.
 * Uses crypto.randomUUID() which is available in Cloudflare Workers.
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Create request context for logging.
 */
export function createRequestContext(
  request: Request,
  requestId: string,
  userId?: string,
  orgId?: string
): RequestLogContext {
  const url = new URL(request.url);

  return {
    requestId,
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get("user-agent") ?? undefined,
    ip:
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for") ??
      undefined,
    userId,
    orgId,
  };
}

/**
 * Log request start.
 */
export function logRequestStart(logger: Logger, context: RequestLogContext): void {
  logger.info(`${context.method} ${context.path}`, context);
}

/**
 * Log request completion.
 */
export function logRequestEnd(
  logger: Logger,
  context: RequestLogContext,
  status: number,
  durationMs: number
): void {
  const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
  const message = `${context.method} ${context.path} ${status} ${durationMs}ms`;

  logger[level](message, {
    ...context,
    status,
    duration: durationMs,
  });
}

/**
 * Log an error during request handling.
 */
export function logRequestError(logger: Logger, context: RequestLogContext, error: unknown): void {
  logger.error(`${context.method} ${context.path} error`, context, error);
}
