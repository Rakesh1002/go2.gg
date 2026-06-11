/**
 * Auth Middleware
 *
 * Validates user sessions using Better Auth (edge-native).
 */

import { type AuthSession, type AuthUser, createAuth } from "@repo/auth";
import * as schema from "@repo/db";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { MiddlewareHandler } from "hono";
import type { Env } from "../bindings.js";
import { getAuthSecret } from "../lib/auth-secret.js";
import { getPlanForOrg } from "../lib/retention.js";
import { isUserBanned } from "../lib/suspension.js";

// drizzle is still used for API key auth below

// Extend Hono context with our auth types
declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser;
    session: AuthSession;
  }
}

/**
 * Create Better Auth instance for session validation
 */
function getBetterAuth(env: Env) {
  const apiBaseUrl = env.API_URL || "http://localhost:8787";

  return createAuth({
    d1Binding: env.DB, // Pass the raw D1 binding - createAuth wraps it for date serialization
    schema, // Pass the Drizzle schema for proper table mapping
    baseUrl: `${apiBaseUrl}/api/v1/auth`,
    appUrl: env.APP_URL || "http://localhost:3000",
    secret: getAuthSecret(env),
    trustedOrigins: [env.APP_URL, "http://localhost:3000", "http://localhost:8787"],
  });
}

/**
 * Auth middleware that validates the session from cookies.
 * Returns 401 if not authenticated.
 */
export function authMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    // Skip auth check if DB not configured
    if (!c.env.DB) {
      console.warn("Database not configured, skipping auth");
      return c.json(
        {
          success: false,
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Authentication service not configured",
          },
        },
        503
      );
    }

    try {
      const auth = getBetterAuth(c.env);

      // Get session from Better Auth using the request headers
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (!session || !session.user) {
        return c.json(
          {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication required",
            },
          },
          401
        );
      }

      // Fetch user's primary organization membership and ban flag together.
      const db = drizzle(c.env.DB, { schema });
      const [[membership], banned] = await Promise.all([
        db
          .select({
            organizationId: schema.organizationMembers.organizationId,
            role: schema.organizationMembers.role,
          })
          .from(schema.organizationMembers)
          .where(eq(schema.organizationMembers.userId, session.user.id))
          .limit(1),
        isUserBanned(db, session.user.id),
      ]);

      if (banned) {
        return c.json(
          {
            success: false,
            error: {
              code: "ACCOUNT_SUSPENDED",
              message: "This account has been suspended. Contact support@go2.gg.",
            },
          },
          403
        );
      }

      const organizationId = membership?.organizationId ?? undefined;
      const plan = await getPlanForOrg(db, organizationId);

      // Convert Better Auth session to our AuthUser/AuthSession types
      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? null,
        avatarUrl: session.user.image ?? null,
        emailVerified: session.user.emailVerified ?? false,
        organizationId,
        role: membership?.role ?? undefined,
        plan,
      };

      const authSession: AuthSession = {
        user: authUser,
        accessToken: session.session.token,
        expiresAt: new Date(session.session.expiresAt).getTime() / 1000,
      };

      // Store in context
      c.set("user", authUser);
      c.set("session", authSession);

      await next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return c.json(
        {
          success: false,
          error: {
            code: "AUTH_ERROR",
            message: "Authentication failed",
          },
        },
        401
      );
    }
  };
}

/**
 * Optional auth - doesn't require authentication but sets user if present.
 */
export function optionalAuthMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    // Skip if DB not configured
    if (!c.env.DB) {
      return next();
    }

    try {
      const auth = getBetterAuth(c.env);

      // Try to get session
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (session?.user) {
        // Fetch user's primary organization membership
        const db = drizzle(c.env.DB, { schema });

        // Banned users are treated as anonymous on optional-auth routes.
        if (await isUserBanned(db, session.user.id)) {
          return next();
        }

        const [membership] = await db
          .select({
            organizationId: schema.organizationMembers.organizationId,
            role: schema.organizationMembers.role,
          })
          .from(schema.organizationMembers)
          .where(eq(schema.organizationMembers.userId, session.user.id))
          .limit(1);

        const organizationId = membership?.organizationId ?? undefined;
        const plan = await getPlanForOrg(db, organizationId);

        // Convert Better Auth session to our types
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name ?? null,
          avatarUrl: session.user.image ?? null,
          emailVerified: session.user.emailVerified ?? false,
          organizationId,
          role: membership?.role ?? undefined,
          plan,
        };

        const authSession: AuthSession = {
          user: authUser,
          accessToken: session.session.token,
          expiresAt: new Date(session.session.expiresAt).getTime() / 1000,
        };

        c.set("user", authUser);
        c.set("session", authSession);
      }
    } catch (error) {
      // Silently ignore auth errors for optional auth
      console.warn("Optional auth check failed:", error);
    }

    await next();
  };
}

