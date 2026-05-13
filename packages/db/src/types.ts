/**
 * Shared Types for Database Layer
 *
 * These types are used across all adapters to ensure consistency.
 */

import type {
  User,
  NewUser,
  Organization,
  NewOrganization,
  OrganizationMember,
  NewOrganizationMember,
  Subscription,
  NewSubscription,
  OrganizationRole,
  Invitation,
  NewInvitation,
  Affiliate,
  NewAffiliate,
  Referral,
  NewReferral,
  UserMetadata,
  NewUserMetadata,
  Purchase,
  NewPurchase,
} from "./schema.js";

// -----------------------------------------------------------------------------
// Repository Interfaces
// -----------------------------------------------------------------------------

/**
 * Base repository interface.
 * All repositories should extend this.
 */
export interface BaseRepository<T, TNew, TUpdate = Partial<TNew>> {
  findById(id: string): Promise<T | null>;
  create(data: TNew): Promise<T>;
  update(id: string, data: TUpdate): Promise<T>;
  delete(id: string): Promise<void>;
}

/**
 * User repository interface.
 */
export interface UserRepository extends BaseRepository<User, NewUser> {
  findByEmail(email: string): Promise<User | null>;
}

/**
 * Organization repository interface.
 */
export interface OrganizationRepository extends BaseRepository<Organization, NewOrganization> {
  findBySlug(slug: string): Promise<Organization | null>;
  findByStripeCustomerId(customerId: string): Promise<Organization | null>;
}

/**
 * Organization member repository interface.
 */
export interface OrganizationMemberRepository {
  findByOrgAndUser(orgId: string, userId: string): Promise<OrganizationMember | null>;
  findByOrganization(orgId: string): Promise<OrganizationMember[]>;
  findByUser(userId: string): Promise<OrganizationMember[]>;
  create(data: NewOrganizationMember): Promise<OrganizationMember>;
  updateRole(id: string, role: OrganizationRole): Promise<OrganizationMember>;
  delete(id: string): Promise<void>;
}

/**
 * Subscription repository interface.
 */
export interface SubscriptionRepository extends BaseRepository<Subscription, NewSubscription> {
  findByOrganization(orgId: string): Promise<Subscription | null>;
  findByStripeSubscriptionId(stripeId: string): Promise<Subscription | null>;
  findActiveByOrganization(orgId: string): Promise<Subscription | null>;
}

/**
 * Membership repository interface (enhanced).
 */
export interface MemberWithUser extends OrganizationMember {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export interface UserOrganization extends OrganizationMember {
  organization: Organization;
}

export interface MembershipRepository {
  findById(id: string): Promise<OrganizationMember | null>;
  findByUserAndOrg(userId: string, organizationId: string): Promise<OrganizationMember | null>;
  findByOrganization(organizationId: string): Promise<MemberWithUser[]>;
  findByUser(userId: string): Promise<UserOrganization[]>;
  create(data: NewOrganizationMember): Promise<OrganizationMember>;
  updateRole(id: string, role: OrganizationRole): Promise<OrganizationMember>;
  delete(id: string): Promise<void>;
  deleteByUserAndOrg(userId: string, organizationId: string): Promise<void>;
  countByOrganization(organizationId: string): Promise<number>;
}

/**
 * Invitation repository interface.
 */
export interface InvitationRepository {
  findById(id: string): Promise<Invitation | null>;
  findByToken(token: string): Promise<Invitation | null>;
  findByOrganization(organizationId: string): Promise<Invitation[]>;
  findPendingByEmail(email: string): Promise<Invitation[]>;
  findPendingByEmailAndOrg(email: string, organizationId: string): Promise<Invitation | null>;
  create(data: NewInvitation): Promise<Invitation>;
  accept(id: string): Promise<Invitation>;
  revoke(id: string): Promise<void>;
  expireOld(): Promise<number>;
  delete(id: string): Promise<void>;
}

/**
 * Affiliate repository interface.
 */
export interface AffiliateRepository {
  findById(id: string): Promise<Affiliate | null>;
  findByUserId(userId: string): Promise<Affiliate | null>;
  findByCode(code: string): Promise<Affiliate | null>;
  findAll(options?: PaginationOptions): Promise<Affiliate[]>;
  create(data: NewAffiliate): Promise<Affiliate>;
  update(id: string, data: Partial<NewAffiliate>): Promise<Affiliate>;
  updateEarnings(id: string, earnings: { pending?: number; paid?: number }): Promise<Affiliate>;
  delete(id: string): Promise<void>;
}

/**
 * Referral repository interface.
 */
export interface ReferralRepository {
  findById(id: string): Promise<Referral | null>;
  findByAffiliate(affiliateId: string): Promise<Referral[]>;
  findByReferredUser(userId: string): Promise<Referral | null>;
  create(data: NewReferral): Promise<Referral>;
  markConverted(
    id: string,
    purchaseId: string,
    amount: number,
    commission: number
  ): Promise<Referral>;
  markPaid(id: string): Promise<Referral>;
}

/**
 * User metadata repository interface.
 */
export interface UserMetadataRepository {
  findByUserId(userId: string): Promise<UserMetadata | null>;
  create(data: NewUserMetadata): Promise<UserMetadata>;
  update(userId: string, data: Partial<NewUserMetadata>): Promise<UserMetadata>;
  setAdmin(userId: string, isAdmin: boolean): Promise<UserMetadata>;
  setBanned(userId: string, isBanned: boolean, reason?: string): Promise<UserMetadata>;
  incrementLoginCount(userId: string): Promise<void>;
}

/**
 * Purchase repository interface.
 * Handles boilerplate license purchases.
 */
export interface PurchaseRepository {
  findById(id: string): Promise<Purchase | null>;
  findByEmail(email: string): Promise<Purchase[]>;
  findByStripeSessionId(sessionId: string): Promise<Purchase | null>;
  findByGithubUsername(username: string): Promise<Purchase[]>;
  create(data: NewPurchase): Promise<Purchase>;
  update(id: string, data: Partial<NewPurchase>): Promise<Purchase>;
  grantGithubAccess(id: string): Promise<Purchase>;
  refund(id: string): Promise<Purchase>;
}

// -----------------------------------------------------------------------------
// Query Options
// -----------------------------------------------------------------------------

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface SortOptions<T = string> {
  field: T;
  direction: "asc" | "desc";
}

// -----------------------------------------------------------------------------
// Database Client Types
// -----------------------------------------------------------------------------

export type DatabaseClient = "d1" | "supabase";

export interface DatabaseConfig {
  client: DatabaseClient;
}

// -----------------------------------------------------------------------------
// Transaction Support
// -----------------------------------------------------------------------------

export type TransactionCallback<T> = (tx: unknown) => Promise<T>;

export interface TransactionSupport {
  transaction<T>(callback: TransactionCallback<T>): Promise<T>;
}
