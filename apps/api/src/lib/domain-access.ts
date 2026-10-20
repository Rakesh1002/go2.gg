import * as schema from "@repo/db";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

export type DomainAccess = "platform" | "verified" | "unverified";

export function platformDomain(env: { DEFAULT_DOMAIN?: string }): string {
  return env.DEFAULT_DOMAIN ?? "go2.gg";
}

/** Null means another tenant's (or nobody's) domain: refuse the write. */
export async function getDomainAccess(
  db: DrizzleD1Database<typeof schema>,
  env: { DEFAULT_DOMAIN?: string },
  user: { id: string; organizationId?: string | null },
  domain: string
): Promise<DomainAccess | null> {
  if (domain === platformDomain(env)) return "platform";

  const [row] = await db
    .select({
      userId: schema.domains.userId,
      organizationId: schema.domains.organizationId,
      verificationStatus: schema.domains.verificationStatus,
    })
    .from(schema.domains)
    .where(eq(schema.domains.domain, domain))
    .limit(1);

  const owned =
    row &&
    (row.userId === user.id ||
      (!!row.organizationId && row.organizationId === user.organizationId));
  if (!owned) return null;
  return row.verificationStatus === "verified" ? "verified" : "unverified";
}

export function domainAccessDenied(domain: string): string {
  return `You don't have access to the domain "${domain}". Use the default domain or a custom domain you've added.`;
}
