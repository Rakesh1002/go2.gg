/**
 * D1 Database Adapter
 *
 * Provides database access for Cloudflare D1 (SQLite).
 */

export { createD1Client, type D1Database, type D1Bindings } from "./client.js";
export { createUserRepository } from "./repositories/user.repository.js";
export { createOrganizationRepository } from "./repositories/organization.repository.js";
export { createSubscriptionRepository } from "./repositories/subscription.repository.js";
export { createPurchaseRepository } from "./repositories/purchase.repository.js";
export { createMembershipRepository } from "./repositories/membership.repository.js";

import type { D1Database } from "./client.js";
import { createUserRepository } from "./repositories/user.repository.js";
import { createOrganizationRepository } from "./repositories/organization.repository.js";
import { createSubscriptionRepository } from "./repositories/subscription.repository.js";
import { createPurchaseRepository } from "./repositories/purchase.repository.js";
import { createMembershipRepository } from "./repositories/membership.repository.js";
import type {
  UserRepository,
  OrganizationRepository,
  SubscriptionRepository,
  PurchaseRepository,
  MembershipRepository,
} from "../../types.js";

/**
 * All D1 repositories bundled together.
 */
export interface D1Repositories {
  users: UserRepository;
  organizations: OrganizationRepository;
  subscriptions: SubscriptionRepository;
  purchases: PurchaseRepository;
  members: MembershipRepository;
}

/**
 * Creates all D1 repositories from a database client.
 */
export function createD1Repositories(db: D1Database): D1Repositories {
  return {
    users: createUserRepository(db),
    organizations: createOrganizationRepository(db),
    subscriptions: createSubscriptionRepository(db),
    purchases: createPurchaseRepository(db),
    members: createMembershipRepository(db),
  };
}
