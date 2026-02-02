/**
 * RBAC Module
 *
 * Role-based and policy-based access control.
 */

export {
  SystemRoles,
  OrganizationRoles,
  Permissions,
  orgRoleHasPermission,
  systemRoleHasPermission,
  getOrgRolePermissions,
  getSystemRolePermissions,
  canManageRole,
  type SystemRole,
  type OrganizationRole,
  type Permission,
} from "./roles.js";

export {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireOwnership,
  allOf,
  anyOf,
  type PolicyContext,
  type PolicyResult,
  type PolicyFunction,
} from "./policies.js";
