/**
 * go2-redirect — lean edge worker for short-link clicks.
 *
 * WHY THIS EXISTS: go2.gg/* was served by the monolith (go2-api-production,
 * ~3.5MB: Hono + Better Auth + Stripe + drizzle + MCP). A cold isolate paid
 * ~1.2s parsing that bundle before the first click resolved. This worker is
 * <KB-scale: KV lookup + a 302, nothing else. Cold start drops to single-digit
 * ms; the warm path skips the monolith's 7-middleware chain entirely.
 *
 * IT ONLY SERVES THE SIMPLE FAST PATH NATIVELY. Anything that needs the
 * monolith's machinery — disabled/expired/archived pages, passwords, cloak
 * iframes, pixel interstitials, A/B (D1), OG crawler pages, device/geo
 * targeting, click-limit enforcement, KV misses — is forwarded over the WEB-
 * style API service binding, which renders the exact existing behaviour. The
 * forward/native decision lives in @repo/link-resolver so it can't drift.
 *
 * CLICK TRACKING (billing-critical) IS NOT REIMPLEMENTED HERE. On a native
 * redirect the worker fires a fire-and-forget service-binding ping to the
 * monolith (x-go2-track-only) carrying the clickId it stamped on the 302, so
 * the D1 click row + conversion attribution use the same id. The monolith's
 * existing tracking code runs unchanged. This keeps billing untouched and the
 * worker drizzle-free, at the cost of a second (post-response) invocation per
 * click — a later optimization collapses that to a queue.
 *
 *   request
 *     │ fail-open wrapper (catches pre-response throws → forward)
 *     ▼
 *   single-segment GET/HEAD, not a reserved path?
 *     │ no ─────────────────────────────────► forward to monolith
 *     ▼ yes
 *   KV get (cacheTtl 300)
 *     │ miss / negative-cache ──────────────► forward (monolith rehydrates/404s)
 *     ▼ hit
 *   evaluateLink(link, now)
 *     │ forward ────────────────────────────► forward (monolith renders + tracks)
 *     ▼ redirect
 *   302 + go2_ref(clickId)  ──  waitUntil: track-ping + Axiom wall-time
 */

import { evaluateLink, type LinkGateInput } from "@repo/link-resolver";

export interface Env {
  LINKS_KV: KVNamespace;
  /** Service binding to go2-api-production (the monolith). */
  API: Fetcher;
  DEFAULT_DOMAIN?: string;
  APP_ENV?: string;
  AXIOM_API_KEY?: string;
  AXIOM_DATASET?: string;
}

/** Mirror of WEB_APP_PATHS in apps/api/src/index.ts — single segments owned by
 *  the Next.js app. A miss here just costs one forward, not a correctness bug. */
const WEB_APP_PATHS = new Set([
  "api", "auth", "bio", "blog", "dashboard", "docs", "invite", "admin", "r",
  "affiliates", "about", "acceptable-use", "report-abuse", "careers",
  "case-studies", "changelog", "competitors", "contact", "cookies", "dpa",
  "events", "features", "free", "guides", "help", "partners", "pricing",
  "privacy", "security", "settings", "billing", "solutions", "status", "terms",
  "tools", "login", "register", "forgot-password", "reset-password", "agents",
  "favicon.ico", "icon.svg", "icon-16.png", "icon-32.png", "icon-192.png",
  "apple-touch-icon.png", "og.png", "robots.txt", "sitemap.xml",
  "manifest.webmanifest", "openapi.json", "llms.txt", "llms-full.txt", "_next",
]);

const SLUG_RE = /^\/([^/]+)$/;

/** false on a fresh isolate, true once the isolate has served a request.
 *  Lets us tag cold vs warm in the latency metric without external state. */
let isWarm = false;

/** Replica of generateClickId() in apps/api/src/lib/analytics-enhanced.ts.
 *  Stable primitive; kept in sync by format (16 base62 chars). */
function generateClickId(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => chars[b % chars.length])
    .join("");
}

function stampGo2Ref(destination: string, linkId: string, clickId: string): string {
  try {
    const u = new URL(destination);
    u.searchParams.set("go2_ref", `${linkId}:${clickId}`);
    return u.toString();
  } catch {
    // Non-URL destination (deep-link scheme); leave it untouched.
    return destination;
  }
}

/** Forward the request to the monolith. Re-wrap so outer code can read headers
 *  (service-binding responses carry immutable headers) — same pattern as the
 *  monolith's apex shim, which preserves the web worker's own CSP. */
async function forward(request: Request, env: Env): Promise<Response> {
  const upstream = await env.API.fetch(request);
  return new Response(upstream.body, upstream);
}

