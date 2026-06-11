import { type NextRequest, NextResponse } from "next/server";

/**
 * Next.js Middleware
 *
 * Handles:
 * - Security headers
 * - Auth route protection
 * - JWT verification (stateless, no API call needed)
 *
 * Uses HMAC-SHA256 signed JWT tokens for stateless authentication.
 * The JWT is set by the API after successful OAuth login.
 */

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/settings", "/billing"];

// Routes that are only for unauthenticated users
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

// API URL for CSP
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

// RFC 8288 Link header advertising agent-discovery surfaces. Comma-separated
// link-values, all relative so they resolve against any host (apex / www / preview).
const LINK_HEADER = [
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</openapi.json>; rel="service-desc"; type="application/json"',
  '</developers/api>; rel="service-doc"; type="text/html"',
  '</llms.txt>; rel="alternate"; type="text/plain"; title="LLM index"',
  '</llms-full.txt>; rel="alternate"; type="text/plain"; title="LLM full corpus"',
  '</AGENTS.md>; rel="alternate"; type="text/markdown"; title="Agents guide"',
  '</.well-known/oauth-protected-resource>; rel="http://openid.net/specs/connect/1.0/issuer"; type="application/json"',
  '</.well-known/agent-card.json>; rel="https://a2a-protocol.org/rel/agent-card"; type="application/json"',
  '</.well-known/agent-skills/index.json>; rel="https://agentskills.io/rel/index"; type="application/json"',
  '</.well-known/mcp.json>; rel="https://modelcontextprotocol.io/rel/manifest"; type="application/json"',
].join(", ");

// Paths that have a markdown counterpart at /agents-md/<path>. Must stay in
// sync with MARKDOWN_PATHS in lib/agentic/agents-md.ts.
const MARKDOWN_NEGOTIABLE = new Set([
  "/",
  "/pricing",
  "/developers",
  "/developers/api",
  "/developers/mcp",
  "/agents",
]);

function clientPrefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const tokens = accept.split(",").map((t) => t.trim().toLowerCase());
  for (const token of tokens) {
    if (token === "*/*") return false;
    if (token.startsWith("text/markdown") || token.startsWith("text/x-markdown")) {
      return true;
    }
  }
  return false;
}

// JWT cookie name (must match API)
const JWT_COOKIE_NAME = "go2_jwt";

// Auth secret (must match API's CSRF_SECRET). Fail closed: the old
// hardcoded fallback ships in the public repo — anyone running prod without
// the secret set would accept attacker-minted JWTs for any user id.
const AUTH_SECRET = (() => {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV !== "production") {
    return "development-secret-change-in-production-min-32-chars";
  }
  throw new Error("AUTH_SECRET must be set to at least 32 characters in production");
})();

/**
 * JWT payload structure
 */
interface JWTPayload {
  sub: string; // user id
  email: string;
  name?: string;
  exp: number; // expiration timestamp
  iat: number; // issued at
}

/**
 * Parse cookies from header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name) {
      cookies[name] = valueParts.join("=");
    }
  });

  return cookies;
}

/**
 * Verify and decode a JWT token using HMAC-SHA256
 * Returns null if invalid or expired
 */
async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    // Decode signature (base64url to bytes)
    const signatureStr = encodedSignature.replace(/-/g, "+").replace(/_/g, "/");
    const paddedSignature = signatureStr + "=".repeat((4 - (signatureStr.length % 4)) % 4);
    const signatureBytes = Uint8Array.from(atob(paddedSignature), (c) => c.charCodeAt(0));

    const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(data));
    if (!valid) {
      return null;
    }

    // Decode payload
    const payloadStr = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = payloadStr + "=".repeat((4 - (payloadStr.length % 4)) % 4);
    const payload = JSON.parse(atob(paddedPayload)) as JWTPayload;

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    console.warn("[Middleware] JWT verification error:", error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Markdown-for-Agents content negotiation: when an agent sends
  // Accept: text/markdown for an allowlisted marketing path, rewrite to the
  // markdown twin under /agents-md/* so the URL stays the same.
  const isMarkdownNegotiable = MARKDOWN_NEGOTIABLE.has(pathname);
  const wantsMarkdown =
    isMarkdownNegotiable && clientPrefersMarkdown(request.headers.get("accept"));

  let response: NextResponse;
  if (wantsMarkdown) {
    const target = pathname === "/" ? "/agents-md" : `/agents-md${pathname}`;
    response = NextResponse.rewrite(new URL(target, request.url));
  } else {
    response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  // Advertise agent-discovery surfaces via RFC 8288 Link header.
  response.headers.set("Link", LINK_HEADER);

  // Vary on Accept for paths that have a markdown counterpart so caches
  // don't poison HTML responses with markdown (or vice versa). Append
  // rather than set so Next.js' own Vary entries (e.g. RSC) survive.
  if (isMarkdownNegotiable) {
    response.headers.append("Vary", "Accept");
  }

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com https://static.cloudflareinsights.com https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${API_URL} https://*.posthog.com https://api.stripe.com https://cdn.jsdelivr.net https://cloudflareinsights.com`,
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", cspHeader);

  // Check if route needs auth protection
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Only check session for protected and auth routes
  if (!isProtectedRoute && !isAuthRoute) {
    return response;
  }

  // Validate session via JWT (stateless, no API call needed)
  let hasSession = false;

  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parseCookies(cookieHeader);

    // Check for JWT cookie
    const jwtToken = cookies[JWT_COOKIE_NAME];

    if (jwtToken) {
      // Verify JWT signature and expiration
      const payload = await verifyJWT(jwtToken, AUTH_SECRET);

      if (payload) {
        hasSession = true;
      }
    }
  } catch (error) {
    console.warn("[Middleware] Session check failed:", error);
    hasSession = false;
  }

  // Redirect authenticated users away from auth routes
  if (hasSession && isAuthRoute) {
    const redirectUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect unauthenticated users to login
  if (!hasSession && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     * - api routes (handled separately by API server)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
  ],
};
