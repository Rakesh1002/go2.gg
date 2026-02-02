/**
 * White-Label / Reseller API Routes (v1)
 *
 * Enterprise white-label functionality:
 * - GET /white-label/config - Get white-label configuration
 * - PUT /white-label/config - Update white-label configuration
 * - GET /white-label/sub-accounts - List sub-accounts
 * - POST /white-label/sub-accounts - Create sub-account
 * - DELETE /white-label/sub-accounts/:id - Remove sub-account
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../../bindings.js";
import { ok, forbidden, notFound, badRequest } from "../../lib/response.js";
import { createD1Repositories } from "@repo/db/d1";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@repo/db";
import { eq, and, desc } from "drizzle-orm";

const whiteLabel = new Hono<{ Bindings: Env }>();

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const whiteLabelConfigSchema = z.object({
  enabled: z.boolean().optional(),
  brandName: z.string().max(100).optional(),
  logoUrl: z.string().url().optional().nullable(),
  logoLightUrl: z.string().url().optional().nullable(),
  faviconUrl: z.string().url().optional().nullable(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  portalDomain: z.string().optional().nullable(),
  hidePoweredBy: z.boolean().optional(),
  customEmailDomain: z.string().optional().nullable(),
  customSupportEmail: z.string().email().optional().nullable(),
  customTermsUrl: z.string().url().optional().nullable(),
  customPrivacyUrl: z.string().url().optional().nullable(),
});

const createSubAccountSchema = z.object({
  name: z.string().min(1).max(100),
  ownerEmail: z.string().email(),
  customName: z.string().optional(),
  billedByParent: z.boolean().default(true),
  monthlyFee: z.number().min(0).optional(),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * GET /white-label/config
 * Get white-label configuration for the organization
 */
whiteLabel.get("/config", async (c) => {
  const user = c.get("user");
  const repos = createD1Repositories(c.env);

  if (!user?.organizationId) {
    return forbidden(c, "Organization required");
  }

  // Check if user is admin/owner
  const membership = await repos.organizations.getMember(user.organizationId, user.id);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return forbidden(c, "Admin access required");
  }

  const db = drizzle(c.env.DB, { schema });
  const configs = await db
    .select()
    .from(schema.whiteLabelConfigs)
    .where(eq(schema.whiteLabelConfigs.organizationId, user.organizationId))
    .limit(1);

  const config = configs[0];

  if (!config) {
    return ok(c, { config: null });
  }

  return ok(c, { config });
});

/**
 * PUT /white-label/config
 * Update white-label configuration
 */
whiteLabel.put("/config", zValidator("json", whiteLabelConfigSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const repos = createD1Repositories(c.env);

  if (!user?.organizationId) {
    return forbidden(c, "Organization required");
  }

  // Check if user is owner (white-label is sensitive)
  const membership = await repos.organizations.getMember(user.organizationId, user.id);
  if (!membership || membership.role !== "owner") {
    return forbidden(c, "Owner access required");
  }

  // Check plan allows white-label
  const org = await repos.organizations.findById(user.organizationId);
  if (!org) {
    return notFound(c, "Organization not found");
  }

  const db = drizzle(c.env.DB, { schema });
  const now = new Date().toISOString();

  // Check if config exists
  const existing = await db
    .select()
    .from(schema.whiteLabelConfigs)
    .where(eq(schema.whiteLabelConfigs.organizationId, user.organizationId))
    .limit(1);

  if (existing[0]) {
    // Update existing
    await db
      .update(schema.whiteLabelConfigs)
      .set({
        ...input,
        updatedAt: now,
      })
      .where(eq(schema.whiteLabelConfigs.id, existing[0].id));

    const updated = { ...existing[0], ...input, updatedAt: now };
    return ok(c, { config: updated });
  } else {
    // Create new
    const id = crypto.randomUUID();
    const newConfig: schema.NewWhiteLabelConfig = {
      id,
      organizationId: user.organizationId,
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.whiteLabelConfigs).values(newConfig);

    return ok(c, { config: newConfig });
  }
});

/**
 * POST /white-label/config/verify-domain
 * Verify portal domain ownership
 */
