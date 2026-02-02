/**
 * Enhanced Analytics Tracking Utilities
 *
 * Comprehensive click tracking with:
 * - Enhanced bot detection (based on Dub patterns)
 * - Click deduplication via identity hash
 * - Detailed UA parsing (device vendor, model, engine)
 * - QR vs link trigger detection
 * - Privacy-compliant IP hashing
 */

import type { CachedLink } from "../bindings.js";

// =============================================================================
// Types
// =============================================================================

export interface ClickMetadata {
  // Core identifiers
  clickId: string;
  linkId: string;
  userId: string | null;
  organizationId: string | null;
  domain: string;
  slug: string;
  destinationUrl: string;

  // Geolocation
  continent: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
  timezone: string | null;
  postalCode: string | null;

  // Device
  device: string;
  deviceVendor: string | null;
  deviceModel: string | null;

  // Browser
  browser: string;
  browserVersion: string;

  // Engine
  engine: string | null;
  engineVersion: string | null;

  // OS
  os: string;
  osVersion: string;

  // CPU
  cpuArchitecture: string | null;

  // Request info
  referrer: string | null;
  referrerDomain: string | null;
  ipHash: string | null;
  identityHash: string | null;
  userAgent: string;

  // Trigger
  trigger: "link" | "qr" | "api";
  isQr: boolean;

  // Detection flags
  isBot: boolean;
  isUnique: boolean;

  // UTM parameters
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;

  // A/B testing
  abTestId: string | null;
  abVariant: string | null;

  // Edge info
  edgeRegion: string | null;

  // Timestamp
  timestamp: string;
}

export interface ParsedUserAgent {
  device: string;
  deviceVendor: string | null;
  deviceModel: string | null;
  browser: string;
  browserVersion: string;
  engine: string | null;
  engineVersion: string | null;
  os: string;
  osVersion: string;
  cpuArchitecture: string | null;
  isBot: boolean;
}

// =============================================================================
// Bot Detection (enhanced based on Dub patterns)
// =============================================================================

const BOT_PATTERNS = [
  // Common bots
  "bot",
  "crawler",
  "spider",
  "scraper",
  "slurp",
  // HTTP clients
  "curl",
  "wget",
  "httpie",
  "postman",
  "insomnia",
  // Programming languages
  "python",
  "java/",
  "go-http",
  "ruby",
  "perl",
  "php/",
  "node-fetch",
  "axios",
  "got/",
  "undici",
  // Headless browsers
  "headless",
  "phantom",
  "puppeteer",
  "playwright",
  "selenium",
  // SEO tools
  "lighthouse",
  "pagespeed",
  "gtmetrix",
  "pingdom",
  "uptimerobot",
  // Social media crawlers (some are legitimate previews)
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "telegrambot",
  "discordbot",
  "whatsapp",
  // Search engine bots
  "googlebot",
  "bingbot",
  "yandex",
  "baiduspider",
  "duckduckbot",
  // Monitoring
  "datadog",
  "newrelic",
  "pingback",
  // Generic patterns
  "preview",
  "scanner",
  "monitor",
  "check",
  "test",
  "fetch",
  "probe",
];

const BOT_USER_AGENTS = new Set([
  // Known bot user agents (exact matches)
  "Go-http-client/1.1",
  "Go-http-client/2.0",
]);

/**
 * Detect if a request is from a bot
 */
export function detectBot(request: Request): boolean {
  const ua = request.headers.get("user-agent") ?? "";
  const lowerUa = ua.toLowerCase();

  // Check exact matches first
  if (BOT_USER_AGENTS.has(ua)) {
    return true;
  }

  // Check patterns
  if (BOT_PATTERNS.some((pattern) => lowerUa.includes(pattern))) {
    return true;
  }

  // Check for missing/empty user agent (often bots)
  if (!ua || ua.length < 10) {
    return true;
  }

  // Check for known bot headers
  const cfBotManagement = request.headers.get("cf-bot-management");
  if (cfBotManagement) {
    try {
      const botData = JSON.parse(cfBotManagement);
      if (botData.verified_bot || botData.score < 30) {
        return true;
      }
    } catch {
      // Ignore parse errors
    }
  }

  return false;
}

