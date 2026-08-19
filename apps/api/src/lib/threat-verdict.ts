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
  /** clean: a scanner confirmed safe. flagged: a scanner found a threat. unknown: no scanner could answer. */
  status: "clean" | "flagged" | "unknown";
  /** Source-prefixed verdict, e.g. "safe_browsing:SOCIAL_ENGINEERING". Empty on clean/unknown. */
  verdict: string;
  /** Which scanners actually ran. */
  scanners: Array<"safe_browsing" | "url_scanner" | "brand_heuristic">;
}

export type SafeBrowsingResult = { flagged: boolean; threats: ThreatType[] } | null;
export type UrlScannerResult = { flagged: boolean; reasons: string[] } | null;
/** Local hostname heuristic — see lib/brand-impersonation.ts. */
export type BrandHeuristicResult = { reason: string } | null;

export function composeThreatVerdict(
  sb: SafeBrowsingResult,
  scanner: UrlScannerResult,
  brand: BrandHeuristicResult = null
): ThreatVerdict {
  const scanners: ThreatVerdict["scanners"] = [];
  if (sb !== null) scanners.push("safe_browsing");
  if (scanner !== null) scanners.push("url_scanner");
  if (brand !== null) scanners.push("brand_heuristic");

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