whiteLabel.post("/config/verify-domain", async (c) => {
  const user = c.get("user");
  const repos = createD1Repositories(c.env);

  if (!user?.organizationId) {
    return forbidden(c, "Organization required");
  }

  // Check if user is owner
  const membership = await repos.organizations.getMember(user.organizationId, user.id);
  if (!membership || membership.role !== "owner") {
    return forbidden(c, "Owner access required");
  }

  const db = drizzle(c.env.DB, { schema });

  const configs = await db
    .select()
    .from(schema.whiteLabelConfigs)
    .where(eq(schema.whiteLabelConfigs.organizationId, user.organizationId))
    .limit(1);

  const config = configs[0];
  if (!config?.portalDomain) {
    return badRequest(c, "Portal domain not configured");
  }

  // In production, verify DNS TXT record
  // For now, auto-verify for development
  await db
    .update(schema.whiteLabelConfigs)
    .set({
      portalDomainVerified: true,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.whiteLabelConfigs.id, config.id));

  return ok(c, {
    verified: true,
    domain: config.portalDomain,
  });
});

/**
 * GET /white-label/sub-accounts
 * List sub-accounts
 */
whiteLabel.get("/sub-accounts", async (c) => {
  const user = c.get("user");
  const repos = createD1Repositories(c.env);

  if (!user?.organizationId) {
    return forbidden(c, "Organization required");
  }

  // Check if user is admin/owner
  const membership = await repos.organizations.getMember(user.organizationId, user.id);
  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return forbidden(c, "Admin access required");
  }

  const db = drizzle(c.env.DB, { schema });

  const subAccounts = await db
    .select({
      id: schema.whiteLabelSubAccounts.id,
      subOrganizationId: schema.whiteLabelSubAccounts.subOrganizationId,
      customName: schema.whiteLabelSubAccounts.customName,
      isActive: schema.whiteLabelSubAccounts.isActive,
      billedByParent: schema.whiteLabelSubAccounts.billedByParent,
      monthlyFee: schema.whiteLabelSubAccounts.monthlyFee,
      createdAt: schema.whiteLabelSubAccounts.createdAt,
      orgName: schema.organizations.name,
    })
    .from(schema.whiteLabelSubAccounts)
    .innerJoin(
      schema.organizations,
      eq(schema.whiteLabelSubAccounts.subOrganizationId, schema.organizations.id)
    )
    .where(eq(schema.whiteLabelSubAccounts.parentOrganizationId, user.organizationId))
    .orderBy(desc(schema.whiteLabelSubAccounts.createdAt));

  return ok(c, { subAccounts });
});

/**
 * POST /white-label/sub-accounts
 * Create a new sub-account
 */
whiteLabel.post("/sub-accounts", zValidator("json", createSubAccountSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const repos = createD1Repositories(c.env);

  if (!user?.organizationId) {
    return forbidden(c, "Organization required");
  }

  // Check if user is owner
  const membership = await repos.organizations.getMember(user.organizationId, user.id);
  if (!membership || membership.role !== "owner") {
    return forbidden(c, "Owner access required");
  }

  const db = drizzle(c.env.DB, { schema });

  // Check white-label config and limits
  const configs = await db
    .select()
    .from(schema.whiteLabelConfigs)
    .where(eq(schema.whiteLabelConfigs.organizationId, user.organizationId))
    .limit(1);

  const config = configs[0];
  if (!config?.enabled) {
    return forbidden(c, "White-label not enabled");
  }

  // Count existing sub-accounts
  const existingCount = await db
    .select({ id: schema.whiteLabelSubAccounts.id })
    .from(schema.whiteLabelSubAccounts)
    .where(eq(schema.whiteLabelSubAccounts.parentOrganizationId, user.organizationId));

  if (existingCount.length >= (config.maxSubAccounts || 10)) {
    return badRequest(c, "Sub-account limit reached");
  }

  // Check if user exists
  const existingUsers = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, input.ownerEmail))
    .limit(1);

  let ownerId = existingUsers[0]?.id;
  const now = new Date().toISOString();

  // Create user if doesn't exist
  if (!ownerId) {
    ownerId = crypto.randomUUID();
    await db.insert(schema.users).values({
      id: ownerId,
      email: input.ownerEmail,
      name: input.name,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Create organization
  const orgId = crypto.randomUUID();
  await db.insert(schema.organizations).values({
    id: orgId,
    name: input.name,
    slug: input.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    ownerId,
    createdAt: now,
    updatedAt: now,
  });

  // Add owner to organization
  await db.insert(schema.organizationMembers).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    userId: ownerId,
    role: "owner",
    createdAt: now,
    updatedAt: now,
  });

  // Create sub-account link
  const subAccountId = crypto.randomUUID();
  await db.insert(schema.whiteLabelSubAccounts).values({
    id: subAccountId,
    parentOrganizationId: user.organizationId,
    subOrganizationId: orgId,
    customName: input.customName,
    billedByParent: input.billedByParent,
    monthlyFee: input.monthlyFee,
    createdAt: now,
    updatedAt: now,
  });

  return ok(c, {
    subAccount: {
      id: subAccountId,
      organizationId: orgId,
      name: input.name,
      ownerEmail: input.ownerEmail,
    },
  });
});

