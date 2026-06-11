/**
 * Go2 API Entry Point
 *
 * Hono application running on Cloudflare Workers.
 * Implements edge-first architecture with comprehensive middleware stack.
 *
 * Key features:
 * - Sub-10ms link redirects via KV lookup
 * - Analytics Engine click tracking
 * - Full API for link management
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import type { CachedLink, Env } from "./bindings.js";

// Durable Objects export
export { RateLimiter } from "./durable-objects/rate-limiter.js";

// Workflow exports — wrangler.toml [[workflows]] entries reference these
// classes by name. The Workers runtime instantiates them on demand.
export { DunningWorkflow } from "./workflows/dunning.js";
export { LinkExpiryWorkflow } from "./workflows/link-expiry.js";

import { admin } from "./routes/admin/index.js";
import { auth } from "./routes/auth.js";
import { billing } from "./routes/billing.js";
// Routes
import { health } from "./routes/health.js";
import { zapier } from "./routes/integrations/zapier.js";
import { mcp } from "./routes/mcp/index.js";
import { oauth } from "./routes/oauth/index.js";
import { linkCheck } from "./routes/public/link-check.js";
import { v1 } from "./routes/v1/index.js";
import { webhooks } from "./routes/webhooks.js";

import { demoModeMiddleware } from "./middleware/demo-mode.js";
import { errorHandler } from "./middleware/error.js";
import { loggerMiddleware } from "./middleware/logger.js";
// Middleware
import { rateLimitMiddleware } from "./middleware/rate-limit.js";

// Enhanced Analytics
import {
  collectClickMetadata,
  detectBot,
  detectQrTrigger,
  generateClickId,
  getDeduplicationKey,
  shouldSkipTracking,
  trackClickEnhanced,
} from "./lib/analytics-enhanced.js";
// Analytics (legacy)
import {
  type ABTestState,
  getABTestFromKV,
  resolveDestination,
  selectABVariant,
  setABTestInKV,
} from "./lib/analytics.js";

// Pixel tracking
import { generatePixelTrackingPage } from "./lib/pixel-tracking.js";

// Axiom logger (for the pixel-interstitial-served event)
import { logEvent as logToAxiom } from "./lib/axiom.js";

// Link cloaking
import { generateCloakedPage } from "./lib/cloaked-page.js";

// Safety interstitial + disabled-link page
import {
  renderDisabledPage,
  renderInterstitial,
  renderPasswordPage,
} from "./lib/safety-pages.js";

import { getCookie, setCookie } from "hono/cookie";
import { signUnlockToken, verifyPassword, verifyUnlockToken } from "./lib/password.js";

// OpenAPI spec
import { getOpenApiSpec } from "./lib/openapi-spec.js";

// Webhook dispatcher
import { captureEvent } from "./lib/product-analytics.js";
import { dispatchWebhookEvent } from "./lib/webhook-dispatcher.js";

const app = new Hono<{ Bindings: Env }>();

// -----------------------------------------------------------------------------
// Global Middleware
// -----------------------------------------------------------------------------

// Request ID for tracing
app.use("*", requestId());

// Timing headers
app.use("*", timing());

// CORS
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const appUrl = c.env.APP_URL;
      const allowedOrigins = [
        // Development
        "http://localhost:3000",
        "http://localhost:8787",
        // Production - explicit origins
        "https://go2.gg",
        "https://www.go2.gg",
        // From env (for staging, etc.)
        appUrl,
        appUrl?.replace("://", "://www."),
      ].filter(Boolean) as string[];

      // Check if origin is in allowed list
      if (origin && allowedOrigins.includes(origin)) {
        return origin;
      }

      // For requests without Origin header (like server-to-server), allow
      if (!origin) {
        return "*";
      }

      return "";
    },
    // `rsc` + the `next-router-*` headers are sent by Next.js's RSC fetches
    // when /openapi.json redirects from go2.gg → api.go2.gg. Without them
    // here the preflight is rejected.
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-ID",
      "X-CSRF-Token",
      "RSC",
      "Next-Router-State-Tree",
      "Next-Router-Prefetch",
      "Next-Url",
    ],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
  })
);

// Security headers
// NOTE: secureHeaders() defaults Cross-Origin-Resource-Policy to "same-origin",
// which blocks browser delivery of api.go2.gg responses to go2.gg pages —
// CORS preflight passes but the actual response is dropped, surfacing as
// "Failed to fetch". This API is meant to be called cross-origin, so we set
// CORP to "cross-origin" and skip COOP/COEP (only relevant for navigations).
app.use(
  "*",
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "strict-origin-when-cross-origin",
    crossOriginResourcePolicy: "cross-origin",
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Pretty JSON in development
app.use("*", prettyJSON());

// Request logging
app.use("*", loggerMiddleware());

// Demo mode write-guard (no-op unless DEMO_MODE=true)
app.use("*", demoModeMiddleware());

// Global error handler
app.onError(errorHandler);

// -----------------------------------------------------------------------------
// MCP host shim — mcp.go2.gg requests are routed to the /mcp transport
// regardless of incoming path. Lets remote clients (Claude.ai, ChatGPT,
// Perplexity) point at https://mcp.go2.gg/mcp without the api.go2.gg prefix
// while keeping a single Worker behind both hostnames.
// -----------------------------------------------------------------------------

const MCP_HOSTS = new Set(["mcp.go2.gg", "mcp.staging.go2.gg"]);

app.use("*", async (c, next) => {
  const host = c.req.header("host")?.split(":")[0]?.toLowerCase();
  if (host && MCP_HOSTS.has(host)) {
    const { mcp: mcpRouter } = await import("./routes/mcp/index.js");
    return mcpRouter.fetch(c.req.raw, c.env, c.executionCtx);
  }
  await next();
});

// -----------------------------------------------------------------------------
// Apex host shim — go2.gg routes to this worker so short-link clicks skip the
// OpenNext worker, whose multi-second cold start dominated click latency.
// Only two things are handled natively on the apex: short-link resolution
// (single-segment GET/HEAD that isn't a known web page) and the password
// unlock POST. Everything else streams through to the web worker over the WEB
// service binding, untouched. Unknown single segments still try the slug
// path first and fall through to the web worker via the notFound handler.
// -----------------------------------------------------------------------------

// Single-segment paths served by the Next.js app. Kept in sync with
// RESERVED_PATHS in apps/web/app/[slug]/route.ts. This is a fast path, not a
// correctness gate — anything missing here costs one KV/D1 lookup and then
// reaches the web worker through notFound anyway.
const WEB_APP_PATHS = new Set([
  "api",
  "auth",
  "bio",
  "blog",
  "dashboard",
  "docs",
  "invite",
  "admin",
  "r",
  "affiliates",
  "about",
  "acceptable-use",
  "report-abuse",
  "careers",
  "case-studies",
  "changelog",
  "competitors",
  "contact",
  "cookies",
  "dpa",
  "events",
  "features",
  "free",
  "guides",
  "help",
  "partners",
  "pricing",
  "privacy",
  "security",
  "settings",
  "billing",
  "solutions",
  "status",
  "terms",
  "tools",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.webmanifest",
  "openapi.json",
  "llms.txt",
  "llms-full.txt",
  "_next",
]);

function isApexHost(env: Env, host: string): boolean {
  const defaultDomain = (env.DEFAULT_DOMAIN ?? "go2.gg").toLowerCase();
  return host === defaultDomain || host === `www.${defaultDomain}`;
}

const UNLOCK_POST_RE = /^\/api\/v1\/links\/[^/]+\/verify$/;

app.use("*", async (c, next) => {
  if (!c.env.WEB) {
    return next();
  }
  const host = c.req.header("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (!isApexHost(c.env, host)) {
    return next();
  }
  const { pathname } = new URL(c.req.url);
  const method = c.req.method;
  const slugMatch = /^\/([^/]+)$/.exec(pathname);
  const isSlugRequest =
    (method === "GET" || method === "HEAD") &&
    slugMatch?.[1] != null &&
    !WEB_APP_PATHS.has(slugMatch[1].toLowerCase());
  const isUnlockPost = method === "POST" && UNLOCK_POST_RE.test(pathname);
  if (isSlugRequest || isUnlockPost) {
    return next();
  }
  return c.env.WEB.fetch(c.req.raw);
});

// -----------------------------------------------------------------------------
// Short Link Redirect Handler (BEFORE all other routes)
// -----------------------------------------------------------------------------

// Reserved paths that should not be treated as short links
const RESERVED_PATHS = new Set([
  "api",
  "health",
  "healthz",
  "ready",
  "admin",
  "webhooks",
  "webhook",
  "_next",
  "static",
  "assets",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "r", // reserved for affiliate landing if hit on the API origin
  "affiliates",
]);

// D1 fallback for the redirect hot path. KV is a cache, not the source of
// truth: bulk- and migration-created entries are written with TTLs, so a KV
// miss must consult D1 or those links 404 permanently once the cache entry
// expires. Returns the same CachedLink shape syncLinkToKV writes so the
// handler logic downstream is identical either way.
async function loadCachedLinkFromD1(
  env: Env,
  domain: string,
  slug: string
): Promise<CachedLink | null> {
  const { drizzle } = await import("drizzle-orm/d1");
  const { and, eq } = await import("drizzle-orm");
  const schema = await import("@repo/db");
  const db = drizzle(env.DB, { schema });
  const rows = await db
    .select()
    .from(schema.links)
    .where(and(eq(schema.links.domain, domain), eq(schema.links.slug, slug)))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    destinationUrl: row.destinationUrl,
    domain: row.domain,
    slug: row.slug,
    userId: row.userId ?? undefined,
    organizationId: row.organizationId ?? undefined,
    geoTargets: row.geoTargets ? JSON.parse(row.geoTargets) : undefined,
    deviceTargets: row.deviceTargets ? JSON.parse(row.deviceTargets) : undefined,
    passwordHash: row.passwordHash ?? undefined,
    expiresAt: row.expiresAt ?? undefined,
    policyExpiresAt: row.policyExpiresAt ?? undefined,
    clickLimit: row.clickLimit ?? undefined,
    clickCount: row.clickCount ?? undefined,
    iosUrl: row.iosUrl ?? undefined,
    androidUrl: row.androidUrl ?? undefined,
    abTestId: row.abTestId ?? undefined,
    abVariant: row.abVariant ?? undefined,
    rewrite: row.rewrite ?? undefined,
    ogTitle: row.ogTitle ?? undefined,
    ogDescription: row.ogDescription ?? undefined,
    ogImage: row.ogImage ?? undefined,
    trackingPixels: row.trackingPixels ? JSON.parse(row.trackingPixels) : undefined,
    enablePixelTracking: row.enablePixelTracking ?? undefined,
    requirePixelConsent: row.requirePixelConsent ?? undefined,
    trackAnalytics: row.trackAnalytics ?? undefined,
    publicStats: row.publicStats ?? undefined,
    trackConversion: row.trackConversion ?? undefined,
    skipDeduplication: row.skipDeduplication ?? undefined,
    agentId: row.agentId ?? undefined,
    agentRunId: row.agentRunId ?? undefined,
    agentActorId: row.agentActorId ?? undefined,
    agentMetadata: row.agentMetadata ? JSON.parse(row.agentMetadata) : undefined,
    isArchived: row.isArchived ?? undefined,
    isDisabled: row.isDisabled ?? undefined,
    disabledReason: row.disabledReason ?? undefined,
    threatStatus: (row.threatStatus as CachedLink["threatStatus"]) ?? undefined,
    createdAt: row.createdAt ?? undefined,
  };
}

app.get("/:slug", async (c, next) => {
  const slug = c.req.param("slug");

  // Skip if reserved path
  if (RESERVED_PATHS.has(slug.toLowerCase())) {
    return next();
  }

  // Every short-link response is noindex/nofollow. Google should NEVER index
  // a /<slug> path on go2.gg — that's how Safe Browsing finds them and flags
  // the shortener for whatever phishing destination an abuser pointed at.
  c.header("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  c.header("Referrer-Policy", "no-referrer");

  // Determine domain from request
  const host = c.req.header("host") ?? c.env.DEFAULT_DOMAIN ?? "go2.gg";
  const domain = host.split(":")[0]; // Remove port if present

  // Fast KV lookup
  const kvKey = `${domain}:${slug}`;
  const cached = await c.env.LINKS_KV.get<CachedLink>(kvKey, "json");

  let link = cached;
  if (!link) {
    // Try lowercase fallback — forgiving for users who type slugs in any case.
    const lowerSlug = slug.toLowerCase();
    if (lowerSlug !== slug) {
      const lowerLink = await c.env.LINKS_KV.get<CachedLink>(`${domain}:${lowerSlug}`, "json");
      if (lowerLink) {
        // Permanent redirect to the canonical (lowercase) slug so search
        // engines and clients learn the right URL.
        const tail = c.req.url.split(slug)[1] ?? "";
        return c.redirect(`/${lowerSlug}${tail}`, 301);
      }
    }
    // Link not found - check if it's on another domain
    const defaultDomain = c.env.DEFAULT_DOMAIN ?? "go2.gg";
    if (domain !== defaultDomain) {
      link = await c.env.LINKS_KV.get<CachedLink>(`${defaultDomain}:${slug}`, "json");
    }
    if (!link) {
      link =
        (await loadCachedLinkFromD1(c.env, domain, slug)) ??
        (domain !== defaultDomain ? await loadCachedLinkFromD1(c.env, defaultDomain, slug) : null);
      if (!link) {
        return next(); // Let 404 handler deal with it
      }
      const rehydrated = link;
      c.executionCtx.waitUntil(
        c.env.LINKS_KV.put(`${rehydrated.domain}:${rehydrated.slug}`, JSON.stringify(rehydrated))
      );
    }
  }

  // Archived (revoked) links are normally evicted from KV at archive time;
  // this defense-in-depth check catches stale cache entries.
  if (link.isArchived) {
    return c.json({ error: "This link is no longer available" }, { status: 410 });
  }

  // Disabled-for-safety: link was flagged by Safe Browsing, URL Scanner, an
  // abuse report review, or an admin. We return 410 Gone and surface the
  // reason — never proxy a flagged destination. The link record stays in
  // D1 so abuse reviews have a paper trail.
  if (link.isDisabled) {
    return c.html(
      renderDisabledPage({
        shortUrl: `https://${link.domain}/${link.slug}`,
        reason: link.disabledReason ?? "This link has been disabled for safety reasons.",
      }),
      { status: 410 },
    );
  }

  // Check if link has expired (user-set or policy-driven).
  const expiryNow = new Date();
  if (link.expiresAt && new Date(link.expiresAt) < expiryNow) {
    return c.json({ error: "This link has expired" }, { status: 410 });
  }
  if (link.policyExpiresAt && new Date(link.policyExpiresAt) < expiryNow) {
    return c.json(
      { error: "This link has expired", reason: "free-tier retention (60 days)" },
      { status: 410 }
    );
  }

  // Enforce click limit if configured. Most links don't have one, so the DB
  // read is only paid for limited links.
  if (link.clickLimit != null) {
    const { drizzle } = await import("drizzle-orm/d1");
    const { eq } = await import("drizzle-orm");
    const schema = await import("@repo/db");
    const db = drizzle(c.env.DB, { schema });
    const row = await db
      .select({ clickCount: schema.links.clickCount })
      .from(schema.links)
      .where(eq(schema.links.id, link.id))
      .limit(1);
    if (row[0] && (row[0].clickCount ?? 0) >= link.clickLimit) {
      return c.json({ error: "This link has reached its click limit" }, { status: 410 });
    }
  }

  // Password protection. A valid per-link unlock cookie (set by the verify
  // endpoint after a correct password) lets the request fall through to the
  // normal redirect path below, so the click is tracked exactly once, here.
  if (link.passwordHash) {
    const secret = c.env.CSRF_SECRET ?? "";
    const cookie = getCookie(c, `go2_pw_${link.id}`);
    const unlocked =
      secret !== "" && cookie != null && (await verifyUnlockToken(cookie, link.id, secret));
    if (!unlocked) {
      const wantsHtml = (c.req.header("accept") ?? "").includes("text/html");
      if (wantsHtml) {
        return c.html(
          renderPasswordPage({
            shortUrl: `https://${link.domain}/${link.slug}`,
            linkId: link.id,
          }),
          { status: 401 }
        );
      }
      return c.json(
        {
          protected: true,
          message: "This link is password protected",
          verifyUrl: `/api/v1/links/${link.id}/verify`,
        },
        { status: 401 }
      );
    }
  }

  // Resolve destination based on targeting rules (iOS/Android/geo/device)
  let baseDestination = resolveDestination(link, c.req.raw);

  // A/B testing — apply only when the link wasn't already specialized by a
  // device/geo target. A/B tests target the default web destination; iOS deep
  // links and country-specific URLs continue to win when matched.
  let pickedABVariantId: string | undefined;
  if (link.abTestId && baseDestination === link.destinationUrl) {
    try {
      let abState: ABTestState | null = await getABTestFromKV(c.env.LINKS_KV, link.abTestId);
      if (!abState) {
        const { drizzle } = await import("drizzle-orm/d1");
        const { eq } = await import("drizzle-orm");
        const schema = await import("@repo/db");
        const db = drizzle(c.env.DB, { schema });
        const row = await db
          .select()
          .from(schema.abTests)
          .where(eq(schema.abTests.id, link.abTestId))
          .limit(1);
        if (row[0]) {
          const variants = JSON.parse(row[0].variants) as Array<{
            id: string;
            url: string;
            weight: number;
            name: string;
          }>;
          abState = {
            id: row[0].id,
            status: row[0].status,
            variants: variants.map((v) => ({
              id: v.id,
              url: v.url,
              weight: v.weight,
              name: v.name,
            })),
            trafficPercentage: row[0].trafficPercentage ?? 100,
            winnerVariantId: row[0].winnerVariantId ?? null,
          };
          // Warm the cache so subsequent redirects skip D1.
          await setABTestInKV(c.env.LINKS_KV, abState);
        }
      }
      if (abState) {
        const picked = selectABVariant(abState);
        if (picked) {
          baseDestination = picked.url;
          pickedABVariantId = picked.id;
        }
      }
    } catch (err) {
      // Defensive: an A/B lookup failure must never break the redirect.
      console.error("AB variant selection failed", err);
    }
  }

  // Generate the click ID synchronously so we can append it to the destination
  // URL (?go2_ref=<linkId>:<clickId>) for client-side conversion attribution
  // and reuse the same ID when persisting the click record below. Both IDs are
  // included so the track endpoint can resolve linkId even if the click row
  // hasn't been persisted by waitUntil yet (sub-second conversion races).
  const clickId = generateClickId();
  let destination = baseDestination;
  try {
    const destUrl = new URL(baseDestination);
    destUrl.searchParams.set("go2_ref", `${link.id}:${clickId}`);
    destination = destUrl.toString();
  } catch {
    // Non-URL destination (e.g. a deep link scheme); skip param injection.
  }

  // Track click asynchronously (non-blocking)
  c.executionCtx.waitUntil(
    (async () => {
      try {
        // Check if tracking should be skipped
        const skipTrack = shouldSkipTracking(c.req.raw);
        const trackAnalytics = link.trackAnalytics !== false; // Default to true
        const isBot = detectBot(c.req.raw);

        // Skip tracking if:
        // 1. User opted out (no-track header/param)
        // 2. Link has analytics disabled
        // 3. Request is from a bot (but still count the click)
        if (skipTrack || !trackAnalytics) {
          // Still increment click count even if not tracking details
          const { drizzle } = await import("drizzle-orm/d1");
          const { sql, eq } = await import("drizzle-orm");
          const schema = await import("@repo/db");
          const db = drizzle(c.env.DB, { schema });
          await db
            .update(schema.links)
            .set({
              clickCount: sql`click_count + 1`,
              lastClickedAt: new Date().toISOString(),
            })
            .where(eq(schema.links.id, link.id));
          return;
        }

        // Detect if this is a QR scan
        const isQr = detectQrTrigger(c.req.raw);
        const trigger = isQr ? "qr" : "link";

        // Collect comprehensive click metadata
        const metadata = await collectClickMetadata(link, c.req.raw, {
          trigger,
          isUnique: true, // Will be updated by deduplication check
        });
        // Reuse the synchronously-generated click ID so the persisted click
        // row matches the go2_ref param appended to the redirect destination.
        metadata.clickId = clickId;
        // Override the static abVariant from the link with the per-request pick.
        // collectClickMetadata defaults to link.abVariant (a static field that
        // is rarely set); the runtime selector above is the source of truth.
        if (pickedABVariantId) {
          metadata.abVariant = pickedABVariantId;
          // Also pin the destinationUrl to the variant's URL so per-variant
          // analytics aggregations (group by destination_url) are accurate.
          metadata.destinationUrl = baseDestination;
        }

        // Check for click deduplication (skip if link config says so)
        let isUnique = true;
        const skipDedup = link.skipDeduplication === true;

        if (!skipDedup && metadata.identityHash && c.env.LINKS_KV) {
          const dedupKey = getDeduplicationKey(link.domain, link.slug, metadata.identityHash);
          const existingClick = await c.env.LINKS_KV.get(dedupKey);

          if (existingClick) {
            isUnique = false;
            metadata.isUnique = false;
          } else {
            // Store deduplication marker (1 hour TTL)
            await c.env.LINKS_KV.put(dedupKey, metadata.clickId, { expirationTtl: 3600 });
          }
        }

        // Skip recording bot clicks in detailed analytics (but count them)
        if (isBot) {
          // Still increment click count for bots
          const { drizzle } = await import("drizzle-orm/d1");
          const { sql, eq } = await import("drizzle-orm");
          const schema = await import("@repo/db");
          const db = drizzle(c.env.DB, { schema });
          await db
            .update(schema.links)
            .set({
              clickCount: sql`click_count + 1`,
              lastClickedAt: new Date().toISOString(),
            })
            .where(eq(schema.links.id, link.id));
          return;
        }

        // Track to Analytics Engine (for aggregated analytics)
        await trackClickEnhanced(c.env.TRACKER, metadata);

        // Import DB dependencies
        const { drizzle } = await import("drizzle-orm/d1");
        const { sql, eq } = await import("drizzle-orm");
        const schema = await import("@repo/db");
        const db = drizzle(c.env.DB, { schema });

        // Insert comprehensive click record into D1
        await db.insert(schema.clicks).values({
          id: metadata.clickId,
          linkId: metadata.linkId,
          userId: metadata.userId,
          organizationId: metadata.organizationId,
          domain: metadata.domain,
          slug: metadata.slug,
          destinationUrl: metadata.destinationUrl,
          // Geo
          continent: metadata.continent,
          country: metadata.country,
          region: metadata.region,
          city: metadata.city,
          latitude: metadata.latitude,
          longitude: metadata.longitude,
          timezone: metadata.timezone,
          postalCode: metadata.postalCode,
          // Device
          device: metadata.device,
          deviceVendor: metadata.deviceVendor,
          deviceModel: metadata.deviceModel,
          // Browser
          browser: metadata.browser,
          browserVersion: metadata.browserVersion,
          // Engine
          engine: metadata.engine,
          engineVersion: metadata.engineVersion,
          // OS
          os: metadata.os,
          osVersion: metadata.osVersion,
          // CPU
          cpuArchitecture: metadata.cpuArchitecture,
          // Request
          referrer: metadata.referrer,
          referrerDomain: metadata.referrerDomain,
          ipHash: metadata.ipHash,
          identityHash: metadata.identityHash,
          userAgent: metadata.userAgent,
          // Trigger
          trigger: metadata.trigger,
          isQr: metadata.isQr,
          // Flags
          isBot: metadata.isBot,
          isUnique,
          // UTM
          utmSource: metadata.utmSource,
          utmMedium: metadata.utmMedium,
          utmCampaign: metadata.utmCampaign,
          utmTerm: metadata.utmTerm,
          utmContent: metadata.utmContent,
          // A/B
          abTestId: metadata.abTestId,
          abVariant: metadata.abVariant,
          // Edge
          edgeRegion: metadata.edgeRegion,
          // Agent attribution
          agentId: metadata.agentId,
          agentRunId: metadata.agentRunId,
          agentActorId: metadata.agentActorId,
          agentToolCallId: metadata.agentToolCallId,
          // Timestamp
          timestamp: metadata.timestamp,
        });

        // Update link stats
        const updateFields: Record<string, unknown> = {
          clickCount: sql`click_count + 1`,
          lastClickedAt: metadata.timestamp,
        };

        // Increment unique clicks if this is a unique visit
        if (isUnique) {
          updateFields.uniqueClicks = sql`unique_clicks + 1`;
        }

        // Increment QR scans if this came from a QR code
        if (isQr) {
          updateFields.qrScans = sql`qr_scans + 1`;
        }

        await db.update(schema.links).set(updateFields).where(eq(schema.links.id, link.id));

        // Bump the agent_runs row's click count so the dashboard / MCP run
        // list sees totals without rejoining clicks. Best-effort.
        if (link.userId && metadata.agentId && metadata.agentRunId) {
          try {
            const { bumpAgentRunClickCount } = await import("./lib/agent-runs.js");
            await bumpAgentRunClickCount(db, {
              userId: link.userId,
              agentId: metadata.agentId,
              runId: metadata.agentRunId,
            });
          } catch (err) {
            console.error("bumpAgentRunClickCount failed:", err);
          }
        }

        // Cache click ID for immediate access (before Analytics Engine ingestion)
        if (c.env.LINKS_KV) {
          const recentClickKey = `click:recent:${link.domain}:${link.slug}`;
          await c.env.LINKS_KV.put(recentClickKey, metadata.clickId, { expirationTtl: 86400 }); // 1 day
        }

        // Product analytics: fire link_clicked to PostHog/GA4 only for unique
        // visits, attributed to the link OWNER's distinctId. This keeps the
        // funnel (signup → link_created → link_clicked → conversion) meaningful
        // without blowing up PostHog's event quota with raw click traffic.
        if (link.userId && isUnique && !metadata.isBot) {
          c.executionCtx.waitUntil(
            captureEvent(c.env, {
              event: "link_clicked",
              distinctId: link.userId,
              properties: {
                organizationId: link.organizationId ?? null,
                linkId: link.id,
                domain: link.domain,
                slug: link.slug,
                country: metadata.country,
                device: metadata.device,
                browser: metadata.browser,
                referrerDomain: metadata.referrerDomain,
                isUnique,
                trigger: metadata.trigger,
                agentId: metadata.agentId ?? null,
                utmSource: metadata.utmSource ?? null,
                utmMedium: metadata.utmMedium ?? null,
                utmCampaign: metadata.utmCampaign ?? null,
              },
            }),
          );
        }

        // Fire click webhook (gated on link ownership; only delivers to webhooks
        // that subscribe to "click" or "*").
        if (link.userId) {
          await dispatchWebhookEvent(c.env, link.userId, link.organizationId, "click", {
            clickId: metadata.clickId,
            linkId: link.id,
            domain: link.domain,
            slug: link.slug,
            destinationUrl: metadata.destinationUrl,
            country: metadata.country,
            device: metadata.device,
            browser: metadata.browser,
            os: metadata.os,
            referrer: metadata.referrer,
            isUnique,
            isBot: metadata.isBot,
            trigger: metadata.trigger,
            agentId: metadata.agentId,
            agentRunId: metadata.agentRunId,
            agentActorId: metadata.agentActorId,
            agentToolCallId: metadata.agentToolCallId,
            timestamp: metadata.timestamp,
          });
        }
      } catch (error) {
        console.error("Failed to track click:", error);
      }
    })()
  );

  // Serve the pixel-tracking interstitial only when the user has at least
  // one *enabled* pixel attached. Previously the gate triggered on
  // `trackingPixels.length > 0` even when every pixel had `enabled: false`,
  // costing every click an extra ~100ms HTML round-trip for nothing.
  const firingPixels = link.enablePixelTracking
    ? link.trackingPixels?.filter((p) => p.enabled)
    : undefined;
  if (firingPixels && firingPixels.length > 0 && link.trackingPixels) {
    const trackingPage = generatePixelTrackingPage(destination, link.trackingPixels, {
      requireConsent: link.requirePixelConsent,
      linkTitle: "Redirecting...",
    });

    // Fire-and-forget: log that we served the interstitial. Lets ops verify
    // a pixel-enabled click actually went through the interstitial path
    // (browser-side fires are visible only to the destination platforms).
    const pixelSummary = link.trackingPixels.map((p) => ({
      type: p.type,
      enabled: p.enabled,
    }));
    c.executionCtx.waitUntil(
      logToAxiom(
        c.env,
        "pixel.interstitial.served",
        {
          linkId: link.id,
          slug: link.slug,
          domain: link.domain,
          country: (c.req.raw.cf as { country?: string } | undefined)?.country,
          requireConsent: !!link.requirePixelConsent,
          pixels: pixelSummary,
        },
      ).catch(() => {
        /* never let logging break a redirect */
      })
    );

    return c.html(trackingPage);
  }

  // Check if link cloaking (rewrite) is enabled
  if (link.rewrite) {
    // Generate cloaked page that embeds destination in iframe
    const cloakedPage = generateCloakedPage(destination, {
      title: link.ogTitle,
      description: link.ogDescription,
      image: link.ogImage,
    });

    return c.html(cloakedPage);
  }

  // Safety interstitial — preview-and-confirm step. Three independent gates;
  // any one of them fires the interstitial. NO query-string bypass — the
  // prior `?go2_confirmed=1` shortcut let phishers craft URLs that skipped
  // the preview entirely. Continue is always a deliberate human click.
  //
  //   1. threatStatus is "unknown" — neither scanner could verify the
  //      destination; force the human to make the call.
  //   2. link is < 1h old AND threatStatus is not "clean" — short window
  //      where create-time check might be stale; once rescan upgrades to
  //      "clean", normal redirect resumes.
  //   3. link is a guest link AND threatStatus is not "clean" — anonymous
  //      creates are higher abuse-risk; lose the gate as soon as the daily
  //      rescan confirms clean.
  //
  // Crawlers / preview bots get the interstitial (noindex), so the
  // destination URL is never indexed via go2.gg's path even if a slug leaks.
  const ageMs = link.createdAt ? Date.now() - new Date(link.createdAt).getTime() : Number.POSITIVE_INFINITY;
  const isNewLink = ageMs < 60 * 60 * 1000;
  const isGuest = link.userId == null;
  const isUnverified = link.threatStatus !== "clean";
  const showInterstitial = isUnverified && (isNewLink || isGuest || link.threatStatus === "unknown");

  if (showInterstitial) {
    return c.html(
      renderInterstitial({
        shortUrl: `https://${link.domain}/${link.slug}`,
        // Show the un-altered destination, not the go2_ref-stamped one. We
        // don't want to leak click IDs on the preview screen.
        destination: baseDestination,
        reason: link.threatStatus === "unknown" ? "unknown_threat" : "new_link",
      }),
    );
  }

  // Return 301 permanent redirect (no pixels, no cloaking)
  return c.redirect(destination, 301);
});

