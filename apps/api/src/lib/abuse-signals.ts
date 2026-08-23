/**
 * Behavioral abuse signals — pure, no I/O, no env, no db.
 *
 * Kept free of runtime imports so the corpus-replay script and the unit tests
 * exercise exactly the code the cron runs. Same discipline as
 * lib/brand-impersonation.ts and lib/threat-verdict.ts.
 *
 * ---------------------------------------------------------------------------
 * WHY THERE IS NO CREATION-RATE SIGNAL HERE
 *
 * Measured against prod D1 after the 2026-08-23 spam ring: the ring peaked at
 * 12 links/account/day and averaged 3.5. Legitimate accounts hit 45 and 38
 * links/day. Every creation-velocity threshold that catches the ring blocks
 * real users at ~4x the rate. It is not a usable discriminator on this
 * platform — do not re-add one.
 *
 * WHAT DOES SEPARATE THEM: click volume, by ~100x. Across all live links the
 * distribution was 86 at zero clicks, 157 under 100, 16 at 100-1k, exactly one
 * in the 1k-10k bucket, and none above 10k. Ring links ran 20k-50k clicks/day.
 * ---------------------------------------------------------------------------
 */

export type SignalTier = "high" | "medium";

export type SignalId =
  | "link_click_burst"
  | "link_click_lifetime"
  | "account_click_burst"
  | "account_click_lifetime"
  | "open_pixel_burst"
  | "open_pixel_destination"
  | "ring_fingerprint";

export interface SignalHit {
  signal: SignalId;
  tier: SignalTier;
  linkIds: string[];
  measured: number;
  threshold: number;
  detail: string;
}

/**
 * Thresholds are absolute rather than plan-derived. Every signup receives an
 * automatic card-free Pro trial (ensure-organization.ts), so a plan-relative
 * bar would be anchored to Pro's allowance for essentially every account and
 * would not reflect observed behaviour. These are validated by replaying the
 * detectors over the whole live corpus — see scripts/replay-abuse-detectors.ts.
 */
export const ABUSE_THRESHOLDS = {
  /** Clicks/hour on a single link. No live link has ever reached this lifetime. */
  LINK_BURST_PER_HOUR: 1_000,
  /** Seed rule: a link's first scan has no baseline to diff against. */
  LINK_LIFETIME_HARD: 25_000,
  /** Clicks/hour summed across one account's links — catches load-spreading. */
  ACCOUNT_BURST_PER_HOUR: 2_500,
  ACCOUNT_LIFETIME_HARD: 75_000,
  /**
   * Clicks/hour on an image-file destination. Exactly one live link platform-
   * wide points at an image, with 5 lifetime clicks, so the false-positive
   * surface here is effectively nil. This is the signal that would have caught
   * the incident within the first hour.
   */
  PIXEL_BURST_PER_HOUR: 200,
  /** Distinct accounts sharing a destination fingerprint before it is notable. */
  RING_MIN_ACCOUNTS: 3,
  /** Medium tier fires at this fraction of the high bar. */
  MEDIUM_FRACTION: 0.5,
  STRIKE_TTL_DAYS: 180,
  /**
   * Hours before the same user can take another strike. Load-bearing: without
   * it one campaign burns all three strikes in three hours and the "3 offences
   * despite 2 warnings" contract is a lie.
   */
  STRIKE_COOLDOWN_HOURS: 24,
  /** Strikes (excluding flag/shadow rows) before the account is suspended. */
  STRIKES_BEFORE_SUSPENSION: 3,
} as const;

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".ico"];

/**
 * A destination that is a bare image file. In a bulk email such a link is an
 * open-tracking pixel: the "clicks" are mail clients fetching the image, not
 * humans. 97% of the ring's 4.6M clicks were this.
 */
export function isImageDestination(rawUrl: string): boolean {
  let path: string;
  try {
    path = new URL(rawUrl).pathname.toLowerCase();
  } catch {
    return false;
  }
  return IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext));
}

/** Path segments that are ordinary routing, never an opaque account fingerprint. */
const ROUTE_STOPLIST = new Set([
  "watch",
  "document",
  "spreadsheets",
  "presentation",
  "dp",
  "gp",
  "blog",
  "posts",
  "post",
  "article",
  "articles",
  "product",
  "products",
  "view",
  "file",
  "files",
  "share",
  "shared",
  "video",
  "videos",
  "playlist",
  "channel",
  "user",
  "users",
  "pull",
  "issues",
  "tree",
  "blob",
  "commit",
  "release",
  "releases",
  "track",
  "album",
  "artist",
  "episode",
  "show",
  "status",
  "photo",
  "photos",
  "images",
  "img",
  "assets",
  "static",
  "media",
  "download",
  "downloads",
  "embed",
  "e",
  "s",
  "d",
  "p",
  "r",
  "c",
  "u",
  "i",
  "a",
  "b",
  "t",
  "v",
  "w",
]);

