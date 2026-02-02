/**
 * Sentry Integration for Cloudflare Workers
 *
 * Provides error tracking and performance monitoring.
 * Uses @sentry/cloudflare for edge-compatible Sentry SDK.
 *
 * Note: Cloudflare Workers use a different initialization pattern.
 * Use `wrapRequestHandler` to wrap your fetch handler.
 */

import {
  captureException as sentryCaptureException,
  captureMessage as sentryCaptureMessage,
  setUser as sentrySetUser,
  setTag as sentrySetTag,
  setExtra as sentrySetExtra,
  addBreadcrumb as sentryAddBreadcrumb,
  flush as sentryFlush,
  startSpan,
  wrapRequestHandler,
} from "@sentry/cloudflare";

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  debug?: boolean;
}

/**
 * Capture an exception with optional context.
 */
export function captureException(
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: { id: string; email?: string };
  }
): string {
  if (context?.user) {
    sentrySetUser(context.user);
  }

  if (context?.tags) {
    for (const [key, value] of Object.entries(context.tags)) {
      sentrySetTag(key, value);
    }
  }

  if (context?.extra) {
    for (const [key, value] of Object.entries(context.extra)) {
      sentrySetExtra(key, value);
    }
  }

  return sentryCaptureException(error);
}

/**
 * Capture a message with optional level.
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info"
): string {
  return sentryCaptureMessage(message, level);
}

/**
 * Set user context for subsequent events.
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  sentrySetUser(user);
}

/**
 * Set a tag for subsequent events.
 */
export function setTag(key: string, value: string): void {
  sentrySetTag(key, value);
}

/**
 * Add breadcrumb for debugging.
 */
export function addBreadcrumb(breadcrumb: {
  category?: string;
  message: string;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  data?: Record<string, unknown>;
}): void {
  sentryAddBreadcrumb({
    ...breadcrumb,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Flush pending events (useful before worker shutdown).
 */
export async function flush(timeout = 2000): Promise<boolean> {
  return sentryFlush(timeout);
}

/**
 * Wrap a function with Sentry error tracking and tracing.
 */
export function withSentry<T extends (...args: unknown[]) => unknown>(
  handler: T,
  options?: { op?: string; name?: string }
): T {
  return ((...args: Parameters<T>) => {
    return startSpan(
      {
        op: options?.op ?? "handler",
        name: options?.name ?? (handler.name || "anonymous"),
      },
      () => {
        try {
          return handler(...args);
        } catch (error) {
          captureException(error);
          throw error;
        }
      }
    );
  }) as T;
}

// Re-export wrapRequestHandler for advanced usage
export { wrapRequestHandler };
