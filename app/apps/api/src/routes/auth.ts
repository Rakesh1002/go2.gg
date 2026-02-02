/**
 * Auth Routes
 *
 * Authentication endpoints using Better Auth (edge-native).
 *
 * Better Auth handles most routes automatically via its handler:
 * - POST /auth/sign-up/email - Email/password signup
 * - POST /auth/sign-in/email - Email/password signin
 * - POST /auth/sign-out - Sign out
 * - GET /auth/session - Get current session
 * - POST /auth/forget-password - Request password reset
 * - POST /auth/reset-password - Reset password with token
 * - GET /auth/callback/:provider - OAuth callback
 * - POST /auth/sign-in/social - Start OAuth flow
 * - POST /auth/magic-link - Send magic link (passwordless)
 * - POST /auth/email-otp/send-verification-otp - Send OTP
 * - POST /auth/email-otp/verify-email - Verify OTP
 *
 * We add custom routes here for additional functionality.
 */

import { Hono } from "hono";
import * as schema from "@repo/db";
import {
  createAuth,
  createJWT,
  type Auth,
  type EmailPayload,
} from "@repo/auth";
import type { Env } from "../bindings.js";
// Rate limit middleware available if needed:
// import { authRateLimitMiddleware, passwordResetRateLimitMiddleware } from "../middleware/rate-limit.js";
import { turnstileMiddleware } from "../middleware/turnstile.js";
import { sendEmail } from "../lib/email.js";

// JWT cookie name and settings
const JWT_COOKIE_NAME = "go2_jwt";
const JWT_EXPIRY_DAYS = 30;

const auth = new Hono<{ Bindings: Env; Variables: { auth: Auth } }>();

// -----------------------------------------------------------------------------
// Helper to create JWT cookie string
// -----------------------------------------------------------------------------

