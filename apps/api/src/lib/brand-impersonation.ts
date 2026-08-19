/**
 * Local brand-impersonation heuristic for destination hostnames.
 *
 * WHY THIS EXISTS: Google Safe Browsing does not merely fail to flag a freshly
 * registered typosquat — it returns a positive "no match", which
 * composeThreatVerdict maps to `clean`. Two live campaigns rode that hole:
 *
 *   roblox.com.{bz,ge}            27 guest links, ~1,350 clicks, 2 days
 *                                 (Netcraft 92808973 / CF abuse 4fa33c8c9294cec0)
 *   xfinit*.jumpingcrab.com        6 guest links,    44 clicks, ~3 months
 *
 * Both were "clean" on every one of the 4h rescan's passes. Cloudflare URL
 * Scanner — the intended second opinion — errors on ~every lookup, so there was
 * no independent signal at all.
 *
 * This check is local, deterministic, and needs no network, so it runs BEFORE
 * the remote scanners and short-circuits them. It is deliberately narrow: it
 * only fires on hostname shapes that are near-exclusively phishing, because a
 * false positive disables a real customer's link.
 *
 *   A. embedded brand domain   roblox.com.bz, paypal.com.secure-login.io
 *      The brand's real domain appears as a contiguous label run but the host
 *      is not that domain or a subdomain of it. Near-zero false-positive rate.
 *   B. brand token on dynamic DNS   xfinitimblay.jumpingcrab.com
 *      Free dyndns providers are near-universally abused; a brand name on one
 *      is not a coincidence.
 *   C. brand token + credential verb   roblox-login.xyz, paypal-verify.io
 *      Leaves plain brand-adjacent names (roblox-fansite.com) alone.
 */

export interface ImpersonationHit {
  /** Source-prefixed, e.g. "brand_heuristic:roblox:embedded_domain". */
  reason: string;
}

interface Brand {
  /** Domains the brand actually owns. A host at or under one of these is fine. */
  domains: string[];
  /** Label stems that identify the brand. Matched as a whole label or prefix. */
  tokens: string[];
}

const BRANDS: Record<string, Brand> = {
  roblox: { domains: ["roblox.com"], tokens: ["roblox", "rblx"] },
  // "xfinit" as its own stem: the live campaign used xfinitimblay / xfinitipaseo.
  xfinity: { domains: ["xfinity.com", "comcast.net", "comcast.com"], tokens: ["xfinity", "xfinit"] },
  paypal: { domains: ["paypal.com", "paypal.me"], tokens: ["paypal"] },
  apple: { domains: ["apple.com", "icloud.com"], tokens: ["appleid", "icloud"] },
  microsoft: {
    domains: ["microsoft.com", "live.com", "office.com", "outlook.com", "sharepoint.com"],
    tokens: ["microsoft", "outlook", "office365"],
  },
  google: {
    domains: ["google.com", "gmail.com", "goo.gl", "youtube.com", "youtu.be"],
    tokens: ["gmail", "googledrive"],
  },
  amazon: { domains: ["amazon.com", "amzn.to", "aws.amazon.com"], tokens: ["amazon"] },
  netflix: { domains: ["netflix.com"], tokens: ["netflix"] },
  facebook: { domains: ["facebook.com", "fb.me", "fb.com"], tokens: ["facebook"] },
  instagram: { domains: ["instagram.com"], tokens: ["instagram"] },
  whatsapp: { domains: ["whatsapp.com", "wa.me"], tokens: ["whatsapp"] },
  telegram: { domains: ["telegram.org", "telegram.me", "t.me"], tokens: ["telegram"] },
  discord: { domains: ["discord.com", "discord.gg", "discordapp.com"], tokens: ["discord"] },
  steam: {
    domains: ["steampowered.com", "steamcommunity.com"],
    tokens: ["steamcommunity", "steampowered"],
  },
  coinbase: { domains: ["coinbase.com"], tokens: ["coinbase"] },
  binance: { domains: ["binance.com", "binance.us"], tokens: ["binance"] },
  metamask: { domains: ["metamask.io"], tokens: ["metamask"] },
  ledger: { domains: ["ledger.com"], tokens: ["ledgerlive"] },
  chase: { domains: ["chase.com"], tokens: ["chasebank"] },
  wellsfargo: { domains: ["wellsfargo.com"], tokens: ["wellsfargo"] },
  bankofamerica: { domains: ["bankofamerica.com"], tokens: ["bankofamerica"] },
  dhl: { domains: ["dhl.com", "dhl.de"], tokens: ["dhlexpress"] },
  fedex: { domains: ["fedex.com"], tokens: ["fedex"] },
  usps: { domains: ["usps.com"], tokens: ["uspstracking"] },
  linkedin: { domains: ["linkedin.com", "lnkd.in"], tokens: ["linkedin"] },
};

