/**
 * Signs the handoff from a gated + tracked go2.gg click to the dedicated pixel
 * tracking origin (PIXEL_ORIGIN). The tracking origin runs the link owner's
 * third-party/custom pixel JS, so it must serve ONLY for a request that proves
 * it came from a real click that already passed every link gate (disabled,
 * expired, click-limit, password) and was counted. The signature is that proof:
 * without it, hitting the tracking origin directly would bypass those gates and
 * the click limit. It binds the destination + domain + slug + a short expiry, so
 * it can't be mixed across links, forged, or replayed after it lapses.
 */

const HANDOFF_TTL_MS = 60 * 1000;

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

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

// `exp` first and length-delimited fields so no field's content can shift a
// boundary (dest can contain anything, including dots).
function payload(dest: string, domain: string, slug: string, exp: number): string {
  return `${exp}\n${domain}\n${slug}\n${dest}`;
}

export async function signPixelHandoff(
  dest: string,
  domain: string,
  slug: string,
  secret: string,
  now: number = Date.now()
): Promise<{ exp: number; sig: string }> {
  const exp = now + HANDOFF_TTL_MS;
  return { exp, sig: await hmacHex(secret, payload(dest, domain, slug, exp)) };
}

export type PixelHandoffStatus = "valid" | "expired" | "invalid";

/**
 * Three-way so the caller can distinguish an authentic-but-stale handoff from a
 * forged one: on "expired" the signature proved `domain` is genuinely ours, so a
 * custom-domain link can be bounced back to its OWN domain (not the default one,
 * which could 404 or hit another tenant's same-named slug). Only "invalid" means
 * nothing in the request can be trusted.
 */
export async function verifyPixelHandoff(
  dest: string,
  domain: string,
  slug: string,
  exp: number,
  sig: string,
  secret: string,
  now: number = Date.now()
): Promise<PixelHandoffStatus> {
  if (!Number.isFinite(exp)) return "invalid";
  const matches = constantTimeEqual(sig, await hmacHex(secret, payload(dest, domain, slug, exp)));
  if (!matches) return "invalid";
  return exp < now ? "expired" : "valid";
}