// =============================================================================
// User Agent Parsing (enhanced)
// =============================================================================

/**
 * Parse user agent string into detailed components
 * Enhanced with device vendor, model, engine detection
 */
export function parseUserAgent(ua: string): ParsedUserAgent {
  const lowerUa = ua.toLowerCase();

  // Bot detection
  const isBot = BOT_PATTERNS.some((pattern) => lowerUa.includes(pattern));

  // Device detection
  let device = "desktop";
  let deviceVendor: string | null = null;
  let deviceModel: string | null = null;

  if (/iphone/i.test(ua)) {
    device = "mobile";
    deviceVendor = "Apple";
    // Extract iPhone model if available
    const iphoneMatch = ua.match(/iPhone\s*(\d+)/i);
    if (iphoneMatch) {
      deviceModel = `iPhone ${iphoneMatch[1]}`;
    } else {
      deviceModel = "iPhone";
    }
  } else if (/ipad/i.test(ua)) {
    device = "tablet";
    deviceVendor = "Apple";
    deviceModel = "iPad";
  } else if (/android/i.test(ua)) {
    device = /mobile/i.test(ua) ? "mobile" : "tablet";
    // Try to extract Android device info
    const androidMatch = ua.match(/;\s*([^;]+)\s*Build\//i);
    if (androidMatch) {
      const deviceInfo = androidMatch[1].trim();
      // Common vendors
      if (/samsung/i.test(deviceInfo)) {
        deviceVendor = "Samsung";
        deviceModel = deviceInfo.replace(/samsung/i, "").trim();
      } else if (/pixel/i.test(deviceInfo)) {
        deviceVendor = "Google";
        deviceModel = deviceInfo;
      } else if (/oneplus/i.test(deviceInfo)) {
        deviceVendor = "OnePlus";
        deviceModel = deviceInfo.replace(/oneplus/i, "").trim();
      } else if (/xiaomi|redmi|poco/i.test(deviceInfo)) {
        deviceVendor = "Xiaomi";
        deviceModel = deviceInfo;
      } else if (/huawei/i.test(deviceInfo)) {
        deviceVendor = "Huawei";
        deviceModel = deviceInfo.replace(/huawei/i, "").trim();
      } else {
        deviceModel = deviceInfo;
      }
    }
  } else if (/ipod/i.test(ua)) {
    device = "mobile";
    deviceVendor = "Apple";
    deviceModel = "iPod";
  } else if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    device = "mobile";
  } else if (/tablet|playbook|silk/i.test(ua)) {
    device = "tablet";
  } else if (/macintosh|mac os x/i.test(ua)) {
    deviceVendor = "Apple";
    deviceModel = "Mac";
  } else if (/windows/i.test(ua)) {
    deviceVendor = "Microsoft";
    deviceModel = "PC";
  }

  // Browser detection (enhanced with engine)
  let browser = "unknown";
  let browserVersion = "";
  let engine: string | null = null;
  let engineVersion: string | null = null;

  if (/edg\//i.test(ua)) {
    browser = "Edge";
    browserVersion = ua.match(/edg\/([\d.]+)/i)?.[1] ?? "";
    engine = "Blink";
  } else if (/opr\//i.test(ua) || /opera/i.test(ua)) {
    browser = "Opera";
    browserVersion = ua.match(/(?:opr|opera)\/([\d.]+)/i)?.[1] ?? "";
    engine = "Blink";
  } else if (/chrome/i.test(ua) && !/chromium/i.test(ua)) {
    browser = "Chrome";
    browserVersion = ua.match(/chrome\/([\d.]+)/i)?.[1] ?? "";
    engine = "Blink";
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = "Safari";
    browserVersion = ua.match(/version\/([\d.]+)/i)?.[1] ?? "";
    engine = "WebKit";
  } else if (/firefox/i.test(ua)) {
    browser = "Firefox";
    browserVersion = ua.match(/firefox\/([\d.]+)/i)?.[1] ?? "";
    engine = "Gecko";
  } else if (/msie|trident/i.test(ua)) {
    browser = "IE";
    browserVersion = ua.match(/(?:msie |rv:)([\d.]+)/i)?.[1] ?? "";
    engine = "Trident";
  } else if (/chromium/i.test(ua)) {
    browser = "Chromium";
    browserVersion = ua.match(/chromium\/([\d.]+)/i)?.[1] ?? "";
    engine = "Blink";
  }

  // Engine version extraction
  if (engine === "Blink" || engine === "WebKit") {
    engineVersion = ua.match(/applewebkit\/([\d.]+)/i)?.[1] ?? null;
  } else if (engine === "Gecko") {
    engineVersion = ua.match(/gecko\/([\d.]+)/i)?.[1] ?? null;
  } else if (engine === "Trident") {
    engineVersion = ua.match(/trident\/([\d.]+)/i)?.[1] ?? null;
  }

  // OS detection
  let os = "unknown";
  let osVersion = "";

  if (/windows nt/i.test(ua)) {
    os = "Windows";
    const versionMap: Record<string, string> = {
      "10.0": "10/11",
      "6.3": "8.1",
      "6.2": "8",
      "6.1": "7",
      "6.0": "Vista",
      "5.1": "XP",
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
    // Try to detect specific distros
    if (/ubuntu/i.test(ua)) {
      os = "Ubuntu";
      osVersion = ua.match(/ubuntu\/([\d.]+)/i)?.[1] ?? "";
    } else if (/fedora/i.test(ua)) {
      os = "Fedora";
    }
  } else if (/cros/i.test(ua)) {
    os = "Chrome OS";
  }

  // CPU architecture detection
  let cpuArchitecture: string | null = null;
  if (/x86_64|x64|amd64|win64/i.test(ua)) {
    cpuArchitecture = "amd64";
  } else if (/arm64|aarch64/i.test(ua)) {
    cpuArchitecture = "arm64";
  } else if (/arm/i.test(ua)) {
    cpuArchitecture = "arm";
  } else if (/i[3-6]86|x86|win32/i.test(ua)) {
    cpuArchitecture = "x86";
  }

  return {
    device,
    deviceVendor,
    deviceModel,
    browser,
    browserVersion,
    engine,
    engineVersion,
    os,
    osVersion,
    cpuArchitecture,
    isBot,
  };
}

// =============================================================================
// Referrer Processing
// =============================================================================

/**
 * Extract and normalize referrer domain
 */
export function extractReferrerDomain(referrer: string | null): string | null {
  if (!referrer) return null;

  try {
    const url = new URL(referrer);
    // Normalize common variations
    let domain = url.hostname.toLowerCase();
    // Remove www prefix
    if (domain.startsWith("www.")) {
      domain = domain.slice(4);
    }
    return domain;
  } catch {
    return null;
  }
}

/**
 * Normalize referrer to "(direct)" if empty or internal
 */
export function normalizeReferrer(referrer: string | null, linkDomain: string): string {
  if (!referrer) return "(direct)";

  const domain = extractReferrerDomain(referrer);
  if (!domain) return "(direct)";

  // If referrer is same as link domain, treat as direct
  if (domain === linkDomain || domain === `www.${linkDomain}`) {
    return "(direct)";
  }

  return domain;
}

// =============================================================================
// Hashing Utilities
// =============================================================================

/**
 * Hash IP address for privacy (SHA-256)
 */
export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "go2-ip-salt-v1");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32); // Truncate for efficiency
}