// -----------------------------------------------------------------------------
// Health Routes (no auth, no rate limiting)
// -----------------------------------------------------------------------------

app.route("/health", health);

// -----------------------------------------------------------------------------
// Webhook Routes (special handling - raw body access, no CORS)
// -----------------------------------------------------------------------------

app.route("/webhooks", webhooks);

// -----------------------------------------------------------------------------
// API v1 Routes
// -----------------------------------------------------------------------------

// Apply rate limiting to API routes
app.use("/api/*", rateLimitMiddleware({ limit: 100, window: 60 }));

// Password-protected link unlock (public, no auth). The form on the password
// page posts here; a correct password sets a short-lived per-link cookie and
// bounces back to the short URL so the normal redirect path tracks the click
// exactly once. Registered after the rate limiter to throttle brute force.
app.post("/api/v1/links/:id/verify", async (c) => {
  const id = c.req.param("id");
  const secret = c.env.CSRF_SECRET;
  const wantsHtml = (c.req.header("accept") ?? "").includes("text/html");

  if (!secret) {
    return c.json({ error: "Password verification is not configured" }, { status: 500 });
  }

  let password = "";
  if ((c.req.header("content-type") ?? "").includes("application/json")) {
    const body = await c.req
      .json<{ password?: string }>()
      .catch(() => ({}) as { password?: string });
    password = body.password ?? "";
  } else {
    const body = await c.req.parseBody();
    password = typeof body.password === "string" ? body.password : "";
  }

  const { drizzle } = await import("drizzle-orm/d1");
  const { eq } = await import("drizzle-orm");
  const schema = await import("@repo/db");
  const db = drizzle(c.env.DB, { schema });
  const rows = await db
    .select({
      id: schema.links.id,
      slug: schema.links.slug,
      domain: schema.links.domain,
      passwordHash: schema.links.passwordHash,
      isDisabled: schema.links.isDisabled,
    })
    .from(schema.links)
    .where(eq(schema.links.id, id))
    .limit(1);
  const link = rows[0];

  if (!link || !link.passwordHash || link.isDisabled) {
    return c.json({ error: "Link not found" }, { status: 404 });
  }

  const ok = password.length > 0 && (await verifyPassword(password, link.passwordHash));
  if (!ok) {
    if (wantsHtml) {
      return c.html(
        renderPasswordPage({
          shortUrl: `https://${link.domain}/${link.slug}`,
          linkId: link.id,
          error: true,
        }),
        { status: 401 }
      );
    }
    return c.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await signUnlockToken(link.id, secret);
  setCookie(c, `go2_pw_${link.id}`, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60,
  });

  const shortUrl = `https://${link.domain}/${link.slug}`;
  if (wantsHtml) {
    return c.redirect(shortUrl, 302);
  }
  return c.json({ success: true, shortUrl });
});

