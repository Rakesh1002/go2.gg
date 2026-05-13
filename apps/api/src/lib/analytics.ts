/**
 * Analytics Tracking Utilities
 *
 * Functions for tracking link clicks using Cloudflare Analytics Engine.
 */

import type { CachedLink } from "../bindings.js";

/**
 * Parse user agent to extract device, browser, and OS info
 */
export function parseUserAgent(ua: string): {
  device: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  isBot: boolean;
} {
  const lowerUa = ua.toLowerCase();

  // Bot detection
  const botPatterns = [
    "bot",
    "crawler",
    "spider",
    "scraper",
    "slurp",
    "curl",
    "wget",
    "python",
    "java",
    "go-http",
    "headless",
    "phantom",
    "lighthouse",
  ];
  const isBot = botPatterns.some((pattern) => lowerUa.includes(pattern));

  // Device detection
  let device = "desktop";
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    device = "mobile";
  } else if (/ipad|tablet|playbook|silk/i.test(ua)) {
    device = "tablet";
  }

  // Browser detection
  let browser = "unknown";
  let browserVersion = "";

  if (/edg\//i.test(ua)) {
    browser = "Edge";
    browserVersion = ua.match(/edg\/([\d.]+)/i)?.[1] ?? "";
  } else if (/chrome/i.test(ua) && !/chromium/i.test(ua)) {
    browser = "Chrome";
    browserVersion = ua.match(/chrome\/([\d.]+)/i)?.[1] ?? "";
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = "Safari";
    browserVersion = ua.match(/version\/([\d.]+)/i)?.[1] ?? "";
  } else if (/firefox/i.test(ua)) {
    browser = "Firefox";
    browserVersion = ua.match(/firefox\/([\d.]+)/i)?.[1] ?? "";
  } else if (/opera|opr\//i.test(ua)) {
    browser = "Opera";
    browserVersion = ua.match(/(?:opera|opr)\/([\d.]+)/i)?.[1] ?? "";
  }

  // OS detection
  let os = "unknown";
  let osVersion = "";

  if (/windows nt/i.test(ua)) {
    os = "Windows";
    const versionMap: Record<string, string> = {
      "10.0": "10",
      "6.3": "8.1",
      "6.2": "8",
      "6.1": "7",
    };
    const ntVersion = ua.match(/windows nt ([\d.]+)/i)?.[1] ?? "";
    osVersion = versionMap[ntVersion] ?? ntVersion;
  } else if (/mac os x/i.test(ua)) {
    os = "macOS";
    osVersion = ua.match(/mac os x ([\d_]+)/i)?.[1]?.replace(/_/g, ".") ?? "";
  } else if (/android/i.test(ua)) {
    os = "Android";
    osVersion = ua.match(/android ([\d.]+)/i)?.[1] ?? "";
  } else if (/iphone os|ipad.*os/i.test(ua)) {
    os = "iOS";
    osVersion = ua.match(/(?:iphone|ipad).*os ([\d_]+)/i)?.[1]?.replace(/_/g, ".") ?? "";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  }

  return { device, browser, browserVersion, os, osVersion, isBot };
}

/**
 * Extract referrer domain from full referrer URL
 */
export function extractReferrerDomain(referrer: string | null): string | null {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);
    return url.hostname;
  } catch {
    return null;
  }
}

/**
 * Hash IP address for privacy (SHA-256)
 */
