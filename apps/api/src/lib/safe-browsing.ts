/**
 * Destination URL safety checks
 *
 * Two-layer threat lookup used at link create / update time and from the
 * daily rescan cron:
 *
 *   1. Google Safe Browsing v4 Lookup API — free tier, 10k req/day per key.
 *      Returns one of MALWARE | SOCIAL_ENGINEERING | UNWANTED_SOFTWARE |
 *      POTENTIALLY_HARMFUL_APPLICATION when the URL is on Google's list.
 *
 *   2. Cloudflare URL Scanner v2 — same dataset Cloudflare's Safe Browsing
 *      relies on, plus their own ML phishing classifier. Used as a second
 *      layer because Google's list lags real-world phishing by ~hours.
 *
 * Both are best-effort. If a key is unset or the upstream times out we fall
 * back to "unknown" — the daily cron will retry. We never fail-closed on
 * link create because that turns every aigateway hiccup into a paying
 * customer hitting "your link could not be created."
 */
import type { Env } from "../bindings.js";
import { logEvent } from "./axiom.js";

/**
 * Extract the host from a URL for safe logging (don't log full URLs — they
 * may contain credentials in query strings or pii in paths).
 */
function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "<unparseable>";
  }
}

/**
 * Best-effort fail-open logger. Every silent `return null` from a scanner
 * flows through here so an outage / revoked-key / quota-hit is visible in
 * Axiom + Workers Logs instead of looking identical to "key not set."
 */
async function logFailOpen(
  env: Env,
  scanner: "safe_browsing" | "url_scanner",
  reason: "no_key" | "http_error" | "timeout" | "exception" | "parse_error",
  context: { url: string; status?: number; latencyMs?: number; err?: string }
): Promise<void> {
  // Only noisy-warn for "real" failures; missing key is expected in dev.
  if (reason === "no_key" && env.APP_ENV !== "production") return;

  const level = reason === "no_key" ? "info" : "warn";
  await logEvent(
    env,
    `${scanner}.fail_open`,
    {
      reason,
      host: safeHost(context.url),
      status: context.status,
      latencyMs: context.latencyMs,
      err: context.err?.slice(0, 200),
    },
    level
  ).catch(() => undefined);

  // Workers Logs / wrangler tail visibility.
  console.warn(`[${scanner}] fail-open (${reason}) for ${safeHost(context.url)}`);
}

export type ThreatType =
  | "MALWARE"
  | "SOCIAL_ENGINEERING"
  | "UNWANTED_SOFTWARE"
  | "POTENTIALLY_HARMFUL_APPLICATION"
  | "URL_SCANNER_PHISHING"
  | "URL_SCANNER_MALICIOUS";

export interface ThreatVerdict {
  /** clean: no scanner flagged. flagged: at least one positive. unknown: no scanner could answer. */
  status: "clean" | "flagged" | "unknown";
  /** Source-prefixed verdict, e.g. "safe_browsing:SOCIAL_ENGINEERING". Empty on clean/unknown. */
  verdict: string;
  /** Which scanners actually ran. */
  scanners: Array<"safe_browsing" | "url_scanner">;
}

const SB_BLOCKING_THREATS = new Set<ThreatType>([
  "MALWARE",
  "SOCIAL_ENGINEERING",
  "UNWANTED_SOFTWARE",
  "POTENTIALLY_HARMFUL_APPLICATION",
]);

const SB_ENDPOINT = "https://safebrowsing.googleapis.com/v4/threatMatches:find";
const SB_TIMEOUT_MS = 4000;
const URL_SCANNER_TIMEOUT_MS = 6000;

interface SafeBrowsingResponse {
  matches?: Array<{
    threatType?: string;
    platformType?: string;
    threat?: { url?: string };
  }>;
}

/**
 * Check a single URL against the Google Safe Browsing v4 Lookup API.
 *
 * Returns null when the key is missing or the upstream errors — callers
 * should treat null as "unknown" and rely on the second layer + rescan.
 */
