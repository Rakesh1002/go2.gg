/**
 * Axiom log ingestion.
 *
 * Single sink for FE + BE structured events. Filters at source — only
 * `level >= warn` plus tagged business events make it past the call site.
 * The forwarder POSTs once per event with `ctx.waitUntil`, which is fine for
 * the volumes we care about (errors, webhook failures, queue dead-letter).
 *
 * Why no SDK: Workers fetch is enough. Axiom's HTTP ingest is just a single
 * POST per dataset; batching gains nothing on a Worker that already serves
 * one request at a time.
 *
 * Env contract:
 *   AXIOM_API_KEY  — ingest token (xaat-…). When unset, every call is a no-op.
 *   AXIOM_DATASET  — dataset name. Defaults to "go2".
 */

const DEFAULT_DATASET = "go2";
const AXIOM_INGEST_URL = "https://api.axiom.co/v1/datasets";

export interface AxiomEnv {
  AXIOM_API_KEY?: string;
  AXIOM_DATASET?: string;
  APP_ENV?: string;
}

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEvent {
  level: LogLevel;
  message: string;
  /** ISO timestamp; auto-stamped if omitted */
  _time?: string;
  /** Logical source — "api" | "web" | "worker:queue" | etc. */
  source?: string;
  /** Request id from Hono's requestId middleware */
  requestId?: string;
  /** Free-form tags for filtering in Axiom */
  [key: string]: unknown;
}

/**
 * Send a single event to Axiom. Returns silently on missing config so the
 * caller can stay free of conditionals. Failures are swallowed (logged) —
 * we never want a logger to take down a request.
 */
export async function sendToAxiom(env: AxiomEnv, event: LogEvent): Promise<void> {
  if (!env.AXIOM_API_KEY) return;

  const dataset = env.AXIOM_DATASET || DEFAULT_DATASET;
  const payload = [
    {
      _time: event._time ?? new Date().toISOString(),
      app_env: env.APP_ENV ?? "development",
      ...event,
    },
  ];

  try {
    const res = await fetch(`${AXIOM_INGEST_URL}/${encodeURIComponent(dataset)}/ingest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.AXIOM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`[axiom] ingest failed ${res.status}: ${body.slice(0, 200)}`);
    }
  } catch (error) {
    console.warn(`[axiom] ingest error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convenience wrapper for the structured-error path (Hono onError, queue
 * consumer, scheduled handler). Always at level=error.
 */
export async function logError(
  env: AxiomEnv,
  message: string,
  fields: Record<string, unknown> = {},
): Promise<void> {
  await sendToAxiom(env, { level: "error", source: "api", message, ...fields });
}

/**
 * Tagged business-event logger. Use for things that aren't errors but are
 * worth keeping (Stripe webhook received, dunning step advanced, etc.).
 * Default level is info — bump to "warn" for things you'd want to grep on.
 */
export async function logEvent(
  env: AxiomEnv,
  message: string,
  fields: Record<string, unknown> = {},
  level: LogLevel = "info",
): Promise<void> {
  await sendToAxiom(env, { level, source: "api", message, ...fields });
}

// ---------------------------------------------------------------------------
// Frontend forwarding
// ---------------------------------------------------------------------------

/**
 * Whitelist of message/error patterns to drop before they ever hit Axiom.
 * Browser noise that's never actionable.
 */
const FE_NOISE_PATTERNS: RegExp[] = [
  /ResizeObserver loop/i,
  /^Load failed$/i,
  /^Failed to fetch$/i,
  /^NetworkError\b/i,
  /cancelled/i,
  /^Script error\.?$/i,
];

export interface ClientLogPayload {
  level?: LogLevel;
  message: string;
  url?: string;
  userAgent?: string;
  stack?: string;
  digest?: string;
  source?: string;
  [key: string]: unknown;
}

/**
 * Returns true when the FE event should be dropped at the API boundary.
 * Bot UAs and known-noisy errors are filtered before forwarding to Axiom
 * so we don't pay ingest cost on garbage.
 */
export function shouldDropClientEvent(payload: ClientLogPayload): boolean {
  if (!payload.message || typeof payload.message !== "string") return true;
  if (payload.message.length > 4000) return true;
  for (const pat of FE_NOISE_PATTERNS) {
    if (pat.test(payload.message)) return true;
  }
  const ua = (payload.userAgent ?? "").toLowerCase();
  if (ua && /(bot|spider|crawler|headless|preview|monitoring)/.test(ua)) return true;
  return false;
}

/**
 * Forward a parsed client log payload to Axiom. The caller (the /v1/log
 * route) is responsible for validating shape, applying drop rules, and
 * adding request-side context (ip hash, country, request id).
 */
export async function forwardClientLog(
  env: AxiomEnv,
  payload: ClientLogPayload,
  context: Record<string, unknown> = {},
): Promise<void> {
  await sendToAxiom(env, {
    level: payload.level ?? "error",
    source: payload.source ?? "web",
    message: payload.message.slice(0, 4000),
    url: payload.url,
    userAgent: payload.userAgent,
    stack: payload.stack?.slice(0, 8000),
    digest: payload.digest,
    ...context,
  });
}
