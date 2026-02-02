/**
 * Structured JSON Logger
 *
 * Provides consistent, structured logging across the application.
 * Designed for:
 * - Cloudflare Workers (console.log outputs to Workers Logs)
 * - Edge compatibility (no Node.js-specific APIs)
 * - JSON format for log aggregation systems
 *
 * Log levels follow syslog severity:
 * - error: System is unusable or critical failure
 * - warn: Warning conditions
 * - info: Informational messages
 * - debug: Debug-level messages (disabled in production)
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  /** Unique request identifier for tracing */
  requestId?: string;
  /** User ID if authenticated */
  userId?: string;
  /** Organization ID if applicable */
  orgId?: string;
  /** Additional structured data */
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggerConfig {
  /** Minimum level to log */
  minLevel: LogLevel;
  /** Service name for identification */
  service: string;
  /** Environment (development, production, test) */
  environment: string;
  /** Enable pretty printing (development only) */
  pretty?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Creates a structured JSON logger instance.
 */
export function createLogger(config: LoggerConfig) {
  const { minLevel, service, environment, pretty = false } = config;
  const minLevelValue = LOG_LEVELS[minLevel];

  function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= minLevelValue;
  }

  function formatError(error: unknown): LogEntry["error"] | undefined {
    if (!error) return undefined;

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return {
      name: "UnknownError",
      message: String(error),
    };
  }

  function log(level: LogLevel, message: string, context?: LogContext, error?: unknown): void {
    if (!shouldLog(level)) return;

    const entry: LogEntry & { service: string; environment: string } = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service,
      environment,
    };

    if (context) {
      entry.context = context;
    }
    if (error) {
      entry.error = formatError(error);
    }

    const output = pretty ? JSON.stringify(entry, null, 2) : JSON.stringify(entry);

    // Use appropriate console method for log level
    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "debug":
        console.debug(output);
        break;
      default:
        console.info(output);
    }
  }

  return {
    debug: (message: string, context?: LogContext) => log("debug", message, context),
    info: (message: string, context?: LogContext) => log("info", message, context),
    warn: (message: string, context?: LogContext, error?: unknown) =>
      log("warn", message, context, error),
    error: (message: string, context?: LogContext, error?: unknown) =>
      log("error", message, context, error),

    /**
     * Create a child logger with additional context
     */
    child: (additionalContext: LogContext) => {
      return {
        debug: (message: string, context?: LogContext) =>
          log("debug", message, { ...additionalContext, ...context }),
        info: (message: string, context?: LogContext) =>
          log("info", message, { ...additionalContext, ...context }),
        warn: (message: string, context?: LogContext, error?: unknown) =>
          log("warn", message, { ...additionalContext, ...context }, error),
        error: (message: string, context?: LogContext, error?: unknown) =>
          log("error", message, { ...additionalContext, ...context }, error),
      };
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;

// -----------------------------------------------------------------------------
// Default Logger Singleton
// -----------------------------------------------------------------------------

let defaultLogger: Logger | null = null;

/**
 * Initialize the default logger.
 * Call this once at application startup.
 */
export function initLogger(config: LoggerConfig): Logger {
  defaultLogger = createLogger(config);
  return defaultLogger;
}

/**
 * Get the default logger instance.
 * Must call initLogger() first.
 */
export function getLogger(): Logger {
  if (!defaultLogger) {
    // Create a fallback logger in development
    defaultLogger = createLogger({
      minLevel: "debug",
      service: "unknown",
      environment: "development",
      pretty: true,
    });
  }
  return defaultLogger;
}
