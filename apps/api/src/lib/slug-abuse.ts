/**
 * Slug abuse detection
 *
 * Blocks custom slugs that fuzzy-match well-known brand names. A slug like
 * "Quuicckbook" or "PaypaI-login" is a phishing tell on its own — even if
 * the destination URL doesn't yet trip Google Safe Browsing, Google's
 * crawler will still index our short URL and flag the entire shortener.
 *
 * Two-layer check:
 *   1. Levenshtein distance against a brand list. distance <= 2 is a
 *      reject for slugs <= 12 chars, distance <= 3 for longer slugs.
 *   2. Trigger keywords that are almost-always phishing context:
 *      'login', 'verify', 'signin', 'wallet', 'reset', 'confirm'.
 *
 * Both layers can be overridden when the destination's eTLD+1 is the
 * brand's verified domain — e.g. /quickbooks → quickbooks.intuit.com is
 * fine, /quuicckbook → some-other-domain.tld is not.
 */

const BRAND_DOMAINS: Record<string, string[]> = {
  quickbooks: ["intuit.com", "quickbooks.com", "quickbooks.intuit.com"],
  intuit: ["intuit.com"],
  paypal: ["paypal.com", "paypal-prepaid.com"],
  microsoft: ["microsoft.com", "office.com", "live.com", "outlook.com", "azure.com"],
  apple: ["apple.com", "icloud.com", "me.com"],
  google: ["google.com", "youtube.com", "gmail.com", "youtu.be"],
  meta: ["meta.com", "facebook.com", "fb.com", "instagram.com", "whatsapp.com"],
  facebook: ["facebook.com", "fb.com", "meta.com"],
  instagram: ["instagram.com"],
  whatsapp: ["whatsapp.com"],
  amazon: ["amazon.com", "amazon.in", "amazon.co.uk", "aws.amazon.com"],
  netflix: ["netflix.com"],
  chase: ["chase.com", "jpmorgan.com"],
  wellsfargo: ["wellsfargo.com"],
  bankofamerica: ["bankofamerica.com", "bofa.com"],
  citibank: ["citibank.com", "citi.com"],
  hsbc: ["hsbc.com", "hsbc.co.uk", "hsbc.co.in"],
  barclays: ["barclays.com", "barclays.co.uk"],
  coinbase: ["coinbase.com"],
  binance: ["binance.com", "binance.us"],
  metamask: ["metamask.io"],
  stripe: ["stripe.com"],
  shopify: ["shopify.com", "myshopify.com"],
  github: ["github.com"],
  gitlab: ["gitlab.com"],
  linkedin: ["linkedin.com", "lnkd.in"],
  twitter: ["twitter.com", "x.com", "t.co"],
  discord: ["discord.com", "discord.gg"],
  slack: ["slack.com"],
  zoom: ["zoom.us"],
  docusign: ["docusign.com", "docusign.net"],
  dropbox: ["dropbox.com"],
  okta: ["okta.com"],
  auth0: ["auth0.com"],
  cloudflare: ["cloudflare.com"],
  digitalocean: ["digitalocean.com"],
  // Indian fintech / popular brands (relevant to user base)
  paytm: ["paytm.com"],
  phonepe: ["phonepe.com"],
  gpay: ["pay.google.com", "google.com"],
  sbi: ["onlinesbi.sbi", "sbi.co.in"],
  hdfc: ["hdfcbank.com"],
  icici: ["icicibank.com"],
  axisbank: ["axisbank.com"],
  // Generic dangerous keywords — never legitimate as the *primary* token
  // of a slug; reject any slug containing them as a substring.
};

const PHISHING_KEYWORDS = new Set([
  "login",
  "signin",
  "sign-in",
  "verify",
  "verification",
  "reset",
  "confirm",
  "secure",
  "wallet",
  "unlock",
  "support",
  "billing",
  "invoice-paid",
  "account-locked",
  "suspended",
]);

/**
 * Levenshtein distance — small dynamic-programming implementation. Fine for
 * slug-vs-brand comparisons (both bounded to ~50 chars).
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const m = a.length;
  const n = b.length;
  let prev = new Array<number>(n + 1);
  let cur = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[n];
}

/** Extract eTLD+1 (loose) from a URL — falls back to hostname on parse failure. */
function rootDomain(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const parts = host.split(".");
    if (parts.length <= 2) return host;
    // Heuristic: treat the last two labels as eTLD+1. Good enough for the
    // brand allowlist below — false positives just mean we fall back to the
    // typosquat check, which is the safer side.
    return parts.slice(-2).join(".");
  } catch {
    return null;
  }
}

/**
 * Map of Unicode look-alike characters to their ASCII counterparts. Covers
 * the high-impact phishing toolkits' typical substitutions: Cyrillic
 * (paypaI, раура1), Greek (μicrosoft), and the Mathematical Alphanumeric
 * Symbols block (𝗉𝖺𝗒𝗉𝖺𝗅). Mathematical alphanumerics decompose under
 * NFKD; Cyrillic and Greek don't, hence this explicit table.
 *
 * If you find a homoglyph attack we're missing, add it here.
 */
