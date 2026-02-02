/**
 * Better Auth Server Configuration
 *
 * This is the main auth configuration used by the API.
 * It handles all auth operations: signup, login, OAuth, sessions, etc.
 *
 * Uses drizzleAdapter with proper schema configuration for D1.
 * @see https://www.better-auth.com/docs/adapters/drizzle
 *
 * IMPORTANT: Cloudflare D1 (SQLite) does not support JavaScript Date objects.
 * We wrap the D1 database binding to intercept queries and convert Date objects
 * to ISO strings before they're sent to D1.
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, magicLink, emailOTP } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";

// Re-export types
export type { Session, User } from "better-auth";

/**
 * Simple JWT utilities for stateless auth verification
 * Uses HMAC-SHA256 for signing
 */
export interface JWTPayload {
  sub: string; // user id
  email: string;
  name?: string;
  exp: number; // expiration timestamp
  iat: number; // issued at
}

/**
 * Create a simple JWT token (for middleware verification)
 * Format: base64url(header).base64url(payload).base64url(signature)
 */
export async function createJWT(
  payload: Omit<JWTPayload, "iat">,
  secret: string,
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload = { ...payload, iat: Math.floor(Date.now() / 1000) };

  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const encodedPayload = btoa(JSON.stringify(fullPayload))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const data = `${encodedHeader}.${encodedPayload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const encodedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signature)),
  )
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${encodedSignature}`;
}

/**
 * Verify and decode a JWT token
 * Returns null if invalid or expired
 */
export async function verifyJWT(
  token: string,
  secret: string,
): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    // Verify signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    // Decode signature (base64url to bytes)
    const signatureStr = encodedSignature.replace(/-/g, "+").replace(/_/g, "/");
    const paddedSignature =
      signatureStr + "=".repeat((4 - (signatureStr.length % 4)) % 4);
    const signatureBytes = Uint8Array.from(atob(paddedSignature), (c) =>
      c.charCodeAt(0),
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(data),
    );
    if (!valid) return null;

    // Decode payload
    const payloadStr = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload =
      payloadStr + "=".repeat((4 - (payloadStr.length % 4)) % 4);
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
 * Recursively convert Date objects to ISO strings in an array of parameters.
 * D1 (SQLite) doesn't accept JavaScript Date objects - they must be stored as text.
 */
function serializeDatesInParams(params: unknown[]): unknown[] {
  return params.map((param) => {
    if (param instanceof Date) {
      return param.toISOString();
    }
    return param;
  });
}

/**
 * Wrap a D1 database binding to automatically serialize Date objects.
 * This intercepts the prepare().bind() chain and converts any Date values to ISO strings.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapD1ForDateSerialization(db: any): any {
  return new Proxy(db, {
    get(target, prop) {
      if (prop === "prepare") {
        return (sql: string) => {
          // Log the SQL query for debugging
          console.log("[D1 Debug] Preparing SQL:", sql.substring(0, 200));

          const statement = target.prepare(sql);
          return new Proxy(statement, {
            get(stmtTarget, stmtProp) {
              if (stmtProp === "bind") {
                return (...args: unknown[]) => {
                  const serializedArgs = serializeDatesInParams(args);
                  console.log(
                    "[D1 Debug] Binding params:",
                    JSON.stringify(serializedArgs).substring(0, 500),
                  );
                  return stmtTarget.bind(...serializedArgs);
                };
              }
              // Wrap run/all/first to catch errors
              if (
                stmtProp === "run" ||
                stmtProp === "all" ||
                stmtProp === "first"
              ) {
                return async (...args: unknown[]) => {
                  try {
                    const result = await stmtTarget[stmtProp](...args);
                    return result;
                  } catch (error) {
                    console.error("[D1 Debug] Query error:", error);
                    throw error;
                  }
                };
              }
              return stmtTarget[stmtProp];
            },
          });
        };
      }
      if (prop === "batch") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return async (statements: any[]) => {
          try {
            // Statements passed to batch are already prepared,
            // so we need to intercept at the prepare level
            const result = await target.batch(statements);
            return result;
          } catch (error) {
            console.error("[D1 Debug] Batch error:", error);
            throw error;
          }
        };
      }
      return target[prop];
    },
  });
}

export interface EmailPayload {
  to: string;
  template: string;
  subject?: string;
  data: Record<string, unknown>;
}

export interface AuthConfig {
  /** Raw D1 database binding from Cloudflare Workers env */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  d1Binding: any; // D1Database type from @cloudflare/workers-types
  /** Drizzle schema object */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any;
  /** Base URL for the auth API (e.g., https://api.go2.gg/api/v1/auth) */
  baseUrl: string;
  /** Base URL for the web app (e.g., https://go2.gg) - used for error redirects */
  appUrl: string;
  /** Secret for signing tokens (min 32 chars) */
  secret: string;
  /** OAuth provider credentials */
  oauth?: {
    google?: { clientId: string; clientSecret: string };
    github?: { clientId: string; clientSecret: string };
    discord?: { clientId: string; clientSecret: string };
    twitter?: { clientId: string; clientSecret: string };
  };
  /** Trusted origins for CORS */
  trustedOrigins?: string[];
  /** Email sending function - called for auth emails */
  sendEmail?: (payload: EmailPayload) => Promise<void>;
}

