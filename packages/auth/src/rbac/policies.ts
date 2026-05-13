/**
 * Policy-Based Authorization (ABAC-ready)
 *
 * Provides a flexible policy system for authorization decisions.
 * Can be extended to support attribute-based access control.
 */

import type { AuthUser } from "../types.js";
import type { OrganizationRole, Permission } from "./roles.js";
import { orgRoleHasPermission, systemRoleHasPermission, SystemRoles } from "./roles.js";

// -----------------------------------------------------------------------------
// Policy Context
// -----------------------------------------------------------------------------

export interface PolicyContext {
  /** The authenticated user */
  user: AuthUser;
  /** System role of the user */
  systemRole?: string;
  /** Organization context (if applicable) */
  organization?: {
    id: string;
    role: OrganizationRole;
  };
  /** Additional attributes for ABAC */
  attributes?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Policy Types
// -----------------------------------------------------------------------------

export type PolicyResult = {
  allowed: boolean;
  reason?: string;
};

export type PolicyFunction = (context: PolicyContext) => PolicyResult | Promise<PolicyResult>;

// -----------------------------------------------------------------------------
// Policy Checking
// -----------------------------------------------------------------------------

/**
 * Check if the context has a specific permission.
 */
export function hasPermission(context: PolicyContext, permission: Permission): boolean {
  // Super admins have all permissions
  if (context.systemRole === SystemRoles.SUPER_ADMIN) {
    return true;
  }

  // Check organization role permissions
  if (context.organization) {
    return orgRoleHasPermission(context.organization.role, permission);
  }

  // Check system role permissions
  if (context.systemRole) {
    return systemRoleHasPermission(context.systemRole as "super_admin" | "user", permission);
  }

  return false;
}

/**
 * Check multiple permissions (all must pass).
 */
export function hasAllPermissions(context: PolicyContext, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(context, p));
}

/**
 * Check multiple permissions (any must pass).
 */
export function hasAnyPermission(context: PolicyContext, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(context, p));
}

/**
 * Create a policy that requires a specific permission.
 */
export function requirePermission(permission: Permission): PolicyFunction {
  return (context: PolicyContext): PolicyResult => {
    const allowed = hasPermission(context, permission);
    return {
      allowed,
      reason: allowed ? undefined : `Missing permission: ${permission}`,
    };
  };
}

/**
 * Create a policy that requires all specified permissions.
 */
export function requireAllPermissions(permissions: Permission[]): PolicyFunction {
  return (context: PolicyContext): PolicyResult => {
    const allowed = hasAllPermissions(context, permissions);
    return {
      allowed,
      reason: allowed ? undefined : `Missing one or more permissions`,
    };
  };
}

/**
 * Create a policy that requires any of the specified permissions.
 */
export function requireAnyPermission(permissions: Permission[]): PolicyFunction {
  return (context: PolicyContext): PolicyResult => {
    const allowed = hasAnyPermission(context, permissions);
    return {
      allowed,
      reason: allowed ? undefined : `Missing all required permissions`,
    };
  };
}

/**
 * Create a policy that checks if user owns the resource.
 */
export function requireOwnership(resourceUserId: string): PolicyFunction {
  return (context: PolicyContext): PolicyResult => {
    const allowed = context.user.id === resourceUserId;
    return {
      allowed,
      reason: allowed ? undefined : "You don't own this resource",
    };
  };
}

/**
 * Combine multiple policies with AND logic.
 */
export function allOf(...policies: PolicyFunction[]): PolicyFunction {
  return async (context: PolicyContext): Promise<PolicyResult> => {
    for (const policy of policies) {
      const result = await policy(context);
      if (!result.allowed) {
        return result;
      }
    }
    return { allowed: true };
  };
}

/**
 * Combine multiple policies with OR logic.
 */
export function anyOf(...policies: PolicyFunction[]): PolicyFunction {
  return async (context: PolicyContext): Promise<PolicyResult> => {
    const reasons: string[] = [];

    for (const policy of policies) {
      const result = await policy(context);
      if (result.allowed) {
        return { allowed: true };
      }
      if (result.reason) {
        reasons.push(result.reason);
      }
    }

    return {
      allowed: false,
      reason: reasons.join("; "),
    };
  };
}