const HOMOGLYPH_MAP: Record<string, string> = {
  // Cyrillic lowercase that look like ASCII
  а: "a",
  е: "e",
  о: "o",
  р: "p",
  с: "c",
  у: "y",
  х: "x",
  // Cyrillic uppercase
  А: "A",
  В: "B",
  Е: "E",
  К: "K",
  М: "M",
  Н: "H",
  О: "O",
  Р: "P",
  С: "C",
  Т: "T",
  У: "Y",
  Х: "X",
  // Greek lookalikes
  ο: "o",
  α: "a",
  ε: "e",
  ρ: "p",
  τ: "t",
  ι: "i",
  κ: "k",
  μ: "m",
  ν: "v",
  // Cherokee — narrower attack surface but documented in IDN homograph papers
  Ꭿ: "A",
  // Fullwidth Latin (used in casual typosquats)
  ｐ: "p",
  ａ: "a",
  ｙ: "y",
  ｌ: "l",
};

/** Decompose Unicode lookalikes to ASCII so раура → paypa for distance scoring. */
function deconfuse(s: string): string {
  // NFKD covers Mathematical Alphanumerics (𝗉𝖺𝗒𝗉𝖺𝗅 → paypal) and most
  // accents. The map above covers Cyrillic / Greek which NFKD leaves alone
  // because they aren't decompositions of Latin code points.
  return s
    .normalize("NFKD")
    .split("")
    .map((ch) => HOMOGLYPH_MAP[ch] ?? ch)
    .join("");
}

/** Normalise a slug for comparison: deconfuse, lowercase, strip non-alphanumerics. */
function normalize(slug: string): string {
  return deconfuse(slug)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export interface SlugAbuseCheck {
  blocked: boolean;
  reason?: string;
  brand?: string;
}

/**
 * Decide whether a slug should be rejected for impersonating a brand.
 *
 * The destination URL is needed because the same slug ("/quickbooks") is
 * fine when pointing to intuit.com and very-not-fine when pointing somewhere
 * else.
 */
export function checkSlugAbuse(rawSlug: string, destinationUrl: string): SlugAbuseCheck {
  const slug = normalize(rawSlug);
  if (!slug) return { blocked: false };

  const destRoot = rootDomain(destinationUrl);

  // Phishing-keyword substring check first — these are never legitimate
  // standalone slugs unless the user is logging into themselves, which
  // isn't a use case worth supporting on a shared shortener.
  for (const kw of PHISHING_KEYWORDS) {
    if (slug.includes(kw)) {
      return {
        blocked: true,
        reason: `Slug contains a phishing keyword ('${kw}'). Pick a slug that doesn't impersonate a login or verification page.`,
      };
    }
  }

  // Brand fuzzy match — short slugs need distance ≤ 1 (tighter to avoid
  // false positives on short common words), longer slugs allow ≤ 2 typos.
  for (const [brand, allowedDomains] of Object.entries(BRAND_DOMAINS)) {
    const normalizedBrand = normalize(brand);
    if (slug === normalizedBrand) {
      // Exact match — allow if destination is the brand's verified domain.
      if (
        destRoot &&
        allowedDomains.some((d) => destRoot.endsWith(d.split(".").slice(-2).join(".")))
      ) {
        return { blocked: false };
      }
      return {
        blocked: true,
        brand,
        reason: `Slug matches brand '${brand}'. If you're the brand owner, point this slug at ${allowedDomains[0]} and we'll allow it.`,
      };
    }

    // Skip distance check when the slug is far too short or far too long
    // to plausibly be a typo of the brand.
    if (Math.abs(slug.length - normalizedBrand.length) > 3) continue;

    const distance = levenshtein(slug, normalizedBrand);
    const limit = normalizedBrand.length <= 6 ? 1 : 2;
    if (distance > 0 && distance <= limit) {
      // Brand-domain whitelist short-circuit — same logic as the exact match.
      if (
        destRoot &&
        allowedDomains.some((d) => destRoot.endsWith(d.split(".").slice(-2).join(".")))
      ) {
        return { blocked: false };
      }
      return {
        blocked: true,
        brand,
        reason: `Slug looks like a typo of brand '${brand}'. We block these by default to keep go2.gg out of Google Safe Browsing's phishing list.`,
      };
    }
  }

  // NOTE: we intentionally do NOT block on "slug merely contains a brand
  // substring" (the pure-substring rule was here previously). That rule
  // false-positived on legitimate compound slugs like "coinbase-agents"
  // (link to a news article ABOUT coinbase) or "apple-event-review". The
  // safety guarantee for brand-prefixed slugs is now defence-in-depth:
  //   - Safe Browsing + URL Scanner catch the phishing destination itself.
  //   - The phishing-keyword block above catches "<brand>-login",
  //     "<brand>-verify", "<brand>-wallet", etc. (the actual phishing-tells).
  //   - The interstitial shows the destination URL to a human before redirect
  //     for any unverified (newly-created or guest) link.
  // Subtle brand-prefixed slugs without keywords are accepted; the daily
  // rescan + abuse-report queue handle them post-hoc.

  return { blocked: false };
}

/**
 * Exported for the kill-script + admin tooling — generates the same
 * normalized brand keys we check against.
 */
export const BRANDS = Object.keys(BRAND_DOMAINS);