/**
 * `host/firstSegment` when the first path segment looks like an opaque account
 * or campaign id, else null.
 *
 * This is what proved 12 accounts were one operator: the affiliate sub-ids
 * `26W1Z61T` and `3NKHWHB` appeared under six accounts each, and individual
 * offer slugs were reused verbatim between them. Grouping by destination
 * fingerprint finds rings that grouping by email or IP misses entirely.
 *
 * Returns null for youtube.com/watch, docs.google.com/document, amazon.com/dp
 * and friends — that exclusion is the whole point.
 */
export function destinationFingerprint(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const first = segments[0];
  if (first.length < 6 || first.length > 32) return null;
  if (ROUTE_STOPLIST.has(first.toLowerCase())) return null;
  // Opaque ids carry a digit or mixed case; ordinary route words carry neither.
  const hasDigit = /[0-9]/.test(first);
  const isMixedCase = /[a-z]/.test(first) && /[A-Z]/.test(first);
  if (!hasDigit && !isMixedCase) return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  return `${host}/${first.toLowerCase()}`;
}

export interface LinkSample {
  id: string;
  userId: string | null;
  destinationUrl: string;
  clickCount: number;
  /** Clicks accrued since the last pass, normalised to per-hour. Null on first scan. */
  clicksPerHour: number | null;
}

function medium(value: number): number {
  return Math.floor(value * ABUSE_THRESHOLDS.MEDIUM_FRACTION);
}

/** Evaluate one link in isolation. Returns every hit, highest tier first. */
export function evaluateLink(link: LinkSample): SignalHit[] {
  const hits: SignalHit[] = [];
  const rate = link.clicksPerHour;
  const isPixel = isImageDestination(link.destinationUrl);
  const T = ABUSE_THRESHOLDS;

  if (rate !== null) {
    if (isPixel && rate >= T.PIXEL_BURST_PER_HOUR) {
      hits.push({
        signal: "open_pixel_burst",
        tier: "high",
        linkIds: [link.id],
        measured: Math.round(rate),
        threshold: T.PIXEL_BURST_PER_HOUR,
        detail: `image destination at ${Math.round(rate)} clicks/hour — email open-tracking pixel`,
      });
    } else if (rate >= T.LINK_BURST_PER_HOUR) {
      hits.push({
        signal: "link_click_burst",
        tier: "high",
        linkIds: [link.id],
        measured: Math.round(rate),
        threshold: T.LINK_BURST_PER_HOUR,
        detail: `${Math.round(rate)} clicks/hour on a single link`,
      });
    } else if (isPixel && rate >= medium(T.PIXEL_BURST_PER_HOUR)) {
      hits.push({
        signal: "open_pixel_burst",
        tier: "medium",
        linkIds: [link.id],
        measured: Math.round(rate),
        threshold: medium(T.PIXEL_BURST_PER_HOUR),
        detail: `image destination at ${Math.round(rate)} clicks/hour`,
      });
    } else if (rate >= medium(T.LINK_BURST_PER_HOUR)) {
      hits.push({
        signal: "link_click_burst",
        tier: "medium",
        linkIds: [link.id],
        measured: Math.round(rate),
        threshold: medium(T.LINK_BURST_PER_HOUR),
        detail: `${Math.round(rate)} clicks/hour on a single link`,
      });
    }
  }

  // Seed rule for a link with no baseline yet.
  if (hits.length === 0 && link.clickCount >= T.LINK_LIFETIME_HARD) {
    hits.push({
      signal: "link_click_lifetime",
      tier: "high",
      linkIds: [link.id],
      measured: link.clickCount,
      threshold: T.LINK_LIFETIME_HARD,
      detail: `${link.clickCount.toLocaleString()} lifetime clicks on a single link`,
    });
  }

  // An image destination alone is plausible (someone shortening a JPEG), so it
  // is a label, never an enforcement trigger.
  if (hits.length === 0 && isPixel) {
    hits.push({
      signal: "open_pixel_destination",
      tier: "medium",
      linkIds: [link.id],
      measured: link.clickCount,
      threshold: 0,
      detail: "destination is a bare image file",
    });
  }

  return hits;
}

