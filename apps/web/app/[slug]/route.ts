import { getCloudflareContext } from "@opennextjs/cloudflare";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Short Link Redirect Handler
 *
 * Proxies /<slug> to the API worker over the API service binding and returns
 * its response (redirect, password page, interstitial) as-is. This keeps the
 * click to a single user-visible hop — the previous implementation 302'd to
 * api.go2.gg, which cost every click a second DNS+TLS+worker round-trip.
 * Outside the Cloudflare runtime (next dev) the binding is absent and we fall
 * back to that redirect.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

// Known paths that should NOT be treated as short links
// These are handled by other routes in the app
const RESERVED_PATHS = new Set([
  "api",
  "auth",
  "bio",
  "blog",
  "dashboard",
  "docs",
  "invite",
  "admin",
  "r", // affiliate landing — see app/r/[code]/route.ts
  "affiliates",
  // Marketing pages
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
  "solutions",
  "status",
  "terms",
  "tools",
  // Auth pages
  "login",
  "register",
  "forgot-password",
  "reset-password",
  // Static files
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.webmanifest",
  "_next",
]);

// X-Robots-Tag stops Google from indexing /<slug> paths on go2.gg. The
// moment a slug gets indexed, Safe Browsing's crawler can flag the
// shortener for whatever phishing destination an abuser pointed at —
// that's how the 2026-05 GSC warning happened. Apply on every short-link
// response so the header reaches the bot even on a 30x.
const ROBOT_HEADERS = {
  "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
  "Referrer-Policy": "no-referrer",
} as const;

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Skip reserved paths - they should 404 here and be handled by other routes
  if (RESERVED_PATHS.has(slug.toLowerCase())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Anything that looks like a file (/foo.png, /x.txt) is a missing static
  // asset, never a short link — slugs can't contain dots. Proxying it to the
  // API would bounce back here via the apex fallthrough and loop to a 1101
  // worker error (that's exactly how /og.png used to take 2.3s to 500).
  if (slug.includes(".")) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: ROBOT_HEADERS });
  }

  // The API worker already failed to resolve this slug and forwarded it here
  // as a possible web asset/page (see its notFound handler). Nothing matched,
  // so answer 404 instead of proxying back — that would loop.
  if (request.headers.get("x-go2-apex-fallthrough")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const search = request.nextUrl.search;
  // Keep the apex host on the proxied URL — links are keyed `go2.gg:<slug>`
  // in KV, so the API resolves them in a single lookup.
  const appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://go2.gg").origin;

  try {
    const { env, cf } = getCloudflareContext();
    const apiBinding = (env as { API?: { fetch: typeof fetch } }).API;
    if (apiBinding?.fetch) {
      // redirect: "manual" is load-bearing — the API answers with a 301 to
      // the destination, which must pass through to the client, not be
      // followed by the worker. cf doesn't cross service bindings on its
      // own; forward it so click analytics keep geo/colo data.
      const init = {
        method: "GET",
        headers: request.headers,
        redirect: "manual",
        cf,
      } as RequestInit;
      const upstream = await apiBinding.fetch(`${appOrigin}/${slug}${search}`, init);
      const headers = new Headers(upstream.headers);
      for (const [key, value] of Object.entries(ROBOT_HEADERS)) {
        headers.set(key, value);
      }
      return new Response(upstream.body, { status: upstream.status, headers });
    }
  } catch {
    // Binding unavailable — use the redirect fallback below.
  }

  return NextResponse.redirect(`${API_URL}/${slug}${search}`, {
    status: 302,
    headers: ROBOT_HEADERS,
  });
}
