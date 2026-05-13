/**
 * Product analytics — server-side fan-out.
 *
 * Mirrors lib/axiom.ts shape. One call from the route handler, fan out to
 * every product-analytics sink we care about (PostHog, GA4 Measurement
 * Protocol). Fire-and-forget via ctx.waitUntil at the call site.
 *
 * Goals (drives the funnel in PostHog/GA4):
 *   - signup
 *   - link_created
 *   - link_clicked          (fired from edge redirect — keep payload tiny)
 *   - conversion_tracked    (lead | sale | custom)
 *   - plan_upgraded
 *
 * Env contract:
 *   POSTHOG_API_KEY        — phc_… project token. Unset → PostHog no-op.
 *   POSTHOG_HOST           — default https://us.i.posthog.com
 *   GA4_MEASUREMENT_ID     — G-… measurement id. Unset → GA4 no-op.
 *   GA4_API_SECRET         — Measurement Protocol secret.
 */

export interface ProductAnalyticsEnv {
  POSTHOG_API_KEY?: string;
  POSTHOG_HOST?: string;
  GA4_MEASUREMENT_ID?: string;
  GA4_API_SECRET?: string;
  APP_ENV?: string;
}

export type ProductEventName =
  | "signup"
  | "link_created"
  | "link_clicked"
  | "conversion_tracked"
  | "plan_upgraded"
  | "plan_downgraded"
  | "trial_started"
  | "trial_ended"
  | "checkout_started"
  | "checkout_completed"
  | "subscription_canceled"
  | "subscription_paid"
  | "sdk_installed"
  | "api_key_created"
  | "webhook_created"
  | "domain_added";

export interface CaptureInput {
  /** Event name — keep canonical (snake_case). */
  event: ProductEventName | (string & {});
  /** Stable id for the user/org. PostHog's distinct_id, GA4's user_id. */
  distinctId: string;
  /** Event properties — flat object. */
  properties?: Record<string, unknown>;
  /** When the event fired. ISO-8601. Defaults to now. */
  timestamp?: string;
  /**
   * GA4 client_id. If absent we fall back to a hash of distinctId so the
   * Measurement Protocol request is still accepted. PostHog ignores this.
   */
  ga4ClientId?: string;
}

const POSTHOG_DEFAULT_HOST = "https://us.i.posthog.com";

/**
 * Fire one event to every configured sink. Failures are swallowed — analytics
 * must never take down a real request. Caller decides whether to await or
 * hand to ctx.waitUntil.
 */
export async function captureEvent(
  env: ProductAnalyticsEnv,
  input: CaptureInput,
): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  if (env.POSTHOG_API_KEY) tasks.push(sendToPostHog(env, input));
  if (env.GA4_MEASUREMENT_ID && env.GA4_API_SECRET) tasks.push(sendToGA4(env, input));
  await Promise.allSettled(tasks);
}

/**
 * Fire a batch of events. PostHog supports batched ingest natively. GA4
 * batches up to 25 events per request.
 */
export async function captureBatch(
  env: ProductAnalyticsEnv,
  inputs: CaptureInput[],
): Promise<void> {
  if (inputs.length === 0) return;
  const tasks: Promise<unknown>[] = [];
  if (env.POSTHOG_API_KEY) tasks.push(sendBatchToPostHog(env, inputs));
  if (env.GA4_MEASUREMENT_ID && env.GA4_API_SECRET) {
    // GA4 has a 25-event-per-request limit. Group by client_id where possible.
    const grouped = groupByClientId(inputs);
    for (const group of grouped) tasks.push(sendBatchToGA4(env, group));
  }
  await Promise.allSettled(tasks);
}

// ---------------------------------------------------------------------------
// PostHog
// ---------------------------------------------------------------------------