function emitAxiom(env: Env, fields: Record<string, unknown>): Promise<void> {
  if (!env.AXIOM_API_KEY) return Promise.resolve();
  const dataset = env.AXIOM_DATASET || "go2";
  return fetch(`https://api.axiom.co/v1/datasets/${encodeURIComponent(dataset)}/ingest`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.AXIOM_API_KEY}`,
    },
    body: JSON.stringify([{ _time: new Date().toISOString(), source: "redirect", ...fields }]),
  })
    .then(() => undefined)
    .catch(() => undefined);
}

/**
 * Custom-domain bio page: a creator's own domain, bound to a gallery, serves the
 * web app — the page AND its assets (/_next/*, images). biohost:<host> (written
 * by the API when a gallery is moved onto the domain) maps the host to a gallery
 * slug. Tag every request so the apex shim streams it to the web worker, and
 * rewrite only the root to the existing /bio/<slug> renderer. Returns null (fall
 * through to normal slug handling) for the platform's own hosts — which keeps the
 * go2.gg hot path read-free — and for ACME challenge paths (edge-served for
 * custom hostnames, must not be rewritten). A bound bio domain serves the bio,
 * not short links.
 *
 * shortcut: a non-bio custom (link) domain pays one extra cached biohost miss per
 * click; collapse into the existing domain:slug read if it ever matters.
 */
async function serveBioHost(
  request: Request,
  url: URL,
  method: string,
  env: Env
): Promise<Response | null> {
  if (method !== "GET" && method !== "HEAD") return null;
  const host = (request.headers.get("host")?.split(":")[0]?.toLowerCase() || "").replace(/\.$/, "");
  const platform = (env.DEFAULT_DOMAIN || "go2.gg").toLowerCase();
  if (!host || host === platform || host === `www.${platform}` || url.pathname.startsWith("/.well-known/")) {
    return null;
  }
  // Short TTL (KV's 60s floor): a slug change or primary switch updates the
  // mapping immediately, so bound how long an edge can serve the old one.
  const bio = await env.LINKS_KV.get<{ slug: string }>(`biohost:${host}`, {
    type: "json",
    cacheTtl: 60,
  });
  if (!bio?.slug) return null;
  const target = new URL(request.url);
  if (url.pathname === "/" || url.pathname === "") {
    target.pathname = `/bio/${encodeURIComponent(bio.slug)}`;
  }
  const headers = new Headers(request.headers);
  headers.set("x-go2-bio-domain", host);
  return forward(new Request(target.toString(), { method, headers }), env);
}

async function handle(request: Request, env: Env, ctx: ExecutionContext, wasWarm: boolean): Promise<Response> {
  const t0 = Date.now();
  const url = new URL(request.url);
  const method = request.method;

  const bioResponse = await serveBioHost(request, url, method, env);
  if (bioResponse) return bioResponse;

  const match = SLUG_RE.exec(url.pathname);
  const slug = match?.[1];

  const isSlugRequest =
    (method === "GET" || method === "HEAD") &&
    slug != null &&
    !WEB_APP_PATHS.has(slug.toLowerCase());

  if (!isSlugRequest || !slug) {
    return forward(request, env);
  }

  const domain = (request.headers.get("host")?.split(":")[0] || env.DEFAULT_DOMAIN || "go2.gg").toLowerCase();
  const kvKey = `${domain}:${slug}`;

  const tKv = Date.now();
  const cached = await env.LINKS_KV.get<Record<string, unknown> | { nf: 1 }>(kvKey, {
    type: "json",
    cacheTtl: 300,
  });
  const kvMs = Date.now() - tKv;

  // Miss or negative-cache sentinel → let the monolith rehydrate from D1 /
  // render the 404. Keeps D1 + negative-cache logic in one place.
  if (!cached || "nf" in cached) {
    return forward(request, env);
  }

  const link = cached as unknown as LinkGateInput & { id: string };
  const decision = evaluateLink(link, Date.now());
  if (decision.action === "forward") {
    return forward(request, env);
  }

  // Native fast path: simple link, gates clear.
  const clickId = generateClickId();
  const destination = stampGo2Ref(decision.destination, link.id, clickId);
  const totalMs = Date.now() - t0;

  // Track-only ping: reuse the original request (preserves cf for geo) with the
  // clickId so the monolith records the same id it would have generated.
  const trackHeaders = new Headers(request.headers);
  trackHeaders.set("x-go2-track-only", "1");
  trackHeaders.set("x-go2-click-id", clickId);
  ctx.waitUntil(env.API.fetch(new Request(request, { headers: trackHeaders })).then(() => undefined).catch(() => undefined));

  ctx.waitUntil(
    emitAxiom(env, {
      message: "redirect.served",
      slug,
      domain,
      colo: (request.cf?.colo as string | undefined) ?? "",
      cold: !wasWarm,
      kv_ms: kvMs,
      total_ms: totalMs,
    })
  );

  return new Response(null, {
    status: 302,
    headers: {
      location: destination,
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex, nofollow, noarchive, nosnippet",
      "referrer-policy": "no-referrer",
      "server-timing": `kv;dur=${kvMs}, total;dur=${totalMs}`,
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const wasWarm = isWarm;
    isWarm = true;
    try {
      return await handle(request, env, ctx, wasWarm);
    } catch (err) {
      // Fail-open — only reachable before a response has started. A worker bug
      // degrades to today's behaviour (monolith) instead of a hard outage.
      console.error("redirect worker fail-open:", err instanceof Error ? err.message : String(err));
      try {
        return await forward(request, env);
      } catch {
        return new Response("Temporary error", { status: 502 });
      }
    }
  },
};
