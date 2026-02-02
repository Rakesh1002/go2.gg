/**
 * Organization Routes (v1)
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok, created, notFound, forbidden } from "../../lib/response.js";

const organizations = new Hono<{ Bindings: Env }>();

// All routes require authentication (supports both API keys and session auth)
organizations.use("/*", apiKeyAuthMiddleware());

/**
 * GET /organizations
 * List organizations for current user
 */
organizations.get("/", async (c) => {
  const user = c.get("user");
  const db = drizzle(c.env.DB, { schema });

  // Get user's organization memberships
  const memberships = await db
    .select()
    .from(schema.organizationMembers)
    .where(eq(schema.organizationMembers.userId, user.id));

  if (memberships.length === 0) {
    return ok(c, []);
  }

  // Get the organizations
  const orgIds = memberships.map((m) => m.organizationId);
  const orgs = await db
    .select()
    .from(schema.organizations)
    .where(inArray(schema.organizations.id, orgIds));

  // Combine with role info
  const result = orgs.map((org) => {
    const membership = memberships.find((m) => m.organizationId === org.id);
    return { ...org, role: membership?.role };
  });

  return ok(c, result);
});

/**
 * GET /organizations/check-slug/:slug
 * Check if a slug is available
 * Used by frontend for real-time availability feedback
 */
organizations.get("/check-slug/:slug", async (c) => {
  const slug = c.req.param("slug").toLowerCase();
  const db = drizzle(c.env.DB, { schema });

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug) || slug.length < 2 || slug.length > 50) {
    return c.json({
      success: true,
      data: {
        available: false,
        reason: "Invalid slug format. Use lowercase letters, numbers, and hyphens only.",
      },
    });
  }

  // Check if slug exists
  const existing = await db
    .select({ id: schema.organizations.id })
    .from(schema.organizations)
    .where(eq(schema.organizations.slug, slug))
    .limit(1);

  return ok(c, {
    slug,
    available: existing.length === 0,
  });
});

/**
 * POST /organizations
 * Create a new organization
 */
const createOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
});

organizations.post("/", zValidator("json", createOrgSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Check if slug is already taken
  const existing = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.slug, input.slug))
    .limit(1);

  if (existing.length > 0) {
    return c.json(
      {
        success: false,
        error: { code: "SLUG_TAKEN", message: "Organization slug is already taken" },
      },
      409
    );
  }

  const orgId = crypto.randomUUID();

  // Create organization
  await db.insert(schema.organizations).values({
    id: orgId,
    name: input.name,
    slug: input.slug,
  });

  // Add creator as owner
  await db.insert(schema.organizationMembers).values({
    id: crypto.randomUUID(),
    organizationId: orgId,
    userId: user.id,
    role: "owner",
  });

  // Get the created org
  const [org] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId));

  return created(c, { ...org, role: "owner" });
});

/**
 * GET /organizations/:id
 * Get organization by ID
 */
organizations.get("/:id", async (c) => {
  const user = c.get("user");
  const orgId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  // Check membership
  const [membership] = await db
    .select()
    .from(schema.organizationMembers)
    .where(
      and(
        eq(schema.organizationMembers.organizationId, orgId),
        eq(schema.organizationMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!membership) {
    return forbidden(c, "Not a member of this organization");
  }

  const [org] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))
    .limit(1);

  if (!org) {
    return notFound(c, "Organization not found");
  }

  return ok(c, { ...org, role: membership.role });
});

/**
 * PATCH /organizations/:id
 * Update organization (name, slug, or logo)
 *
 * Industry standard: Allow changing the slug with uniqueness check.
 * Internal UUID remains constant for foreign key references.
 */
const updateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens only")
    .optional(),
  logoUrl: z.string().url().optional().nullable(),
});

organizations.patch("/:id", zValidator("json", updateOrgSchema), async (c) => {
  const user = c.get("user");
  const orgId = c.req.param("id");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Check admin/owner membership
  const [membership] = await db
    .select()
    .from(schema.organizationMembers)
    .where(
      and(
        eq(schema.organizationMembers.organizationId, orgId),
        eq(schema.organizationMembers.userId, user.id),
        inArray(schema.organizationMembers.role, ["owner", "admin"])
      )
    )
    .limit(1);

  if (!membership) {
    return forbidden(c, "Only admins can update organizations");
  }

  // If slug is being updated, check if it's already taken by another org
  if (input.slug) {
    const existingWithSlug = await db
      .select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, input.slug))
      .limit(1);

    if (existingWithSlug.length > 0 && existingWithSlug[0].id !== orgId) {
      return c.json(
        {
          success: false,
          error: {
            code: "SLUG_TAKEN",
            message: "This slug is already taken. Please choose a different one.",
          },
        },
        400
      );
    }
  }

  // Update organization
  await db
    .update(schema.organizations)
    .set({
      ...input,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.organizations.id, orgId));

  // Get updated org
  const [updated] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId));

  return ok(c, updated);
});

