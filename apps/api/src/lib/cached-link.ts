/**
 * Single source of truth for the D1 link row → CachedLink mapping.
 *
 * The redirect hot path trusts KV: whatever this serializer omits is
 * invisible to the resolver until the next full sync. Hand-rolled partial
 * CachedLink objects at the write sites caused a real safety bug — a PATCH
 * that dropped `isDisabled` silently re-enabled a Safe-Browsing-disabled
 * link at the edge. Every KV write must go through this module.
 *
 * KV entries carry no TTL — D1 is the source of truth and eviction is
 * explicit (archive/expiry/policy/threat). A TTL caused bulk-imported links
 * to silently age out of the cache and 404.
 */
import type * as schema from "@repo/db";
import type { CachedLink } from "../bindings.js";

function parseJson<T>(value: string | null | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

/**
 * Accepts the insert shape (`NewLink`) so freshly-constructed rows can be
 * synced without a re-select; a full `Link` row is assignable to it.
 */
export function serializeCachedLink(
  // `id` and `domain` are optional on the insert type (uuid/default-valued);
  // the cache key needs both, so require them from the caller.
  row: schema.NewLink & { id: string; domain: string }
): CachedLink {
  return {
    id: row.id,
    destinationUrl: row.destinationUrl,
    domain: row.domain,
    slug: row.slug,
    userId: row.userId ?? undefined,
    organizationId: row.organizationId ?? undefined,
    geoTargets: parseJson(row.geoTargets),
    deviceTargets: parseJson(row.deviceTargets),
    passwordHash: row.passwordHash ?? undefined,
    expiresAt: row.expiresAt ?? undefined,
    policyExpiresAt: row.policyExpiresAt ?? undefined,
    clickLimit: row.clickLimit ?? undefined,
    clickCount: row.clickCount ?? undefined,
    iosUrl: row.iosUrl ?? undefined,
    androidUrl: row.androidUrl ?? undefined,
    abTestId: row.abTestId ?? undefined,
    abVariant: row.abVariant ?? undefined,
    rewrite: row.rewrite ?? undefined,
    ogTitle: row.ogTitle ?? undefined,
    ogDescription: row.ogDescription ?? undefined,
    ogImage: row.ogImage ?? undefined,
    trackingPixels: parseJson(row.trackingPixels),
    enablePixelTracking: row.enablePixelTracking ?? undefined,
    requirePixelConsent: row.requirePixelConsent ?? undefined,
    trackAnalytics: row.trackAnalytics ?? undefined,
    publicStats: row.publicStats ?? undefined,
    trackConversion: row.trackConversion ?? undefined,
    skipDeduplication: row.skipDeduplication ?? undefined,
    agentId: row.agentId ?? undefined,
    agentRunId: row.agentRunId ?? undefined,
    agentActorId: row.agentActorId ?? undefined,
    agentMetadata: parseJson(row.agentMetadata),
    isArchived: row.isArchived ?? undefined,
    isDisabled: row.isDisabled ?? undefined,
    disabledReason: row.disabledReason ?? undefined,
    threatStatus: (row.threatStatus as CachedLink["threatStatus"]) ?? undefined,
    createdAt: row.createdAt ?? undefined,
  };
}

export function cachedLinkKey(link: Pick<CachedLink, "domain" | "slug">): string {
  return `${link.domain}:${link.slug}`;
}

export async function syncLinkToKV(kv: KVNamespace, link: CachedLink): Promise<void> {
  await kv.put(cachedLinkKey(link), JSON.stringify(link));
}