async function createJWTCookie(
  user: { id: string; email: string; name?: string },
  env: Env,
): Promise<string> {
  const secret =
    env.CSRF_SECRET || "development-secret-change-in-production-min-32-chars";
  const jwtToken = await createJWT(
    {
      sub: user.id,
      email: user.email,
      name: user.name || undefined,
      exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY_DAYS * 24 * 60 * 60,
    },
    secret,
  );

  const isProduction = env.APP_ENV === "production";
  const domain = isProduction ? ".go2.gg" : undefined;

  return [
    `${JWT_COOKIE_NAME}=${jwtToken}`,
    "Path=/",
    `Max-Age=${JWT_EXPIRY_DAYS * 24 * 60 * 60}`,
    isProduction ? "Secure" : "",
    "HttpOnly",
    "SameSite=Lax",
    domain ? `Domain=${domain}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

// -----------------------------------------------------------------------------
// Helper to create Better Auth instance
// -----------------------------------------------------------------------------

function createBetterAuth(env: Env): Auth {
  // API URL where Better Auth is mounted
  // Production: https://api.go2.gg (from API_URL env var)
  // Development: http://localhost:8787
  const apiBaseUrl = env.API_URL || "http://localhost:8787";
  const isProduction = env.APP_ENV === "production";

  // Build trusted origins list
  const trustedOrigins = [
    env.APP_URL, // https://go2.gg
    env.APP_URL.replace("://", "://www."), // https://www.go2.gg
    // Include localhost only in development
    ...(isProduction ? [] : ["http://localhost:3000", "http://localhost:8787"]),
  ].filter(Boolean);

  return createAuth({
    d1Binding: env.DB, // Pass the raw D1 binding - auth package wraps it for date serialization
    schema, // Pass the Drizzle schema for proper table mapping
    // Better Auth needs to know where it's hosted for OAuth callbacks
    baseUrl: `${apiBaseUrl}/api/v1/auth`,
    // Web app URL for redirects after auth (error pages, etc.)
    appUrl: env.APP_URL || "http://localhost:3000",
    secret:
      env.CSRF_SECRET || "development-secret-change-in-production-min-32-chars",
    trustedOrigins,
    oauth: {
      // Configure OAuth providers if credentials are set
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {}),
      // GitHub OAuth - disabled for now, enable later
      // ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      //   ? {
      //       github: {
      //         clientId: env.GITHUB_CLIENT_ID,
      //         clientSecret: env.GITHUB_CLIENT_SECRET,
      //       },
      //     }
      //   : {}),
    },
    // Email sending for auth flows (magic link, password reset, email verification)
    sendEmail: async (payload: EmailPayload) => {
      try {
        await sendEmail(env, {
          to: payload.to,
          template: payload.template as Parameters<
            typeof sendEmail
          >[1]["template"],
          data: payload.data,
          subject: payload.subject,
        });
      } catch (error) {
        console.error("[Auth] Failed to send email:", error);
        throw error;
      }
    },
  });
}

// -----------------------------------------------------------------------------
// Middleware to inject auth instance
// -----------------------------------------------------------------------------

auth.use("*", async (c, next) => {
  const betterAuth = createBetterAuth(c.env);
  c.set("auth", betterAuth);
  await next();
});

// -----------------------------------------------------------------------------
// Better Auth Handler (handles all standard auth routes)
// -----------------------------------------------------------------------------

/**
 * All Better Auth routes
 * This handles the standard auth endpoints automatically:
 * - /auth/sign-up/email
 * - /auth/sign-in/email
 * - /auth/sign-out
 * - /auth/session
 * - /auth/callback/:provider
 * - etc.
 */
auth.on(["GET", "POST"], "/*", async (c) => {
  const betterAuth = c.get("auth");
  const path = c.req.path;
  const method = c.req.method;
  const cookies = c.req.header("cookie") || "";

  // Debug logging for auth requests
  console.log(`[AUTH DEBUG] ${method} ${path} - Starting request`);
  console.log(`[AUTH DEBUG] Cookies: ${cookies.substring(0, 200)}`);

  // Special debug endpoint
  if (path.endsWith("/debug-session")) {
    const cookiePrefix = "go2.session_token=";
    const tokenStart = cookies.indexOf(cookiePrefix);
    let token = "";
    if (tokenStart >= 0) {
      const tokenValue = cookies.substring(tokenStart + cookiePrefix.length);
      const tokenEnd = tokenValue.indexOf(";");
      token = tokenEnd >= 0 ? tokenValue.substring(0, tokenEnd) : tokenValue;
    }
    return c.json({
      cookies: cookies.substring(0, 300),
      extractedToken: token,
      tokenLength: token.length,
      allCookieNames: cookies.split(";").map((c) => c.trim().split("=")[0]),
    });
  }

  try {
    // Let Better Auth handle the request
    const response = await betterAuth.handler(c.req.raw);

    // Debug logging for response
    console.log(
      `[AUTH DEBUG] ${method} ${path} - Response status: ${response.status}`,
    );

    // Handle sign-out: clear the JWT cookie along with Better Auth session
    if (path.endsWith("/sign-out") && response.ok) {
      const newHeaders = new Headers(response.headers);
      const isProduction = c.env.APP_ENV === "production";
      const domain = isProduction ? ".go2.gg" : undefined;

      // Clear the JWT cookie by setting it to expire immediately
      const clearJwtCookie = [
        `${JWT_COOKIE_NAME}=`,
        "Path=/",
        "Max-Age=0",
        "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        isProduction ? "Secure" : "",
        "HttpOnly",
        "SameSite=Lax",
        domain ? `Domain=${domain}` : "",
      ]
        .filter(Boolean)
        .join("; ");

      newHeaders.append("Set-Cookie", clearJwtCookie);
      console.log(`[AUTH DEBUG] Cleared JWT cookie on sign-out`);

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    }

    // Handle email/password sign-in and sign-up: set JWT cookie for successful auth
    if (
      (path.endsWith("/sign-in/email") || path.endsWith("/sign-up/email")) &&
      response.ok
    ) {
      try {
        // Clone response to read the body
        const clonedResponse = response.clone();
        const body = (await clonedResponse.json()) as {
          user?: { id: string; email: string; name?: string };
        };

        if (body.user) {
          const jwtCookie = await createJWTCookie(body.user, c.env);
          const authType = path.endsWith("/sign-up/email")
            ? "sign-up"
            : "sign-in";
          console.log(
            `[AUTH DEBUG] Created JWT for email ${authType} user: ${body.user.email}`,
          );

          // Create new response with JWT cookie added
          const newHeaders = new Headers(response.headers);
          newHeaders.append("Set-Cookie", jwtCookie);

          // Return new response with the same body but with JWT cookie
          return new Response(JSON.stringify(body), {
            status: response.status,
            headers: newHeaders,
          });
        }
      } catch (jwtError) {
        console.error(
          `[AUTH DEBUG] Failed to create JWT for email auth:`,
          jwtError,
        );
        // Continue with original response even if JWT creation fails
      }
    }

    // Log redirect location for OAuth callbacks
    if (response.status === 302) {
      const location = response.headers.get("location");
      console.log(`[AUTH DEBUG] ${method} ${path} - Redirect to: ${location}`);

      // If this is an OAuth callback redirecting to the app (not error), create JWT cookie
      if (
        path.includes("/callback/") &&
        location &&
        !location.includes("error=")
      ) {
        try {
          // Get the session from the response cookies
          // Note: In Cloudflare Workers, we need to use get() and split manually
          const setCookieHeader = response.headers.get("set-cookie") || "";
          const setCookieHeaders = setCookieHeader.split(/,(?=[^;]*=)/); // Split on comma followed by cookie name
          console.log(
            `[AUTH DEBUG] Set-Cookie headers: ${setCookieHeader.substring(0, 200)}`,
          );

          // Find session token from response cookies
          let sessionToken = "";
          for (const cookie of setCookieHeaders) {
            if (cookie.includes("session_token=")) {
              const match = cookie.match(/session_token=([^;]+)/);
              if (match) {
                sessionToken = decodeURIComponent(match[1]).split(".")[0]; // Get token before signature
                break;
              }
            }
          }

          if (sessionToken) {
            // Look up session in database
            const sessionResult = await c.env.DB.prepare(
              'SELECT s.*, u.email, u.name FROM "session" s JOIN "user" u ON s."userId" = u.id WHERE s.token = ? LIMIT 1',
            )
              .bind(sessionToken)
              .first<{
                userId: string;
                email: string;
                name: string | null;
                expiresAt: string;
              }>();

            if (sessionResult) {
              const jwtCookie = await createJWTCookie(
                {
                  id: sessionResult.userId,
                  email: sessionResult.email,
                  name: sessionResult.name || undefined,
                },
                c.env,
              );

              console.log(
                `[AUTH DEBUG] Created JWT for OAuth user: ${sessionResult.email}`,
              );

              // Create new response with JWT cookie added
              const newHeaders = new Headers(response.headers);
              newHeaders.append("Set-Cookie", jwtCookie);

              return new Response(response.body, {
                status: response.status,
                headers: newHeaders,
              });
            }
          }
        } catch (jwtError) {
          console.error(`[AUTH DEBUG] Failed to create JWT:`, jwtError);
          // Continue with original response even if JWT creation fails
        }
      }
    }

    // For error responses, try to log the body
    if (response.status >= 400) {
      const clonedResponse = response.clone();
      try {
        const body = await clonedResponse.text();
        console.error(`[AUTH DEBUG] ${method} ${path} - Error body: ${body}`);
      } catch {
        console.error(
          `[AUTH DEBUG] ${method} ${path} - Could not read error body`,
        );
      }
    }

    // Convert Better Auth response to Hono response
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error(`[AUTH DEBUG] ${method} ${path} - Exception:`, error);
    throw error;
  }
});

// -----------------------------------------------------------------------------
// Custom Routes (additional functionality)
// -----------------------------------------------------------------------------

/**
 * GET /auth/debug-session
 * Debug endpoint to test session lookup directly
 */
auth.get("/debug-session", async (c) => {
  const cookies = c.req.header("cookie") || "";
  const cookiePrefix = "go2.session_token=";
  const tokenStart = cookies.indexOf(cookiePrefix);

  let token = "";
  if (tokenStart >= 0) {
    const tokenValue = cookies.substring(tokenStart + cookiePrefix.length);
    const tokenEnd = tokenValue.indexOf(";");
    token = tokenEnd >= 0 ? tokenValue.substring(0, tokenEnd) : tokenValue;
  }

  return c.json({
    cookies: cookies.substring(0, 200),
    extractedToken: token,
    tokenLength: token.length,
  });
});

/**
 * GET /auth/me
 * Get current authenticated user with extended info
 * (wraps Better Auth session with our user data)
 */
auth.get("/me", async (c) => {
  const betterAuth = c.get("auth");

  try {
    // Get session from Better Auth
    const session = await betterAuth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          },
        },
        401,
      );
    }

    return c.json({
      success: true,
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          emailVerified: session.user.emailVerified,
          image: session.user.image,
        },
        session: {
          id: session.session.id,
          expiresAt: session.session.expiresAt,
        },
      },
    });
  } catch (error) {
    console.error("Error getting session:", error);
    return c.json(
      {
        success: false,
        error: {
          code: "SESSION_ERROR",
          message: "Failed to get session",
        },
      },
      500,
    );
  }
});

/**
 * POST /auth/verify-turnstile
 * Verify Turnstile token before auth operations
 * (Used as a pre-check for signup/signin forms)
 */
auth.post("/verify-turnstile", turnstileMiddleware(), async (c) => {
  return c.json({
    success: true,
    data: { verified: true },
  });
});

export { auth };
