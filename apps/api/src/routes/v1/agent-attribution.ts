/**
 * Agent Attribution Routes (v1)
 *
 * Query click events by AI agent context. The wedge: every click recorded
 * against a link carries (agent_id, agent_run_id, agent_actor_id,
 * agent_tool_call_id) when those were set at link creation or click time.
 *
 * - GET  /agent-attribution         — list clicks, filter by agent_id / run_id / actor_id
 * - GET  /agent-attribution/runs    — distinct runs that produced clicks for the caller
 * - GET  /agent-attribution/summary — counts grouped by agent_id and run_id
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { and, desc, eq, or, sql } from "drizzle-orm";
import * as schema from "@repo/db";
import type { Env } from "../../bindings.js";
import { apiKeyAuthMiddleware } from "../../middleware/auth.js";
import { ok } from "../../lib/response.js";

const agentAttribution = new Hono<{ Bindings: Env }>();

agentAttribution.use("/*", apiKeyAuthMiddleware());

/**
 * Tenant scope for attribution queries. Returns clicks visible to the caller:
 * either the click was stamped with the caller's user_id, or it belongs to a
 * link in the caller's organization.
 *
 * The org branch is essential — API-key-created links land under whichever
 * member the auth middleware resolved as `c.user`, so a teammate logging in
 * via session would otherwise see an empty attribution view.
 */
function tenantScope(
  user: { id: string; organizationId?: string | null },
) {
  if (user.organizationId) {
    return or(
      eq(schema.clicks.userId, user.id),
      eq(schema.clicks.organizationId, user.organizationId),
    )!;
  }
  return eq(schema.clicks.userId, user.id);
}

const listSchema = z.object({
  agentId: z.string().min(1).max(200).optional(),
  agentRunId: z.string().min(1).max(200).optional(),
  agentActorId: z.string().min(1).max(200).optional(),
  linkId: z.string().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(200).default(50),
  // Bot clicks are stamped with `is_bot=1`. They inflate raw counts and are
  // rarely useful in attribution dashboards — opt-in via excludeBots=1.
  excludeBots: z.coerce.boolean().optional().default(false),
});

/**
 * GET /agent-attribution
 * Paginated list of clicks scoped to the caller's userId/orgId, filtered by
 * any combination of agent_id, agent_run_id, agent_actor_id, link_id.
 */
agentAttribution.get("/", zValidator("query", listSchema), async (c) => {
  const user = c.get("user");
  const q = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  const conditions = [tenantScope(user)];
  if (q.agentId) conditions.push(eq(schema.clicks.agentId, q.agentId));
  if (q.agentRunId) conditions.push(eq(schema.clicks.agentRunId, q.agentRunId));
  if (q.agentActorId) conditions.push(eq(schema.clicks.agentActorId, q.agentActorId));
  if (q.linkId) conditions.push(eq(schema.clicks.linkId, q.linkId));
  if (q.excludeBots) conditions.push(eq(schema.clicks.isBot, false));

  const offset = (q.page - 1) * q.perPage;

  const rows = await db
    .select({
      id: schema.clicks.id,
      linkId: schema.clicks.linkId,
      slug: schema.clicks.slug,
      domain: schema.clicks.domain,
      destinationUrl: schema.clicks.destinationUrl,
      country: schema.clicks.country,
      device: schema.clicks.device,
      browser: schema.clicks.browser,
      os: schema.clicks.os,
      referrer: schema.clicks.referrerDomain,
      isBot: schema.clicks.isBot,
      isUnique: schema.clicks.isUnique,
      agentId: schema.clicks.agentId,
      agentRunId: schema.clicks.agentRunId,
      agentActorId: schema.clicks.agentActorId,
      agentToolCallId: schema.clicks.agentToolCallId,
      timestamp: schema.clicks.timestamp,
    })
    .from(schema.clicks)
    .where(and(...conditions))
    .orderBy(desc(schema.clicks.timestamp))
    .limit(q.perPage)
    .offset(offset);

  return ok(c, {
    clicks: rows,
    page: q.page,
    perPage: q.perPage,
  });
});

const summarySchema = z.object({
  agentId: z.string().min(1).max(200).optional(),
  agentRunId: z.string().min(1).max(200).optional(),
  groupBy: z.enum(["agent_id", "agent_run_id"]).default("agent_run_id"),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  excludeBots: z.coerce.boolean().optional().default(false),
});

/**
 * GET /agent-attribution/summary
 * Roll-up: counts of clicks (and unique clicks) grouped by agent_id or
 * agent_run_id. Use this for "which run drove how many clicks" dashboards.
 */
agentAttribution.get("/summary", zValidator("query", summarySchema), async (c) => {
  const user = c.get("user");
  const q = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  const conditions = [tenantScope(user)];
  if (q.agentId) conditions.push(eq(schema.clicks.agentId, q.agentId));
  if (q.agentRunId) conditions.push(eq(schema.clicks.agentRunId, q.agentRunId));
  if (q.excludeBots) conditions.push(eq(schema.clicks.isBot, false));

  const groupCol =
    q.groupBy === "agent_id" ? schema.clicks.agentId : schema.clicks.agentRunId;

  // When grouping by run_id, also surface the agent_id so the caller doesn't
  // need a follow-up query to know which agent emitted the run. SQLite's
  // GROUP BY tolerates this: agent_id is functionally dependent on run_id
  // (a run belongs to one agent), so MIN() picks any of the equal values.
  const rows = await db
    .select({
      key: groupCol,
      agentId:
        q.groupBy === "agent_run_id"
          ? sql<string | null>`min(${schema.clicks.agentId})`
          : groupCol,
      clicks: sql<number>`count(*)`,
      uniqueClicks: sql<number>`sum(case when ${schema.clicks.isUnique} = 1 then 1 else 0 end)`,
      lastClickAt: sql<string>`max(${schema.clicks.timestamp})`,
    })
    .from(schema.clicks)
    .where(and(...conditions, sql`${groupCol} is not null`))
    .groupBy(groupCol)
    .orderBy(desc(sql`count(*)`))
    .limit(q.limit);

  return ok(c, {
    groupBy: q.groupBy,
    rows,
  });
});

const runsSchema = z.object({
  agentId: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  excludeBots: z.coerce.boolean().optional().default(false),
});

/**
 * GET /agent-attribution/runs
 * Distinct (agentId, agentRunId) pairs the caller has produced clicks for,
 * with first/last click timestamps. Useful for the agent to ask "what runs
 * have I tracked so far?"
 */
agentAttribution.get("/runs", zValidator("query", runsSchema), async (c) => {
  const user = c.get("user");
  const q = c.req.valid("query");
  const db = drizzle(c.env.DB, { schema });

  const conditions = [
    tenantScope(user),
    sql`${schema.clicks.agentRunId} is not null`,
  ];
  if (q.agentId) conditions.push(eq(schema.clicks.agentId, q.agentId));
  if (q.excludeBots) conditions.push(eq(schema.clicks.isBot, false));

  const rows = await db
    .select({
      agentId: schema.clicks.agentId,
      agentRunId: schema.clicks.agentRunId,
      clicks: sql<number>`count(*)`,
      firstClickAt: sql<string>`min(${schema.clicks.timestamp})`,
      lastClickAt: sql<string>`max(${schema.clicks.timestamp})`,
    })
    .from(schema.clicks)
    .where(and(...conditions))
    .groupBy(schema.clicks.agentId, schema.clicks.agentRunId)
    .orderBy(desc(sql`max(${schema.clicks.timestamp})`))
    .limit(q.limit);

  return ok(c, { runs: rows });
});

export { agentAttribution };
