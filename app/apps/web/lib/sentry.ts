/**
 * Sentry Client Configuration
 *
 * Initialize Sentry for frontend error tracking.
 * This should be called once on app initialization.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Initialize Sentry for the browser
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    console.debug("Sentry DSN not configured, skipping initialization");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session Replay (optional)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out noise
    ignoreErrors: [
      // Browser extensions
      "ResizeObserver loop",
      "ResizeObserver loop limit exceeded",
      // Network errors that are usually user-side
      "Failed to fetch",
      "NetworkError",
      "Load failed",
      // Safari-specific
      "cancelled",
    ],

    // Don't send in development by default
    enabled: process.env.NODE_ENV === "production",

    // Add additional context
    beforeSend(event) {
      // Don't send events in development
      if (process.env.NODE_ENV === "development") {
        return null;
      }

      return event;
    },
  });
}

/**
 * Capture an exception with context
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: { id?: string; email?: string };
  }
) {
  if (context?.user) {
    Sentry.setUser(context.user);
  }

  if (context?.tags) {
    Sentry.setTags(context.tags);
  }

  Sentry.captureException(error, {
    extra: context?.extra,
  });
}

/**
 * Set user context for all subsequent events
 */
export function setUser(user: { id: string; email?: string } | null) {
  if (user) {
    Sentry.setUser(user);
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, unknown>, category?: string) {
  Sentry.addBreadcrumb({
    message,
    data,
    category: category ?? "custom",
    level: "info",
  });
}

/**
 * Create a span for performance monitoring
 */
export function startSpan<T>(name: string, callback: () => T | Promise<T>): T | Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: "function",
    },
    callback
  );
}

export { Sentry };
