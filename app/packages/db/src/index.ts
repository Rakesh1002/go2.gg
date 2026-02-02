/**
 * @repo/db - Database Abstraction Layer
 *
 * This package provides:
 * - Drizzle ORM schema definitions
 * - Repository pattern implementation
 * - D1 adapter for Cloudflare
 *
 * Usage:
 * ```typescript
 * // D1 (Cloudflare Workers)
 * import { createD1Client, createD1Repositories } from "@repo/db/d1";
 * const db = createD1Client(env.DB);
 * const repos = createD1Repositories(db);
 * const user = await repos.users.findById("123");
 * ```
 */

// Schema exports
export * from "./schema.js";

// Type exports
export type {
  UserRepository,
  OrganizationRepository,
  OrganizationMemberRepository,
  SubscriptionRepository,
  BaseRepository,
  PaginationOptions,
  SortOptions,
  DatabaseClient,
  DatabaseConfig,
  TransactionCallback,
  TransactionSupport,
} from "./types.js";

// D1 adapter exports
export {
  createD1Client,
  createD1Repositories,
  createUserRepository as createD1UserRepository,
  createOrganizationRepository as createD1OrganizationRepository,
  createSubscriptionRepository as createD1SubscriptionRepository,
  type D1Database,
  type D1Bindings,
  type D1Repositories,
} from "./adapters/d1/index.js";