// Mount auth routes (public endpoints)
// /oauth2 must mount BEFORE /auth so the more-specific prefix wins.
app.route("/api/v1/auth/oauth2", oauth);
app.route("/api/v1/auth", auth);

// Mount billing routes
app.route("/api/v1/billing", billing);

// Mount v1 routes (users, organizations, etc.)
app.route("/api/v1", v1);

// Public utilities (no auth required)
app.route("/api/public/link-check", linkCheck);

// Integrations (Zapier, etc.)
app.route("/api/integrations/zapier", zapier);

// -----------------------------------------------------------------------------
// Remote MCP transport (Streamable HTTP)
// -----------------------------------------------------------------------------

app.route("/mcp", mcp);

// -----------------------------------------------------------------------------
// Admin Routes (internal only)
// -----------------------------------------------------------------------------

app.route("/admin", admin);

// -----------------------------------------------------------------------------
// API Documentation
// -----------------------------------------------------------------------------

app.get("/api/openapi.json", (c) => {
  const spec = getOpenApiSpec(c.env);
  return c.json(spec, 200, {
    "Cache-Control": "public, max-age=300, s-maxage=3600",
    "X-Robots-Tag": "all",
  });
});

app.get("/api/docs", (c) => c.redirect("/api/openapi.json", 301));

