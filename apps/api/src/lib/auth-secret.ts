import type { Env } from "../bindings.js";

/**
 * The single trust root for Better Auth session signing, the go2_jwt HMAC,
 * and password-link unlock tokens. Fail closed: the old `||` fallback string
 * ships in the public AGPL mirror, so any production deploy missing the
 * secret would accept attacker-minted JWTs for any user id.
 */
export function getAuthSecret(env: Env): string {
  const secret = env.CSRF_SECRET;
  if (secret && secret.length >= 32) {
    return secret;
  }
  if (env.APP_ENV !== "production") {
    return "development-secret-change-in-production-min-32-chars";
  }
  throw new Error("CSRF_SECRET must be set to at least 32 characters in production");
}
