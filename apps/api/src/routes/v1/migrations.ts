/**
 * Migration Routes
 *
 * Provides one-click migration from competitor URL shorteners:
 * - Bitly
 * - Rebrandly
 * - Short.io
 * - TinyURL
 * - Dub.co
 *
 * Flow:
 * 1. GET /migrations/providers - List available providers
 * 2. POST /migrations/validate - Validate API credentials
 * 3. POST /migrations/start - Start migration (returns progress ID)
 * 4. GET /migrations/:id/status - Check migration progress
 * 5. GET /migrations - List past migrations
 */

import { Hono } from "hono";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "@repo/db";
import { nanoid } from "nanoid";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import {
  fetchLinksFromProvider,
  getProviderInfo,
  listProviders,
  validateCredentials,
  type MigrationCredentials,
  type MigrationProvider,
} from "../../lib/migrations/index.js";

const migrations = new Hono<{ Bindings: Env }>();

// All routes require authentication
migrations.use("*", apiKeyAuthMiddleware());

// -----------------------------------------------------------------------------
// Validation Schemas
// -----------------------------------------------------------------------------

const validateCredentialsSchema = z.object({
  provider: z.enum(["bitly", "rebrandly", "shortio", "tinyurl", "dub"]),
  apiKey: z.string().optional(),
  accessToken: z.string().optional(),
  groupGuid: z.string().optional(),
  workspaceId: z.string().optional(),
});

const startMigrationSchema = z.object({
  provider: z.enum(["bitly", "rebrandly", "shortio", "tinyurl", "dub"]),
  apiKey: z.string().optional(),
  accessToken: z.string().optional(),
  groupGuid: z.string().optional(),
  workspaceId: z.string().optional(),
  options: z
    .object({
      importTags: z.boolean().optional().default(true),
      preserveSlugs: z.boolean().optional().default(true),
      skipDuplicates: z.boolean().optional().default(true),
      defaultDomain: z.string().optional(),
    })
    .optional(),
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * GET /migrations/providers
 * List available migration providers
 */
migrations.get("/providers", async (c) => {
  const providers = listProviders();

  return c.json({
    success: true,
    data: providers,
  });
});

/**
 * GET /migrations/providers/:provider
 * Get detailed info about a provider including setup instructions
 */
migrations.get("/providers/:provider", async (c) => {
  const provider = c.req.param("provider") as MigrationProvider;

  try {
    const info = getProviderInfo(provider);
    return c.json({
      success: true,
      data: {
        ...info,
        provider,
      },
    });
  } catch {
    return c.json(
      { success: false, error: { code: "INVALID_PROVIDER", message: "Provider not supported" } },
      400
    );
  }
});

/**
 * POST /migrations/validate
 * Validate credentials for a provider
 */
migrations.post("/validate", async (c) => {
  const body = await c.req.json();
  const parsed = validateCredentialsSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: parsed.error.format(),
        },
      },
      400
    );
  }

  const credentials: MigrationCredentials = {
    provider: parsed.data.provider,
    apiKey: parsed.data.apiKey,
    accessToken: parsed.data.accessToken,
    groupGuid: parsed.data.groupGuid,
    workspaceId: parsed.data.workspaceId,
  };

  const result = await validateCredentials(credentials);

  if (!result.valid) {
    return c.json(
      {
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: result.error ?? "Failed to validate credentials",
        },
      },
      400
    );
  }

  return c.json({
    success: true,
    data: {
      valid: true,
      metadata: result.metadata,
    },
  });
});

/**
 * POST /migrations/start
 * Start a migration from a provider
 */
