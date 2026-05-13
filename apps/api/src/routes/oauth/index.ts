import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { authMiddleware } from "../../middleware/auth.js";
import {
  filterAllowedScopes,
  issueAccessToken,
  parseScopeString,
  randomId,
  randomTokenString,
  sha256Base64Url,
  sha256Hex,
  SUPPORTED_SCOPES,
  OAUTH_CONSTANTS,
} from "../../lib/oauth.js";

const oauth = new Hono<{ Bindings: Env }>();

const REGISTER_SCHEMA = z.object({
  redirect_uris: z.array(z.string().url()).min(1),
  client_name: z.string().min(1).max(120).optional(),
  scope: z.string().optional(),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  token_endpoint_auth_method: z.enum(["none", "client_secret_basic", "client_secret_post"]).optional(),
  software_id: z.string().optional(),
  software_version: z.string().optional(),
  contacts: z.array(z.string()).optional(),
  logo_uri: z.string().url().optional(),
  client_uri: z.string().url().optional(),
  policy_uri: z.string().url().optional(),
  tos_uri: z.string().url().optional(),
});

oauth.post("/register", zValidator("json", REGISTER_SCHEMA), async (c) => {
  const body = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  const clientId = `mcp_${randomTokenString(16)}`;
  const authMethod = body.token_endpoint_auth_method ?? "none";
  let clientSecret: string | undefined;
  let clientSecretHash: string | null = null;
  if (authMethod !== "none") {
    clientSecret = randomTokenString(32);
    clientSecretHash = await sha256Hex(clientSecret);
  }

  const requestedScopes = filterAllowedScopes(parseScopeString(body.scope));
  const scopes = requestedScopes.length > 0 ? requestedScopes : ["links:read", "links:write", "attribution:read"];

  const id = randomId();
  await db.insert(schema.oauthClients).values({
    id,
    clientId,
    clientSecretHash,
    name: body.client_name ?? "Unnamed MCP client",
    redirectUris: JSON.stringify(body.redirect_uris),
    grantTypes: JSON.stringify(body.grant_types ?? ["authorization_code", "refresh_token"]),
    responseTypes: JSON.stringify(body.response_types ?? ["code"]),
    scopes: JSON.stringify(scopes),
    tokenEndpointAuthMethod: authMethod,
    contacts: body.contacts ? JSON.stringify(body.contacts) : null,
    logoUri: body.logo_uri ?? null,
    clientUri: body.client_uri ?? null,
    policyUri: body.policy_uri ?? null,
    tosUri: body.tos_uri ?? null,
    softwareId: body.software_id ?? null,
    softwareVersion: body.software_version ?? null,
    isDynamic: true,
  });

  const response: Record<string, unknown> = {
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_name: body.client_name ?? "Unnamed MCP client",
    redirect_uris: body.redirect_uris,
    grant_types: body.grant_types ?? ["authorization_code", "refresh_token"],
    response_types: body.response_types ?? ["code"],
    token_endpoint_auth_method: authMethod,
    scope: scopes.join(" "),
  };
  if (clientSecret) response.client_secret = clientSecret;
  return c.json(response, 201);
});

oauth.get("/authorize", async (c) => {
  const params = new URL(c.req.url).searchParams;
  const responseType = params.get("response_type");
  const clientId = params.get("client_id");
  const redirectUri = params.get("redirect_uri");
  const codeChallenge = params.get("code_challenge");
  const codeChallengeMethod = params.get("code_challenge_method") ?? "S256";
  const state = params.get("state");
  const scope = params.get("scope") ?? "";
  const resource = params.get("resource") ?? undefined;

  if (responseType !== "code") return c.json({ error: "unsupported_response_type" }, 400);
  if (!clientId || !redirectUri || !codeChallenge) {
    return c.json({ error: "invalid_request", error_description: "missing required parameter" }, 400);
  }
  if (codeChallengeMethod !== "S256") {
    return c.json({ error: "invalid_request", error_description: "code_challenge_method must be S256" }, 400);
  }

  const db = drizzle(c.env.DB, { schema });
  const [client] = await db
    .select()
    .from(schema.oauthClients)
    .where(eq(schema.oauthClients.clientId, clientId))
    .limit(1);
  if (!client) return c.json({ error: "invalid_client" }, 401);

  let registered: string[] = [];
  try {
    registered = JSON.parse(client.redirectUris);
  } catch {
    registered = [];
  }
  if (!registered.includes(redirectUri)) {
    return c.json({ error: "invalid_redirect_uri" }, 400);
  }

  const requestedScopes = filterAllowedScopes(parseScopeString(scope));
  const consentUrl = new URL(`${c.env.APP_URL || "https://go2.gg"}/oauth/consent`);
  consentUrl.searchParams.set("client_id", clientId);
  consentUrl.searchParams.set("client_name", client.name);
  consentUrl.searchParams.set("redirect_uri", redirectUri);
  consentUrl.searchParams.set("code_challenge", codeChallenge);
  consentUrl.searchParams.set("code_challenge_method", codeChallengeMethod);
  if (state) consentUrl.searchParams.set("state", state);
  if (resource) consentUrl.searchParams.set("resource", resource);
  consentUrl.searchParams.set("scope", requestedScopes.join(" "));
  return c.redirect(consentUrl.toString(), 302);
});

