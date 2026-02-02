/**
 * @repo/auth - Authentication & Authorization Package
 *
 * This package provides:
 * - Better Auth integration (edge-native auth)
 * - Role-based access control (RBAC)
 * - Policy-based authorization (ABAC-ready)
 * - Guards for server components and API routes
 *
 * Usage:
 * ```typescript
 * // Server-side (API Worker)
 * import { createAuth } from "@repo/auth";
 *
 * const auth = createAuth({ db, baseUrl, secret });
 * // Mount auth routes: app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
 *
 * // Client-side (React/Next.js)
 * import { createBetterAuthClient } from "@repo/auth/client";
 *
 * const authClient = createBetterAuthClient({ baseUrl: "https://api.go2.gg" });
 * // Use: authClient.signIn.email({ email, password })
 *
 * // Check permissions
 * import { hasPermission, Permissions } from "@repo/auth/rbac";
 *
 * if (hasPermission(context, Permissions.ORG_UPDATE)) {
 *   // Allow update
 * }
 * ```
 */

// Better Auth Server
export {
  createAuth,
  createJWT,
  verifyJWT,
  type Auth,
  type AuthConfig,
  type JWTPayload,
  type EmailPayload,
} from "./server.js";

// Types
export {
  AuthError,
  signUpSchema,
  signInSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  oauthProviders,
  type AuthUser,
  type AuthSession,
  type AuthProvider,
  type SignUpInput,
  type SignInInput,
  type ResetPasswordInput,
  type UpdatePasswordInput,
  type OAuthProvider,
  type AuthErrorCode,
} from "./types.js";

// RBAC
export {
  SystemRoles,
  OrganizationRoles,
  Permissions,
  orgRoleHasPermission,
  systemRoleHasPermission,
  getOrgRolePermissions,
  getSystemRolePermissions,
  canManageRole,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  requirePermission as createPermissionPolicy,
  requireAllPermissions as createAllPermissionsPolicy,
  requireAnyPermission as createAnyPermissionPolicy,
  requireOwnership as createOwnershipPolicy,
  allOf,
  anyOf,
  type SystemRole,
  type OrganizationRole,
  type Permission,
  type PolicyContext,
  type PolicyResult,
  type PolicyFunction,
} from "./rbac/index.js";

// Guards
export {
  requireAuth,
  requireOrgAuth,
  createPolicyContext,
  withAuth,
  createAuthMiddleware,
  getAuthContext,
  getOrgAuthContext,
  requirePermission,
  requirePolicy,
  type AuthGuardResult,
  type OrgAuthGuardResult,
  type AuthContext,
  type OrgAuthContext,
  type SessionVerifier,
} from "./guards/index.js";
