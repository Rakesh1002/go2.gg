/**
 * D1 Subscription Repository Implementation
 */

import { eq, and, inArray } from "drizzle-orm";
import type { D1Database } from "../client.js";
import { subscriptions, type Subscription, type NewSubscription } from "../../../schema.js";
import type { SubscriptionRepository } from "../../../types.js";

export function createSubscriptionRepository(db: D1Database): SubscriptionRepository {
  return {
    async findById(id: string): Promise<Subscription | null> {
      const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
      return result[0] ?? null;
    },

    async findByOrganization(orgId: string): Promise<Subscription | null> {
      const result = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.organizationId, orgId))
        .limit(1);
      return result[0] ?? null;
    },

    async findByStripeSubscriptionId(stripeId: string): Promise<Subscription | null> {
      const result = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, stripeId))
        .limit(1);
      return result[0] ?? null;
    },

    async findActiveByOrganization(orgId: string): Promise<Subscription | null> {
      const result = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.organizationId, orgId),
            inArray(subscriptions.status, ["active", "trialing"])
          )
        )
        .limit(1);
      return result[0] ?? null;
    },

    async create(data: NewSubscription): Promise<Subscription> {
      const id = data.id ?? crypto.randomUUID();
      const now = new Date().toISOString();

      const newSub: NewSubscription = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(subscriptions).values(newSub);

      const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
      if (!result[0]) {
        throw new Error("Failed to create subscription");
      }
      return result[0];
    },

    async update(id: string, data: Partial<NewSubscription>): Promise<Subscription> {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await db.update(subscriptions).set(updateData).where(eq(subscriptions.id, id));

      const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
      if (!result[0]) {
        throw new Error("Subscription not found");
      }
      return result[0];
    },

    async delete(id: string): Promise<void> {
      await db.delete(subscriptions).where(eq(subscriptions.id, id));
    },
  };
}