migrations.post("/start", async (c) => {
  const user = c.get("user" as never) as { id: string; organizationId?: string };
  const body = await c.req.json();
  const parsed = startMigrationSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: parsed.error.format(),
        },
      },
      400
    );
  }

  const db = drizzle(c.env.DB, { schema });
  const migrationId = nanoid();
  const defaultDomain = parsed.data.options?.defaultDomain ?? c.env.DEFAULT_DOMAIN ?? "go2.gg";

  // Create migration record
  await db.insert(schema.migrations).values({
    id: migrationId,
    userId: user.id,
    organizationId: user.organizationId ?? null,
    provider: parsed.data.provider,
    status: "running",
    totalLinks: 0,
    importedLinks: 0,
    skippedLinks: 0,
    failedLinks: 0,
    startedAt: new Date().toISOString(),
  });

  // Start migration in background
  c.executionCtx.waitUntil(
    (async () => {
      try {
        const credentials: MigrationCredentials = {
          provider: parsed.data.provider,
          apiKey: parsed.data.apiKey,
          accessToken: parsed.data.accessToken,
          groupGuid: parsed.data.groupGuid,
          workspaceId: parsed.data.workspaceId,
        };

        // Fetch links from provider
        const links = await fetchLinksFromProvider(credentials);

        // Update total count
        await db
          .update(schema.migrations)
          .set({ totalLinks: links.length })
          .where(eq(schema.migrations.id, migrationId));

        let imported = 0;
        let skipped = 0;
        let failed = 0;
        const errors: Array<{ link: string; error: string }> = [];

        // Import each link
        for (const link of links) {
          try {
            // Check for duplicate slug if skipDuplicates is enabled
            if (parsed.data.options?.skipDuplicates !== false) {
              const existing = await db
                .select({ id: schema.links.id })
                .from(schema.links)
                .where(
                  and(eq(schema.links.slug, link.slug), eq(schema.links.domain, defaultDomain))
                )
                .limit(1);

              if (existing.length > 0) {
                skipped++;
                continue;
              }
            }

            // Generate new slug if not preserving
            const slug = parsed.data.options?.preserveSlugs !== false ? link.slug : nanoid(7);

            const linkId = nanoid();

            // Create the link
            await db.insert(schema.links).values({
              id: linkId,
              userId: user.id,
              organizationId: user.organizationId ?? null,
              destinationUrl: link.originalUrl,
              slug,
              domain: defaultDomain,
              title: link.title,
              clickCount: link.clickCount ?? 0,
              createdAt: link.createdAt ?? new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              migrationId,
              migrationSource: parsed.data.provider,
              migrationOriginalId: link.originalId,
            });

            // Import tags if enabled
            if (parsed.data.options?.importTags !== false && link.tags?.length) {
              for (const tagName of link.tags) {
                // Find or create tag
                let tag = await db
                  .select()
                  .from(schema.linkTags)
                  .where(
                    and(eq(schema.linkTags.name, tagName), eq(schema.linkTags.userId, user.id))
                  )
                  .limit(1);

                if (tag.length === 0) {
                  const tagId = nanoid();
                  await db.insert(schema.linkTags).values({
                    id: tagId,
                    userId: user.id,
                    organizationId: user.organizationId ?? null,
                    name: tagName,
                    color: `#${Math.floor(Math.random() * 16777215)
                      .toString(16)
                      .padStart(6, "0")}`,
                    createdAt: new Date().toISOString(),
                  });
                  tag = await db
                    .select()
                    .from(schema.linkTags)
                    .where(eq(schema.linkTags.id, tagId));
                }

                // Link tag to link
                await db.insert(schema.linkTagAssignments).values({
                  id: nanoid(),
                  linkId,
                  tagId: tag[0].id,
                  createdAt: new Date().toISOString(),
                });
              }
            }

            // Sync to KV
            await c.env.LINKS_KV.put(
              `${defaultDomain}:${slug}`,
              JSON.stringify({
                id: linkId,
                destinationUrl: link.originalUrl,
                domain: defaultDomain,
                slug,
              }),
              { expirationTtl: 86400 * 365 } // 1 year
            );

            imported++;
          } catch (error) {
            failed++;
            errors.push({
              link: link.shortUrl,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }

          // Update progress periodically
          if ((imported + skipped + failed) % 50 === 0) {
            await db
              .update(schema.migrations)
              .set({
                importedLinks: imported,
                skippedLinks: skipped,
                failedLinks: failed,
              })
              .where(eq(schema.migrations.id, migrationId));
          }
        }

        // Final update
        await db
          .update(schema.migrations)
          .set({
            status: "completed",
            importedLinks: imported,
            skippedLinks: skipped,
            failedLinks: failed,
            completedAt: new Date().toISOString(),
            errors: errors.length > 0 ? JSON.stringify(errors) : null,
          })
          .where(eq(schema.migrations.id, migrationId));
      } catch (error) {
        // Mark migration as failed
        await db
          .update(schema.migrations)
          .set({
            status: "failed",
            completedAt: new Date().toISOString(),
            errors: JSON.stringify([
              {
                link: "migration",
                error: error instanceof Error ? error.message : "Unknown error",
              },
            ]),
          })
          .where(eq(schema.migrations.id, migrationId));
      }
    })()
  );

  return c.json({
    success: true,
    data: {
      migrationId,
      status: "running",
      message: "Migration started. Check status with GET /migrations/:id/status",
    },
  });
});

