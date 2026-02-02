/**
 * D1 Organization Membership Repository Implementation
 */

import { eq, and } from "drizzle-orm";
import type { D1Database } from "../client.js";
import {
  organizationMembers,
  organizations,
  users,
  type OrganizationMember,
  type NewOrganizationMember,
  type OrganizationRole,
} from "../../../schema.js";
import type { MembershipRepository, MemberWithUser, UserOrganization } from "../../../types.js";

export function createMembershipRepository(db: D1Database): MembershipRepository {
  return {
    async findById(id: string): Promise<OrganizationMember | null> {
      const result = await db
        .select()
        .from(organizationMembers)
        .where(eq(organizationMembers.id, id))
        .limit(1);
      return result[0] ?? null;
    },

    async findByUserAndOrg(
      userId: string,
      organizationId: string
    ): Promise<OrganizationMember | null> {
      const result = await db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.organizationId, organizationId)
          )
        )
        .limit(1);
      return result[0] ?? null;
    },

    async findByOrganization(organizationId: string): Promise<MemberWithUser[]> {
      const result = await db
        .select({
          member: organizationMembers,
          user: users,
        })
        .from(organizationMembers)
        .innerJoin(users, eq(organizationMembers.userId, users.id))
        .where(eq(organizationMembers.organizationId, organizationId));

      return result.map(({ member, user }) => ({
        ...member,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
      }));
    },

    async findByUser(userId: string): Promise<UserOrganization[]> {
      const result = await db
        .select({
          member: organizationMembers,
          org: organizations,
        })
        .from(organizationMembers)
        .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
        .where(eq(organizationMembers.userId, userId));

      return result.map(({ member, org }) => ({
        ...member,
        organization: org,
      }));
    },

    async create(data: NewOrganizationMember): Promise<OrganizationMember> {
      const id = data.id ?? crypto.randomUUID();
      const now = new Date().toISOString();

      const newMember: NewOrganizationMember = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(organizationMembers).values(newMember);

      const result = await db
        .select()
        .from(organizationMembers)
        .where(eq(organizationMembers.id, id))
        .limit(1);
      if (!result[0]) {
        throw new Error("Failed to create membership");
      }
      return result[0];
    },

    async updateRole(id: string, role: OrganizationRole): Promise<OrganizationMember> {
      const now = new Date().toISOString();

      await db
        .update(organizationMembers)
        .set({ role, updatedAt: now })
        .where(eq(organizationMembers.id, id));

      const result = await db
        .select()
        .from(organizationMembers)
        .where(eq(organizationMembers.id, id))
        .limit(1);
      if (!result[0]) {
        throw new Error("Membership not found");
      }
      return result[0];
    },

    async delete(id: string): Promise<void> {
      await db.delete(organizationMembers).where(eq(organizationMembers.id, id));
    },

    async deleteByUserAndOrg(userId: string, organizationId: string): Promise<void> {
      await db
        .delete(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.organizationId, organizationId)
          )
        );
    },

    async countByOrganization(organizationId: string): Promise<number> {
      const result = await db
        .select()
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, organizationId));
      return result.length;
    },
  };
}
