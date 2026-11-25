/**
 * Pure composition of the two-layer destination threat check.
 *
 * Kept free of runtime imports so it can be unit-tested without the Workers
 * runtime. checkSafeBrowsing + checkUrlScanner produce the two inputs; this
 * decides the combined verdict.
 */

export type ThreatType =
  | "MALWARE"
  | "SOCIAL_ENGINEERING"
  | "UNWANTED_SOFTWARE"
  | "POTENTIALLY_HARMFUL_APPLICATION"
  | "URL_SCANNER_PHISHING"
  | "URL_SCANNER_MALICIOUS";

export interface ThreatVerdict {
  /**
   * clean: a scanner confirmed safe. flagged: a scanner found a threat and the
   * link must be blocked/disabled. suspect: a local heuristic found a
   * spam-shaped (not malware-shaped) signal — recorded as a label only, it
   * never blocks. unknown: no scanner could answer.
   */
  status: "clean" | "flagged" | "suspect" | "unknown";
  /** Source-prefixed verdict, e.g. "safe_browsing:SOCIAL_ENGINEERING". Empty on clean/unknown. */
  verdict: string;
  /** Which scanners actually ran. */
  scanners: Array<"safe_browsing" | "url_scanner" | "brand_heuristic" | "blocklist">;
}

export type SafeBrowsingResult = { flagged: boolean; threats: ThreatType[] } | null;
export type UrlScannerResult = { flagged: boolean; reasons: string[] } | null;
/** Local hostname heuristic — see lib/brand-impersonation.ts. */
export type BrandHeuristicResult = { reason: string } | null;
/** Human-confirmed blocklist hit — see lib/destination-blocklist.ts. */
export type BlocklistHeuristicResult = { reason: string; action: "block" | "suspect" } | null;

export function composeThreatVerdict(
  sb: SafeBrowsingResult,
  scanner: UrlScannerResult,
  brand: BrandHeuristicResult = null,
  blocklist: BlocklistHeuristicResult = null
): ThreatVerdict {
  const scanners: ThreatVerdict["scanners"] = [];
  if (sb !== null) scanners.push("safe_browsing");
  if (scanner !== null) scanners.push("url_scanner");
  if (brand !== null) scanners.push("brand_heuristic");
  if (blocklist !== null) scanners.push("blocklist");

  // A human investigated and confirmed this destination. That outranks every
  // automated signal, including a scanner "clean" — Safe Browsing returned
  // clean on all 274 links of the 2026-08-23 spam ring.
  if (blocklist?.action === "block") {
    return { status: "flagged", verdict: blocklist.reason, scanners };
  }

  // The local heuristic wins first. It is the only signal that fires on a
  // freshly registered typosquat: Safe Browsing answers a positive "no match"
  // for days-to-months on those, which would otherwise compose to `clean`.
  if (brand) {
    return { status: "flagged", verdict: brand.reason, scanners };
  }
  if (sb?.flagged) {
    return { status: "flagged", verdict: `safe_browsing:${sb.threats[0]}`, scanners };
  }
  if (scanner?.flagged) {
    return { status: "flagged", verdict: `url_scanner:${scanner.reasons[0]}`, scanners };
  }

  // A soft blocklist hit must be able to downgrade a scanner "clean" to
  // "suspect", so it is evaluated before the clean branch below. If clean won,
  // the label would be dead code for exactly the spam class it exists to mark.
  // "suspect" never blocks — it is a label the behavioral detector joins on.
  if (blocklist?.action === "suspect") {
    return { status: "suspect", verdict: blocklist.reason, scanners };
  }

  // A definitive "clean" from EITHER authoritative source is enough. Requiring
  // BOTH to answer left every destination URL Scanner had never indexed stuck
  // "unknown" forever — and in practice URL Scanner errors on nearly every
  // lookup — which pinned ~all links behind the safety interstitial (no OG
  // previews, friction on every human click). Google Safe Browsing alone is a
  // sufficient malware/phishing signal, and the 4h rescan re-checks so a
  // destination that later turns malicious still gets flagged and disabled.
  if (sb || scanner) {
    return { status: "clean", verdict: "", scanners };
  }

  // No scanner could answer at all — keep the interstitial engaged until one can.
  return { status: "unknown", verdict: "", scanners };
}

export const shortUrlOf = (link: { domain: string; slug: string }): string =>
  `https://${link.domain}/${link.slug}`;

export const domainRootOf = (domain: string): string => `https://${domain}/`;

/**
 * Pin Safe Browsing listings of our own short URLs back to their links.
 *
 * Google attributes a phishing chain to its entry URL, so `go2.gg/<slug>` can
 * be listed while the destination itself reads clean (the 2026-11 scanit case).
 * A listed domain root means the whole host is listed and every slug on it
 * would match, so that domain is reported and never pinned on its links —
 * otherwise one whole-domain listing would disable every customer link.
 */
export function attributeShortUrlFlags<T extends { domain: string; slug: string }>(
  links: T[],
  listed: Map<string, ThreatType[]>
): { hits: Array<{ link: T; threat: ThreatType }>; flaggedDomains: string[] } {
  const flaggedDomains = [...new Set(links.map((l) => l.domain))].filter((d) =>
    listed.has(domainRootOf(d))
  );
  const hits: Array<{ link: T; threat: ThreatType }> = [];
  for (const link of links) {
    if (flaggedDomains.includes(link.domain)) continue;
    const threat = listed.get(shortUrlOf(link))?.[0];
    if (threat) hits.push({ link, threat });
  }
  return { hits, flaggedDomains };
}
