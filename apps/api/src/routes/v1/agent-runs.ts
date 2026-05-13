/**
 * Agent Runs Routes (v1)
 *
 * First-class CRUD over the `agent_runs` table. A run is auto-upserted when a
 * link is stamped with `agent_run_id`, so the read endpoints here will start
 * returning rows the moment any agent creates a tracked link — even before
 * the first click lands.
 *
 * - GET    /agent-runs           — paginated list (filter by agent / status / actor)
 * - GET    /agent-runs/:runId    — drill-down for one run (with sample links + clicks)
 * - PATCH  /agent-runs/:runId    — update status / metadata (start_run / end_run / revoke)
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq, or, sql } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok, badRequest, notFound } from "../../lib/response.js";

const agentRuns = new Hono<{ Bindings: Env }>();

agentRuns.use("/*", apiKeyAuthMiddleware());

function tenantScope(user: { id: string; organizationId?: string | null }) {
  if (user.organizationId) {
    return or(
      eq(schema.agentRuns.userId, user.id),
      eq(schema.agentRuns.organizationId, user.organizationId),
    )!;
  }
  return eq(schema.agentRuns.userId, user.id);
}

const listSchema = z.object({
  agentId: z.string().min(1).max(200).optional(),
  actorId: z.string().min(1).max(200).optional(),
  status: z.enum(schema.agentRunStatuses).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(200).default(50),
});

agentRuns.get("/", zValidator("query", listSchema), async (c) => {
  const user = c.get("user");
  const q = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  const conditions = [tenantScope(user)];
  if (q.agentId) conditions.push(eq(schema.agentRuns.agentId, q.agentId));
  if (q.actorId) conditions.push(eq(schema.agentRuns.actorId, q.actorId));
  if (q.status) conditions.push(eq(schema.agentRuns.status, q.status));

  const offset = (q.page - 1) * q.perPage;

  const rows = await db
    .select()
    .from(schema.agentRuns)
    .where(and(...conditions))
    .orderBy(desc(schema.agentRuns.startedAt))
    .limit(q.perPage)
    .offset(offset);

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.agentRuns)
    .where(and(...conditions));

  return ok(
    c,
    rows.map(formatRun),
    { page: q.page, perPage: q.perPage, total: count, hasMore: offset + rows.length < count },
  );
});

agentRuns.get("/:runId", async (c) => {
  const user = c.get("user");
  const runId = c.req.param("runId");
  const db = drizzle(c.env.DB, { schema });

  const [run] = await db
    .select()
    .from(schema.agentRuns)
    .where(and(tenantScope(user), eq(schema.agentRuns.runId, runId)))
    .limit(1);

  if (!run) return notFound(c, "Run not found");

  const [linkSample, clickSample] = await Promise.all([
    db
      .select({
        id: schema.links.id,
        slug: schema.links.slug,
        domain: schema.links.domain,
        destinationUrl: schema.links.destinationUrl,
        clickCount: schema.links.clickCount,
        isArchived: schema.links.isArchived,
        createdAt: schema.links.createdAt,
      })
      .from(schema.links)
      .where(
        and(
          eq(schema.links.agentRunId, run.runId),
          eq(schema.links.agentId, run.agentId),
          eq(schema.links.userId, run.userId),
        ),
      )
      .orderBy(desc(schema.links.createdAt))
      .limit(50),
    db
      .select({
        id: schema.clicks.id,
        linkId: schema.clicks.linkId,
        slug: schema.clicks.slug,
        country: schema.clicks.country,
        device: schema.clicks.device,
        browser: schema.clicks.browser,
        isBot: schema.clicks.isBot,
        agentToolCallId: schema.clicks.agentToolCallId,
        timestamp: schema.clicks.timestamp,
      })
      .from(schema.clicks)
      .where(
        and(
          eq(schema.clicks.agentRunId, run.runId),
          eq(schema.clicks.agentId, run.agentId),
        ),
      )
      .orderBy(desc(schema.clicks.timestamp))
      .limit(100),
  ]);

  return ok(c, {
    run: formatRun(run),
    links: linkSample,
    clicks: clickSample,
  });
});

const patchSchema = z.object({
  status: z.enum(schema.agentRunStatuses).optional(),
  metadata: z
    .record(z.unknown())
    .refine((v) => JSON.stringify(v).length <= 4096, {
      message: "metadata must serialize to ≤ 4 KB",
    })
    .optional(),
});

agentRuns.patch("/:runId", zValidator("json", patchSchema), async (c) => {
  const user = c.get("user");
  const runId = c.req.param("runId");
  const updates = c.req.valid("json");
  const db = drizzle(c.env.DB, { schema });

  if (Object.keys(updates).length === 0) {
    return badRequest(c, "No fields to update");
  }

  const [run] = await db
    .select()
    .from(schema.agentRuns)
    .where(and(tenantScope(user), eq(schema.agentRuns.runId, runId)))
    .limit(1);

  if (!run) return notFound(c, "Run not found");

  const setFields: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (updates.status) {
    setFields.status = updates.status;
    if (updates.status === "completed" || updates.status === "failed" || updates.status === "revoked") {
      setFields.endedAt = new Date().toISOString();
    }
  }
  if (updates.metadata) {
    setFields.metadata = JSON.stringify(updates.metadata);
  }

  await db
    .update(schema.agentRuns)
    .set(setFields)
    .where(eq(schema.agentRuns.id, run.id));

  const [updated] = await db
    .select()
    .from(schema.agentRuns)
    .where(eq(schema.agentRuns.id, run.id))
    .limit(1);

  return ok(c, formatRun(updated));
});

function formatRun(run: schema.AgentRun) {
  return {
    id: run.id,
    agentId: run.agentId,
    runId: run.runId,
    actorId: run.actorId,
    status: run.status,
    linkCount: run.linkCount,
    clickCount: run.clickCount,
    metadata: run.metadata ? safeJsonParse(run.metadata) : null,
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    updatedAt: run.updatedAt,
  };
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export { agentRuns };
