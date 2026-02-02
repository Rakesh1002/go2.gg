/**
 * File Upload Routes (v1)
 *
 * Handles file uploads and downloads using Cloudflare R2.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok, badRequest, notFound } from "../../lib/response.js";

const files = new Hono<{ Bindings: Env }>();

// All routes require authentication
files.use("/*", apiKeyAuthMiddleware());

// -----------------------------------------------------------------------------
// Schemas
// -----------------------------------------------------------------------------

const uploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  organizationId: z.string().uuid().optional(),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * POST /files/upload-url
 * Get a presigned URL for uploading a file to R2
 */
files.post("/upload-url", zValidator("json", uploadUrlSchema), async (c) => {
  const user = c.get("user");
  const { filename, contentType, organizationId } = c.req.valid("json");

  if (!c.env.R2_BUCKET) {
    return badRequest(c, "File storage not configured", "STORAGE_NOT_CONFIGURED");
  }

  // Generate a unique key for the file
  const key = organizationId
    ? `orgs/${organizationId}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`
    : `users/${user.id}/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;

  // For R2, we need to use the direct upload approach
  // Since R2 doesn't support presigned URLs directly in Workers,
  // we'll handle the upload through the API

  return ok(c, {
    key,
    uploadUrl: `/api/v1/files/${key}`,
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
  });
});

/**
 * PUT /files/:key+
 * Upload a file to R2
 */
files.put("/:key{.+}", async (c) => {
  const user = c.get("user");
  const key = c.req.param("key");

  if (!c.env.R2_BUCKET) {
    return badRequest(c, "File storage not configured", "STORAGE_NOT_CONFIGURED");
  }

  // Validate the key belongs to the user or their organization
  if (!key.startsWith(`users/${user.id}/`) && !key.includes("/orgs/")) {
    return c.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Cannot upload to this path" },
      },
      403
    );
  }

  const contentType = c.req.header("Content-Type") ?? "application/octet-stream";
  const body = await c.req.arrayBuffer();

  // Validate file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (body.byteLength > maxSize) {
    return badRequest(c, "File too large (max 10MB)", "FILE_TOO_LARGE");
  }

  try {
    await c.env.R2_BUCKET.put(key, body, {
      httpMetadata: {
        contentType,
      },
      customMetadata: {
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString(),
      },
    });

    return ok(c, {
      key,
      size: body.byteLength,
      contentType,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return badRequest(c, error instanceof Error ? error.message : "Upload failed", "UPLOAD_FAILED");
  }
});

/**
 * GET /files/:key+
 * Download a file from R2
 */
files.get("/:key{.+}", async (c) => {
  const user = c.get("user");
  const key = c.req.param("key");

  if (!c.env.R2_BUCKET) {
    return badRequest(c, "File storage not configured", "STORAGE_NOT_CONFIGURED");
  }

  // Validate access
  if (!key.startsWith(`users/${user.id}/`) && !key.includes("/orgs/")) {
    return c.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Cannot access this file" },
      },
      403
    );
  }

  try {
    const object = await c.env.R2_BUCKET.get(key);

    if (!object) {
      return notFound(c, "File not found");
    }

    const headers = new Headers();
    headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");
    headers.set("Content-Length", String(object.size));
    headers.set("ETag", object.etag);

    // Cache for 1 hour
    headers.set("Cache-Control", "private, max-age=3600");

    return new Response(object.body, { headers });
  } catch (error) {
    console.error("Download error:", error);
    return badRequest(
      c,
      error instanceof Error ? error.message : "Download failed",
      "DOWNLOAD_FAILED"
    );
  }
});

/**
 * DELETE /files/:key+
 * Delete a file from R2
 */
files.delete("/:key{.+}", async (c) => {
  const user = c.get("user");
  const key = c.req.param("key");

  if (!c.env.R2_BUCKET) {
    return badRequest(c, "File storage not configured", "STORAGE_NOT_CONFIGURED");
  }

  // Validate ownership
  if (!key.startsWith(`users/${user.id}/`)) {
    // TODO: Check organization admin access
    return c.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Cannot delete this file" },
      },
      403
    );
  }

  try {
    await c.env.R2_BUCKET.delete(key);
    return c.body(null, 204);
  } catch (error) {
    console.error("Delete error:", error);
    return badRequest(c, error instanceof Error ? error.message : "Delete failed", "DELETE_FAILED");
  }
});

/**
 * GET /files
 * List files for the current user
 */
files.get("/", async (c) => {
  const user = c.get("user");
  const prefix = c.req.query("prefix") ?? `users/${user.id}/`;
  const limit = Number.parseInt(c.req.query("limit") ?? "100");

  if (!c.env.R2_BUCKET) {
    return ok(c, { files: [] });
  }

  try {
    const listed = await c.env.R2_BUCKET.list({
      prefix,
      limit,
    });

    const files = listed.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded.toISOString(),
      etag: obj.etag,
    }));

    return ok(c, {
      files,
      truncated: listed.truncated,
      cursor: listed.truncated ? listed.cursor : undefined,
    });
  } catch (error) {
    console.error("List error:", error);
    return ok(c, { files: [] });
  }
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  return filename.replace(/[/\\]/g, "_").replace(/\0/g, "").slice(0, 200);
}

export { files };
