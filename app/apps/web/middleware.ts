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

// JWT cookie name (must match API)
const JWT_COOKIE_NAME = "go2_jwt";

// Auth secret (must match API's CSRF_SECRET)
const AUTH_SECRET =
  process.env.AUTH_SECRET || "development-secret-change-in-production-min-32-chars";

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
    // Debug: log token and secret info
    console.log("[Middleware] JWT token (first 50 chars):", token.substring(0, 50));
    console.log("[Middleware] Secret (first 10 chars):", secret.substring(0, 10));
    console.log("[Middleware] Secret length:", secret.length);

    const parts = token.split(".");
    if (parts.length !== 3) {
      console.log("[Middleware] JWT doesn't have 3 parts");
      return null;
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    // Debug: decode and log payload before verification
    try {
      const payloadStr = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
      const paddedPayload = payloadStr + "=".repeat((4 - (payloadStr.length % 4)) % 4);
      const decodedPayload = JSON.parse(atob(paddedPayload));
      console.log(
        "[Middleware] JWT payload (pre-verify):",
        JSON.stringify(decodedPayload).substring(0, 100)
      );
    } catch (e) {
      console.log("[Middleware] Failed to decode payload for debug:", e);
    }

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

    console.log("[Middleware] Signature bytes length:", signatureBytes.length);

    const valid = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(data));
    if (!valid) {
      console.log("[Middleware] JWT signature verification failed - signatures don't match");
      return null;
    }

    // Decode payload
    const payloadStr = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = payloadStr + "=".repeat((4 - (payloadStr.length % 4)) % 4);
    const payload = JSON.parse(atob(paddedPayload)) as JWTPayload;

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      console.log("[Middleware] JWT expired at:", new Date(payload.exp * 1000).toISOString());
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
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${API_URL} https://*.posthog.com https://api.stripe.com`,
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
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
  let userEmail: string | null = null;

  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = parseCookies(cookieHeader);

    console.log("[Middleware] Checking session for:", pathname);

    // Check for JWT cookie
    const jwtToken = cookies[JWT_COOKIE_NAME];

    if (jwtToken) {
      // Verify JWT signature and expiration
      const payload = await verifyJWT(jwtToken, AUTH_SECRET);

      if (payload) {
        hasSession = true;
        userEmail = payload.email;
        console.log("[Middleware] JWT valid for user:", payload.email);
      } else {
        console.log("[Middleware] JWT invalid or expired");
      }
    } else {
      console.log("[Middleware] No JWT cookie found");
    }
  } catch (error) {
    console.warn("[Middleware] Session check failed:", error);
    hasSession = false;
  }

  console.log(
    "[Middleware] hasSession:",
    hasSession,
    "isProtected:",
    isProtectedRoute,
    "isAuth:",
    isAuthRoute,
    "user:",
    userEmail
  );

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
