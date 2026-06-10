/**
 * Salted password hashing for user-chosen secrets (link passwords).
 *
 * High-entropy machine tokens (API keys, PKCE, OAuth) intentionally stay on
 * plain SHA-256 elsewhere — salting only matters for low-entropy human input.
 */

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    KEY_BITS
  );
  return toHex(new Uint8Array(bits));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt)}$${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("pbkdf2$")) {
    const [, iterStr, saltHex, hash] = stored.split("$");
    const computed = await derive(password, fromHex(saltHex), Number(iterStr));
    return constantTimeEqual(computed, hash);
  }
  // Legacy unsalted SHA-256 hex hashes created before salting was introduced.
  const data = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return constantTimeEqual(toHex(new Uint8Array(buf)), stored);
}

const UNLOCK_TTL_MS = 60 * 60 * 1000;

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(new Uint8Array(sig));
}

/**
 * Short-lived cookie token proving a correct password was entered for one link.
 * Bound to the link id and an expiry so it can't be replayed across links or
 * after it lapses. Signed with the worker's CSRF_SECRET.
 */
export async function signUnlockToken(
  linkId: string,
  secret: string,
  now: number = Date.now()
): Promise<string> {
  const exp = now + UNLOCK_TTL_MS;
  const sig = await hmacHex(secret, `${linkId}.${exp}`);
  return `${exp}.${sig}`;
}

export async function verifyUnlockToken(
  token: string,
  linkId: string,
  secret: string,
  now: number = Date.now()
): Promise<boolean> {
  const [expStr, sig] = token.split(".");
  if (!expStr || !sig) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < now) return false;
  return constantTimeEqual(sig, await hmacHex(secret, `${linkId}.${exp}`));
}
