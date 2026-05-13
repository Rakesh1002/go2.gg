/**
 * Agent runs — upsert + count helpers.
 *
 * A run row is created the first time a link in a (userId, agentId, runId)
 * triple is stamped, then incremented on every subsequent link. The dashboard
 * and MCP `list_agent_runs` tool read from this table so runs without clicks
 * still surface; a future `start_run` / `end_run` MCP pair will use the same
 * row to transition status and write `endedAt`.
 */

import { and, eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@repo/db";

export interface UpsertRunInput {
  userId: string;
  organizationId: string | null | undefined;
  agentId: string;
  runId: string;
  actorId?: string | null;
  metadata?: string | null;
}

/**
 * Insert a new run row or bump the link count + updated_at on an existing
 * one. Idempotent — safe to call from every link-create.
 *
 * SQLite ON CONFLICT against the (user_id, agent_id, run_id) unique index.
 */
export async function upsertAgentRunFromLink(
  db: DrizzleD1Database<typeof schema>,
  input: UpsertRunInput,
): Promise<void> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .insert(schema.agentRuns)
    .values({
      id,
      userId: input.userId,
      organizationId: input.organizationId ?? null,
      agentId: input.agentId,
      runId: input.runId,
      actorId: input.actorId ?? null,
      status: "running",
      linkCount: 1,
      clickCount: 0,
      metadata: input.metadata ?? null,
      startedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        schema.agentRuns.userId,
        schema.agentRuns.agentId,
        schema.agentRuns.runId,
      ],
      set: {
        linkCount: sql`${schema.agentRuns.linkCount} + 1`,
        // Only refresh actor / metadata if the new call provided them; the
        // raw COALESCE keeps prior values otherwise.
        actorId: sql`COALESCE(${input.actorId ?? null}, ${schema.agentRuns.actorId})`,
        metadata: sql`COALESCE(${input.metadata ?? null}, ${schema.agentRuns.metadata})`,
        updatedAt: now,
      },
    });
}

/**
 * Increment click_count for a run. Called from the click-tracking path after
 * a successful click row insert. No-op when the click had no agent context.
 */
export async function bumpAgentRunClickCount(
  db: DrizzleD1Database<typeof schema>,
  params: { userId: string; agentId: string; runId: string },
): Promise<void> {
  await db
    .update(schema.agentRuns)
    .set({
      clickCount: sql`${schema.agentRuns.clickCount} + 1`,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(schema.agentRuns.userId, params.userId),
        eq(schema.agentRuns.agentId, params.agentId),
        eq(schema.agentRuns.runId, params.runId),
      ),
    );
}