async function sendToPostHog(
  env: ProductAnalyticsEnv,
  input: CaptureInput,
): Promise<void> {
  const host = env.POSTHOG_HOST || POSTHOG_DEFAULT_HOST;
  const url = `${host.replace(/\/$/, "")}/i/v0/e/`;
  const body = {
    api_key: env.POSTHOG_API_KEY,
    event: input.event,
    distinct_id: input.distinctId,
    timestamp: input.timestamp ?? new Date().toISOString(),
    properties: {
      $lib: "go2-server",
      app_env: env.APP_ENV ?? "development",
      ...(input.properties ?? {}),
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[posthog] capture failed ${res.status}`);
    }
  } catch (error) {
    console.warn(
      `[posthog] capture error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function sendBatchToPostHog(
  env: ProductAnalyticsEnv,
  inputs: CaptureInput[],
): Promise<void> {
  const host = env.POSTHOG_HOST || POSTHOG_DEFAULT_HOST;
  const url = `${host.replace(/\/$/, "")}/batch/`;
  const body = {
    api_key: env.POSTHOG_API_KEY,
    batch: inputs.map((i) => ({
      event: i.event,
      distinct_id: i.distinctId,
      timestamp: i.timestamp ?? new Date().toISOString(),
      properties: {
        $lib: "go2-server",
        app_env: env.APP_ENV ?? "development",
        ...(i.properties ?? {}),
      },
    })),
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[posthog] batch failed ${res.status}`);
    }
  } catch (error) {
    console.warn(
      `[posthog] batch error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// GA4 — Measurement Protocol
// ---------------------------------------------------------------------------
// https://developers.google.com/analytics/devguides/collection/protocol/ga4

async function sendToGA4(
  env: ProductAnalyticsEnv,
  input: CaptureInput,
): Promise<void> {
  await sendBatchToGA4(env, [input]);
}

async function sendBatchToGA4(
  env: ProductAnalyticsEnv,
  inputs: CaptureInput[],
): Promise<void> {
  const measurementId = env.GA4_MEASUREMENT_ID;
  const apiSecret = env.GA4_API_SECRET;
  if (!measurementId || !apiSecret) return;

  // GA4 requires a client_id at the payload level — all events in a single
  // request share the same client. groupByClientId guarantees that holds.
  const clientId = inputs[0]?.ga4ClientId ?? hashToClientId(inputs[0]!.distinctId);
  const userId = inputs[0]?.distinctId;

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`;
  const body = {
    client_id: clientId,
    user_id: userId,
    events: inputs.slice(0, 25).map((i) => ({
      name: sanitizeGA4EventName(i.event),
      params: sanitizeGA4Params({
        engagement_time_msec: 1,
        ...(i.properties ?? {}),
      }),
    })),
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[ga4] mp capture failed ${res.status}`);
    }
  } catch (error) {
    console.warn(
      `[ga4] mp error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * GA4 event names: 1-40 chars, [a-zA-Z0-9_], must start with a letter.
 */
function sanitizeGA4EventName(name: string): string {
  let cleaned = name.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40);
  if (!/^[a-zA-Z]/.test(cleaned)) cleaned = `e_${cleaned}`;
  return cleaned;
}

/**
 * GA4 param names: 1-40 chars, [a-zA-Z0-9_]. Values: scalar only, strings
 * truncated to 100 chars. Anything non-scalar is JSON-stringified.
 */
function sanitizeGA4Params(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [rawKey, rawValue] of Object.entries(input)) {
    const key = rawKey.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 40);
    if (!key) continue;
    if (rawValue == null) continue;
    if (typeof rawValue === "string") out[key] = rawValue.slice(0, 100);
    else if (typeof rawValue === "number" || typeof rawValue === "boolean") out[key] = rawValue;
    else {
      try {
        out[key] = JSON.stringify(rawValue).slice(0, 100);
      } catch {
        // unserialisable — skip
      }
    }
  }
  return out;
}

function hashToClientId(distinctId: string): string {
  // GA4 client_id format: <random>.<timestamp> — we deterministically derive
  // one from distinctId so repeat events from the same user stay grouped.
  let h = 5381;
  for (let i = 0; i < distinctId.length; i++) {
    h = ((h << 5) + h + distinctId.charCodeAt(i)) | 0;
  }
  const seed = Math.abs(h).toString();
  return `${seed}.${seed}`;
}

function groupByClientId(inputs: CaptureInput[]): CaptureInput[][] {
  const buckets = new Map<string, CaptureInput[]>();
  for (const input of inputs) {
    const key = input.ga4ClientId ?? input.distinctId;
    const existing = buckets.get(key);
    if (existing) existing.push(input);
    else buckets.set(key, [input]);
  }
  return Array.from(buckets.values());
}