/**
 * DELETE /organizations/:id
 * Delete organization
 */
organizations.delete("/:id", async (c) => {
  const user = c.get("user");
  const orgId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  // Check owner membership
  const [membership] = await db
    .select()
    .from(schema.organizationMembers)
    .where(
      and(
        eq(schema.organizationMembers.organizationId, orgId),
        eq(schema.organizationMembers.userId, user.id),
        eq(schema.organizationMembers.role, "owner")
      )
    )
    .limit(1);

  if (!membership) {
    return forbidden(c, "Only owners can delete organizations");
  }

  // Delete organization (cascade will handle members, subscriptions, etc.)
  await db.delete(schema.organizations).where(eq(schema.organizations.id, orgId));

  return c.body(null, 204);
});

/**
 * GET /organizations/:id/members
 * List organization members
 */
organizations.get("/:id/members", async (c) => {
  const user = c.get("user");
  const orgId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  // Check membership
  const [membership] = await db
    .select()
    .from(schema.organizationMembers)
    .where(
      and(
        eq(schema.organizationMembers.organizationId, orgId),
        eq(schema.organizationMembers.userId, user.id)
      )
    )
    .limit(1);

  if (!membership) {
    return forbidden(c, "Not a member of this organization");
  }

  // Get all members
  const members = await db
    .select({
      id: schema.organizationMembers.id,
      userId: schema.organizationMembers.userId,
      role: schema.organizationMembers.role,
      createdAt: schema.organizationMembers.createdAt,
      user: {
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        avatarUrl: schema.users.avatarUrl,
      },
    })
    .from(schema.organizationMembers)
    .leftJoin(schema.users, eq(schema.organizationMembers.userId, schema.users.id))
    .where(eq(schema.organizationMembers.organizationId, orgId));

  return ok(c, members);
});

/**
 * POST /organizations/:id/members
 * Invite a member to the organization
 */
const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member"),
});

organizations.post("/:id/members", zValidator("json", inviteMemberSchema), async (c) => {
  const user = c.get("user");
  const orgId = c.req.param("id");
  const { email, role } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Check admin/owner membership
  const [membership] = await db
    .select()
    .from(schema.organizationMembers)
    .where(
      and(
        eq(schema.organizationMembers.organizationId, orgId),
        eq(schema.organizationMembers.userId, user.id),
        inArray(schema.organizationMembers.role, ["owner", "admin"])
      )
    )
    .limit(1);

  if (!membership) {
    return forbidden(c, "Only admins can invite members");
  }

  // Find user by email
  const [invitee] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  // Get organization for invite email
  const [org] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))
    .limit(1);

  if (!invitee) {
    // Store pending invite and queue invitation email
    const inviteToken = crypto.randomUUID();

    // Store invite in KV with expiry
    if (c.env.KV_CONFIG) {
      await c.env.KV_CONFIG.put(
        `invite:${inviteToken}`,
        JSON.stringify({
          email,
          organizationId: orgId,
          role,
          invitedBy: user.id,
          createdAt: new Date().toISOString(),
        }),
        { expirationTtl: 60 * 60 * 24 * 7 } // 7 days
      );
    }

    // Queue invitation email
    if (c.env.BACKGROUND_QUEUE) {
      await c.env.BACKGROUND_QUEUE.send({
        type: "email:send",
        payload: {
          to: email,
          template: "organization-invite",
          data: {
            organizationName: org?.name ?? "Organization",
            inviterName: user.email,
            inviteUrl: `${c.env.APP_URL}/invite/${inviteToken}`,
          },
        },
      });
    }

    return c.json({
      success: true,
      data: {
        status: "pending",
        email,
        message: "Invitation email sent",
      },
    });
  }

  // Check if already a member
  const [existingMember] = await db
    .select()
    .from(schema.organizationMembers)
    .where(
      and(
        eq(schema.organizationMembers.organizationId, orgId),
        eq(schema.organizationMembers.userId, invitee.id)
      )
    )
    .limit(1);

  if (existingMember) {
    return c.json(
      {
        success: false,
        error: { code: "ALREADY_MEMBER", message: "User is already a member" },
      },
      409
    );
  }

  // Add member
  const memberId = crypto.randomUUID();
  await db.insert(schema.organizationMembers).values({
    id: memberId,
    organizationId: orgId,
    userId: invitee.id,
    role,
  });

  return created(c, {
    id: memberId,
    userId: invitee.id,
    role,
    user: {
      id: invitee.id,
      email: invitee.email,
      name: invitee.name,
    },
  });
});

/**
 * DELETE /organizations/:id/members/:memberId
 * Remove a member from the organization
 */