export async function checkSafeBrowsing(
  env: Env,
  url: string
): Promise<{ flagged: boolean; threats: ThreatType[] } | null> {
  const key = env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!key) {
    await logFailOpen(env, "safe_browsing", "no_key", { url });
    return null;
  }

  const body = {
    client: {
      clientId: "go2gg",
      clientVersion: "1.0.0",
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SB_TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(`${SB_ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      await logFailOpen(env, "safe_browsing", "http_error", {
        url,
        status: res.status,
        latencyMs: Date.now() - start,
      });
      return null;
    }

    const data = (await res.json()) as SafeBrowsingResponse;
    const matches = data.matches ?? [];
    const threats = matches
      .map((m) => m.threatType as ThreatType | undefined)
      .filter((t): t is ThreatType => !!t && SB_BLOCKING_THREATS.has(t));

    return { flagged: threats.length > 0, threats };
  } catch (err) {
    const reason = err instanceof Error && err.name === "AbortError" ? "timeout" : "exception";
    await logFailOpen(env, "safe_browsing", reason, {
      url,
      latencyMs: Date.now() - start,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

interface UrlScannerResponse {
  result?: {
    verdicts?: {
      overall?: { malicious?: boolean; phishing?: string[]; categories?: string[] };
    };
  };
}

/**
 * Check a single URL against the Cloudflare URL Scanner v2 API.
 *
 * This is a synchronous lookup against already-scanned URLs in CF's cache.
 * We don't submit a fresh scan from the create-link hot path — that takes
 * tens of seconds. The daily rescan cron submits fresh scans for previously
 * unknown destinations.
 */
export async function checkUrlScanner(
  env: Env,
  url: string
): Promise<{ flagged: boolean; reasons: string[] } | null> {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const token = env.CLOUDFLARE_URLSCANNER_TOKEN;
  if (!accountId || !token) {
    await logFailOpen(env, "url_scanner", "no_key", { url });
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), URL_SCANNER_TIMEOUT_MS);
  const start = Date.now();

  try {
    // Search by hostname for already-scanned URLs — much faster than
    // submitting a new scan, which is what we want on the create path.
    const params = new URLSearchParams({ url, limit: "1" });
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/urlscanner/v2/search?${params.toString()}`,
      {
        headers: { authorization: `Bearer ${token}` },
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      await logFailOpen(env, "url_scanner", "http_error", {
        url,
        status: res.status,
        latencyMs: Date.now() - start,
      });
      return null;
    }

    const data = (await res.json()) as { result?: { tasks?: Array<{ uuid?: string }> } };
    const uuid = data.result?.tasks?.[0]?.uuid;
    // No prior scan = unscanned, NOT clean. Return null so the verdict
    // composer treats this destination as unknown and the interstitial /
    // rescan path can pick it up. The previous behaviour (return {flagged:
    // false}) would let a brand-new phishing URL Google hasn't seen pass
    // both layers.
    if (!uuid) return null;

    // Fetch the verdict for the most recent scan.
    const verdictRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/urlscanner/v2/result/${uuid}`,
      {
        headers: { authorization: `Bearer ${token}` },
        signal: controller.signal,
      }
    );
    if (!verdictRes.ok) {
      await logFailOpen(env, "url_scanner", "http_error", {
        url,
        status: verdictRes.status,
        latencyMs: Date.now() - start,
      });
      return null;
    }

    const verdictData = (await verdictRes.json()) as { result?: UrlScannerResponse["result"] };
    const overall = verdictData.result?.verdicts?.overall;
    if (!overall) return null;

    const reasons: string[] = [];
    if (overall.malicious) reasons.push("malicious");
    if (overall.phishing && overall.phishing.length > 0) reasons.push("phishing");

    return { flagged: reasons.length > 0, reasons };
  } catch (err) {
    const reason = err instanceof Error && err.name === "AbortError" ? "timeout" : "exception";
    await logFailOpen(env, "url_scanner", reason, {
      url,
      latencyMs: Date.now() - start,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Run both threat checks in parallel and combine the verdict.
 *
 * Strategy: flagged if EITHER scanner says so. If both return null we
 * surface "unknown" — the daily rescan cron will retry with fresh queries.
 */
export async function checkDestinationThreat(env: Env, url: string): Promise<ThreatVerdict> {
  const [sb, scanner] = await Promise.all([checkSafeBrowsing(env, url), checkUrlScanner(env, url)]);

  const scanners: ThreatVerdict["scanners"] = [];
  if (sb !== null) scanners.push("safe_browsing");
  if (scanner !== null) scanners.push("url_scanner");

  if (sb?.flagged) {
    return {
      status: "flagged",
      verdict: `safe_browsing:${sb.threats[0]}`,
      scanners,
    };
  }
  if (scanner?.flagged) {
    return {
      status: "flagged",
      verdict: `url_scanner:${scanner.reasons[0]}`,
      scanners,
    };
  }

  // Both ran and both came back clean.
  if (sb && scanner) {
    return { status: "clean", verdict: "", scanners };
  }
  // At least one ran and was clean — accept it. We can't get a stronger
  // signal without paying the URL Scanner submit cost on the hot path.
  if (sb || scanner) {
    return { status: "clean", verdict: "", scanners };
  }

  return { status: "unknown", verdict: "", scanners };
}

/**
 * Convenience: returns true if the destination should be blocked at create
 * time. Treats "unknown" as not-blocking so we don't fail-closed when a key
 * is missing.
 */
export function shouldBlockOnCreate(verdict: ThreatVerdict): boolean {
  return verdict.status === "flagged";
}