/**
 * Create identity hash for click deduplication
 * Combines IP + User Agent to identify unique visitors
 */
export async function createIdentityHash(ip: string, userAgent: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${ip}:${userAgent}:go2-identity-v1`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * Generate a short unique click ID (nanoid-style)
 */
export function generateClickId(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => chars[b % chars.length])
    .join("");
}

// =============================================================================
// QR Detection
// =============================================================================

/**
 * Detect if click came from QR code scan
 * Based on query params, headers, or referrer patterns
 */
export function detectQrTrigger(request: Request): boolean {
  const url = new URL(request.url);

  // Check for explicit QR parameter
  if (url.searchParams.has("qr") || url.searchParams.get("trigger") === "qr") {
    return true;
  }

  // Check for common QR scanner app referrers/patterns
  const referrer = request.headers.get("referer") ?? "";
  const qrPatterns = ["qr", "scan", "barcode", "zxing"];
  if (qrPatterns.some((p) => referrer.toLowerCase().includes(p))) {
    return true;
  }

  // Check user agent for QR scanner apps
  const ua = (request.headers.get("user-agent") ?? "").toLowerCase();
  if (ua.includes("qr") || ua.includes("scan")) {
    return true;
  }

  return false;
}

// =============================================================================
// UTM Parameter Extraction
// =============================================================================

/**
 * Extract UTM parameters from a URL
 */
export function extractUtmParams(url: string): {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
} {
  try {
    const parsed = new URL(url);
    return {
      utmSource: parsed.searchParams.get("utm_source"),
      utmMedium: parsed.searchParams.get("utm_medium"),
      utmCampaign: parsed.searchParams.get("utm_campaign"),
      utmTerm: parsed.searchParams.get("utm_term"),
      utmContent: parsed.searchParams.get("utm_content"),
    };
  } catch {
    return {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmTerm: null,
      utmContent: null,
    };
  }
}

// =============================================================================
// Click Deduplication Cache Keys
// =============================================================================

/**
 * Generate cache key for click deduplication
 * Format: click:dedup:{domain}:{slug}:{identityHash}
 */
export function getDeduplicationKey(domain: string, slug: string, identityHash: string): string {
  return `click:dedup:${domain}:${slug}:${identityHash}`;
}

/**
 * Generate cache key for recent click ID lookup
 * Format: click:id:{domain}:{slug}
 */
export function getRecentClickKey(domain: string, slug: string): string {
  return `click:recent:${domain}:${slug}`;
}

// =============================================================================
// No-Track Detection
// =============================================================================

/**
 * Check if request has opted out of tracking
 */
export function shouldSkipTracking(request: Request): boolean {
  const url = new URL(request.url);

  // Check for no-track query parameter
  if (url.searchParams.has("go2-no-track") || url.searchParams.has("dub-no-track")) {
    return true;
  }

  // Check for no-track header
  const noTrackHeader =
    request.headers.get("x-go2-no-track") || request.headers.get("dub-no-track");
  if (noTrackHeader === "1" || noTrackHeader === "true") {
    return true;
  }

  // Check for DNT header (Do Not Track - deprecated but respect it)
  if (request.headers.get("dnt") === "1") {
    return true;
  }

  // Skip HEAD requests (preflight, link previews)
  if (request.method === "HEAD") {
    return true;
  }

  return false;
}

// =============================================================================
// Full Click Data Collection
// =============================================================================

/**
 * Collect all click metadata from a request
 */
export async function collectClickMetadata(
  link: CachedLink,
  request: Request,
  options: {
    isUnique?: boolean;
    trigger?: "link" | "qr" | "api";
  } = {}
): Promise<ClickMetadata> {
  const cf = request.cf;
  const ua = request.headers.get("user-agent") ?? "";
  const parsedUa = parseUserAgent(ua);
  const referrer = request.headers.get("referer");
  const ip = request.headers.get("cf-connecting-ip") ?? "";

  // Hash IP and create identity hash
  const ipHash = ip ? await hashIP(ip) : null;
  const identityHash = ip && ua ? await createIdentityHash(ip, ua) : null;

  // Detect trigger
  const isQr = options.trigger === "qr" || detectQrTrigger(request);
  const trigger = options.trigger ?? (isQr ? "qr" : "link");

  // Extract UTM params from destination
  const utmParams = extractUtmParams(link.destinationUrl);

  return {
    clickId: generateClickId(),
    linkId: link.id,
    userId: link.userId ?? null,
    organizationId: link.organizationId ?? null,
    domain: link.domain,
    slug: link.slug,
    destinationUrl: link.destinationUrl,

    // Geo
    continent: (cf?.continent as string) ?? null,
    country: (cf?.country as string) ?? null,
    region: (cf?.region as string) ?? null,
    city: (cf?.city as string) ?? null,
    latitude: cf?.latitude ? String(cf.latitude) : null,
    longitude: cf?.longitude ? String(cf.longitude) : null,
    timezone: (cf?.timezone as string) ?? null,
    postalCode: (cf?.postalCode as string) ?? null,

    // Device
    device: parsedUa.device,
    deviceVendor: parsedUa.deviceVendor,
    deviceModel: parsedUa.deviceModel,

    // Browser
    browser: parsedUa.browser,
    browserVersion: parsedUa.browserVersion,

    // Engine
    engine: parsedUa.engine,
    engineVersion: parsedUa.engineVersion,

    // OS
    os: parsedUa.os,
    osVersion: parsedUa.osVersion,

    // CPU
    cpuArchitecture: parsedUa.cpuArchitecture,

    // Request
    referrer,
    referrerDomain: extractReferrerDomain(referrer),
    ipHash,
    identityHash,
    userAgent: ua.slice(0, 500),

    // Trigger
    trigger,
    isQr,

    // Flags
    isBot: parsedUa.isBot,
    isUnique: options.isUnique ?? true,

    // UTM
    ...utmParams,

    // A/B
    abTestId: link.abTestId ?? null,
    abVariant: link.abVariant ?? null,

    // Edge
    edgeRegion: (cf?.colo as string) ?? null,

    // Timestamp
    timestamp: new Date().toISOString(),
  };
}

// =============================================================================
// Track Click (Enhanced)
// =============================================================================

/**
 * Track a click event in Analytics Engine (enhanced version)
 */
export async function trackClickEnhanced(
  tracker: AnalyticsEngineDataset,
  metadata: ClickMetadata
): Promise<void> {
  // Write to Analytics Engine
  // blobs: string data (max 20)
  // doubles: numeric data (max 20)
  // indexes: indexed fields (max 1)
  tracker.writeDataPoint({
    blobs: [
      metadata.linkId, // 0: link ID
      metadata.slug, // 1: slug
      metadata.domain, // 2: domain
      metadata.destinationUrl.slice(0, 500), // 3: destination (truncated)
      metadata.country ?? "", // 4: country
      metadata.city ?? "", // 5: city
      metadata.region ?? "", // 6: region
      metadata.device, // 7: device type
      metadata.browser, // 8: browser
      metadata.os, // 9: OS
      metadata.referrerDomain ?? "", // 10: referrer domain
      metadata.trigger, // 11: trigger (link/qr/api)
      metadata.abVariant ?? "", // 12: A/B variant
      metadata.continent ?? "", // 13: continent
      metadata.deviceVendor ?? "", // 14: device vendor
      metadata.engine ?? "", // 15: browser engine
      metadata.identityHash ?? "", // 16: identity hash
      metadata.userId ?? "", // 17: user ID
      metadata.organizationId ?? "", // 18: org ID
      metadata.clickId, // 19: click ID
    ],
    doubles: [
      Date.now(), // 0: timestamp
      metadata.longitude ? parseFloat(metadata.longitude) : 0, // 1: longitude
      metadata.latitude ? parseFloat(metadata.latitude) : 0, // 2: latitude
      metadata.isBot ? 1 : 0, // 3: is bot
      metadata.isQr ? 1 : 0, // 4: is QR
      metadata.isUnique ? 1 : 0, // 5: is unique
    ],
    indexes: [metadata.linkId], // For filtering by link ID
  });
}
