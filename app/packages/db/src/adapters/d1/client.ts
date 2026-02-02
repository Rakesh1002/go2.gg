/**
 * Cloudflare D1 Database Client
 *
 * Creates a Drizzle ORM client for Cloudflare D1 (SQLite).
 * D1 is Cloudflare's serverless SQL database.
 */

import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import type { D1Database as CloudflareD1Database } from "@cloudflare/workers-types";
import * as schema from "../../schema.js";

/** Drizzle-wrapped D1 database with schema types */
export type D1Database = DrizzleD1Database<typeof schema>;

/**
 * Creates a Drizzle client for D1.
 *
 * @param d1 - The D1 database binding from Cloudflare Workers
 * @returns Drizzle ORM client
 *
 * @example
 * ```typescript
 * // In your Hono handler
 * const db = createD1Client(env.DB);
 * const users = await db.select().from(schema.users);
 * ```
 */
export function createD1Client(d1: CloudflareD1Database): D1Database {
  return drizzle(d1, { schema });
}

/**
 * Type for the D1 binding in Cloudflare Workers environment.
 */
export interface D1Bindings {
  DB: CloudflareD1Database;
}
