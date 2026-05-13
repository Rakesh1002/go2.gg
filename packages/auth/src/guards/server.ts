/**
 * Server Component Guards
 *
 * Authorization guards for Next.js Server Components.
 */

import { AuthError, type AuthSession, type AuthUser } from "../types.js";
import type { PolicyContext, PolicyFunction } from "../rbac/policies.js";
import type { OrganizationRole } from "../rbac/roles.js";

// -----------------------------------------------------------------------------
// Guard Types
// -----------------------------------------------------------------------------

export interface AuthGuardResult {
  user: AuthUser;
  session: AuthSession;
}

export interface OrgAuthGuardResult extends AuthGuardResult {
  organization: {
    id: string;
    role: OrganizationRole;
  };
}

// -----------------------------------------------------------------------------
// Server Guards
// -----------------------------------------------------------------------------

/**
 * Requires an authenticated user.
 * Throws AuthError if not authenticated.
 */
export async function requireAuth(
  getSession: () => Promise<AuthSession | null>
): Promise<AuthGuardResult> {
  const session = await getSession();

  if (!session) {
    throw new AuthError("Authentication required", "UNAUTHORIZED", 401);
  }

  return {
    user: session.user,
    session,
  };
}

/**
 * Requires an authenticated user with organization context.
 */
export async function requireOrgAuth(
  getSession: () => Promise<AuthSession | null>,
  getOrgMembership: (userId: string, orgId: string) => Promise<{ role: OrganizationRole } | null>,
  orgId: string
): Promise<OrgAuthGuardResult> {
  const { user, session } = await requireAuth(getSession);

  const membership = await getOrgMembership(user.id, orgId);

  if (!membership) {
    throw new AuthError("Not a member of this organization", "FORBIDDEN", 403);
  }

  return {
    user,
    session,
    organization: {
      id: orgId,
      role: membership.role,
    },
  };
}

/**
 * Creates a policy context from auth result.
 */
export function createPolicyContext(
  auth: AuthGuardResult,
  orgContext?: { id: string; role: OrganizationRole }
): PolicyContext {
  return {
    user: auth.user,
    organization: orgContext,
  };
}

/**
 * Requires that a policy passes.
 */
export async function requirePolicy(context: PolicyContext, policy: PolicyFunction): Promise<void> {
  const result = await policy(context);

  if (!result.allowed) {
    throw new AuthError(result.reason ?? "Permission denied", "FORBIDDEN", 403);
  }
}

/**
 * Higher-order function to protect a server action or data fetcher.
 */
export function withAuth<TArgs extends unknown[], TResult>(
  getSession: () => Promise<AuthSession | null>,
  handler: (auth: AuthGuardResult, ...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const auth = await requireAuth(getSession);
    return handler(auth, ...args);
  };
}
