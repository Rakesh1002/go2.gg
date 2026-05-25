import { type NextRequest, NextResponse } from "next/server";

/**
 * Short Link Redirect Handler
 *
 * This catch-all route handles short link redirects by redirecting to the API.
 * Short links are resolved on the api.go2.gg subdomain.
 *
 * Note: We redirect instead of proxy because Cloudflare Workers have restrictions
 * on fetching other Workers on the same zone.
 */

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Skip reserved paths - they should 404 here and be handled by other routes
  if (RESERVED_PATHS.has(slug.toLowerCase())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Redirect to the API domain for short link resolution
  // The API handles the actual redirect logic, including:
  // - Looking up the link in KV/D1
  // - Tracking clicks via Analytics Engine
  // - Handling password-protected links
  // - Geo-targeting and device targeting
  const apiUrl = `https://api.go2.gg/${slug}`;

  // X-Robots-Tag stops Google from indexing /<slug> paths on go2.gg. The
  // moment a slug gets indexed, Safe Browsing's crawler can flag the
  // shortener for whatever phishing destination an abuser pointed at —
  // that's how the 2026-05 GSC warning happened. Apply on the redirect
  // response so the header reaches the bot even on a 30x.
  return NextResponse.redirect(apiUrl, {
    status: 302,
    headers: {
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
      "Referrer-Policy": "no-referrer",
    },
  });
}