const CONFIRM_SCHEMA = z.object({
  client_id: z.string(),
  redirect_uri: z.string().url(),
  code_challenge: z.string(),
  code_challenge_method: z.literal("S256"),
  scope: z.string().optional().default(""),
  state: z.string().optional(),
  resource: z.string().optional(),
  decision: z.enum(["allow", "deny"]),
});

oauth.post("/authorize/confirm", authMiddleware(), zValidator("json", CONFIRM_SCHEMA), async (c) => {
  const body = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  const sessionUser = c.get("user");
  if (!sessionUser) return c.json({ error: "unauthenticated" }, 401);

  const [client] = await db
    .select()
    .from(schema.oauthClients)
    .where(eq(schema.oauthClients.clientId, body.client_id))
    .limit(1);
  if (!client) return c.json({ error: "invalid_client" }, 401);

  if (body.decision === "deny") {
    const url = new URL(body.redirect_uri);
    url.searchParams.set("error", "access_denied");
    if (body.state) url.searchParams.set("state", body.state);
    return c.json({ redirect: url.toString() });
  }

  const scopes = filterAllowedScopes(parseScopeString(body.scope));
  const codePlain = randomTokenString(32);
  const codeHash = await sha256Hex(codePlain);
  const expiresAt = new Date(Date.now() + OAUTH_CONSTANTS.AUTHZ_CODE_TTL_SECONDS * 1000).toISOString();

  await db.insert(schema.oauthAuthorizationCodes).values({
    id: randomId(),
    codeHash,
    clientId: body.client_id,
    userId: sessionUser.id,
    organizationId: sessionUser.organizationId ?? null,
    redirectUri: body.redirect_uri,
    scopes: JSON.stringify(scopes),
    codeChallenge: body.code_challenge,
    codeChallengeMethod: body.code_challenge_method,
    resource: body.resource ?? null,
    expiresAt,
  });

  const url = new URL(body.redirect_uri);
  url.searchParams.set("code", codePlain);
  if (body.state) url.searchParams.set("state", body.state);
  return c.json({ redirect: url.toString() });
});

