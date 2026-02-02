import { NextRequest, NextResponse } from "next/server";

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
  // Marketing pages
  "about",
  "acceptable-use",
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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

  return NextResponse.redirect(apiUrl, 302);
}
