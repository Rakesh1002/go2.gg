/**
 * @repo/logger - Structured Logging & Observability
 *
 * This package provides:
 * - Structured JSON logging for Cloudflare Workers
 * - Sentry integration for error tracking
 * - Request tracing middleware
 *
 * Usage:
 * ```typescript
 * import { initLogger, getLogger } from "@repo/logger";
 *
 * // Initialize at startup
 * initLogger({
 *   minLevel: "info",
 *   service: "api",
 *   environment: "production",
 * });
 *
 * // Use throughout your app
 * const logger = getLogger();
 * logger.info("User logged in", { userId: "123" });
 * logger.error("Payment failed", { orderId: "456" }, error);
 * ```
 */

export {
  createLogger,
  initLogger,
  getLogger,
  type Logger,
  type LogLevel,
  type LogContext,
  type LogEntry,
  type LoggerConfig,
} from "./logger.js";

export {
  generateRequestId,
  createRequestContext,
  logRequestStart,
  logRequestEnd,
  logRequestError,
  type RequestLogContext,
} from "./middleware.js";
