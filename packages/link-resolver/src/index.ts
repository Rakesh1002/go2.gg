/**
 * Link resolution gate — single source of truth shared by the lean edge
 * redirect worker (apps/redirect) and the monolith (apps/api).
 *
 * The edge worker can only serve the fast 302 itself for a "simple" link:
 * one with no gate failures and no feature that needs the monolith's heavier
 * machinery (password page, cloak iframe, pixel interstitial, A/B/D1 lookups,
 * OG crawler page, device/geo targeting, click-limit enforcement). Anything
 * else is forwarded to the monolith over a service binding, which renders the
 * exact existing behaviour. Keeping this decision in one dependency-light
 * module (no drizzle, no Hono) is what stops the two workers from drifting on
 * safety-critical gates like disabled/expired.
 *
 *   evaluateLink(link, nowMs)
 *     │
 *     ├─ isArchived ──────────────► forward "archived"   (monolith 410)
 *     ├─ isDisabled ──────────────► forward "disabled"   (monolith 410 page)
 *     ├─ expiresAt   < now ───────► forward "expired"
 *     ├─ policyExpiresAt < now ───► forward "policy_expired"
 *     ├─ clickLimit != null ──────► forward "click_limit" (count enforced in D1)
 *     ├─ passwordHash ────────────► forward "password"
 *     ├─ rewrite ─────────────────► forward "rewrite"     (cloak iframe)
 *     ├─ pixels enabled ──────────► forward "pixels"
 *     ├─ abTestId ────────────────► forward "ab_test"
 *     ├─ og metadata ─────────────► forward "og_meta"     (crawler preview)
 *     ├─ device/geo targeting ────► forward "targeting"
 *     └─ otherwise ───────────────► redirect (edge serves it)
 */

/** Structural subset of CachedLink the gate reads. CachedLink is assignable. */
export interface LinkGateInput {
  destinationUrl: string;
  isArchived?: boolean;
  isDisabled?: boolean;
  expiresAt?: string;
  policyExpiresAt?: string;
  clickLimit?: number;
  passwordHash?: string;
  rewrite?: boolean;
  abTestId?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  trackingPixels?: unknown[];
  enablePixelTracking?: boolean;
  geoTargets?: Record<string, string>;
  deviceTargets?: Record<string, string>;
  iosUrl?: string;
  androidUrl?: string;
}

export type ForwardReason =
  | "archived"
  | "disabled"
  | "expired"
  | "policy_expired"
  | "click_limit"
  | "password"
  | "rewrite"
  | "pixels"
  | "ab_test"
  | "og_meta"
  | "targeting";

export type GateDecision =
  | { action: "redirect"; destination: string }
  | { action: "forward"; reason: ForwardReason };

function isPast(iso: string | undefined, nowMs: number): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  // Unparseable timestamps are treated as not-expired; the monolith owns the
  // authoritative check, and we never want a parse error to 410 a live link.
  return Number.isFinite(t) && t < nowMs;
}

/**
 * Decide whether the edge can serve this link natively (fast 302) or must
 * forward to the monolith. `nowMs` is injected (Date.now()) so the gate stays
 * pure and unit-testable.
 */
export function evaluateLink(link: LinkGateInput, nowMs: number): GateDecision {
  if (link.isArchived) return { action: "forward", reason: "archived" };
  if (link.isDisabled) return { action: "forward", reason: "disabled" };
  if (isPast(link.expiresAt, nowMs)) return { action: "forward", reason: "expired" };
  if (isPast(link.policyExpiresAt, nowMs)) return { action: "forward", reason: "policy_expired" };
  if (link.clickLimit != null) return { action: "forward", reason: "click_limit" };
  if (link.passwordHash) return { action: "forward", reason: "password" };
  if (link.rewrite) return { action: "forward", reason: "rewrite" };
  if (link.enablePixelTracking && (link.trackingPixels?.length ?? 0) > 0) {
    return { action: "forward", reason: "pixels" };
  }
  if (link.abTestId) return { action: "forward", reason: "ab_test" };
  if (link.ogTitle || link.ogDescription || link.ogImage) {
    return { action: "forward", reason: "og_meta" };
  }
  if (
    link.iosUrl ||
    link.androidUrl ||
    (link.geoTargets && Object.keys(link.geoTargets).length > 0) ||
    (link.deviceTargets && Object.keys(link.deviceTargets).length > 0)
  ) {
    return { action: "forward", reason: "targeting" };
  }
  return { action: "redirect", destination: link.destinationUrl };
}
