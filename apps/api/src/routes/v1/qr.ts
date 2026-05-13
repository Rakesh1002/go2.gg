/**
 * QR Code Routes (v1)
 *
 * QR code generation and management:
 * - POST /qr/generate - Generate a QR code
 * - POST /qr - Save a QR code configuration
 * - GET /qr - List saved QR codes
 * - GET /qr/:id - Get QR code by ID
 * - PATCH /qr/:id - Update QR code
 * - DELETE /qr/:id - Delete QR code
 * - GET /qr/:id/download - Download QR code as image
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, sql } from "drizzle-orm";
import * as schema from "@repo/db";
import QRCode from "qrcode";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok, created, noContent, notFound, forbidden } from "../../lib/response.js";

const qrRouter = new Hono<{ Bindings: Env }>();

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const generateQrSchema = z.object({
  url: z.string().url("Invalid URL"),
  linkId: z.string().optional(),
  size: z.number().min(64).max(2048).default(256),
  foregroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#000000"),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#FFFFFF"),
  logoUrl: z.string().url().optional().nullable(),
  logoSize: z.number().min(10).max(100).default(50),
  cornerRadius: z.number().min(0).max(50).default(0),
  errorCorrection: z.enum(["L", "M", "Q", "H"]).default("M"),
  format: z.enum(["png", "svg"]).default("svg"),
});

const createQrSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url("Invalid URL"),
  linkId: z.string().optional(),
  size: z.number().min(64).max(2048).default(256),
  foregroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#000000"),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#FFFFFF"),
  logoUrl: z.string().url().optional().nullable(),
  logoSize: z.number().min(10).max(100).default(50),
  cornerRadius: z.number().min(0).max(50).default(0),
  errorCorrection: z.enum(["L", "M", "Q", "H"]).default("M"),
});

const updateQrSchema = createQrSchema.partial();

const listQrSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Encode `data` as a real QR code and render as SVG. Uses the `qrcode` library
 * (matrix mode) so we can keep the cornerRadius rendering for branding.
 */
