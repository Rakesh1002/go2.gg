/**
 * D1 Purchase Repository Implementation
 *
 * Handles boilerplate license purchases.
 */

import { eq, desc } from "drizzle-orm";
import type { D1Database } from "../client.js";
import { purchases, type Purchase, type NewPurchase } from "../../../schema.js";
import type { PurchaseRepository } from "../../../types.js";

export function createPurchaseRepository(db: D1Database): PurchaseRepository {
  return {
    async findById(id: string): Promise<Purchase | null> {
      const result = await db.select().from(purchases).where(eq(purchases.id, id)).limit(1);
      return result[0] ?? null;
    },

    async findByEmail(email: string): Promise<Purchase[]> {
      return db
        .select()
        .from(purchases)
        .where(eq(purchases.email, email))
        .orderBy(desc(purchases.createdAt));
    },

    async findByStripeSessionId(sessionId: string): Promise<Purchase | null> {
      const result = await db
        .select()
        .from(purchases)
        .where(eq(purchases.stripeSessionId, sessionId))
        .limit(1);
      return result[0] ?? null;
    },

    async findByGithubUsername(username: string): Promise<Purchase[]> {
      return db
        .select()
        .from(purchases)
        .where(eq(purchases.githubUsername, username))
        .orderBy(desc(purchases.createdAt));
    },

    async create(data: NewPurchase): Promise<Purchase> {
      const id = data.id ?? crypto.randomUUID();
      const now = new Date().toISOString();

      const newPurchase: NewPurchase = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(purchases).values(newPurchase);

      const result = await db.select().from(purchases).where(eq(purchases.id, id)).limit(1);
      if (!result[0]) {
        throw new Error("Failed to create purchase");
      }
      return result[0];
    },

    async update(id: string, data: Partial<NewPurchase>): Promise<Purchase> {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await db.update(purchases).set(updateData).where(eq(purchases.id, id));

      const result = await db.select().from(purchases).where(eq(purchases.id, id)).limit(1);
      if (!result[0]) {
        throw new Error("Purchase not found");
      }
      return result[0];
    },

    async grantGithubAccess(id: string): Promise<Purchase> {
      return this.update(id, {
        githubAccessGranted: true,
        githubAccessGrantedAt: new Date().toISOString(),
      });
    },

    async refund(id: string): Promise<Purchase> {
      return this.update(id, {
        status: "refunded",
        refundedAt: new Date().toISOString(),
      });
    },
  };
}