export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${ip}go2-salt`); // Add salt for extra privacy
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Track a click event in Analytics Engine
 */
export async function trackClick(
  tracker: AnalyticsEngineDataset,
  link: CachedLink,
  request: Request
): Promise<void> {
  const cf = request.cf;
  const ua = request.headers.get("user-agent") ?? "";
  const { device, browser, os, isBot } = parseUserAgent(ua);
  const referrer = request.headers.get("referer");
  const referrerDomain = extractReferrerDomain(referrer);

  // Write to Analytics Engine
  // blobs: string data (max 20)
  // doubles: numeric data (max 20)
  // indexes: indexed fields (max 1)
  tracker.writeDataPoint({
    blobs: [
      link.id, // 0: link ID
      link.slug, // 1: slug
      link.domain, // 2: domain
      link.destinationUrl, // 3: destination
      (cf?.country as string) ?? "", // 4: country
      (cf?.city as string) ?? "", // 5: city
      (cf?.region as string) ?? "", // 6: region
      device, // 7: device type
      browser, // 8: browser
      os, // 9: OS
      referrerDomain ?? "", // 10: referrer domain
      link.abVariant ?? "", // 11: A/B variant
    ],
    doubles: [
      Date.now(), // 0: timestamp
      (cf?.longitude as number) ?? 0, // 1: longitude
      (cf?.latitude as number) ?? 0, // 2: latitude
      isBot ? 1 : 0, // 3: is bot
    ],
    indexes: [link.id], // For filtering by link ID
  });
}

/**
 * Determine the correct destination URL based on targeting rules
 */
export function resolveDestination(link: CachedLink, request: Request): string {
  const cf = request.cf;
  const ua = request.headers.get("user-agent") ?? "";
  const { device, os } = parseUserAgent(ua);

  // Check device-specific deep links first
  if (os === "iOS" && link.iosUrl) {
    return link.iosUrl;
  }
  if (os === "Android" && link.androidUrl) {
    return link.androidUrl;
  }

  // Check geo targeting
  if (link.geoTargets && cf?.country) {
    const country = cf.country as string;
    if (link.geoTargets[country]) {
      return link.geoTargets[country];
    }
  }

  // Check device targeting
  if (link.deviceTargets) {
    if (link.deviceTargets[device]) {
      return link.deviceTargets[device];
    }
  }

  return link.destinationUrl;
}

// -----------------------------------------------------------------------------
// A/B testing — runtime variant selection
// -----------------------------------------------------------------------------

/**
 * Minimal A/B test state cached in KV for fast edge lookups.
 * Click counts are intentionally excluded — they live in D1 and are read by
 * the results endpoint, not the redirect path.
 */
export interface ABTestState {
  id: string;
  status: "draft" | "running" | "paused" | "completed";
  variants: Array<{ id: string; url: string; weight: number; name: string }>;
  trafficPercentage: number;
  winnerVariantId: string | null;
}

const AB_KV_TTL_SECONDS = 60;

function abTestKvKey(id: string): string {
  return `abtest:${id}`;
}

export async function getABTestFromKV(kv: KVNamespace, id: string): Promise<ABTestState | null> {
  return kv.get<ABTestState>(abTestKvKey(id), "json");
}

export async function setABTestInKV(kv: KVNamespace, state: ABTestState): Promise<void> {
  await kv.put(abTestKvKey(state.id), JSON.stringify(state), {
    expirationTtl: AB_KV_TTL_SECONDS,
  });
}

export async function deleteABTestFromKV(kv: KVNamespace, id: string): Promise<void> {
  await kv.delete(abTestKvKey(id));
}

/**
 * Pick a variant for the current request. Returns null when the test should
 * not influence the redirect (paused/draft, traffic sampled out, no variants).
 *
 * Selection is per-request weighted random. Returning visitors are not bucketed
 * stickily — that is a planned follow-up; for the typical anonymous redirect
 * audience, weighted random is the right default.
 */
export function selectABVariant(
  state: ABTestState
): { id: string; url: string; name: string } | null {
  if (!state.variants || state.variants.length === 0) {
    return null;
  }

  // Completed test with a winner: lock in the winner URL until the link is
  // updated. (Normally the /complete endpoint also rewrites links.destinationUrl
  // and clears link.abTestId, so this branch is defensive for in-flight reads.)
  if (state.status === "completed") {
    if (!state.winnerVariantId) return null;
    const winner = state.variants.find((v) => v.id === state.winnerVariantId);
    return winner ? { id: winner.id, url: winner.url, name: winner.name } : null;
  }

  if (state.status !== "running") {
    return null;
  }

  // Traffic percentage sampling: only `trafficPercentage`% of visitors enter
  // the test. The rest fall through to the link's default destination.
  const trafficPct = Math.max(0, Math.min(100, state.trafficPercentage ?? 100));
  if (trafficPct < 100) {
    const sample = secureRandom();
    if (sample * 100 >= trafficPct) {
      return null;
    }
  }

  const totalWeight = state.variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight <= 0) return null;

  const pick = secureRandom() * totalWeight;
  let cursor = 0;
  for (const v of state.variants) {
    cursor += v.weight;
    if (pick < cursor) {
      return { id: v.id, url: v.url, name: v.name };
    }
  }
  // Floating point fallback — return last variant.
  const last = state.variants[state.variants.length - 1];
  return last ? { id: last.id, url: last.url, name: last.name } : null;
}

function secureRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  // Map uint32 → [0, 1)
  return buf[0]! / 0x1_0000_0000;
}
