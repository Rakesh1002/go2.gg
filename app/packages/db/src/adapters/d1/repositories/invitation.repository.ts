/**
 * D1 Invitation Repository Implementation
 */

import { eq, and, lt } from "drizzle-orm";
import type { D1Database } from "../client.js";
import { invitations, type Invitation, type NewInvitation } from "../../../schema.js";
import type { InvitationRepository } from "../../../types.js";

export function createInvitationRepository(db: D1Database): InvitationRepository {
  return {
    async findById(id: string): Promise<Invitation | null> {
      const result = await db.select().from(invitations).where(eq(invitations.id, id)).limit(1);
      return result[0] ?? null;
    },

    async findByToken(token: string): Promise<Invitation | null> {
      const result = await db
        .select()
        .from(invitations)
        .where(eq(invitations.token, token))
        .limit(1);
      return result[0] ?? null;
    },

    async findByOrganization(organizationId: string): Promise<Invitation[]> {
      return db.select().from(invitations).where(eq(invitations.organizationId, organizationId));
    },

    async findPendingByEmail(email: string): Promise<Invitation[]> {
      return db
        .select()
        .from(invitations)
        .where(and(eq(invitations.email, email.toLowerCase()), eq(invitations.status, "pending")));
    },

    async findPendingByEmailAndOrg(
      email: string,
      organizationId: string
    ): Promise<Invitation | null> {
      const result = await db
        .select()
        .from(invitations)
        .where(
          and(
            eq(invitations.email, email.toLowerCase()),
            eq(invitations.organizationId, organizationId),
            eq(invitations.status, "pending")
          )
        )
        .limit(1);
      return result[0] ?? null;
    },

    async create(data: NewInvitation): Promise<Invitation> {
      const id = data.id ?? crypto.randomUUID();
      const token = data.token ?? crypto.randomUUID();
      const now = new Date().toISOString();

      // Default expiration: 7 days from now
      const expiresAt =
        data.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const newInvitation: NewInvitation = {
        ...data,
        id,
        token,
        email: data.email.toLowerCase(),
        expiresAt,
        createdAt: now,
      };

      await db.insert(invitations).values(newInvitation);

      const result = await db.select().from(invitations).where(eq(invitations.id, id)).limit(1);
      if (!result[0]) {
        throw new Error("Failed to create invitation");
      }
      return result[0];
    },

    async accept(id: string): Promise<Invitation> {
      const now = new Date().toISOString();

      await db
        .update(invitations)
        .set({
          status: "accepted",
          acceptedAt: now,
        })
        .where(eq(invitations.id, id));

      const result = await db.select().from(invitations).where(eq(invitations.id, id)).limit(1);
      if (!result[0]) {
        throw new Error("Invitation not found");
      }
      return result[0];
    },

    async revoke(id: string): Promise<void> {
      await db.update(invitations).set({ status: "revoked" }).where(eq(invitations.id, id));
    },

    async expireOld(): Promise<number> {
      const now = new Date().toISOString();
      const result = await db
        .update(invitations)
        .set({ status: "expired" })
        .where(and(eq(invitations.status, "pending"), lt(invitations.expiresAt, now)));
      return result.rowsAffected ?? 0;
    },

    async delete(id: string): Promise<void> {
      await db.delete(invitations).where(eq(invitations.id, id));
    },
  };
}
