/**
 * Auth Guards
 *
 * Authorization guards for server components and API routes.
 */

// Server Component guards
export {
  requireAuth,
  requireOrgAuth,
  createPolicyContext,
  requirePolicy as requireServerPolicy,
  withAuth,
  type AuthGuardResult,
  type OrgAuthGuardResult,
} from "./server.js";

// API guards (Hono)
export {
  createAuthMiddleware,
  getAuthContext,
  getOrgAuthContext,
  requirePermission,
  requirePolicy,
  type AuthContext,
  type OrgAuthContext,
  type SessionVerifier,
} from "./api.js";