const TOKEN_SCHEMA = z.object({
  grant_type: z.enum(["authorization_code", "refresh_token"]),
  code: z.string().optional(),
  redirect_uri: z.string().url().optional(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  code_verifier: z.string().optional(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

oauth.post("/token", async (c) => {
  let payload: Record<string, string> = {};
  const ct = c.req.header("Content-Type") ?? "";
  if (ct.includes("application/x-www-form-urlencoded")) {
    const form = await c.req.formData();
    for (const [k, v] of form.entries()) {
      payload[k] = typeof v === "string" ? v : "";
    }
  } else {
    try {
      payload = (await c.req.json()) as Record<string, string>;
    } catch {
      return c.json({ error: "invalid_request" }, 400);
    }
  }

  const parsed = TOKEN_SCHEMA.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: "invalid_request", error_description: parsed.error.message }, 400);
  }
  const body = parsed.data;
  const db = drizzle(c.env.DB, { schema });

  let clientId = body.client_id;
  let clientSecret = body.client_secret;
  const auth = c.req.header("Authorization");
  if (auth?.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice("Basic ".length));
      const idx = decoded.indexOf(":");
      if (idx > 0) {
        clientId = decoded.slice(0, idx);
        clientSecret = decoded.slice(idx + 1);
      }
    } catch {
      return c.json({ error: "invalid_client" }, 401);
    }
  }
  if (!clientId) return c.json({ error: "invalid_client" }, 401);

  const [client] = await db
    .select()
    .from(schema.oauthClients)
    .where(eq(schema.oauthClients.clientId, clientId))
    .limit(1);
  if (!client) return c.json({ error: "invalid_client" }, 401);

  if (client.tokenEndpointAuthMethod !== "none") {
    if (!clientSecret) return c.json({ error: "invalid_client" }, 401);
    const provided = await sha256Hex(clientSecret);
    if (provided !== client.clientSecretHash) {
      return c.json({ error: "invalid_client" }, 401);
    }
  }

  if (body.grant_type === "authorization_code") {
    if (!body.code || !body.redirect_uri || !body.code_verifier) {
      return c.json({ error: "invalid_request" }, 400);
    }
    const codeHash = await sha256Hex(body.code);
    const [authzCode] = await db
      .select()
      .from(schema.oauthAuthorizationCodes)
      .where(eq(schema.oauthAuthorizationCodes.codeHash, codeHash))
      .limit(1);
    if (!authzCode) return c.json({ error: "invalid_grant" }, 400);
    if (authzCode.consumedAt) return c.json({ error: "invalid_grant", error_description: "code reused" }, 400);
    if (new Date(authzCode.expiresAt).getTime() < Date.now()) {
      return c.json({ error: "invalid_grant", error_description: "code expired" }, 400);
    }
    if (authzCode.clientId !== client.clientId) return c.json({ error: "invalid_grant" }, 400);
    if (authzCode.redirectUri !== body.redirect_uri) return c.json({ error: "invalid_grant" }, 400);

    const verifierHash = await sha256Base64Url(body.code_verifier);
    if (verifierHash !== authzCode.codeChallenge) {
      return c.json({ error: "invalid_grant", error_description: "PKCE verification failed" }, 400);
    }

    await db
      .update(schema.oauthAuthorizationCodes)
      .set({ consumedAt: new Date().toISOString() })
      .where(eq(schema.oauthAuthorizationCodes.id, authzCode.id));

    let scopes: string[] = [];
    try {
      scopes = JSON.parse(authzCode.scopes);
    } catch {
      scopes = [];
    }

    const issued = await issueAccessToken(c.env, {
      clientId: client.clientId,
      userId: authzCode.userId,
      organizationId: authzCode.organizationId,
      scopes,
    });
    return c.json({
      access_token: issued.accessToken,
      token_type: "Bearer",
      expires_in: issued.expiresIn,
      refresh_token: issued.refreshToken,
      scope: issued.scopes.join(" "),
    });
  }

  if (body.grant_type === "refresh_token") {
    if (!body.refresh_token) return c.json({ error: "invalid_request" }, 400);
    const refreshHash = await sha256Hex(body.refresh_token);
    const [refresh] = await db
      .select()
      .from(schema.oauthRefreshTokens)
      .where(eq(schema.oauthRefreshTokens.tokenHash, refreshHash))
      .limit(1);
    if (!refresh) return c.json({ error: "invalid_grant" }, 400);
    if (refresh.revokedAt) return c.json({ error: "invalid_grant" }, 400);
    if (new Date(refresh.expiresAt).getTime() < Date.now()) {
      return c.json({ error: "invalid_grant" }, 400);
    }
    if (refresh.clientId !== client.clientId) return c.json({ error: "invalid_grant" }, 400);

    let scopes: string[] = [];
    try {
      scopes = JSON.parse(refresh.scopes);
    } catch {
      scopes = [];
    }
    if (body.scope) {
      const requested = filterAllowedScopes(parseScopeString(body.scope));
      scopes = scopes.filter((s) => requested.includes(s));
    }

    await db
      .update(schema.oauthRefreshTokens)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(schema.oauthRefreshTokens.id, refresh.id));

    const issued = await issueAccessToken(c.env, {
      clientId: client.clientId,
      userId: refresh.userId,
      organizationId: refresh.organizationId,
      scopes,
    });
    return c.json({
      access_token: issued.accessToken,
      token_type: "Bearer",
      expires_in: issued.expiresIn,
      refresh_token: issued.refreshToken,
      scope: issued.scopes.join(" "),
    });
  }

  return c.json({ error: "unsupported_grant_type" }, 400);
});

oauth.post("/revoke", async (c) => {
  let body: { token?: string } = {};
  try {
    body = (await c.req.json()) as { token?: string };
  } catch {
    body = {};
  }
  if (!body.token) return c.json({ error: "invalid_request" }, 400);
  const tokenHash = await sha256Hex(body.token);
  const db = drizzle(c.env.DB, { schema });
  await db
    .update(schema.oauthAccessTokens)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(schema.oauthAccessTokens.tokenHash, tokenHash));
  await db
    .update(schema.oauthRefreshTokens)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(schema.oauthRefreshTokens.tokenHash, tokenHash));
  return c.json({ revoked: true });
});

oauth.get("/scopes", (c) => c.json({ supported: SUPPORTED_SCOPES }));

export { oauth };