organizations.delete("/:id/members/:memberId", async (c) => {
  const user = c.get("user");
  const orgId = c.req.param("id");
  const memberId = c.req.param("memberId");
  const db = drizzle(c.env.DB, { schema });

  // Check admin/owner membership
  const [currentMembership] = await db
    .select()
    .from(schema.organizationMembers)
    .where(
      and(
        eq(schema.organizationMembers.organizationId, orgId),
        eq(schema.organizationMembers.userId, user.id),
        inArray(schema.organizationMembers.role, ["owner", "admin"])
      )
    )
    .limit(1);

  if (!currentMembership) {
    return forbidden(c, "Only admins can remove members");
  }

  // Get target member
  const [targetMember] = await db
    .select()
    .from(schema.organizationMembers)
    .where(eq(schema.organizationMembers.id, memberId))
    .limit(1);

  if (!targetMember || targetMember.organizationId !== orgId) {
    return notFound(c, "Member not found");
  }

  // Can't remove owner
  if (targetMember.role === "owner") {
    return forbidden(c, "Cannot remove organization owner");
  }

  // Remove member
  await db.delete(schema.organizationMembers).where(eq(schema.organizationMembers.id, memberId));

  return c.body(null, 204);
});

/**
 * POST /organizations/accept-invite/:token
 * Accept a pending invitation
 */
organizations.post("/accept-invite/:token", async (c) => {
  const user = c.get("user");
  const token = c.req.param("token");
  const db = drizzle(c.env.DB, { schema });

  if (!c.env.KV_CONFIG) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_CONFIGURED", message: "Invites not configured" },
      },
      500
    );
  }

  // Get invite from KV
  const inviteData = await c.env.KV_CONFIG.get(`invite:${token}`);

  if (!inviteData) {
    return c.json(
      {
        success: false,
        error: { code: "INVALID_INVITE", message: "Invalid or expired invitation" },
      },
      400
    );
  }

  const invite = JSON.parse(inviteData) as {
    email: string;
    organizationId: string;
    role: string;
  };

  // Verify email matches
  if (invite.email !== user.email) {
    return c.json(
      {
        success: false,
        error: { code: "EMAIL_MISMATCH", message: "Invitation was sent to a different email" },
      },
      403
    );
  }

  // Check if already a member
  const [existingMember] = await db
    .select()
    .from(schema.organizationMembers)
    .where(
      and(
        eq(schema.organizationMembers.organizationId, invite.organizationId),
        eq(schema.organizationMembers.userId, user.id)
      )
    )
    .limit(1);

  if (existingMember) {
    // Delete the invite and return success
    await c.env.KV_CONFIG.delete(`invite:${token}`);
    return ok(c, { message: "Already a member of this organization" });
  }

  // Add member
  await db.insert(schema.organizationMembers).values({
    id: crypto.randomUUID(),
    organizationId: invite.organizationId,
    userId: user.id,
    role: invite.role as "admin" | "member",
  });

  // Delete the used invite
  await c.env.KV_CONFIG.delete(`invite:${token}`);

  // Get organization
  const [org] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, invite.organizationId))
    .limit(1);

  return ok(c, {
    message: "Successfully joined organization",
    organization: org,
    role: invite.role,
  });
});

/**
 * PATCH /organizations/:id/members/:memberId
 * Update member role
 */
const updateMemberSchema = z.object({
  role: z.enum(["admin", "member"]),
});

organizations.patch("/:id/members/:memberId", zValidator("json", updateMemberSchema), async (c) => {
  const user = c.get("user");
  const orgId = c.req.param("id");
  const memberId = c.req.param("memberId");
  const { role } = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  // Check owner membership (only owners can change roles)
  const [currentMembership] = await db
    .select()
    .from(schema.organizationMembers)
    .where(
      and(
        eq(schema.organizationMembers.organizationId, orgId),
        eq(schema.organizationMembers.userId, user.id),
        eq(schema.organizationMembers.role, "owner")
      )
    )
    .limit(1);

  if (!currentMembership) {
    return forbidden(c, "Only owners can change member roles");
  }

  // Get target member
  const [targetMember] = await db
    .select()
    .from(schema.organizationMembers)
    .where(eq(schema.organizationMembers.id, memberId))
    .limit(1);

  if (!targetMember || targetMember.organizationId !== orgId) {
    return notFound(c, "Member not found");
  }

  // Can't change owner's role
  if (targetMember.role === "owner") {
    return forbidden(c, "Cannot change owner's role");
  }

  // Update role
  await db
    .update(schema.organizationMembers)
    .set({ role, updatedAt: new Date().toISOString() })
    .where(eq(schema.organizationMembers.id, memberId));

  return ok(c, { id: memberId, role });
});

export { organizations };
