/**
 * D1 User Repository Implementation
 */

import { eq } from "drizzle-orm";
import type { D1Database } from "../client.js";
import { users, type User, type NewUser } from "../../../schema.js";
import type { UserRepository } from "../../../types.js";

export function createUserRepository(db: D1Database): UserRepository {
  return {
    async findById(id: string): Promise<User | null> {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0] ?? null;
    },

    async findByEmail(email: string): Promise<User | null> {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      return result[0] ?? null;
    },

    async create(data: NewUser): Promise<User> {
      const id = data.id ?? crypto.randomUUID();
      const now = new Date().toISOString();

      const newUser: NewUser = {
        ...data,
        id,
        email: data.email.toLowerCase(),
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(users).values(newUser);

      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!result[0]) {
        throw new Error("Failed to create user");
      }
      return result[0];
    },

    async update(id: string, data: Partial<NewUser>): Promise<User> {
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await db.update(users).set(updateData).where(eq(users.id, id));

      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!result[0]) {
        throw new Error("User not found");
      }
      return result[0];
    },

    async delete(id: string): Promise<void> {
      await db.delete(users).where(eq(users.id, id));
    },
  };
}
