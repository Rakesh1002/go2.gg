/**
 * API Guards for Hono
 *
 * Middleware and guards for protecting API routes.
 */

import type { Context } from "hono";
import { AuthError, type AuthSession, type AuthUser } from "../types.js";
import type { PolicyContext, PolicyFunction } from "../rbac/policies.js";
import type { OrganizationRole, Permission } from "../rbac/roles.js";
import { hasPermission } from "../rbac/policies.js";

// -----------------------------------------------------------------------------
// Context Extension Types
// -----------------------------------------------------------------------------

export interface AuthContext {
  user: AuthUser;
  session: AuthSession;
}

export interface OrgAuthContext extends AuthContext {
  organization: {
    id: string;
    role: OrganizationRole;
  };
}

// -----------------------------------------------------------------------------
// Session Verification
// -----------------------------------------------------------------------------

export type SessionVerifier = (
  authHeader: string | null,
  cookies: Record<string, string>
) => Promise<AuthSession | null>;

/**
 * Creates an auth middleware for Hono.
 *
 * @example
 * ```typescript
 * const authMiddleware = createAuthMiddleware(async (authHeader, cookies) => {
 *   // Verify session using your auth provider
 *   return await verifySession(authHeader, cookies);
 * });
 *
 * app.use("/api/*", authMiddleware);
 * ```
 */
export function createAuthMiddleware(verifySession: SessionVerifier) {
  return async (c: Context, next: () => Promise<void>) => {
    const authHeader = c.req.header("Authorization") ?? null;
    const cookies = parseCookies(c.req.header("Cookie") ?? "");

    const session = await verifySession(authHeader, cookies);

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Store auth context in Hono context
    c.set("user", session.user);
    c.set("session", session);

    await next();
  };
}

/**
 * Get auth context from Hono context.
 */
export function getAuthContext(c: Context): AuthContext {
  const user = c.get("user") as AuthUser | undefined;
  const session = c.get("session") as AuthSession | undefined;

  if (!user || !session) {
    throw new AuthError("Not authenticated", "UNAUTHORIZED", 401);
  }

  return { user, session };
}

/**
 * Get organization auth context from Hono context.
 */
export function getOrgAuthContext(c: Context): OrgAuthContext {
  const auth = getAuthContext(c);
  const organization = c.get("organization") as { id: string; role: OrganizationRole } | undefined;

  if (!organization) {
    throw new AuthError("No organization context", "FORBIDDEN", 403);
  }

  return { ...auth, organization };
}

// -----------------------------------------------------------------------------
// Permission Guards
// -----------------------------------------------------------------------------

/**
 * Guard that requires a specific permission.
 */
export function requirePermission(permission: Permission) {
  return async (c: Context, next: () => Promise<void>) => {
    const auth = getAuthContext(c);
    const org = c.get("organization") as { id: string; role: OrganizationRole } | undefined;

    const context: PolicyContext = {
      user: auth.user,
      organization: org,
    };

    if (!hasPermission(context, permission)) {
      return c.json({ error: "Forbidden", message: `Missing permission: ${permission}` }, 403);
    }

    await next();
  };
}

/**
 * Guard that evaluates a custom policy.
 */
export function requirePolicy(policy: PolicyFunction) {
  return async (c: Context, next: () => Promise<void>) => {
    const auth = getAuthContext(c);
    const org = c.get("organization") as { id: string; role: OrganizationRole } | undefined;

    const context: PolicyContext = {
      user: auth.user,
      organization: org,
    };

    const result = await policy(context);

    if (!result.allowed) {
      return c.json({ error: "Forbidden", message: result.reason }, 403);
    }

    await next();
  };
}

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  for (const pair of cookieHeader.split(";")) {
    const [key, value] = pair.trim().split("=");
    if (key && value) {
      cookies[key] = decodeURIComponent(value);
    }
  }

  return cookies;
}
