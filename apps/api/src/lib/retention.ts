/**
 * Plan-tier link retention policy.
 *
 * Free links auto-expire after `planLimits[plan].linkRetentionDays` days from
 * createdAt. Paid tiers keep links forever. The policy expiry is stored in a
 * dedicated `policy_expires_at` column so user-set `expires_at` is preserved
 * across plan changes.
 */

import { eq, and, isNull, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { planLimits, type PlanId } from "@repo/config/pricing";
import * as schema from "@repo/db";

/**
 * Compute the policy expiry timestamp for a link given its plan tier and
 * createdAt. Returns null when the plan has no retention limit.
 */
export function computePolicyExpiresAt(plan: PlanId, createdAtIso: string): string | null {
  const days = planLimits[plan]?.linkRetentionDays;
  if (days == null) return null;
  const created = new Date(createdAtIso).getTime();
  return new Date(created + days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Resolve the active subscription plan for an org. Mirrors `getOrgUsage` but
 * only returns the plan ID. Defaults to "free" when no active/trialing
 * subscription exists.
 */
export async function getPlanForOrg(
  db: DrizzleD1Database<typeof schema>,
  organizationId: string | null | undefined
): Promise<PlanId> {
  if (!organizationId) return "free";
  const sub = await db
    .select({ plan: schema.subscriptions.plan, status: schema.subscriptions.status })
    .from(schema.subscriptions)
    .where(
      and(
        eq(schema.subscriptions.organizationId, organizationId),
        sql`(${schema.subscriptions.status} = 'active' OR ${schema.subscriptions.status} = 'trialing')`
      )
    )
    .limit(1);
  return (sub[0]?.plan as PlanId | undefined) ?? "free";
}

/**
 * Apply the retention policy across an org's links after a plan change.
 *
 * - Upgrade to paid: clear policy_expires_at on every link the org owns.
 * - Downgrade/cancel to free: stamp policy_expires_at = createdAt + 60d on
 *   every link missing one. Existing values are NOT overwritten — if a link
 *   already has a policy expiry (e.g. created during free-tier and never
 *   touched), keep it as-is so retroactive deadlines stay stable.
 */
export async function applyRetentionForOrg(
  db: DrizzleD1Database<typeof schema>,
  organizationId: string,
  plan: PlanId
): Promise<{ cleared: number; stamped: number }> {
  const days = planLimits[plan]?.linkRetentionDays;

  if (days == null) {
    // Paid plan — clear policy expiry on every link the org owns.
    const result = await db
      .update(schema.links)
      .set({ policyExpiresAt: null })
      .where(eq(schema.links.organizationId, organizationId));
    return { cleared: (result as unknown as { changes?: number }).changes ?? 0, stamped: 0 };
  }

  // Free plan — backfill policy expiry on links that don't have one yet.
  // SQLite expression: createdAt (ISO text) + N days, computed in app code
  // because D1's date math from ISO strings is awkward. We do it in two passes.
  const links = await db
    .select({ id: schema.links.id, createdAt: schema.links.createdAt })
    .from(schema.links)
    .where(
      and(eq(schema.links.organizationId, organizationId), isNull(schema.links.policyExpiresAt))
    );

  let stamped = 0;
  for (const link of links) {
    const expiresAt = computePolicyExpiresAt(plan, link.createdAt);
    if (!expiresAt) continue;
    await db
      .update(schema.links)
      .set({ policyExpiresAt: expiresAt })
      .where(eq(schema.links.id, link.id));
    stamped++;
  }
  return { cleared: 0, stamped };
}

/**
 * Prune `clicks` rows older than the org's analytics retention window.
 *
 * Free plans keep 30d, Pro 365d, Business 730d, Enterprise 1825d. The cron
 * iterates every org and deletes clicks past the cutoff in one statement
 * per org. Returns the number of rows deleted across the org.
 *
 * Why per-org instead of a single global delete: plan tier varies by org,
 * so the cutoff differs per row. A global delete with a join across the
 * subscriptions table is harder to express in D1 / SQLite reliably.
 */
export async function pruneClicksForOrg(
  db: DrizzleD1Database<typeof schema>,
  organizationId: string,
  plan: PlanId,
): Promise<{ deleted: number }> {
  const days = planLimits[plan]?.analyticsRetentionDays;
  if (days == null || days <= 0) return { deleted: 0 };

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const result = await db
    .delete(schema.clicks)
    .where(
      and(
        eq(schema.clicks.organizationId, organizationId),
        sql`${schema.clicks.timestamp} < ${cutoff}`,
      ),
    );
  return { deleted: (result as unknown as { changes?: number }).changes ?? 0 };
}
