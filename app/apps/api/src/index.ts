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
import { secureHeaders } from "hono/secure-headers";
import { prettyJSON } from "hono/pretty-json";
import { requestId } from "hono/request-id";
import { timing } from "hono/timing";
import type { Env, CachedLink } from "./bindings.js";

// Durable Objects export
export { RateLimiter } from "./durable-objects/rate-limiter.js";

// Routes
import { health } from "./routes/health.js";
import { auth } from "./routes/auth.js";
import { billing } from "./routes/billing.js";
import { webhooks } from "./routes/webhooks.js";
import { v1 } from "./routes/v1/index.js";
import { admin } from "./routes/admin/index.js";
import { linkCheck } from "./routes/public/link-check.js";
import { zapier } from "./routes/integrations/zapier.js";

// Middleware
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { errorHandler } from "./middleware/error.js";
import { loggerMiddleware } from "./middleware/logger.js";

// Analytics (legacy)
import { resolveDestination } from "./lib/analytics.js";
// Enhanced Analytics
import {
  collectClickMetadata,
  trackClickEnhanced,
  detectBot,
  shouldSkipTracking,
  getDeduplicationKey,
  detectQrTrigger,
} from "./lib/analytics-enhanced.js";

// Pixel tracking
import { generatePixelTrackingPage } from "./lib/pixel-tracking.js";

// Link cloaking
import { generateCloakedPage } from "./lib/cloaked-page.js";

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
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-CSRF-Token"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
  })
);

// Security headers
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
  })
);

// Pretty JSON in development
app.use("*", prettyJSON());

// Request logging
app.use("*", loggerMiddleware());

// Global error handler
app.onError(errorHandler);

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
]);

