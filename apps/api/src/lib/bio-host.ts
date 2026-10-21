import * as schema from "@repo/db";
import { and, asc, desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

/**
 * A "bio host" is a creator's own custom domain that serves one of their bio
 * galleries at its root. The redirect worker reads this KV key to route the
 * domain to the web app (see apps/redirect/src/index.ts).
 */
export const bioHostKey = (domain: string) => `biohost:${domain}`;

type KvEnv = { LINKS_KV: KVNamespace };

/**
 * Recompute which gallery (if any) `domain` serves at its root and keep the KV
 * mapping + `domains.bioGalleryId` in lockstep with reality.
 *
 * The root is served by the domain OWNER's primary, published gallery on that
 * domain. This is the single source of truth, which makes the mapping safe and
 * self-healing: a gallery can never bind a domain whose owner doesn't own it
 * (closes the cross-tenant hijack), an unpublished draft never takes the root,
 * and moving or deleting one gallery promotes the next instead of orphaning the
 * domain. Call it for every custom domain a gallery create/update/delete touches
 * (old and new), and whenever a domain becomes verified.
 */
export async function recomputeBioHost(
  db: DrizzleD1Database<typeof schema>,
  env: KvEnv,
  domain: string
): Promise<void> {
  // Best-effort: the primary write (gallery/domain) already committed, so a KV
  // or D1 hiccup here must not fail the request. The mapping is eventually
  // consistent — the next edit or verify on this domain reconciles it.
  try {
    const [d] = await db
      .select({
        userId: schema.domains.userId,
        verificationStatus: schema.domains.verificationStatus,
      })
      .from(schema.domains)
      .where(eq(schema.domains.domain, domain))
      .limit(1);

    // Only a verified domain can serve a bio (it has a cert). Eligible galleries
    // are the domain OWNER's own (userId is stable); the gallery's org id is a
    // snapshot a removed member could exploit, so it is not used.
    let chosen: { id: string; slug: string } | undefined;
    if (d && d.verificationStatus === "verified") {
      const rows = await db
        .select({ id: schema.linkGalleries.id, slug: schema.linkGalleries.slug })
        .from(schema.linkGalleries)
        .where(
          and(
            eq(schema.linkGalleries.domain, domain),
            eq(schema.linkGalleries.userId, d.userId),
            eq(schema.linkGalleries.isPublished, true)
          )
        )
        .orderBy(desc(schema.linkGalleries.isPrimary), asc(schema.linkGalleries.createdAt))
        .limit(1);
      chosen = rows[0];
    }

    if (chosen) {
      await env.LINKS_KV.put(bioHostKey(domain), JSON.stringify({ slug: chosen.slug }));
    } else {
      await env.LINKS_KV.delete(bioHostKey(domain));
    }
    if (d) {
      await db
        .update(schema.domains)
        .set({ bioGalleryId: chosen?.id ?? null, updatedAt: new Date().toISOString() })
        .where(eq(schema.domains.domain, domain));
    }
  } catch (err) {
    console.error("recomputeBioHost failed:", err instanceof Error ? err.message : err);
  }
}