/**
 * Retry an async function with exponential backoff
 */
async function retryAsync<T>(
  fn: () => Promise<T>,
  options: { attempts?: number; baseDelayMs?: number; name?: string } = {},
): Promise<T> {
  const { attempts = 3, baseDelayMs = 100, name = "operation" } = options;
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        const delay = baseDelayMs * Math.pow(2, i);
        console.warn(
          `[Auth] Retry ${i + 1}/${attempts} for ${name} after ${delay}ms:`,
          error,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Generate a URL-safe slug from a string
 *
 * Industry standard approach (like Supabase, Vercel, Linear):
 * - Use human-readable prefix from email/name
 * - Add short random suffix for uniqueness
 * - Users can change the slug later to something cleaner like "acme-inc"
 */
function generateSlug(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/@.*$/, "") // Remove email domain
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, "") // Remove leading/trailing dashes
    .substring(0, 20); // Limit length (shorter for cleaner URLs)

  // Add short random suffix to ensure uniqueness (4 chars is enough for personal workspaces)
  const suffix = crypto.randomUUID().substring(0, 4);
  return `${base}-${suffix}`;
}

/**
 * Create a Better Auth instance for use in Cloudflare Workers
 *
 * Note: In Cloudflare Workers, we must create the auth instance inside the
 * request handler because the DB binding is only available at request time.
 */
