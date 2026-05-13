import { drizzle } from "drizzle-orm/d1";
import { and, eq, gt, isNull } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../bindings.js";

export const SUPPORTED_SCOPES = [
  "links:read",
  "links:write",
  "analytics:read",
  "attribution:read",
  "attribution:write",
  "webhooks:read",
  "webhooks:write",
] as const;
export type Scope = (typeof SUPPORTED_SCOPES)[number];

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const AUTHZ_CODE_TTL_SECONDS = 600;

export function isValidScope(scope: string): scope is Scope {
  return (SUPPORTED_SCOPES as readonly string[]).includes(scope);
}

export function parseScopeString(value: string | undefined | null): string[] {
  if (!value) return [];
  return value
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function filterAllowedScopes(requested: string[]): string[] {
  const out: string[] = [];
  for (const s of requested) if (isValidScope(s)) out.push(s);
  return out;
}

export async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function base64UrlEncode(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomTokenString(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export function randomId(): string {
  return crypto.randomUUID();
}

export interface IssuedAccessToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scopes: string[];
  tokenId: string;
}

export async function issueAccessToken(
  env: Env,
  params: {
    clientId: string;
    userId: string;
    organizationId?: string | null;
    scopes: string[];
  }
): Promise<IssuedAccessToken> {
  const db = drizzle(env.DB, { schema });
  const accessTokenPlain = randomTokenString(32);
  const refreshTokenPlain = randomTokenString(32);
  const accessHash = await sha256Hex(accessTokenPlain);
  const refreshHash = await sha256Hex(refreshTokenPlain);
  const tokenId = randomId();
  const refreshId = randomId();
  const now = Date.now();
  const expiresAt = new Date(now + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString();
  const refreshExpiresAt = new Date(now + ACCESS_TOKEN_TTL_SECONDS * 6 * 1000).toISOString();

  await db.insert(schema.oauthAccessTokens).values({
    id: tokenId,
    tokenHash: accessHash,
    clientId: params.clientId,
    userId: params.userId,
    organizationId: params.organizationId ?? null,
    scopes: JSON.stringify(params.scopes),
    expiresAt,
  });

  await db.insert(schema.oauthRefreshTokens).values({
    id: refreshId,
    tokenHash: refreshHash,
    accessTokenId: tokenId,
    clientId: params.clientId,
    userId: params.userId,
    organizationId: params.organizationId ?? null,
    scopes: JSON.stringify(params.scopes),
    expiresAt: refreshExpiresAt,
  });

  return {
    accessToken: accessTokenPlain,
    refreshToken: refreshTokenPlain,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    scopes: params.scopes,
    tokenId,
  };
}

export async function lookupAccessToken(
  env: Env,
  token: string
): Promise<{
  userId: string;
  organizationId: string | null;
  scopes: string[];
  clientId: string;
} | null> {
  const tokenHash = await sha256Hex(token);
  const db = drizzle(env.DB, { schema });
  const nowIso = new Date().toISOString();
  const [row] = await db
    .select()
    .from(schema.oauthAccessTokens)
    .where(
      and(
        eq(schema.oauthAccessTokens.tokenHash, tokenHash),
        gt(schema.oauthAccessTokens.expiresAt, nowIso),
        isNull(schema.oauthAccessTokens.revokedAt)
      )
    )
    .limit(1);
  if (!row) return null;

  let scopes: string[] = [];
  try {
    scopes = JSON.parse(row.scopes ?? "[]");
  } catch {
    scopes = [];
  }

  await db
    .update(schema.oauthAccessTokens)
    .set({ lastUsedAt: nowIso })
    .where(eq(schema.oauthAccessTokens.id, row.id));

  return {
    userId: row.userId,
    organizationId: row.organizationId ?? null,
    scopes,
    clientId: row.clientId,
  };
}

export const OAUTH_CONSTANTS = {
  ACCESS_TOKEN_TTL_SECONDS,
  AUTHZ_CODE_TTL_SECONDS,
} as const;
