/**
 * User suspension.
 *
 * Banning is enforced in three places:
 *   1. authMiddleware / apiKeyAuthMiddleware reject banned users with 403
 *      ACCOUNT_SUSPENDED (sessions are also deleted here, so dashboards die
 *      immediately, not at cookie expiry).
 *   2. Every active link the user owns is disabled in D1 AND its KV entry is
 *      rewritten with isDisabled — the redirect hot path trusts KV, so this
 *      is what actually stops live traffic.
 *   3. API keys are expired and OAuth tokens revoked, so programmatic access
 *      (SDK, MCP, agents) stops with the account.
 *
 * Unban reverses the metadata flag and re-enables only the links this module
 * disabled (matched on SUSPENSION_DISABLED_REASON) — links disabled by Safe
 * Browsing or admins for other reasons stay disabled.
 */
import * as schema from "@repo/db";
import { and, eq, isNull, or } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { Env } from "../bindings.js";
import { cachedLinkKey, serializeCachedLink } from "./cached-link.js";

export const SUSPENSION_DISABLED_REASON = "Account suspended for abuse";

type Db = DrizzleD1Database<typeof schema>;

export async function isUserBanned(db: Db, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ isBanned: schema.userMetadata.isBanned })
    .from(schema.userMetadata)
    .where(eq(schema.userMetadata.userId, userId))
    .limit(1);
  return row?.isBanned === true;
}

export async function banUser(
  env: Env,
  db: Db,
  userId: string,
  reason?: string
): Promise<{ linksDisabled: number; apiKeysExpired: number; sessionsRevoked: number }> {
  const now = new Date().toISOString();

  await db
    .insert(schema.userMetadata)
    .values({
      userId,
      isBanned: true,
      bannedAt: now,
      bannedReason: reason ?? SUSPENSION_DISABLED_REASON,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.userMetadata.userId,
      set: {
        isBanned: true,
        bannedAt: now,
        bannedReason: reason ?? SUSPENSION_DISABLED_REASON,
        updatedAt: now,
      },
    });

  // Disable every active link, then rewrite KV — the resolver trusts KV, so
  // the D1 update alone would leave the links serving until cache eviction.
  const activeLinks = await db
    .select()
    .from(schema.links)
    .where(
      and(
        eq(schema.links.userId, userId),
        eq(schema.links.isArchived, false),
        or(eq(schema.links.isDisabled, false), isNull(schema.links.isDisabled))
      )
    );

  if (activeLinks.length > 0) {
    await db
      .update(schema.links)
      .set({
        isDisabled: true,
        disabledAt: now,
        disabledReason: SUSPENSION_DISABLED_REASON,
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.links.userId, userId),
          eq(schema.links.isArchived, false),
          or(eq(schema.links.isDisabled, false), isNull(schema.links.isDisabled))
        )
      );

    for (const link of activeLinks) {
      const cached = serializeCachedLink({
        ...link,
        isDisabled: true,
        disabledReason: SUSPENSION_DISABLED_REASON,
      });
      await env.LINKS_KV.put(cachedLinkKey(cached), JSON.stringify(cached));
    }
  }

  // Expire API keys minted by this user (paper trail beats deletion).
  const keys = await db
    .select({ id: schema.apiKeys.id })
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.createdByUserId, userId));
  if (keys.length > 0) {
    await db
      .update(schema.apiKeys)
      .set({ expiresAt: now })
      .where(eq(schema.apiKeys.createdByUserId, userId));
  }

  // Revoke OAuth tokens.
  await db
    .update(schema.oauthAccessTokens)
    .set({ revokedAt: now })
    .where(
      and(eq(schema.oauthAccessTokens.userId, userId), isNull(schema.oauthAccessTokens.revokedAt))
    );
  await db
    .update(schema.oauthRefreshTokens)
    .set({ revokedAt: now })
    .where(
      and(eq(schema.oauthRefreshTokens.userId, userId), isNull(schema.oauthRefreshTokens.revokedAt))
    );

  // Kill live sessions so open dashboards stop working now.
  const sessions = await db
    .select({ id: schema.sessions.id })
    .from(schema.sessions)
    .where(eq(schema.sessions.userId, userId));
  if (sessions.length > 0) {
    await db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
  }

  return {
    linksDisabled: activeLinks.length,
    apiKeysExpired: keys.length,
    sessionsRevoked: sessions.length,
  };
}

export async function unbanUser(
  env: Env,
  db: Db,
  userId: string
): Promise<{ linksReenabled: number }> {
  const now = new Date().toISOString();

  await db
    .insert(schema.userMetadata)
    .values({ userId, isBanned: false, bannedAt: null, bannedReason: null, updatedAt: now })
    .onConflictDoUpdate({
      target: schema.userMetadata.userId,
      set: { isBanned: false, bannedAt: null, bannedReason: null, updatedAt: now },
    });

  // Only undo what banUser did — other disable reasons stay in force.
  const suspendedLinks = await db
    .select()
    .from(schema.links)
    .where(
      and(
        eq(schema.links.userId, userId),
        eq(schema.links.isDisabled, true),
        eq(schema.links.disabledReason, SUSPENSION_DISABLED_REASON)
      )
    );

  if (suspendedLinks.length > 0) {
    await db
      .update(schema.links)
      .set({ isDisabled: false, disabledAt: null, disabledReason: null, updatedAt: now })
      .where(
        and(
          eq(schema.links.userId, userId),
          eq(schema.links.isDisabled, true),
          eq(schema.links.disabledReason, SUSPENSION_DISABLED_REASON)
        )
      );

    for (const link of suspendedLinks) {
      const cached = serializeCachedLink({
        ...link,
        isDisabled: false,
        disabledReason: null,
      });
      await env.LINKS_KV.put(cachedLinkKey(cached), JSON.stringify(cached));
    }
  }

  return { linksReenabled: suspendedLinks.length };
}
