/**
 * D1 Organization Repository Implementation
 */

import { eq } from "drizzle-orm";
import type { D1Database } from "../client.js";
import { organizations, type Organization, type NewOrganization } from "../../../schema.js";
import type { OrganizationRepository } from "../../../types.js";

export function createOrganizationRepository(db: D1Database): OrganizationRepository {
  return {
    async findById(id: string): Promise<Organization | null> {
      const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
      return result[0] ?? null;
    },

    async findBySlug(slug: string): Promise<Organization | null> {
      const result = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug.toLowerCase()))
        .limit(1);
      return result[0] ?? null;
    },

    async findByStripeCustomerId(customerId: string): Promise<Organization | null> {
      const result = await db
        .select()
        .from(organizations)
        .where(eq(organizations.stripeCustomerId, customerId))
        .limit(1);
      return result[0] ?? null;
    },

    async create(data: NewOrganization): Promise<Organization> {
      const id = data.id ?? crypto.randomUUID();
      const now = new Date().toISOString();

      const newOrg: NewOrganization = {
        ...data,
        id,
        slug: data.slug.toLowerCase(),
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(organizations).values(newOrg);

      const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
      if (!result[0]) {
        throw new Error("Failed to create organization");
      }
      return result[0];
    },

    async update(id: string, data: Partial<NewOrganization>): Promise<Organization> {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await db.update(organizations).set(updateData).where(eq(organizations.id, id));

      const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
      if (!result[0]) {
        throw new Error("Organization not found");
      }
      return result[0];
    },

    async delete(id: string): Promise<void> {
      await db.delete(organizations).where(eq(organizations.id, id));
    },
  };
}