export function createAuth(config: AuthConfig) {
  const socialProviders: Record<
    string,
    { clientId: string; clientSecret: string }
  > = {};

  if (config.oauth?.google) {
    socialProviders.google = config.oauth.google;
  }
  if (config.oauth?.github) {
    socialProviders.github = config.oauth.github;
  }
  if (config.oauth?.discord) {
    socialProviders.discord = config.oauth.discord;
  }
  if (config.oauth?.twitter) {
    socialProviders.twitter = config.oauth.twitter;
  }

  // Wrap the D1 database binding to serialize Date objects to ISO strings
  // D1 (SQLite) doesn't accept JavaScript Date objects directly
  const wrappedD1 = wrapD1ForDateSerialization(config.d1Binding);

  // Create Drizzle instance with the wrapped D1 binding
  const db = drizzle(wrappedD1, { schema: config.schema });

  // Use drizzleAdapter with schema for proper D1 integration
  // Pass schema with Better Auth's expected property names mapped to our tables
  return betterAuth({
    // Database adapter with D1-compatible date handling
    database: drizzleAdapter(db, {
      provider: "sqlite", // D1 is SQLite-based
      schema: {
        // Map ONLY Better Auth's expected model names to our Drizzle schema tables
        // Don't spread config.schema to avoid conflicts with plural table names
        user: config.schema.users,
        session: config.schema.sessions,
        account: config.schema.accounts,
        verification: config.schema.verificationTokens,
      },
    }),

    // Base configuration
    baseURL: config.baseUrl,
    secret: config.secret,
    trustedOrigins: config.trustedOrigins || [config.baseUrl],

    // Account configuration for OAuth account linking
    account: {
      accountLinking: {
        enabled: true,
        // Trust these providers to link accounts automatically by email
        trustedProviders: ["google", "github", "email-password"],
        // Don't allow linking accounts with different emails
        allowDifferentEmails: false,
      },
    },

    // Email + Password authentication
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // We verify via email link on first action
      minPasswordLength: 8,
      // Send password reset email
      sendResetPassword: config.sendEmail
        ? async ({ user, url }) => {
            // Fire and forget - don't block on email sending
            config.sendEmail!({
              to: user.email,
              template: "password-reset",
              subject: "Reset your Go2 password",
              data: {
                resetLink: url,
                expiresIn: "1 hour",
              },
            }).catch((err) => {
              console.error("[Auth] Failed to send password reset email:", err);
            });
          }
        : undefined,
    },

    // Email verification configuration
    // Note: We set sendOnSignUp to false to avoid blocking signup on email errors
    // Users can verify later via the verify email flow
    emailVerification: config.sendEmail
      ? {
          sendOnSignUp: false, // Don't block signup on email verification
          sendVerificationEmail: async ({ user, url }) => {
            // Fire and forget - don't block on email sending
            // This prevents timing attacks and signup failures from email errors
            config.sendEmail!({
              to: user.email,
              template: "email-verification",
              subject: "Verify your email address",
              data: {
                verificationLink: url,
                expiresIn: "24 hours",
              },
            }).catch((err) => {
              console.error("[Auth] Failed to send verification email:", err);
            });
          },
        }
      : undefined,

    // Social OAuth providers
    socialProviders:
      Object.keys(socialProviders).length > 0 ? socialProviders : undefined,

    // Session configuration
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24 * 7, // 7 days
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes cache
      },
    },

    // Advanced options
    advanced: {
      useSecureCookies: config.baseUrl.startsWith("https://"),
      cookiePrefix: "go2",
      generateId: () => crypto.randomUUID(),
      // Enable cross-subdomain cookies for api.go2.gg <-> go2.gg
      crossSubDomainCookies: {
        enabled: true,
        // Extract the root domain from appUrl (e.g., "go2.gg" from "https://go2.gg")
        domain: config.appUrl.includes("localhost")
          ? undefined // Don't set domain for localhost
          : `.${new URL(config.appUrl).hostname.split(".").slice(-2).join(".")}`, // ".go2.gg"
      },
    },

    // Rate limiting
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
    },

    // Plugins - Enable Bearer token, Magic Link, and Email OTP authentication
    plugins: [
      bearer({
        requireSignature: false,
      }),
      // Magic Link (passwordless sign-in)
      ...(config.sendEmail
        ? [
            magicLink({
              sendMagicLink: async ({ email, url }) => {
                // Fire and forget
                config.sendEmail!({
                  to: email,
                  template: "magic-link",
                  subject: "Your sign-in link for Go2",
                  data: {
                    magicLink: url,
                    expiresIn: "10 minutes",
                  },
                }).catch((err) => {
                  console.error("[Auth] Failed to send magic link:", err);
                });
              },
              expiresIn: 600, // 10 minutes
            }),
            // Email OTP (for verification and password reset via OTP)
            emailOTP({
              sendVerificationOTP: async ({ email, otp, type }) => {
                const subjects: Record<string, string> = {
                  "sign-in": "Your Go2 sign-in code",
                  "email-verification": "Verify your Go2 email",
                  "forget-password": "Reset your Go2 password",
                };
                // Fire and forget
                config.sendEmail!({
                  to: email,
                  template: "email-otp",
                  subject: subjects[type] || "Your Go2 verification code",
                  data: {
                    otp,
                    type,
                    expiresIn: "10 minutes",
                  },
                }).catch((err) => {
                  console.error("[Auth] Failed to send OTP:", err);
                });
              },
              otpLength: 6,
              expiresIn: 600, // 10 minutes
            }),
          ]
        : []),
    ],

    // Error handling - log errors and redirect to web app
    // Note: Don't include query params in errorURL - Better Auth appends its own
    onAPIError: {
      errorURL: `${config.appUrl}/login`,
      onError: (error: unknown) => {
        if (error instanceof Error) {
          console.error("[Better Auth Error]", {
            message: error.message,
            cause: error.cause,
            stack: error.stack,
          });
        } else {
          console.error("[Better Auth Error]", error);
        }
      },
    },

    // Database hooks for user lifecycle events
    databaseHooks: {
      session: {
        create: {
          after: async (session) => {
            // Log session creation for debugging
            console.log("[Auth] Session created:", {
              sessionId: session.id,
              userId: session.userId,
              expiresAt: session.expiresAt,
            });
          },
        },
      },
      user: {
        create: {
          after: async (user) => {
            try {
              console.log(
                "[Auth] Creating personal workspace for new user:",
                user.id,
              );

              // Generate organization details
              const orgId = crypto.randomUUID();
              const userName = user.name || user.email?.split("@")[0] || "User";
              const orgName = `${userName}'s Workspace`;
              const orgSlug = generateSlug(user.email || user.id);
              const now = new Date().toISOString();

              // Calculate trial end date (14 days from now)
              const trialEnd = new Date();
              trialEnd.setDate(trialEnd.getDate() + 14);
              const trialEndStr = trialEnd.toISOString();

              // Create personal organization with retry
              await retryAsync(
                () =>
                  config.d1Binding
                    .prepare(
                      `
                      INSERT INTO organizations (id, name, slug, created_at, updated_at)
                      VALUES (?, ?, ?, ?, ?)
                    `,
                    )
                    .bind(orgId, orgName, orgSlug, now, now)
                    .run(),
                { name: "create-organization" },
              );

              // Add user as owner with retry
              const memberId = crypto.randomUUID();
              await retryAsync(
                () =>
                  config.d1Binding
                    .prepare(
                      `
                      INSERT INTO organization_members (id, organization_id, user_id, role, created_at, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?)
                    `,
                    )
                    .bind(memberId, orgId, user.id, "owner", now, now)
                    .run(),
                { name: "create-membership" },
              );

              // Create 14-day Pro trial subscription with retry
              // Note: We use a placeholder Stripe subscription ID since this is a trial
              const subscriptionId = crypto.randomUUID();
              const trialStripeId = `trial_${crypto.randomUUID()}`;
              await retryAsync(
                () =>
                  config.d1Binding
                    .prepare(
                      `
                      INSERT INTO subscriptions (id, organization_id, stripe_subscription_id, stripe_price_id, plan, status, current_period_start, current_period_end, created_at, updated_at)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    )
                    .bind(
                      subscriptionId,
                      orgId,
                      trialStripeId,
                      "trial_pro", // Placeholder price ID for trial
                      "pro",
                      "trialing",
                      now,
                      trialEndStr,
                      now,
                      now,
                    )
                    .run(),
                { name: "create-subscription" },
              );

              console.log("[Auth] Personal workspace created successfully:", {
                userId: user.id,
                orgId,
                orgSlug,
                trialEnd: trialEndStr,
              });

              // Enroll user in onboarding drip campaign
              try {
                const dripStateId = crypto.randomUUID();
                const campaignId = "onboarding";

                // Check if campaign exists
                const campaign = await config.d1Binding
                  .prepare(
                    `SELECT id FROM drip_campaigns WHERE id = ? AND is_active = 1`,
                  )
                  .bind(campaignId)
                  .first();

                if (campaign) {
                  // Get first email in the campaign
                  const firstEmail = (await config.d1Binding
                    .prepare(
                      `
                      SELECT id, delay_minutes FROM drip_emails 
                      WHERE campaign_id = ? AND is_active = 1 
                      ORDER BY sequence ASC LIMIT 1
                    `,
                    )
                    .bind(campaignId)
                    .first()) as { id: string; delay_minutes: number } | null;

                  if (firstEmail) {
                    // Calculate when to send the first email
                    const nextEmailAt = new Date(
                      Date.now() + firstEmail.delay_minutes * 60 * 1000,
                    );

                    await config.d1Binding
                      .prepare(
                        `
                        INSERT INTO user_drip_state (id, user_id, campaign_id, status, current_email_id, next_email_at, emails_sent, started_at, created_at, updated_at)
                        VALUES (?, ?, ?, 'active', ?, ?, 0, ?, ?, ?)
                      `,
                      )
                      .bind(
                        dripStateId,
                        user.id,
                        campaignId,
                        firstEmail.id,
                        nextEmailAt.toISOString(),
                        now,
                        now,
                        now,
                      )
                      .run();

                    console.log(
                      "[Auth] User enrolled in onboarding campaign:",
                      user.id,
                    );
                  }
                }
              } catch (dripError) {
                // Don't fail user creation if drip enrollment fails
                console.error(
                  "[Auth] Failed to enroll user in drip campaign:",
                  dripError,
                );
              }
            } catch (error) {
              // Log error with full details for debugging
              // Note: User creation still succeeds - the fallback in stats endpoint will fix this
              console.error(
                "[Auth] Failed to create personal workspace after retries:",
                {
                  userId: user.id,
                  userEmail: user.email,
                  error: error instanceof Error ? error.message : error,
                  stack: error instanceof Error ? error.stack : undefined,
                },
              );
            }
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