/**
 * API Key auth middleware
 * Validates API keys for programmatic access.
 * Can be used alongside session auth.
 */
export function apiKeyAuthMiddleware(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const authHeader = c.req.header("Authorization");

    // Check for Bearer token (API key format: go2_xxx)
    if (authHeader?.startsWith("Bearer go2_")) {
      const apiKey = authHeader.replace("Bearer ", "");

      // Hash the key and look it up
      const keyHash = await hashApiKey(apiKey);
      const db = drizzle(c.env.DB, { schema });

      const [result] = await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.keyHash, keyHash))
        .limit(1);

      if (result) {
        // Check expiration
        if (result.expiresAt && new Date(result.expiresAt) < new Date()) {
          return c.json(
            {
              success: false,
              error: {
                code: "API_KEY_EXPIRED",
                message: "API key has expired",
              },
            },
            401
          );
        }

        // Resolve the user this key is acting as. Preferred: the user who
        // minted the key (`created_by_user_id`). Fallback for legacy keys:
        // the first member of the org (deterministic but not the actual
        // minter — this is what every key did before migration 0014).
        // Note: schema.users maps to the "user" table (Better Auth convention).
        let member:
          | {
              userId: string;
              email: string;
              name: string | null;
              image: string | null;
              emailVerified: boolean | null;
            }
          | undefined;

        if (result.createdByUserId) {
          [member] = await db
            .select({
              userId: schema.users.id,
              email: schema.users.email,
              name: schema.users.name,
              image: schema.users.image,
              emailVerified: schema.users.emailVerified,
            })
            .from(schema.users)
            .where(eq(schema.users.id, result.createdByUserId))
            .limit(1);
        }

        if (!member) {
          [member] = await db
            .select({
              userId: schema.users.id,
              email: schema.users.email,
              name: schema.users.name,
              image: schema.users.image,
              emailVerified: schema.users.emailVerified,
            })
            .from(schema.organizationMembers)
            .innerJoin(schema.users, eq(schema.organizationMembers.userId, schema.users.id))
            .where(eq(schema.organizationMembers.organizationId, result.organizationId))
            .limit(1);
        }

        if (member) {
          if (await isUserBanned(db, member.userId)) {
            return c.json(
              {
                success: false,
                error: {
                  code: "ACCOUNT_SUSPENDED",
                  message: "This account has been suspended. Contact support@go2.gg.",
                },
              },
              403
            );
          }

          // Look up the API-key user's role within the org so write-scoped
          // helpers (folder ACL, etc.) can authorize correctly.
          const [keyMembership] = await db
            .select({ role: schema.organizationMembers.role })
            .from(schema.organizationMembers)
            .where(eq(schema.organizationMembers.userId, member.userId))
            .limit(1);

          const plan = await getPlanForOrg(db, result.organizationId);

          const authUser: AuthUser = {
            id: member.userId,
            email: member.email,
            name: member.name ?? null,
            avatarUrl: member.image ?? null, // Better Auth uses 'image' column
            emailVerified: member.emailVerified ?? false,
            organizationId: result.organizationId,
            role: keyMembership?.role ?? undefined,
            plan,
          };

          const authSession: AuthSession = {
            user: authUser,
            accessToken: apiKey,
            expiresAt: result.expiresAt
              ? new Date(result.expiresAt).getTime() / 1000
              : Date.now() / 1000 + 86400,
          };

          c.set("user", authUser);
          c.set("session", authSession);

          // Update last used timestamp
          await db
            .update(schema.apiKeys)
            .set({ lastUsedAt: new Date().toISOString() })
            .where(eq(schema.apiKeys.id, result.id));

          return next();
        }
      }

      return c.json(
        {
          success: false,
          error: {
            code: "INVALID_API_KEY",
            message: "Invalid API key",
          },
        },
        401
      );
    }

    // Fall back to session auth
    return authMiddleware()(c, next);
  };
}

/**
 * Hash API key using SHA-256
 */
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
