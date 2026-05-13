/**
 * Client-side logger.
 *
 * Forwards browser errors to the API's `/v1/log` route, which republishes
 * to the Axiom dataset that backend logs share. Filtering happens server-side
 * in `apps/api/src/lib/axiom.ts#shouldDropClientEvent`, so this client stays
 * dumb on purpose: serialize, POST, return.
 *
 * Designed to never throw — a failing logger must never break a page.
 */

const LOG_ENDPOINT_PATH = "/api/v1/log";

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

interface LogPayload {
  level?: LogLevel;
  message: string;
  url?: string;
  userAgent?: string;
  stack?: string;
  digest?: string;
  source?: string;
}

function getApiBase(): string {
  // Set by Next.js public env in apps/web/wrangler.toml [vars].
  // Falls back to same-origin (covers preview deployments).
  return (
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
    (typeof window !== "undefined" ? window.location.origin : "")
  );
}

export async function reportClientLog(payload: LogPayload): Promise<void> {
  if (typeof window === "undefined") return;

  const body: LogPayload = {
    level: payload.level ?? "error",
    message: String(payload.message ?? "").slice(0, 4000),
    url: payload.url ?? window.location.href,
    userAgent: payload.userAgent ?? navigator.userAgent,
    stack: payload.stack,
    digest: payload.digest,
    source: payload.source ?? "web",
  };

  const url = `${getApiBase()}${LOG_ENDPOINT_PATH}`;

  // Prefer sendBeacon during unload; it's fire-and-forget and survives
  // navigation. Fall back to fetch with keepalive for normal in-page errors.
  try {
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
    if (navigator.sendBeacon?.(url, blob)) return;
  } catch {
    // fall through to fetch
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "omit",
      keepalive: true,
    });
  } catch {
    // Swallow — see header comment.
  }
}

/**
 * Best-effort report for a thrown Error. Use from React error boundaries.
 */
export function reportError(error: unknown, fields: Partial<LogPayload> = {}): void {
  const err = error instanceof Error ? error : new Error(String(error));
  void reportClientLog({
    level: "error",
    message: err.message || "Unknown client error",
    stack: err.stack,
    ...fields,
  });
}