/**
 * GET /migrations/:id/status
 * Get migration status and progress
 */
migrations.get("/:id/status", async (c) => {
  const user = c.get("user" as never) as { id: string };
  const id = c.req.param("id");

  const db = drizzle(c.env.DB, { schema });

  const migration = await db
    .select()
    .from(schema.migrations)
    .where(and(eq(schema.migrations.id, id), eq(schema.migrations.userId, user.id)))
    .limit(1);

  if (migration.length === 0) {
    return c.json(
      { success: false, error: { code: "NOT_FOUND", message: "Migration not found" } },
      404
    );
  }

  const m = migration[0];

  return c.json({
    success: true,
    data: {
      id: m.id,
      provider: m.provider,
      status: m.status,
      totalLinks: m.totalLinks,
      importedLinks: m.importedLinks,
      skippedLinks: m.skippedLinks,
      failedLinks: m.failedLinks,
      progress:
        m.totalLinks > 0
          ? Math.round(((m.importedLinks + m.skippedLinks + m.failedLinks) / m.totalLinks) * 100)
          : 0,
      startedAt: m.startedAt,
      completedAt: m.completedAt,
      errors: m.errors ? JSON.parse(m.errors) : [],
    },
  });
});

/**
 * GET /migrations
 * List past migrations
 */
migrations.get("/", async (c) => {
  const user = c.get("user" as never) as { id: string };

  const db = drizzle(c.env.DB, { schema });

  const migrationsList = await db
    .select({
      id: schema.migrations.id,
      provider: schema.migrations.provider,
      status: schema.migrations.status,
      totalLinks: schema.migrations.totalLinks,
      importedLinks: schema.migrations.importedLinks,
      skippedLinks: schema.migrations.skippedLinks,
      failedLinks: schema.migrations.failedLinks,
      startedAt: schema.migrations.startedAt,
      completedAt: schema.migrations.completedAt,
    })
    .from(schema.migrations)
    .where(eq(schema.migrations.userId, user.id))
    .orderBy(desc(schema.migrations.startedAt))
    .limit(50);

  return c.json({
    success: true,
    data: migrationsList,
  });
});

/**
 * DELETE /migrations/:id
 * Delete a migration record and optionally its imported links
 */
migrations.delete("/:id", async (c) => {
  const user = c.get("user" as never) as { id: string };
  const id = c.req.param("id");
  const deleteLinks = c.req.query("deleteLinks") === "true";

  const db = drizzle(c.env.DB, { schema });

  const migration = await db
    .select()
    .from(schema.migrations)
    .where(and(eq(schema.migrations.id, id), eq(schema.migrations.userId, user.id)))
    .limit(1);

  if (migration.length === 0) {
    return c.json(
      { success: false, error: { code: "NOT_FOUND", message: "Migration not found" } },
      404
    );
  }

  // Optionally delete imported links
  if (deleteLinks) {
    const linksToDelete = await db
      .select({ id: schema.links.id, domain: schema.links.domain, slug: schema.links.slug })
      .from(schema.links)
      .where(eq(schema.links.migrationId, id));

    // Delete from KV
    for (const link of linksToDelete) {
      await c.env.LINKS_KV.delete(`${link.domain}:${link.slug}`);
    }

    // Delete from DB
    await db.delete(schema.links).where(eq(schema.links.migrationId, id));
  }

  // Delete migration record
  await db.delete(schema.migrations).where(eq(schema.migrations.id, id));

  return c.json({
    success: true,
    data: {
      deleted: true,
      linksDeleted: deleteLinks,
    },
  });
});

export { migrations };
