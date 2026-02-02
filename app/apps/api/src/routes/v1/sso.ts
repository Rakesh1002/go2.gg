/**
 * SSO/SAML API Routes (v1)
 *
 * Enterprise SSO functionality:
 * - GET /sso/config - Get SSO configuration
 * - PUT /sso/config - Update SSO configuration
 * - GET /sso/metadata - Get SP SAML metadata
 * - POST /sso/init - Initiate SSO login
 * - POST /sso/callback - Handle SAML callback
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../../bindings.js";
import { ok, forbidden, error, notFound } from "../../lib/response.js";
import {
  getSSOConfig,
  upsertSSOConfig,
  generateSAMLRequest,
  parseSAMLResponse,
  generateSPMetadata,
  requiresSSO,
  provisionSSOUser,
  createSSOSession,
} from "../../lib/sso.js";
import { createD1Repositories } from "@repo/db/d1";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@repo/db";

const sso = new Hono<{ Bindings: Env }>();

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const ssoConfigSchema = z.object({
  provider: z.enum(["saml", "oidc"]),
  enabled: z.boolean().optional(),
  // SAML settings
  ssoUrl: z.string().url().optional(),
  sloUrl: z.string().url().optional(),
  certificate: z.string().optional(),
  // OIDC settings
  oidcIssuer: z.string().url().optional(),
  oidcClientId: z.string().optional(),
  oidcClientSecret: z.string().optional(),
  // Domain settings
  emailDomain: z.string().optional(),
  enforceSSO: z.boolean().optional(),
  // Provisioning
  autoProvision: z.boolean().optional(),
  defaultRole: z.enum(["member", "admin"]).optional(),
});

const ssoInitSchema = z.object({
  email: z.string().email().optional(),
  returnUrl: z.string().optional(),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * GET /sso/config
 * Get SSO configuration for the organization
 */
sso.get("/config", async (c) => {
  const user = c.get("user");
  const repos = createD1Repositories(c.env);

  if (!user?.organizationId) {
    return forbidden(c, "Organization required");
  }

  // Check if user is admin/owner
  const membership = await repos.organizations.getMember(user.organizationId, user.id);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return forbidden(c, "Admin access required");
  }

  const db = drizzle(c.env.DB, { schema });
  const config = await getSSOConfig(db, user.organizationId);

  if (!config) {
    return ok(c, { config: null });
  }

  // Don't expose secrets
  return ok(c, {
    config: {
      id: config.id,
      provider: config.provider,
      enabled: config.enabled,
      ssoUrl: config.ssoUrl,
      sloUrl: config.sloUrl,
      emailDomain: config.emailDomain,
      enforceSSO: config.enforceSSO,
      autoProvision: config.autoProvision,
      defaultRole: config.defaultRole,
      // Don't expose: certificate, oidcClientSecret
      hasCertificate: !!config.certificate,
      hasOidcCredentials: !!config.oidcClientId,
      lastSyncedAt: config.lastSyncedAt,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    },
  });
});

/**
 * PUT /sso/config
 * Update SSO configuration
 */
sso.put("/config", zValidator("json", ssoConfigSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const repos = createD1Repositories(c.env);

  if (!user?.organizationId) {
    return forbidden(c, "Organization required");
  }

  // Check enterprise plan
  const org = await repos.organizations.findById(user.organizationId);
  if (!org) {
    return notFound(c, "Organization not found");
  }

  // Check if user is admin/owner
  const membership = await repos.organizations.getMember(user.organizationId, user.id);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return forbidden(c, "Admin access required");
  }

  // Validate domain ownership if setting email domain
  if (input.emailDomain) {
    // In production, verify domain ownership via DNS TXT record
    // For now, just validate format
    if (!/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(input.emailDomain)) {
      return error(c, "Invalid email domain format", 400);
    }
  }

  const db = drizzle(c.env.DB, { schema });
  const entityId = `https://go2.gg/sso/${user.organizationId}`;

  const config = await upsertSSOConfig(db, user.organizationId, {
    ...input,
    entityId,
  });

  return ok(c, { config });
});

/**
 * GET /sso/metadata
 * Get SAML Service Provider metadata
 */
sso.get("/metadata", async (c) => {
  const user = c.get("user");

  if (!user?.organizationId) {
    return forbidden(c, "Organization required");
  }

  const entityId = `https://go2.gg/sso/${user.organizationId}`;
  const acsUrl = `${c.env.APP_URL}/api/v1/sso/callback`;
  const sloUrl = `${c.env.APP_URL}/api/v1/sso/logout`;

  const metadata = generateSPMetadata(entityId, acsUrl, sloUrl);

  c.header("Content-Type", "application/xml");
  return c.text(metadata);
});