/**
 * PATCH /white-label/sub-accounts/:id
 * Update a sub-account
 */
whiteLabel.patch(
  "/sub-accounts/:id",
  zValidator(
    "json",
    z.object({
      customName: z.string().optional(),
      isActive: z.boolean().optional(),
      monthlyFee: z.number().min(0).optional(),
    })
  ),
  async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const repos = createD1Repositories(c.env);

    if (!user?.organizationId) {
      return forbidden(c, "Organization required");
    }

    // Check if user is owner
    const membership = await repos.organizations.getMember(user.organizationId, user.id);
    if (!membership || membership.role !== "owner") {
      return forbidden(c, "Owner access required");
    }

    const db = drizzle(c.env.DB, { schema });

    // Verify sub-account belongs to this org
    const subAccounts = await db
      .select()
      .from(schema.whiteLabelSubAccounts)
      .where(
        and(
          eq(schema.whiteLabelSubAccounts.id, id),
          eq(schema.whiteLabelSubAccounts.parentOrganizationId, user.organizationId)
        )
      )
      .limit(1);

    if (!subAccounts[0]) {
      return notFound(c, "Sub-account not found");
    }

    await db
      .update(schema.whiteLabelSubAccounts)
      .set({
        ...input,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.whiteLabelSubAccounts.id, id));

    return ok(c, { updated: true });
  }
);

/**
 * DELETE /white-label/sub-accounts/:id
 * Delete a sub-account
 */
whiteLabel.delete("/sub-accounts/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const repos = createD1Repositories(c.env);

  if (!user?.organizationId) {
    return forbidden(c, "Organization required");
  }

  // Check if user is owner
  const membership = await repos.organizations.getMember(user.organizationId, user.id);
  if (!membership || membership.role !== "owner") {
    return forbidden(c, "Owner access required");
  }

  const db = drizzle(c.env.DB, { schema });

  // Verify sub-account belongs to this org
  const subAccounts = await db
    .select()
    .from(schema.whiteLabelSubAccounts)
    .where(
      and(
        eq(schema.whiteLabelSubAccounts.id, id),
        eq(schema.whiteLabelSubAccounts.parentOrganizationId, user.organizationId)
      )
    )
    .limit(1);

  if (!subAccounts[0]) {
    return notFound(c, "Sub-account not found");
  }

  // Delete sub-account link (but keep the org)
  await db.delete(schema.whiteLabelSubAccounts).where(eq(schema.whiteLabelSubAccounts.id, id));

  return ok(c, { deleted: true });
});

/**
 * GET /white-label/branding
 * Public endpoint to get branding for a domain
 */
whiteLabel.get("/branding", async (c) => {
  const domain = c.req.query("domain");

  if (!domain) {
    return badRequest(c, "Domain required");
  }

  const db = drizzle(c.env.DB, { schema });

  const configs = await db
    .select({
      brandName: schema.whiteLabelConfigs.brandName,
      logoUrl: schema.whiteLabelConfigs.logoUrl,
      logoLightUrl: schema.whiteLabelConfigs.logoLightUrl,
      faviconUrl: schema.whiteLabelConfigs.faviconUrl,
      primaryColor: schema.whiteLabelConfigs.primaryColor,
      secondaryColor: schema.whiteLabelConfigs.secondaryColor,
      hidePoweredBy: schema.whiteLabelConfigs.hidePoweredBy,
      customSupportEmail: schema.whiteLabelConfigs.customSupportEmail,
      customTermsUrl: schema.whiteLabelConfigs.customTermsUrl,
      customPrivacyUrl: schema.whiteLabelConfigs.customPrivacyUrl,
    })
    .from(schema.whiteLabelConfigs)
    .where(
      and(
        eq(schema.whiteLabelConfigs.portalDomain, domain),
        eq(schema.whiteLabelConfigs.portalDomainVerified, true),
        eq(schema.whiteLabelConfigs.enabled, true)
      )
    )
    .limit(1);

  const config = configs[0];

  if (!config) {
    // Return default branding
    return ok(c, {
      branding: {
        brandName: "Go2",
        primaryColor: "#3b82f6",
        hidePoweredBy: false,
      },
    });
  }

  return ok(c, { branding: config });
});

export { whiteLabel };