async function generateQrSvg(
  data: string,
  options: {
    size: number;
    foregroundColor: string;
    backgroundColor: string;
    cornerRadius: number;
    errorCorrection: "L" | "M" | "Q" | "H";
  }
): Promise<string> {
  const { size, foregroundColor, backgroundColor, cornerRadius, errorCorrection } = options;

  const code = QRCode.create(data, { errorCorrectionLevel: errorCorrection });
  const matrixSize = code.modules.size;
  const matrixData = code.modules.data;
  const margin = 4; // QR spec quiet zone, in modules
  const totalModules = matrixSize + margin * 2;
  const moduleSize = size / totalModules;
  const radius = Math.min(cornerRadius, moduleSize / 2);

  let modules = "";
  for (let row = 0; row < matrixSize; row++) {
    for (let col = 0; col < matrixSize; col++) {
      if (matrixData[row * matrixSize + col]) {
        const x = (col + margin) * moduleSize;
        const y = (row + margin) * moduleSize;
        modules += `<rect x="${x.toFixed(3)}" y="${y.toFixed(3)}" width="${moduleSize.toFixed(3)}" height="${moduleSize.toFixed(3)}" rx="${radius.toFixed(3)}" fill="${foregroundColor}"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">
  <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
  ${modules}
</svg>`;
}

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * POST /qr/generate
 * Generate a QR code (no auth required for basic generation)
 */
qrRouter.post("/generate", zValidator("json", generateQrSchema), async (c) => {
  const input = c.req.valid("json");

  const svg = await generateQrSvg(input.url, {
    size: input.size,
    foregroundColor: input.foregroundColor,
    backgroundColor: input.backgroundColor,
    cornerRadius: input.cornerRadius,
    errorCorrection: input.errorCorrection,
  });

  if (input.format === "svg") {
    return c.body(svg, 200, {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000",
    });
  }

  // For PNG, we'd need to use a library or Workers AI
  // For now, return SVG with a note
  return ok(c, {
    svg,
    format: "svg",
    size: input.size,
    url: input.url,
  });
});

// All remaining routes require authentication
qrRouter.use("/*", apiKeyAuthMiddleware());

/**
 * POST /qr
 * Save a QR code configuration
 */
qrRouter.post("/", zValidator("json", createQrSchema), async (c) => {
  const user = c.get("user");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newQr: schema.NewQRCode = {
    id,
    userId: user.id,
    organizationId: user.organizationId,
    linkId: input.linkId,
    name: input.name,
    url: input.url,
    size: input.size,
    foregroundColor: input.foregroundColor,
    backgroundColor: input.backgroundColor,
    logoUrl: input.logoUrl,
    logoSize: input.logoSize,
    cornerRadius: input.cornerRadius,
    errorCorrection: input.errorCorrection,
    scanCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.qrCodes).values(newQr);

  return created(c, {
    id,
    ...input,
    scanCount: 0,
    createdAt: now,
  });
});

/**
 * GET /qr
 * List saved QR codes
 */
qrRouter.get("/", zValidator("query", listQrSchema), async (c) => {
  const user = c.get("user");
  const { page, perPage } = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  const offset = (page - 1) * perPage;

  const results = await db
    .select({
      id: schema.qrCodes.id,
      name: schema.qrCodes.name,
      url: schema.qrCodes.url,
      linkId: schema.qrCodes.linkId,
      size: schema.qrCodes.size,
      foregroundColor: schema.qrCodes.foregroundColor,
      backgroundColor: schema.qrCodes.backgroundColor,
      logoUrl: schema.qrCodes.logoUrl,
      scanCount: schema.qrCodes.scanCount,
      lastScannedAt: schema.qrCodes.lastScannedAt,
      createdAt: schema.qrCodes.createdAt,
    })
    .from(schema.qrCodes)
    .where(eq(schema.qrCodes.userId, user.id))
    .orderBy(desc(schema.qrCodes.createdAt))
    .limit(perPage)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.qrCodes)
    .where(eq(schema.qrCodes.userId, user.id));

  const total = countResult[0]?.count ?? 0;

  return ok(c, results, {
    page,
    perPage,
    total,
    hasMore: offset + results.length < total,
  });
});

/**
 * GET /qr/:id
 * Get QR code by ID
 */
qrRouter.get("/:id", async (c) => {
  const user = c.get("user");
  const qrId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const result = await db.select().from(schema.qrCodes).where(eq(schema.qrCodes.id, qrId)).limit(1);

  if (!result[0]) {
    return notFound(c, "QR code not found");
  }

  if (result[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this QR code");
  }

  const qr = result[0];

  return ok(c, {
    id: qr.id,
    name: qr.name,
    url: qr.url,
    linkId: qr.linkId,
    size: qr.size,
    foregroundColor: qr.foregroundColor,
    backgroundColor: qr.backgroundColor,
    logoUrl: qr.logoUrl,
    logoSize: qr.logoSize,
    cornerRadius: qr.cornerRadius,
    errorCorrection: qr.errorCorrection,
    aiStyle: qr.aiStyle ? JSON.parse(qr.aiStyle) : null,
    aiImageUrl: qr.aiImageUrl,
    scanCount: qr.scanCount,
    lastScannedAt: qr.lastScannedAt,
    createdAt: qr.createdAt,
    updatedAt: qr.updatedAt,
  });
});

/**
 * PATCH /qr/:id
 * Update QR code
 */
qrRouter.patch("/:id", zValidator("json", updateQrSchema), async (c) => {
  const user = c.get("user");
  const qrId = c.req.param("id");
  const input = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.qrCodes)
    .where(eq(schema.qrCodes.id, qrId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "QR code not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this QR code");
  }

  const updateData: Partial<schema.NewQRCode> = {
    ...(input.name && { name: input.name }),
    ...(input.url && { url: input.url }),
    ...(input.linkId !== undefined && { linkId: input.linkId }),
    ...(input.size && { size: input.size }),
    ...(input.foregroundColor && { foregroundColor: input.foregroundColor }),
    ...(input.backgroundColor && { backgroundColor: input.backgroundColor }),
    ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
    ...(input.logoSize && { logoSize: input.logoSize }),
    ...(input.cornerRadius !== undefined && { cornerRadius: input.cornerRadius }),
    ...(input.errorCorrection && { errorCorrection: input.errorCorrection }),
    updatedAt: new Date().toISOString(),
  };

  await db.update(schema.qrCodes).set(updateData).where(eq(schema.qrCodes.id, qrId));

  const updated = await db
    .select()
    .from(schema.qrCodes)
    .where(eq(schema.qrCodes.id, qrId))
    .limit(1);

  return ok(c, updated[0]);
});

/**
 * DELETE /qr/:id
 * Delete QR code
 */
qrRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  const qrId = c.req.param("id");
  const db = drizzle(c.env.DB, { schema });

  const existing = await db
    .select()
    .from(schema.qrCodes)
    .where(eq(schema.qrCodes.id, qrId))
    .limit(1);

  if (!existing[0]) {
    return notFound(c, "QR code not found");
  }

  if (existing[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this QR code");
  }

  await db.delete(schema.qrCodes).where(eq(schema.qrCodes.id, qrId));

  return noContent(c);
});

/**
 * GET /qr/:id/download
 * Download QR code as image
 */
qrRouter.get("/:id/download", async (c) => {
  const user = c.get("user");
  const qrId = c.req.param("id");
  // Format parameter reserved for future PNG support
  const _format = c.req.query("format") ?? "svg";
  const db = drizzle(c.env.DB, { schema });

  const result = await db.select().from(schema.qrCodes).where(eq(schema.qrCodes.id, qrId)).limit(1);

  if (!result[0]) {
    return notFound(c, "QR code not found");
  }

  if (result[0].userId !== user.id) {
    return forbidden(c, "You don't have access to this QR code");
  }

  const qr = result[0];

  const svg = await generateQrSvg(qr.url, {
    size: qr.size ?? 256,
    foregroundColor: qr.foregroundColor ?? "#000000",
    backgroundColor: qr.backgroundColor ?? "#FFFFFF",
    cornerRadius: qr.cornerRadius ?? 0,
    errorCorrection: (qr.errorCorrection as "L" | "M" | "Q" | "H") ?? "M",
  });

  return c.body(svg, 200, {
    "Content-Type": "image/svg+xml",
    "Content-Disposition": `attachment; filename="${qr.name.replace(/[^a-zA-Z0-9]/g, "_")}.svg"`,
  });
});

export { qrRouter };