// -----------------------------------------------------------------------------
// Root Route
// -----------------------------------------------------------------------------

app.get("/", (c) => {
  return c.json({
    name: "Go2 API",
    version: "1.0.0",
    tagline: "The fastest way to share links",
    docs: "/api/docs",
    health: "/health",
    environment: c.env.APP_ENV,
  });
});

// -----------------------------------------------------------------------------
// 404 Handler
// -----------------------------------------------------------------------------

app.notFound((c) => {
  // Apex fall-through: a single-segment path that didn't resolve as a short
  // link may still be a web asset or page (favicon variants, future Next
  // routes), so the web worker gets the final word on the apex.
  const host = c.req.header("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (c.env.WEB && isApexHost(c.env, host)) {
    return c.env.WEB.fetch(c.req.raw);
  }
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404
  );
});

// -----------------------------------------------------------------------------
// Queue Consumer Handler
// -----------------------------------------------------------------------------

export default {
  fetch: app.fetch,

  /**
   * Handle queued messages for background jobs
   */
  async queue(batch: MessageBatch<{ type: string; payload: unknown }>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const { type, payload } = message.body;

      try {
        switch (type) {
          case "email:send": {
            const { sendEmail } = await import("./lib/email.js");
            const emailPayload = payload as {
              to: string;
              template: string;
              data: Record<string, unknown>;
              subject?: string;
              isMarketing?: boolean;
            };
            const result = await sendEmail(env, emailPayload as Parameters<typeof sendEmail>[1]);
            if (!result.success) {
              console.error(`Email send failed: ${result.error}`);
              // Don't retry on configuration errors
              if (result.error?.includes("not configured")) {
                break;
              }
              throw new Error(result.error);
            }
            break;
          }

          case "analytics:track":
            break;

          case "subscription:sync":
            break;

          case "cleanup:sessions":
            break;

          default:
            console.warn(`Unknown job type: ${type}`);
        }

        message.ack();
      } catch (error) {
        console.error(`Failed to process job ${type}:`, error);
        message.retry();
      }
    }
  },

  /**
   * Handle scheduled cron jobs
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const _cronTime = new Date(event.scheduledTime);

    switch (event.cron) {
      case "0 0 * * *":
        // Daily cleanup at midnight
        ctx.waitUntil(
          (async () => {
            const { drizzle } = await import("drizzle-orm/d1");
            const { and, lt, eq } = await import("drizzle-orm");
            const schema = await import("@repo/db");
            const db = drizzle(env.DB, { schema });
            const now = new Date().toISOString();

            // 1. Cleanup expired links from KV
            // Note: D1 links remain for historical analytics
            try {
              // Find expired links
              const expiredLinks = await db
                .select({
                  id: schema.links.id,
                  domain: schema.links.domain,
                  slug: schema.links.slug,
                })
                .from(schema.links)
                .where(and(lt(schema.links.expiresAt, now), eq(schema.links.isArchived, false)));

              // Remove from KV
              for (const link of expiredLinks) {
                await env.LINKS_KV.delete(`${link.domain}:${link.slug}`);
              }
            } catch (error) {
              console.error("Failed to cleanup expired links:", error);
            }

            // 2. Handle expired trial subscriptions
            // Downgrade trials that have expired to free plan
            try {
              // Find expired trials
              const expiredTrials = await db
                .select({
                  id: schema.subscriptions.id,
                  organizationId: schema.subscriptions.organizationId,
                })
                .from(schema.subscriptions)
                .where(
                  and(
                    eq(schema.subscriptions.status, "trialing"),
                    lt(schema.subscriptions.currentPeriodEnd, now)
                  )
                );

              for (const trial of expiredTrials) {
                // Update subscription to expired/free status
                await db
                  .update(schema.subscriptions)
                  .set({
                    status: "canceled",
                    plan: "free",
                    updatedAt: now,
                  })
                  .where(eq(schema.subscriptions.id, trial.id));
              }
            } catch (error) {
              console.error("Failed to process expired trials:", error);
            }

            // 3. Fix orphaned users (users without organizations)
            // This is a safety net for failed signup hooks
            try {
              const { fixOrphanedUsers } = await import("./lib/ensure-organization.js");
              const result = await fixOrphanedUsers(db);
              if (result.fixed > 0 || result.errors > 0) {
              }
            } catch (error) {
              console.error("Failed to fix orphaned users:", error);
            }

            // 4. Backfill plan-tier link retention.
            // Stamps `policy_expires_at = createdAt + 60d` on free-tier links
            // that don't have one yet, and clears it on links owned by orgs
            // currently on a paid plan.
            try {
              const { isNull } = await import("drizzle-orm");
              const { applyRetentionForOrg } = await import("./lib/retention.js");

              // Find every org that owns at least one link.
              const orgs = await db
                .select({ organizationId: schema.links.organizationId })
                .from(schema.links)
                .groupBy(schema.links.organizationId);

              let totalStamped = 0;
              let totalCleared = 0;
              for (const row of orgs) {
                if (!row.organizationId) continue;

                // Read current plan for this org.
                const sub = await db
                  .select({ plan: schema.subscriptions.plan, status: schema.subscriptions.status })
                  .from(schema.subscriptions)
                  .where(
                    and(
                      eq(schema.subscriptions.organizationId, row.organizationId),
                      // Active OR trialing — anything else falls back to "free"
                      // via the default in applyRetentionForOrg.
                      eq(schema.subscriptions.status, "active")
                    )
                  )
                  .limit(1);
                const plan =
                  (sub[0]?.plan as "free" | "pro" | "business" | "enterprise" | undefined) ??
                  "free";

                const result = await applyRetentionForOrg(db, row.organizationId, plan);
                totalStamped += result.stamped;
                totalCleared += result.cleared;
              }

              if (totalStamped > 0 || totalCleared > 0) {
              }

              // Also evict expired free-tier links from KV so the redirect
              // path doesn't serve them from cache.
              const expiredByPolicy = await db
                .select({ domain: schema.links.domain, slug: schema.links.slug })
                .from(schema.links)
                .where(
                  and(lt(schema.links.policyExpiresAt, now), eq(schema.links.isArchived, false))
                );
              for (const link of expiredByPolicy) {
                await env.LINKS_KV.delete(`${link.domain}:${link.slug}`);
              }
              if (expiredByPolicy.length > 0) {
              }
              // Suppress unused warning for `isNull` (kept for future filtered queries).
              void isNull;
            } catch (error) {
              console.error("Failed to apply retention policy:", error);
            }

            // Threat rescan moved to the every-4h trigger below — it shares
            // the cadence with link-health and runs 6x/day instead of 1x to
            // shrink the window between phishing-going-live and disable.
          })()
        );
        break;

      case "*/15 * * * *":
        // Every 15 minutes - sync subscriptions
        ctx.waitUntil(
          (async () => {
            // TODO: Sync Stripe subscription statuses
          })()
        );
        break;

      case "0 */6 * * *":
        // Every 6 hours - prune old clicks per plan-tier retention.
        ctx.waitUntil(
          (async () => {
            try {
              const { drizzle } = await import("drizzle-orm/d1");
              const { and, eq } = await import("drizzle-orm");
              const schema = await import("@repo/db");
              const { pruneClicksForOrg } = await import("./lib/retention.js");
              const db = drizzle(env.DB, { schema });

              // Every org with at least one click row.
              const orgs = await db
                .select({ organizationId: schema.clicks.organizationId })
                .from(schema.clicks)
                .groupBy(schema.clicks.organizationId);

              let totalDeleted = 0;
              for (const row of orgs) {
                if (!row.organizationId) continue;

                const sub = await db
                  .select({ plan: schema.subscriptions.plan })
                  .from(schema.subscriptions)
                  .where(
                    and(
                      eq(schema.subscriptions.organizationId, row.organizationId),
                      eq(schema.subscriptions.status, "active"),
                    ),
                  )
                  .limit(1);
                const plan = (sub[0]?.plan as
                  | "free"
                  | "pro"
                  | "business"
                  | "enterprise"
                  | undefined) ?? "free";

                const result = await pruneClicksForOrg(db, row.organizationId, plan);
                totalDeleted += result.deleted;
              }

              if (totalDeleted > 0) {
                console.log(`[cron] pruned ${totalDeleted} clicks across ${orgs.length} orgs`);
              }
            } catch (error) {
              console.error("Failed to prune clicks:", error);
            }
          })(),
        );
        break;

      case "0 */4 * * *":
        // Every 4 hours - check link health
        ctx.waitUntil(
          (async () => {
            try {
              const { drizzle } = await import("drizzle-orm/d1");
              const schema = await import("@repo/db");
              const db = drizzle(env.DB, { schema });
              const { getLinksToCheck, checkUrlHealth, updateLinkHealth, getBrokenLinks } =
                await import("./lib/link-health.js");
              const { eq, and } = await import("drizzle-orm");

              // Get links that need checking (batch of 50)
              const linksToCheck = await getLinksToCheck(db, 50);

              const newlyBrokenByOrg = new Map<string, string[]>();

              for (const link of linksToCheck) {
                const result = await checkUrlHealth(link.destinationUrl);
                await updateLinkHealth(db, link.id, result);

                // Track newly broken links for notifications
                if (result.status === "broken" && link.healthStatus !== "broken") {
                  // Get org ID for this link
                  const linkData = await db
                    .select({ organizationId: schema.links.organizationId })
                    .from(schema.links)
                    .where(eq(schema.links.id, link.id))
                    .limit(1);

                  if (linkData[0]?.organizationId) {
                    const orgId = linkData[0].organizationId;
                    if (!newlyBrokenByOrg.has(orgId)) {
                      newlyBrokenByOrg.set(orgId, []);
                    }
                    const orgLinks = newlyBrokenByOrg.get(orgId);
                    if (orgLinks) {
                      orgLinks.push(link.id);
                    }
                  }
                }

                // Small delay between checks to avoid overwhelming targets
                await new Promise((r) => setTimeout(r, 100));
              }

              // Threat rescan (Safe Browsing + URL Scanner) — every 4h.
              // Catches the cloaking-after-create attack pattern where the
              // destination page goes live AFTER the link was created clean.
              try {
                const { rescanLinkBatch } = await import("./lib/threat-rescan.js");
                const result = await rescanLinkBatch(env, db);
                if (result.flagged > 0 || result.bailedOnBudget) {
                  console.log(
                    `[cron] threat rescan: scanned=${result.scanned} flagged=${result.flagged} notified=${result.notified} bailedOnBudget=${result.bailedOnBudget}`,
                  );
                }
              } catch (error) {
                console.error("Failed to run threat rescan:", error);
              }

              // Send notifications for newly broken links
              for (const [orgId] of newlyBrokenByOrg) {
                // Get org owner email
                const owner = await db
                  .select({
                    email: schema.users.email,
                    name: schema.users.name,
                  })
                  .from(schema.organizationMembers)
                  .innerJoin(schema.users, eq(schema.organizationMembers.userId, schema.users.id))
                  .where(
                    and(
                      eq(schema.organizationMembers.organizationId, orgId),
                      eq(schema.organizationMembers.role, "owner")
                    )
                  )
                  .limit(1);

                if (!owner[0]?.email) continue;

                // Get broken link details
                const brokenLinks = await getBrokenLinks(db, orgId);

                if (brokenLinks.length > 0 && env.BACKGROUND_QUEUE) {
                  await env.BACKGROUND_QUEUE.send({
                    type: "email:send",
                    payload: {
                      to: owner[0].email,
                      template: "broken-link-alert",
                      data: {
                        customerName: owner[0].name || "there",
                        brokenLinksCount: brokenLinks.length,
                        links: brokenLinks.slice(0, 10).map((link) => ({
                          shortUrl: `${link.domain}/${link.slug}`,
                          destinationUrl: link.destinationUrl,
                          error: link.healthErrorMessage || "Unknown error",
                        })),
                        dashboardUrl: `${env.APP_URL}/dashboard/links?filter=broken`,
                      },
                    },
                  });
                }
              }
            } catch (error) {
              console.error("Failed to check link health:", error);
            }
          })()
        );
        break;

      case "0 8 * * *":
        // Daily at 8 AM UTC - check usage alerts
        ctx.waitUntil(
          (async () => {
            try {
              const { drizzle } = await import("drizzle-orm/d1");
              const { eq, and } = await import("drizzle-orm");
              const schema = await import("@repo/db");
              const db = drizzle(env.DB, { schema });
              const {
                getOrgUsage,
                checkUsageAlerts,
                hasAlertBeenSent,
                recordAlertSent,
                getCurrentMonthStart,
                getPlanDisplayName,
              } = await import("./lib/usage.js");

              // Get all organizations with active subscriptions
              const orgs = await db
                .select({
                  id: schema.organizations.id,
                  name: schema.organizations.name,
                })
                .from(schema.organizations);

              for (const org of orgs) {
                // Get org owner for email
                const owner = await db
                  .select({
                    userId: schema.organizationMembers.userId,
                    email: schema.users.email,
                    name: schema.users.name,
                  })
                  .from(schema.organizationMembers)
                  .innerJoin(schema.users, eq(schema.organizationMembers.userId, schema.users.id))
                  .where(
                    and(
                      eq(schema.organizationMembers.organizationId, org.id),
                      eq(schema.organizationMembers.role, "owner")
                    )
                  )
                  .limit(1);

                if (!owner[0]) continue;

                // Get usage
                const usage = await getOrgUsage(db, owner[0].userId, org.id);
                const alerts = checkUsageAlerts(usage);

                const monthStart = getCurrentMonthStart();

                for (const alert of alerts) {
                  if (alert.threshold === null) continue;

                  // Determine period for this alert type
                  const periodStart = alert.type === "linksThisMonth" ? monthStart : undefined;

                  // Check if already sent
                  const alreadySent = await hasAlertBeenSent(
                    db,
                    org.id,
                    alert.type,
                    alert.threshold,
                    periodStart
                  );

                  if (alreadySent) continue;

                  // Send the alert email
                  if (env.BACKGROUND_QUEUE) {
                    await env.BACKGROUND_QUEUE.send({
                      type: "email:send",
                      payload: {
                        to: owner[0].email,
                        template: "usage-alert",
                        data: {
                          customerName: owner[0].name || "there",
                          usageType: alert.type,
                          usagePercentage: Math.round(alert.percentage ?? 0),
                          currentUsage: alert.current,
                          limit: alert.limit,
                          planName: getPlanDisplayName(usage.plan),
                          upgradeUrl: `${env.APP_URL}/dashboard/billing`,
                        },
                      },
                    });
                  }

                  // Record the alert
                  await recordAlertSent(
                    db,
                    org.id,
                    owner[0].userId,
                    alert.type,
                    alert.threshold,
                    periodStart
                  );
                }
              }
            } catch (error) {
              console.error("Failed to check usage alerts:", error);
            }

            // Check for trial expiry warnings (3 days and 1 day before)
            try {
              const { drizzle } = await import("drizzle-orm/d1");
              const { and, eq, gt, lt } = await import("drizzle-orm");
              const schema = await import("@repo/db");
              const db = drizzle(env.DB, { schema });

              const now = new Date();
              const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
              const _in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

              // Find trials expiring in the next 3 days
              const expiringTrials = await db
                .select({
                  id: schema.subscriptions.id,
                  organizationId: schema.subscriptions.organizationId,
                  currentPeriodEnd: schema.subscriptions.currentPeriodEnd,
                })
                .from(schema.subscriptions)
                .where(
                  and(
                    eq(schema.subscriptions.status, "trialing"),
                    gt(schema.subscriptions.currentPeriodEnd, now.toISOString()),
                    lt(schema.subscriptions.currentPeriodEnd, in3Days.toISOString())
                  )
                );

              for (const trial of expiringTrials) {
                if (!trial.currentPeriodEnd) continue;

                const expiryDate = new Date(trial.currentPeriodEnd);
                const daysRemaining = Math.ceil(
                  (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );

                // Only send for 3 days and 1 day warnings
                if (daysRemaining !== 3 && daysRemaining !== 1) continue;

                // Get org owner for email
                const owner = await db
                  .select({
                    email: schema.users.email,
                    name: schema.users.name,
                  })
                  .from(schema.organizationMembers)
                  .innerJoin(schema.users, eq(schema.organizationMembers.userId, schema.users.id))
                  .where(
                    and(
                      eq(schema.organizationMembers.organizationId, trial.organizationId),
                      eq(schema.organizationMembers.role, "owner")
                    )
                  )
                  .limit(1);

                if (!owner[0]) continue;

                // Send trial expiry warning email
                if (env.BACKGROUND_QUEUE) {
                  await env.BACKGROUND_QUEUE.send({
                    type: "email:send",
                    payload: {
                      to: owner[0].email,
                      template: "trial-expiring",
                      data: {
                        customerName: owner[0].name || "there",
                        daysRemaining,
                        expiryDate: expiryDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }),
                        upgradeUrl: `${env.APP_URL}/dashboard/billing`,
                      },
                    },
                  });
                }
              }
            } catch (error) {
              console.error("Failed to check trial expiry warnings:", error);
            }
          })()
        );
        break;

      case "0 9 * * *":
        // Daily at 9 AM UTC - dispatch dunning Workflow.
        // The Workflow owns per-step durability so a mid-batch crash resumes
        // from the last completed reminder instead of restarting and risking
        // double-sends. See src/workflows/dunning.ts.
        ctx.waitUntil(
          (async () => {
            try {
              await env.DUNNING_WORKFLOW.create({
                params: { triggeredAt: new Date(event.scheduledTime).toISOString() },
              });
            } catch (error) {
              console.error("Failed to dispatch dunning workflow:", error);
            }
          })()
        );
        break;

      case "0 2 * * *":
        // Daily at 02:00 UTC — Stripe metered usage report for Scale tier.
        // No-op until STRIPE_METERED_PRICE_ID_SCALE is set AND at least one
        // org has a stripe_subscription_item_id (i.e. a Scale customer
        // signed up). See lib/metered-billing.ts for the wiring guide.
        ctx.waitUntil(
          (async () => {
            try {
              const { runDailyScaleUsageReport } = await import("./lib/metered-billing.js");
              const result = await runDailyScaleUsageReport(env);
              if (result.orgs > 0) {
              }
            } catch (error) {
              console.error("Failed to report Scale usage:", error);
            }
          })()
        );
        break;

      case "*/5 * * * *":
        // Every 5 minutes - process drip emails
        ctx.waitUntil(
          (async () => {
            try {
              const { drizzle } = await import("drizzle-orm/d1");
              const schema = await import("@repo/db");
              const db = drizzle(env.DB, { schema });

              const {
                initializeCampaigns,
                processDripEmails,
                checkInactiveUsers,
                checkUpgradeEligible,
              } = await import("./lib/drip-campaigns.js");

              // Initialize campaigns if not exists
              await initializeCampaigns(db);

              // Process pending drip emails
              const _emailStats = await processDripEmails(db, env);

              // Check for inactive users (less frequently - only on the hour)
              const minute = new Date().getMinutes();
              if (minute < 5) {
                const _inactiveStats = await checkInactiveUsers(db);

                const _upgradeEnrolled = await checkUpgradeEligible(db);
              }
            } catch (error) {
              console.error("Failed to process drip emails:", error);
            }
          })()
        );
        break;

      default:
        console.warn(`Unknown cron schedule: ${event.cron}`);
    }
  },

  /**
   * Inbound email handler — Cloudflare Email Routing routes every message
   * matching the catch-all rule (*@go2.gg) to this Worker. The destination is
   * configured per-deploy via the MAIL_FORWARD_TO secret (defaults to
   * support@go2.gg) so the public repo carries no operator personal address.
   *
   * Setup (one-time, in CF dashboard + CLI):
   * 1. Email > Email Routing > Destination addresses → verify your inbox.
   * 2. `wrangler secret put MAIL_FORWARD_TO --env production` → that inbox.
   * 3. Email > Email Routing > Routing rules → "Catch-all address" → set
   *    action to "Send to a Worker" and choose this Worker (go2-api-production).
   *
   * @see https://developers.cloudflare.com/email-routing/email-workers/runtime-api/
   */
  async email(message: ForwardableEmailMessage, env: Env, _ctx: ExecutionContext): Promise<void> {
    const FORWARD_TO = env.MAIL_FORWARD_TO ?? "support@go2.gg";

    // Optional per-address routing — currently everything funnels to the
    // single inbox, but we keep the structure so future addresses (support@,
    // billing@, abuse@, etc.) can branch without rewriting the handler.
    const localPart = message.to.split("@")[0]?.toLowerCase() ?? "";
    void localPart;

    try {
      await message.forward(FORWARD_TO);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Email Inbound] forward to ${FORWARD_TO} failed:`, errMsg);
      // Reject the message so the sender gets an SMTP error rather than
      // silent loss — and so CF Email Routing can retry.
      message.setReject(`Forward failed: ${errMsg}`);
    }
  },
};