/**
 * POST /sso/init
 * Initiate SSO login
 */
sso.post("/init", zValidator("json", ssoInitSchema), async (c) => {
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // If email provided, check if SSO is required
  if (input.email) {
    const ssoCheck = await requiresSSO(db, input.email);

    if (ssoCheck.required && ssoCheck.config) {
      const requestId = crypto.randomUUID().replace(/-/g, "");
      const callbackUrl = `${c.env.APP_URL}/api/v1/sso/callback`;

      if (
        ssoCheck.config.provider === "saml" &&
        ssoCheck.config.ssoUrl &&
        ssoCheck.config.certificate
      ) {
        const samlRequest = generateSAMLRequest(
          {
            entityId:
              ssoCheck.config.entityId || `https://go2.gg/sso/${ssoCheck.config.organizationId}`,
            ssoUrl: ssoCheck.config.ssoUrl,
            certificate: ssoCheck.config.certificate,
          },
          callbackUrl,
          requestId
        );

        // Build redirect URL
        const ssoUrl = new URL(ssoCheck.config.ssoUrl);
        ssoUrl.searchParams.set("SAMLRequest", samlRequest);
        if (input.returnUrl) {
          ssoUrl.searchParams.set("RelayState", input.returnUrl);
        }

        return ok(c, {
          ssoRequired: true,
          redirectUrl: ssoUrl.toString(),
        });
      }

      // OIDC flow
      if (
        ssoCheck.config.provider === "oidc" &&
        ssoCheck.config.oidcIssuer &&
        ssoCheck.config.oidcClientId
      ) {
        const authUrl = new URL(`${ssoCheck.config.oidcIssuer}/authorize`);
        authUrl.searchParams.set("client_id", ssoCheck.config.oidcClientId);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", "openid email profile");
        authUrl.searchParams.set("redirect_uri", callbackUrl);
        authUrl.searchParams.set("state", requestId);

        return ok(c, {
          ssoRequired: true,
          redirectUrl: authUrl.toString(),
        });
      }
    }
  }

  return ok(c, { ssoRequired: false });
});

/**
 * POST /sso/callback
 * Handle SAML callback
 */
sso.post("/callback", async (c) => {
  const formData = await c.req.formData();
  const samlResponse = formData.get("SAMLResponse") as string;
  const relayState = formData.get("RelayState") as string;

  if (!samlResponse) {
    return error(c, "Missing SAML response", 400);
  }

  const db = drizzle(c.env.DB, { schema });

  // Parse and validate SAML response
  // In production, we'd need to determine the correct config from the response
  // For now, we'll extract the issuer and look it up
  const result = parseSAMLResponse(samlResponse, "");

  if (!result.valid || !result.user?.email) {
    console.error("SAML validation failed:", result.error);
    return error(c, result.error || "Invalid SAML response", 400);
  }

  // Find SSO config by email domain
  const domain = result.user.email.split("@")[1];
  if (!domain) {
    return error(c, "Invalid email in SAML response", 400);
  }

  const { eq, and } = await import("drizzle-orm");
  const configs = await db
    .select()
    .from(schema.ssoConfigs)
    .where(and(eq(schema.ssoConfigs.emailDomain, domain), eq(schema.ssoConfigs.enabled, true)))
    .limit(1);

  const ssoConfig = configs[0];
  if (!ssoConfig) {
    return error(c, "No SSO configuration found for this domain", 400);
  }

  try {
    // Provision or update user
    const { userId, isNew } = await provisionSSOUser(db, ssoConfig, result.user);

    // Create SSO session
    await createSSOSession(db, userId, ssoConfig.id, result.sessionIndex, result.nameId);

    // In production, create an auth token here and redirect
    // For now, redirect with success indicator
    const redirectUrl = relayState || `${c.env.APP_URL}/dashboard`;
    const url = new URL(redirectUrl);
    url.searchParams.set("sso", "success");
    url.searchParams.set("user", isNew ? "new" : "existing");

    return c.redirect(url.toString());
  } catch (err) {
    console.error("SSO provisioning failed:", err);
    return error(c, (err as Error).message, 400);
  }
});

/**
 * GET /sso/check
 * Check if SSO is required for an email domain
 */
sso.get("/check", async (c) => {
  const email = c.req.query("email");

  if (!email) {
    return error(c, "Email required", 400);
  }

  const db = drizzle(c.env.DB, { schema });
  const ssoCheck = await requiresSSO(db, email);

  return ok(c, {
    ssoRequired: ssoCheck.required,
    provider: ssoCheck.config?.provider,
  });
});

export { sso };
