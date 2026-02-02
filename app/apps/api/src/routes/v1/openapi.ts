/**
 * OpenAPI Schema Definitions
 *
 * Defines reusable schemas for the API using Zod.
 * These schemas document the expected structure of API requests and responses.
 */

import { z } from "zod";

// -----------------------------------------------------------------------------
// Common Schemas
// -----------------------------------------------------------------------------

export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: ErrorSchema.optional(),
    meta: z
      .object({
        page: z.number().optional(),
        perPage: z.number().optional(),
        total: z.number().optional(),
        hasMore: z.boolean().optional(),
      })
      .optional(),
  });

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
});

// -----------------------------------------------------------------------------
// Auth Schemas
// -----------------------------------------------------------------------------

export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional(),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  emailVerified: z.boolean(),
});

export const SessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number(),
});

// -----------------------------------------------------------------------------
// Organization Schemas
// -----------------------------------------------------------------------------

export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().url().nullable(),
  stripeCustomerId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
});

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().optional(),
});

// -----------------------------------------------------------------------------
// Billing Schemas
// -----------------------------------------------------------------------------

export const CheckoutSchema = z.object({
  priceId: z.string().min(1),
  organizationId: z.string().uuid().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const SubscriptionSchema = z.object({
  id: z.string(),
  status: z.enum(["trialing", "active", "canceled", "past_due", "unpaid", "incomplete", "paused"]),
  plan: z.enum(["free", "pro", "business", "enterprise"]),
  currentPeriodEnd: z.string().datetime().nullable(),
  cancelAtPeriodEnd: z.boolean(),
});

export const EntitlementsSchema = z.object({
  features: z.record(z.boolean()),
  limits: z.object({
    seats: z.number().nullable(),
    storage: z.number().nullable(),
    apiCalls: z.number().nullable(),
  }),
});

// -----------------------------------------------------------------------------
// OpenAPI Info
// -----------------------------------------------------------------------------

export const openApiInfo = {
  openapi: "3.1.0",
  info: {
    title: "ShipQuest API",
    version: "1.0.0",
    description: "Enterprise Web Boilerplate API - Production-ready REST API",
    contact: {
      name: "ShipQuest Team",
      url: "https://github.com/shipquest/shipquest",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    { url: "http://localhost:8787", description: "Development" },
    { url: "https://api.your-app.com", description: "Production" },
  ],
  tags: [
    { name: "Health", description: "Health check endpoints" },
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Users", description: "User management endpoints" },
    { name: "Organizations", description: "Organization management endpoints" },
    { name: "Billing", description: "Subscription and billing endpoints" },
    { name: "Admin", description: "Administrative endpoints (internal)" },
  ],
};
