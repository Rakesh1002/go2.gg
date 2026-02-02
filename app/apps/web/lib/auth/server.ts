/**
 * Server-side Auth Utilities
 *
 * For use in Server Components and API routes.
 * Uses JWT decoding for production (avoids worker-to-worker 522 timeouts).
 * Falls back to API call in development.
 */

import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
const JWT_COOKIE_NAME = "go2_jwt";
const AUTH_SECRET =
  process.env.AUTH_SECRET || "development-secret-change-in-production-min-32-chars";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
  image?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  session: {
    id: string;
    expiresAt: string;
  };
}

interface JWTPayload {
  sub: string;
  email: string;
  name?: string;
  exp: number;
  iat?: number;
}

/**
 * Decode JWT payload without verification (for server components)
 * Verification already happened in middleware
 */
function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payloadStr = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = payloadStr + "=".repeat((4 - (payloadStr.length % 4)) % 4);
    const payload = JSON.parse(atob(paddedPayload)) as JWTPayload;

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Get user from JWT cookie (stateless, no API call)
 * For use in Server Components in production
 */
async function getUserFromJWT(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const jwtCookie = cookieStore.get(JWT_COOKIE_NAME);

    if (!jwtCookie?.value) {
      return null;
    }

    const payload = decodeJWTPayload(jwtCookie.value);

    if (!payload) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || null,
      emailVerified: true, // If JWT is valid, email was verified through OAuth
    };
  } catch (error) {
    console.error("Error getting user from JWT:", error);
    return null;
  }
}

/**
 * Get the current session from the API
 * For use in Server Components (development only, production uses JWT)
 */
export async function getServerSession(): Promise<AuthSession | null> {
  // In production, use JWT-based auth to avoid worker-to-worker 522 timeouts
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.CLOUDFLARE_WORKER === "true";

  if (isProduction) {
    const user = await getUserFromJWT();
    if (user) {
      return {
        user,
        session: {
          id: "jwt-session",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    }
    return null;
  }

  // Development: call API
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const response = await fetch(`${API_URL}/api/v1/auth/get-session`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.user) {
      return null;
    }

    return data as AuthSession;
  } catch (error) {
    console.error("Error getting server session:", error);
    return null;
  }
}

/**
 * Get the current user
 * For use in Server Components
 */
export async function getServerUser(): Promise<AuthUser | null> {
  // In production, use JWT directly to avoid worker-to-worker 522 timeouts
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.CLOUDFLARE_WORKER === "true";

  if (isProduction) {
    return getUserFromJWT();
  }

  // Development: use session API
  const session = await getServerSession();
  return session?.user ?? null;
}

/**
 * Check if user is authenticated
 * For use in Server Components
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getServerUser();
  return user !== null;
}
