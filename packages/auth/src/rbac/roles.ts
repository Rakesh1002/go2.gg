/**
 * Role-Based Access Control (RBAC)
 *
 * Defines roles and their permissions for the application.
 */

// -----------------------------------------------------------------------------
// Role Definitions
// -----------------------------------------------------------------------------

export const SystemRoles = {
  SUPER_ADMIN: "super_admin", // Platform-wide admin
  USER: "user", // Regular authenticated user
} as const;

export const OrganizationRoles = {
  OWNER: "owner", // Full control, can delete org
  ADMIN: "admin", // Manage members and settings
  MEMBER: "member", // Read/write access
  VIEWER: "viewer", // Read-only access
} as const;

export type SystemRole = (typeof SystemRoles)[keyof typeof SystemRoles];
export type OrganizationRole = (typeof OrganizationRoles)[keyof typeof OrganizationRoles];

// -----------------------------------------------------------------------------
// Permission Definitions
// -----------------------------------------------------------------------------

export const Permissions = {
  // Organization permissions
  ORG_READ: "org:read",
  ORG_UPDATE: "org:update",
  ORG_DELETE: "org:delete",
  ORG_MANAGE_MEMBERS: "org:manage_members",
  ORG_MANAGE_BILLING: "org:manage_billing",

  // User permissions within org
  USER_INVITE: "user:invite",
  USER_REMOVE: "user:remove",
  USER_UPDATE_ROLE: "user:update_role",

  // Resource permissions (generic)
  RESOURCE_CREATE: "resource:create",
  RESOURCE_READ: "resource:read",
  RESOURCE_UPDATE: "resource:update",
  RESOURCE_DELETE: "resource:delete",

  // Admin permissions
  ADMIN_ACCESS: "admin:access",
  ADMIN_MANAGE_USERS: "admin:manage_users",
  ADMIN_MANAGE_ORGS: "admin:manage_orgs",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

// -----------------------------------------------------------------------------
// Role-Permission Mapping
// -----------------------------------------------------------------------------

const orgRolePermissions: Record<OrganizationRole, Permission[]> = {
  [OrganizationRoles.OWNER]: [
    Permissions.ORG_READ,
    Permissions.ORG_UPDATE,
    Permissions.ORG_DELETE,
    Permissions.ORG_MANAGE_MEMBERS,
    Permissions.ORG_MANAGE_BILLING,
    Permissions.USER_INVITE,
    Permissions.USER_REMOVE,
    Permissions.USER_UPDATE_ROLE,
    Permissions.RESOURCE_CREATE,
    Permissions.RESOURCE_READ,
    Permissions.RESOURCE_UPDATE,
    Permissions.RESOURCE_DELETE,
  ],
  [OrganizationRoles.ADMIN]: [
    Permissions.ORG_READ,
    Permissions.ORG_UPDATE,
    Permissions.ORG_MANAGE_MEMBERS,
    Permissions.USER_INVITE,
    Permissions.USER_REMOVE,
    Permissions.RESOURCE_CREATE,
    Permissions.RESOURCE_READ,
    Permissions.RESOURCE_UPDATE,
    Permissions.RESOURCE_DELETE,
  ],
  [OrganizationRoles.MEMBER]: [
    Permissions.ORG_READ,
    Permissions.RESOURCE_CREATE,
    Permissions.RESOURCE_READ,
    Permissions.RESOURCE_UPDATE,
  ],
  [OrganizationRoles.VIEWER]: [Permissions.ORG_READ, Permissions.RESOURCE_READ],
};

const systemRolePermissions: Record<SystemRole, Permission[]> = {
  [SystemRoles.SUPER_ADMIN]: [
    ...Object.values(Permissions), // All permissions
  ],
  [SystemRoles.USER]: [], // No special permissions, relies on org roles
};

// -----------------------------------------------------------------------------
// Permission Checking
// -----------------------------------------------------------------------------

/**
 * Check if an organization role has a specific permission.
 */
export function orgRoleHasPermission(role: OrganizationRole, permission: Permission): boolean {
  return orgRolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if a system role has a specific permission.
 */
export function systemRoleHasPermission(role: SystemRole, permission: Permission): boolean {
  return systemRolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for an organization role.
 */
export function getOrgRolePermissions(role: OrganizationRole): Permission[] {
  return orgRolePermissions[role] ?? [];
}

/**
 * Get all permissions for a system role.
 */
export function getSystemRolePermissions(role: SystemRole): Permission[] {
  return systemRolePermissions[role] ?? [];
}

/**
 * Check if a role can manage another role.
 * Owners can manage all. Admins can manage members/viewers.
 */
export function canManageRole(
  managerRole: OrganizationRole,
  targetRole: OrganizationRole
): boolean {
  const roleHierarchy: Record<OrganizationRole, number> = {
    [OrganizationRoles.OWNER]: 4,
    [OrganizationRoles.ADMIN]: 3,
    [OrganizationRoles.MEMBER]: 2,
    [OrganizationRoles.VIEWER]: 1,
  };

  return roleHierarchy[managerRole] > roleHierarchy[targetRole];
}
