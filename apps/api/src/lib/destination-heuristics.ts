/**
 * Local, network-free destination heuristics for spam-shaped destinations.
 *
 * Companion to brand-impersonation.ts, which targets malware/phishing-shaped
 * hostnames. This module targets the *spam* shapes the 2026-08-23 ring used,
 * which Google Safe Browsing correctly reports as clean because they are not
 * malware. Pure, never throws, returns null on unparseable input.
 *
 * Severity discipline — this is the whole design:
 *   "block"   refuses the create outright. Reserved for shapes with no
 *             plausible legitimate analogue.
 *   "suspect" is a LABEL. It never blocks and never disables. It exists so
 *             the behavioral detector and admin triage have something to join
 *             on. At ~90 users a false block is far more expensive than a
 *             missed label.
 *
 * Only ONE combination blocks: a base64-wrapped redirector served from a free
 * hosting suffix — which is exactly the observed
 * `ofppt.eu.cc/app/wrap/<base64>` shape. Every standalone signal is "suspect".
 */

export type HeuristicSeverity = "block" | "suspect";

export interface HeuristicHit {
  reason: string;
  severity: HeuristicSeverity;
}

/**
 * Verbs that indicate a redirector once a base64 payload is decoded. Matched
 * as whole words so "track" doesn't fire on "soundtrack".
 */
const REDIRECT_TOKENS =
  /\b(redirect|redirection|redir|wrap|track|tracking|click|clk|goto|jump|away|forward|out)\b/i;

const SCRIPT_EXTENSIONS = [".php", ".asp", ".aspx", ".cgi", ".jsp"];

/**
 * Free subdomain / free TLD providers. Abuse-heavy AND cheap to register, so a
 * redirector living here is a strong co-signal.
 *
 * Deliberately EXCLUDED: pages.dev, workers.dev, vercel.app, netlify.app,
 * glitch.me, repl.co, replit.dev, blogspot.com. They are also abused, but they
 * are this product's own users' default deploy targets — flagging them would
 * generate false positives on exactly the developer audience go2.gg sells to.
 */
const FREE_HOSTING_SUFFIXES = [
  "eu.cc",
  "us.cc",
  "co.cc",
  "eu.org",
  "tk",
  "ml",
  "ga",
  "cf",
  "gq",
  "rf.gd",
  "epizy.com",
  "byethost.com",
  "great-site.net",
  "free.nf",
  "infinityfreeapp.com",
  "42web.io",
  "kozow.com",
  "mywire.org",
  "dvrdns.org",
];

/** Query keys that mark an affiliate/CPA network link. utm_* is deliberately
 *  excluded — it is universal on legitimate marketing links. */
const AFFILIATE_PARAMS = new Set([
  "creative_id",
  "sub_id",
  "subid",
  "aff_id",
  "affid",
  "affiliate_id",
  "click_id",
  "clickid",
  "offer_id",
  "oid",
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "transaction_id",
]);

function decodeBase64Loose(value: string): string | null {
  if (value.length < 16 || !/^[A-Za-z0-9+/=_-]+$/.test(value)) return null;
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  try {
    const decoded = atob(padded);
    // Reject binary/random blobs — only a printable payload is meaningful.
    for (let i = 0; i < decoded.length; i++) {
      const code = decoded.charCodeAt(i);
      if (code > 0x7e) return null;
      if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) return null;
    }
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * A decoded payload looks like a redirector when it names a redirect verb AND
 * carries redirect machinery (query params, a scheme, or a script filename).
 *
 * The conjunction is what keeps this near-zero-FP: image proxies (imgproxy,
 * thumbor) and SPA routers also use base64 path segments, but they decode to
 * image URLs and JSON, not to `redirection/wrap.php?track=...`.
 */
function looksLikeRedirectorPayload(decoded: string): boolean {
  if (!REDIRECT_TOKENS.test(decoded)) return false;
  const hasQuery = decoded.includes("?") && decoded.includes("=");
  const hasScheme = decoded.includes("://");
  const hasScript = SCRIPT_EXTENSIONS.some((ext) => decoded.toLowerCase().includes(ext));
  return hasQuery || hasScheme || hasScript;
}

/** True when any path segment or long query value base64-decodes to a redirector. */
export function hasBase64Redirector(url: URL): boolean {
  const candidates: string[] = url.pathname.split("/").filter(Boolean);
  for (const value of url.searchParams.values()) candidates.push(value);

  for (const candidate of candidates) {
    const decoded = decodeBase64Loose(candidate);
    if (!decoded) continue;
    if (looksLikeRedirectorPayload(decoded)) return true;
    // One extra level: the ring's payload was itself a path+query that could
    // carry another wrapped blob.
    for (const inner of decoded.split(/[/?&=]/)) {
      const innerDecoded = decodeBase64Loose(inner);
      if (innerDecoded && looksLikeRedirectorPayload(innerDecoded)) return true;
    }
  }
  return false;
}

function freeHostingSuffix(host: string): string | null {
  const h = host.toLowerCase().replace(/^www\./, "");
  for (const suffix of FREE_HOSTING_SUFFIXES) {
    if (h === suffix || h.endsWith(`.${suffix}`)) return suffix;
  }
  return null;
}

/**
 * An opaque uppercase publisher/sub id, e.g. `26W1Z61T`, `3NKHWHB`.
 * Strictly uppercase on purpose — allowing lowercase matches far too many
 * legitimate slugs.
 */
function isAffiliateSubId(segment: string): boolean {
  return (
    segment.length >= 6 &&
    segment.length <= 10 &&
    /^[A-Z0-9]+$/.test(segment) &&
    /[A-Z]/.test(segment) &&
    /[0-9]/.test(segment)
  );
}

export function hasAffiliateShape(url: URL): boolean {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0 || !isAffiliateSubId(segments[0])) return false;
  const hasAffiliateParam = [...url.searchParams.keys()].some((k) =>
    AFFILIATE_PARAMS.has(k.toLowerCase())
  );
  return hasAffiliateParam || segments.length >= 2;
}

/**
 * Returns a hit when the destination has a known spam shape, else null.
 * Never throws — malformed input is simply not a hit.
 */
export function detectDestinationHeuristics(rawUrl: string): HeuristicHit | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const redirector = hasBase64Redirector(url);
  const freeHost = freeHostingSuffix(url.hostname);

  // The only blocking combination. A base64-wrapped redirector served from a
  // throwaway free host is the observed ofppt.eu.cc/app/wrap/<b64> shape and
  // has essentially no legitimate analogue.
  if (redirector && freeHost) {
    return {
      reason: `local:redirector_on_free_host:${freeHost}`,
      severity: "block",
    };
  }

  if (redirector) {
    return { reason: "local:base64_redirector", severity: "suspect" };
  }

  // Affiliate marketing is a large, legitimate, paying use case for a URL
  // shortener. This must NEVER block — blocking CPA-network URL shapes would
  // break precisely the customers most likely to pay. It is a label only.
  if (hasAffiliateShape(url)) {
    return { reason: "local:affiliate_network_shape", severity: "suspect" };
  }

  if (freeHost) {
    return { reason: `local:free_hosting:${freeHost}`, severity: "suspect" };
  }

  return null;
}