/** Evaluate one account's links in aggregate — catches load-spreading. */
export function evaluateAccount(userId: string, links: LinkSample[]): SignalHit[] {
  const T = ABUSE_THRESHOLDS;
  const hits: SignalHit[] = [];

  const rated = links.filter((l) => l.clicksPerHour !== null);
  const totalRate = rated.reduce((sum, l) => sum + (l.clicksPerHour ?? 0), 0);
  const totalLifetime = links.reduce((sum, l) => sum + l.clickCount, 0);

  // Attribute to the links carrying the volume, not every link the user owns.
  const contributors = [...links]
    .sort((a, b) => (b.clicksPerHour ?? 0) - (a.clicksPerHour ?? 0))
    .filter((l) => (l.clicksPerHour ?? 0) > 0)
    .map((l) => l.id);

  if (rated.length > 0 && totalRate >= T.ACCOUNT_BURST_PER_HOUR) {
    hits.push({
      signal: "account_click_burst",
      tier: "high",
      linkIds: contributors,
      measured: Math.round(totalRate),
      threshold: T.ACCOUNT_BURST_PER_HOUR,
      detail: `${Math.round(totalRate)} clicks/hour across ${contributors.length} links (user ${userId})`,
    });
  } else if (rated.length > 0 && totalRate >= medium(T.ACCOUNT_BURST_PER_HOUR)) {
    hits.push({
      signal: "account_click_burst",
      tier: "medium",
      linkIds: contributors,
      measured: Math.round(totalRate),
      threshold: medium(T.ACCOUNT_BURST_PER_HOUR),
      detail: `${Math.round(totalRate)} clicks/hour across ${contributors.length} links`,
    });
  } else if (totalLifetime >= T.ACCOUNT_LIFETIME_HARD) {
    hits.push({
      signal: "account_click_lifetime",
      tier: "high",
      linkIds: links.map((l) => l.id),
      measured: totalLifetime,
      threshold: T.ACCOUNT_LIFETIME_HARD,
      detail: `${totalLifetime.toLocaleString()} lifetime clicks across ${links.length} links`,
    });
  }

  return hits;
}

/**
 * Destination fingerprints shared by RING_MIN_ACCOUNTS or more distinct users.
 *
 * MEDIUM only, permanently. At this platform's size a marketing agency running
 * one client's affiliate links across three seats is a real collision, and it
 * is not worth a suspension. Its value is as a lead for human review, and as
 * the expansion rule once some other signal has already fired at high tier.
 */
export function findRingFingerprints(
  links: Array<{ id: string; userId: string | null; destinationUrl: string }>
): SignalHit[] {
  const byFingerprint = new Map<string, { users: Set<string>; linkIds: string[] }>();

  for (const link of links) {
    if (!link.userId) continue;
    const fingerprint = destinationFingerprint(link.destinationUrl);
    if (!fingerprint) continue;
    const bucket = byFingerprint.get(fingerprint) ?? { users: new Set(), linkIds: [] };
    bucket.users.add(link.userId);
    bucket.linkIds.push(link.id);
    byFingerprint.set(fingerprint, bucket);
  }

  const hits: SignalHit[] = [];
  for (const [fingerprint, bucket] of byFingerprint) {
    if (bucket.users.size >= ABUSE_THRESHOLDS.RING_MIN_ACCOUNTS) {
      hits.push({
        signal: "ring_fingerprint",
        tier: "medium",
        linkIds: bucket.linkIds,
        measured: bucket.users.size,
        threshold: ABUSE_THRESHOLDS.RING_MIN_ACCOUNTS,
        detail: `destination fingerprint "${fingerprint}" shared by ${bucket.users.size} accounts`,
      });
    }
  }
  return hits;
}

/** Clicks/hour since the last pass, or null when there is no usable baseline. */
export function clicksPerHour(
  clickCount: number,
  previousClicks: number | null,
  previousAt: string | null,
  nowMs: number
): number | null {
  if (previousClicks === null || previousAt === null) return null;
  const previousMs = Date.parse(previousAt);
  if (!Number.isFinite(previousMs)) return null;
  const hours = (nowMs - previousMs) / 3_600_000;
  // Under a minute of elapsed time makes the rate meaningless and explosive.
  if (hours < 1 / 60) return null;
  const delta = clickCount - previousClicks;
  if (delta <= 0) return 0;
  return delta / hours;
}

export function highestTier(hits: SignalHit[]): SignalTier | null {
  if (hits.some((h) => h.tier === "high")) return "high";
  if (hits.length > 0) return "medium";
  return null;
}