/**
 * Free dynamic-DNS / free-subdomain providers. Hosting is anonymous and
 * disposable, so a brand name under one is a reliable phishing signal. Not
 * blocked on their own — plenty of hobbyists use these legitimately.
 */
const DYNAMIC_DNS_SUFFIXES = [
  "jumpingcrab.com",
  "hopto.org",
  "no-ip.org",
  "no-ip.biz",
  "no-ip.info",
  "noip.me",
  "ddns.net",
  "zapto.org",
  "servebeer.com",
  "serveblog.net",
  "servegame.com",
  "serveminecraft.net",
  "sytes.net",
  "myftp.biz",
  "myftp.org",
  "myvnc.com",
  "redirectme.net",
  "dynu.net",
  "duckdns.org",
  "freedns.org",
  "chickenkiller.com",
  "crabdance.com",
  "strangled.net",
  "twilightparadox.com",
  "ignorelist.com",
];

/** Words that turn a brand-adjacent name into a credential-harvest name. */
const CREDENTIAL_VERBS = [
  "login",
  "signin",
  "verify",
  "verification",
  "account",
  "secure",
  "security",
  "update",
  "confirm",
  "recover",
  "unlock",
  "support",
  "billing",
  "wallet",
  "auth",
];

function hostOf(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase().replace(/\.$/, "");
    return host || null;
  } catch {
    return null;
  }
}

/** True when `host` is `domain` itself or a subdomain of it. */
function isAtOrUnder(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

/** True when `domain`'s labels appear as a contiguous run inside `host`'s. */
function containsLabelRun(hostLabels: string[], domain: string): boolean {
  const want = domain.split(".");
  for (let i = 0; i + want.length <= hostLabels.length; i++) {
    let match = true;
    for (let j = 0; j < want.length; j++) {
      if (hostLabels[i + j] !== want[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

/** True when a label is the token or starts with it (xfinitimblay ⊃ xfinit). */
function labelCarriesToken(label: string, token: string): boolean {
  return label === token || label.startsWith(token);
}

/** A. Brand's real domain embedded but demoted to a label — roblox.com.bz. */
function hasEmbeddedBrandDomain(labels: string[], domains: string[]): boolean {
  return domains.some((domain) => {
    if (containsLabelRun(labels, domain)) return true;
    // Hyphenated evasion of the same trick: roblox-com.bz.
    const [name, ...rest] = domain.split(".");
    const tld = rest.join(".");
    return tld !== "" && labels.includes(`${name}-${tld.replace(/\./g, "-")}`);
  });
}

/** B. Brand token on a disposable dynamic-DNS host — xfinit*.jumpingcrab.com. */
function hasBrandOnDynamicDns(host: string, labels: string[], tokens: string[]): boolean {
  const dyn = DYNAMIC_DNS_SUFFIXES.find((s) => isAtOrUnder(host, s));
  if (!dyn) return false;
  const prefixLabels = labels.slice(0, labels.length - dyn.split(".").length);
  return prefixLabels.some((l) => tokens.some((t) => labelCarriesToken(l, t)));
}

/** C. Brand token fused with a credential verb — roblox-login.xyz. */
function hasCredentialBait(labels: string[], tokens: string[]): boolean {
  return labels.some(
    (label) =>
      tokens.some((t) => label.includes(t)) && CREDENTIAL_VERBS.some((v) => label.includes(v))
  );
}

/**
 * Returns a hit when the hostname impersonates a known brand, else null.
 * Never throws — malformed input is simply not a hit.
 */
export function detectBrandImpersonation(rawUrl: string): ImpersonationHit | null {
  const host = hostOf(rawUrl);
  if (!host) return null;

  const labels = host.split(".");

  // A host at or under a domain some brand actually owns is always fine, and
  // must win over every heuristic below.
  for (const { domains } of Object.values(BRANDS)) {
    if (domains.some((d) => isAtOrUnder(host, d))) return null;
  }

  for (const [brand, { domains, tokens }] of Object.entries(BRANDS)) {
    if (hasEmbeddedBrandDomain(labels, domains)) {
      return { reason: `brand_heuristic:${brand}:embedded_domain` };
    }
    if (hasBrandOnDynamicDns(host, labels, tokens)) {
      return { reason: `brand_heuristic:${brand}:dynamic_dns` };
    }
    if (hasCredentialBait(labels, tokens)) {
      return { reason: `brand_heuristic:${brand}:credential_bait` };
    }
  }

  return null;
}