app.get("/:slug", async (c, next) => {
  const slug = c.req.param("slug");

  // Skip if reserved path
  if (RESERVED_PATHS.has(slug.toLowerCase())) {
    return next();
  }

  // Determine domain from request
  const host = c.req.header("host") ?? c.env.DEFAULT_DOMAIN ?? "go2.gg";
  const domain = host.split(":")[0]; // Remove port if present

  // Fast KV lookup
  const kvKey = `${domain}:${slug}`;
  const cached = await c.env.LINKS_KV.get<CachedLink>(kvKey, "json");

  let link = cached;
  if (!link) {
    // Link not found - check if it's on another domain
    const defaultDomain = c.env.DEFAULT_DOMAIN ?? "go2.gg";
    if (domain !== defaultDomain) {
      const fallbackKey = `${defaultDomain}:${slug}`;
      const fallbackLink = await c.env.LINKS_KV.get<CachedLink>(fallbackKey, "json");
      if (!fallbackLink) {
        return next(); // Let 404 handler deal with it
      }
      link = fallbackLink;
    } else {
      return next();
    }
  }

  // Check if link has expired
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return c.json({ error: "This link has expired" }, { status: 410 });
  }

  // Check password protection (return special response)
  if (link.passwordHash) {
    // Password-protected links require POST with password
    return c.json(
      {
        protected: true,
        message: "This link is password protected",
        verifyUrl: `/api/v1/links/${link.id}/verify`,
      },
      { status: 401 }
    );
  }

  // Resolve destination based on targeting rules
  const destination = resolveDestination(link, c.req.raw);

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

        // Cache click ID for immediate access (before Analytics Engine ingestion)
        if (c.env.LINKS_KV) {
          const recentClickKey = `click:recent:${link.domain}:${link.slug}`;
          await c.env.LINKS_KV.put(recentClickKey, metadata.clickId, { expirationTtl: 86400 }); // 1 day
        }
      } catch (error) {
        console.error("Failed to track click:", error);
      }
    })()
  );

  // Check if pixel tracking is enabled and pixels are configured
  if (link.enablePixelTracking && link.trackingPixels && link.trackingPixels.length > 0) {
    // Generate pixel tracking page that fires pixels then redirects
    const trackingPage = generatePixelTrackingPage(destination, link.trackingPixels, {
      requireConsent: link.requirePixelConsent,
      linkTitle: "Redirecting...",
    });

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

// Mount auth routes (public endpoints)
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
// Admin Routes (internal only)
// -----------------------------------------------------------------------------

app.route("/admin", admin);

// -----------------------------------------------------------------------------
// API Documentation
// -----------------------------------------------------------------------------

app.get("/api/docs", (c) => {
  // Redirect to OpenAPI documentation
  return c.json({
    openapi: "3.1.0",
    info: {
      title: "Go2 API",
      version: "1.0.0",
      description: "Go2 URL Shortener - The fastest way to share links",
    },
    servers: [
      { url: "http://localhost:8787", description: "Development" },
      { url: c.env.APP_URL?.replace(":3000", ":8787") ?? "", description: "Current" },
    ],
    paths: {
      "/health": {
        get: { summary: "Health check", tags: ["Health"] },
      },
      "/{slug}": {
        get: { summary: "Redirect short link", tags: ["Redirect"] },
      },
      "/api/v1/links": {
        get: { summary: "List links", tags: ["Links"] },
        post: { summary: "Create link", tags: ["Links"] },
      },
      "/api/v1/links/{id}": {
        get: { summary: "Get link", tags: ["Links"] },
        patch: { summary: "Update link", tags: ["Links"] },
        delete: { summary: "Delete link", tags: ["Links"] },
      },
      "/api/v1/links/{id}/stats": {
        get: { summary: "Get link analytics", tags: ["Links"] },
      },
      "/api/v1/domains": {
        get: { summary: "List custom domains", tags: ["Domains"] },
        post: { summary: "Add custom domain", tags: ["Domains"] },
      },
      "/api/v1/domains/{id}": {
        get: { summary: "Get domain", tags: ["Domains"] },
        delete: { summary: "Remove domain", tags: ["Domains"] },
      },
      "/api/v1/domains/{id}/verify": {
        post: { summary: "Verify domain ownership", tags: ["Domains"] },
      },
      "/api/v1/auth/signup": {
        post: { summary: "Sign up", tags: ["Auth"] },
      },
      "/api/v1/auth/signin": {
        post: { summary: "Sign in", tags: ["Auth"] },
      },
      "/api/v1/billing/checkout": {
        post: { summary: "Create checkout session", tags: ["Billing"] },
      },
    },
  });
});

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
            // TODO: Implement analytics tracking
            console.log("Tracking event:", payload);
            break;

          case "subscription:sync":
            // TODO: Sync subscription with Stripe
            console.log("Syncing subscription:", payload);
            break;

          case "cleanup:sessions":
            // TODO: Cleanup expired sessions
            console.log("Cleaning up sessions");
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
    const cronTime = new Date(event.scheduledTime);

    console.log(`Running cron job at ${cronTime.toISOString()}`);

    switch (event.cron) {
      case "0 0 * * *":
        // Daily cleanup at midnight
        ctx.waitUntil(
          (async () => {
            console.log("Running daily cleanup...");
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

              console.log(`Cleaned up ${expiredLinks.length} expired links from KV`);
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

              console.log(`Found ${expiredTrials.length} expired trial subscriptions`);

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

                console.log(`Downgraded trial for org ${trial.organizationId} to free plan`);
              }

              console.log(`Processed ${expiredTrials.length} expired trials`);
            } catch (error) {
              console.error("Failed to process expired trials:", error);
            }

            // 3. Fix orphaned users (users without organizations)
            // This is a safety net for failed signup hooks
            try {
              const { fixOrphanedUsers } = await import("./lib/ensure-organization.js");
              const result = await fixOrphanedUsers(db);
              if (result.fixed > 0 || result.errors > 0) {
                console.log(`Fixed ${result.fixed} orphaned users, ${result.errors} errors`);
              }
            } catch (error) {
              console.error("Failed to fix orphaned users:", error);
            }
          })()
        );
        break;

      case "*/15 * * * *":
        // Every 15 minutes - sync subscriptions
        ctx.waitUntil(
          (async () => {
            console.log("Syncing subscriptions...");
            // TODO: Sync Stripe subscription statuses
          })()
        );
        break;

      case "0 */6 * * *":
        // Every 6 hours - aggregate analytics
        ctx.waitUntil(
          (async () => {
            console.log("Aggregating analytics...");
            // Analytics are stored in Analytics Engine
            // This cron can be used for any aggregation/reporting tasks
          })()
        );
        break;

      case "0 */4 * * *":
        // Every 4 hours - check link health
        ctx.waitUntil(
          (async () => {
            console.log("Checking link health...");
            try {
              const { drizzle } = await import("drizzle-orm/d1");
              const schema = await import("@repo/db");
              const db = drizzle(env.DB, { schema });
              const { getLinksToCheck, checkUrlHealth, updateLinkHealth, getBrokenLinks } =
                await import("./lib/link-health.js");
              const { eq } = await import("drizzle-orm");

              // Get links that need checking (batch of 50)
              const linksToCheck = await getLinksToCheck(db, 50);
              console.log(`Checking health of ${linksToCheck.length} links`);

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

              // Send notifications for newly broken links
              for (const [orgId] of newlyBrokenByOrg) {
                // Get org owner email
                const owner = await db
                  .select({
                    email: schema.users.email,
                    name: schema.users.name,
                  })
                  .from(schema.organizationMembers)
                  .innerJoin(schema.users, (join) =>
                    join.eq(schema.organizationMembers.userId, schema.users.id)
                  )
                  .where((where) =>
                    where.and(
                      where.eq(schema.organizationMembers.organizationId, orgId),
                      where.eq(schema.organizationMembers.role, "owner")
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
                  console.log(
                    `Sent broken link alert to ${owner[0].email} for ${brokenLinks.length} links`
                  );
                }
              }

              console.log("Link health check complete");
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
            console.log("Checking usage alerts...");
            try {
              const { drizzle } = await import("drizzle-orm/d1");
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

              console.log(`Checking usage alerts for ${orgs.length} organizations`);

              for (const org of orgs) {
                // Get org owner for email
                const owner = await db
                  .select({
                    userId: schema.organizationMembers.userId,
                    email: schema.users.email,
                    name: schema.users.name,
                  })
                  .from(schema.organizationMembers)
                  .innerJoin(schema.users, (join) =>
                    join.eq(schema.organizationMembers.userId, schema.users.id)
                  )
                  .where((where) =>
                    where.and(
                      where.eq(schema.organizationMembers.organizationId, org.id),
                      where.eq(schema.organizationMembers.role, "owner")
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

                  console.log(`Sent ${alert.threshold}% ${alert.type} alert to ${owner[0].email}`);
                }
              }

              console.log("Usage alerts check complete");
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
              const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

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

              console.log(`Found ${expiringTrials.length} trials expiring soon`);

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
                  .innerJoin(schema.users, (join) =>
                    join.eq(schema.organizationMembers.userId, schema.users.id)
                  )
                  .where((where) =>
                    where.and(
                      where.eq(schema.organizationMembers.organizationId, trial.organizationId),
                      where.eq(schema.organizationMembers.role, "owner")
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

                  console.log(`Sent ${daysRemaining}-day trial warning to ${owner[0].email}`);
                }
              }

              console.log("Trial expiry warnings check complete");
            } catch (error) {
              console.error("Failed to check trial expiry warnings:", error);
            }
          })()
        );
        break;

      case "0 9 * * *":
        // Daily at 9 AM UTC - process dunning reminders
        ctx.waitUntil(
          (async () => {
            console.log("Processing dunning reminders...");
            try {
              const { drizzle } = await import("drizzle-orm/d1");
              const schema = await import("@repo/db");
              const db = drizzle(env.DB, { schema });
              const {
                getPendingDunningReminders,
                markReminderSent,
                buildDunningEmailData,
                getExpiredDunningRecords,
                markDunningCanceled,
                DUNNING_SCHEDULE,
              } = await import("./lib/dunning.js");

              // Get pending reminders
              const pendingReminders = await getPendingDunningReminders(db);
              console.log(`Found ${pendingReminders.length} pending dunning reminders`);

              // Send reminders
              for (const record of pendingReminders) {
                const daysSinceFailure = Math.floor(
                  (Date.now() - new Date(record.failedAt).getTime()) / (1000 * 60 * 60 * 24)
                );

                // Determine which reminder to send
                let reminderDay = DUNNING_SCHEDULE.REMINDER_1;
                if (daysSinceFailure >= DUNNING_SCHEDULE.FINAL_WARNING) {
                  reminderDay = DUNNING_SCHEDULE.FINAL_WARNING;
                } else if (daysSinceFailure >= DUNNING_SCHEDULE.REMINDER_2) {
                  reminderDay = DUNNING_SCHEDULE.REMINDER_2;
                }

                const emailData = buildDunningEmailData(
                  record,
                  reminderDay,
                  `${env.APP_URL}/dashboard/billing`
                );

                // Queue the email
                if (env.BACKGROUND_QUEUE) {
                  await env.BACKGROUND_QUEUE.send({
                    type: "email:send",
                    payload: {
                      to: record.email,
                      template: "dunning-reminder",
                      data: {
                        customerName: "Customer",
                        ...emailData,
                      },
                    },
                  });
                }

                // Mark reminder as sent
                await markReminderSent(db, record.id, reminderDay);
                console.log(`Sent Day ${reminderDay} reminder to ${record.email}`);
              }

              // Check for expired grace periods and cancel subscriptions
              const expiredRecords = await getExpiredDunningRecords(db);
              console.log(`Found ${expiredRecords.length} expired dunning records`);

              for (const record of expiredRecords) {
                // Cancel subscription in Stripe
                try {
                  const Stripe = (await import("stripe")).default;
                  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
                    apiVersion: "2025-02-24.acacia",
                  });

                  // Find and cancel the subscription
                  const subscriptions = await stripe.subscriptions.list({
                    customer: record.stripeCustomerId,
                    status: "past_due",
                    limit: 1,
                  });

                  if (subscriptions.data.length > 0) {
                    await stripe.subscriptions.cancel(subscriptions.data[0].id);
                    console.log(`Canceled subscription for customer ${record.stripeCustomerId}`);
                  }

                  // Mark dunning as canceled
                  await markDunningCanceled(db, record.id);
                } catch (error) {
                  console.error(
                    `Failed to cancel subscription for ${record.stripeCustomerId}:`,
                    error
                  );
                }
              }

              console.log("Dunning processing complete");
            } catch (error) {
              console.error("Failed to process dunning:", error);
            }
          })()
        );
        break;

      case "*/5 * * * *":
        // Every 5 minutes - process drip emails
        ctx.waitUntil(
          (async () => {
            try {
              console.log("Processing drip emails...");
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
              const emailStats = await processDripEmails(db, env);
              console.log(
                `[Drip] Processed: ${emailStats.sent} sent, ${emailStats.skipped} skipped, ${emailStats.errors} errors`
              );

              // Check for inactive users (less frequently - only on the hour)
              const minute = new Date().getMinutes();
              if (minute < 5) {
                const inactiveStats = await checkInactiveUsers(db);
                console.log(
                  `[Drip] Inactive users enrolled: 7d=${inactiveStats.enrolled7d}, 14d=${inactiveStats.enrolled14d}`
                );

                const upgradeEnrolled = await checkUpgradeEligible(db);
                console.log(`[Drip] Upgrade nudge enrolled: ${upgradeEnrolled}`);
              }

              console.log("Drip email processing complete");
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
};
