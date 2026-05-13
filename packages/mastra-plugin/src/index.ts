/**
 * go2-mastra
 *
 * Drop-in Go2 tools for Mastra agents. Every link created through these tools
 * is auto-stamped with `agent_id`, `agent_run_id`, and `agent_actor_id`, so the
 * clicks that come back are queryable per-run via the same plugin's
 * `getAttributionTool` or the Go2 dashboard at `/dashboard/agent-runs`.
 *
 * @example Quick start
 * ```ts
 * import { Agent } from "@mastra/core/agent";
 * import { openai } from "@ai-sdk/openai";
 * import { createGo2Toolset } from "go2-mastra";
 *
 * const myAgent = new Agent({
 *   name: "Researcher",
 *   instructions: "Help users with research. Cite sources via shortened links.",
 *   model: openai("gpt-4o"),
 *   tools: createGo2Toolset({
 *     apiKey: process.env.GO2_API_KEY!,
 *     agentId: "researcher-v1",
 *   }),
 * });
 * ```
 */

import { Go2 } from "go2-sdk";
import type {
  AgentAttributionContext,
  Link,
  AgentRun,
} from "go2-sdk";
import { z } from "zod";

// We import the Mastra factory through a thin shim so consumers who pin a
// different Mastra major version still work — Mastra renamed `createTool`
// between 0.x and 1.x but kept the call shape compatible.
type CreateToolFactory = <
  TInput extends z.ZodType,
  TOutput extends z.ZodType,
>(config: {
  id: string;
  description: string;
  inputSchema: TInput;
  outputSchema?: TOutput;
  execute: (ctx: {
    context: z.infer<TInput>;
    runtimeContext?: { get: (k: string) => unknown };
  }) => Promise<z.infer<TOutput>>;
}) => unknown;

let cachedFactory: CreateToolFactory | null = null;
async function getCreateTool(): Promise<CreateToolFactory> {
  if (cachedFactory) return cachedFactory;
  const mod = await import("@mastra/core/tools");
  const factory =
    (mod as { createTool?: CreateToolFactory }).createTool ??
    // 0.x / older
    (mod as unknown as { default?: { createTool?: CreateToolFactory } }).default
      ?.createTool;
  if (!factory) {
    throw new Error(
      "[go2-mastra] Couldn't find createTool on @mastra/core/tools. " +
        "Install @mastra/core >= 0.10.0 alongside this package.",
    );
  }
  cachedFactory = factory;
  return factory;
}

// ---------------------------------------------------------------------------
// Plugin options
// ---------------------------------------------------------------------------

export interface Go2PluginOptions {
  /** Go2 API key (`go2_…`). Get one at https://go2.gg/dashboard/api-keys */
  apiKey: string;

  /** Override the API base URL. Defaults to https://api.go2.gg */
  apiUrl?: string;

  /**
   * Stable identifier for this agent — e.g. "researcher-v1", "claude-code",
   * "cursor". Stamped on every link the plugin mints unless overridden via
   * `runtimeContext.set("agentId", "…")` at call time.
   */
  agentId?: string;

  /**
   * Per-actor identifier — typically the human end-user the agent is acting
   * for. Use this to slice attribution by who *asked* the agent to do
   * something (`{ agentActorId: "user_42" }`).
   */
  agentActorId?: string;

  /**
   * Free-form metadata attached to every link the plugin mints. Stored on
   * the link, not propagated to clicks. Useful for things like
   * `{ prompt_hash, model, build_sha }`.
   */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function makeClient(opts: Go2PluginOptions): Go2 {
  return new Go2({
    apiKey: opts.apiKey,
    apiUrl: opts.apiUrl ?? "https://api.go2.gg",
  });
}

/**
 * Resolve the agent context the plugin should stamp on each call. Prefers
 * runtimeContext (set per-Mastra-run) over the static plugin opts so a
 * single Agent instance can serve many users / sessions.
 */
function resolveContext(
  opts: Go2PluginOptions,
  runtimeContext?: { get: (k: string) => unknown },
): AgentAttributionContext {
  const fromRuntime = (k: string) =>
    typeof runtimeContext?.get === "function"
      ? (runtimeContext.get(k) as string | undefined)
      : undefined;

  return {
    agentId: fromRuntime("agentId") ?? opts.agentId,
    agentRunId: fromRuntime("agentRunId"),
    agentActorId: fromRuntime("agentActorId") ?? opts.agentActorId,
    agentMetadata: opts.metadata,
  };
}

// ---------------------------------------------------------------------------
// Tool factories
// ---------------------------------------------------------------------------

const shortenInputSchema = z.object({
  destinationUrl: z.string().url().describe("The URL to shorten"),
  slug: z
    .string()
    .min(1)
    .max(64)
    .optional()
    .describe(
      "Optional custom slug. Omit to let Go2 pick a memorable AI-generated one.",
    ),
  title: z
    .string()
    .max(120)
    .optional()
    .describe("Human-readable title for the dashboard"),
});

const shortenOutputSchema = z.object({
  shortUrl: z.string(),
  id: z.string(),
  destinationUrl: z.string(),
  domain: z.string(),
  slug: z.string(),
});

/**
 * Mastra tool: shorten a URL with agent attribution baked in.
 *
 * @example
 * ```ts
 * tools: { shorten: createGo2Tool({ apiKey: process.env.GO2_API_KEY!, agentId: "my-agent" }) }
 * ```
 */
export async function createGo2Tool(opts: Go2PluginOptions) {
  const client = makeClient(opts);
  const factory = await getCreateTool();
  return factory({
    id: "go2_shorten",
    description:
      "Shorten a URL into a tracked go2.gg link. Every click is recorded with " +
      "the (agent_id, agent_run_id, agent_actor_id) that minted it. Returns the " +
      "short URL the agent should hand back to the user.",
    inputSchema: shortenInputSchema,
    outputSchema: shortenOutputSchema,
    execute: async ({ context, runtimeContext }) => {
      const ctx = resolveContext(opts, runtimeContext);
      const link: Link = await client.links.create({
        destinationUrl: context.destinationUrl,
        slug: context.slug,
        title: context.title,
        ...ctx,
      });
      return {
        shortUrl: link.shortUrl,
        id: link.id,
        destinationUrl: link.destinationUrl,
        domain: link.domain,
        slug: link.slug,
      };
    },
  });
}

const expiringInputSchema = z.object({
  destinationUrl: z.string().url(),
  expiresInMinutes: z
    .number()
    .int()
    .min(1)
    .max(60 * 24 * 365)
    .describe("Lifetime in minutes. After this the link returns 410 Gone."),
  slug: z.string().min(1).max(64).optional(),
});

const expiringOutputSchema = z.object({
  shortUrl: z.string(),
  id: z.string(),
  expiresAt: z.string(),
});

/**
 * Mastra tool: shorten a URL that auto-expires. Useful for one-time download
 * links, per-session deep links, time-limited campaigns. Backed by a real
 * Cloudflare Workflow on the Go2 side, so expiry happens within seconds of
 * `expiresAt`, not at the next cron sweep.
 */
export async function createGo2ExpiringTool(opts: Go2PluginOptions) {
  const client = makeClient(opts);
  const factory = await getCreateTool();
  return factory({
    id: "go2_create_expiring",
    description:
      "Create a tracked short URL that auto-expires. Use this for one-time " +
      "deliverables, per-session deep links, or time-limited campaigns. The " +
      "link returns 410 Gone after expiresAt; clicks before that are still " +
      "attributed to this agent run.",
    inputSchema: expiringInputSchema,
    outputSchema: expiringOutputSchema,
    execute: async ({ context, runtimeContext }) => {
      const ctx = resolveContext(opts, runtimeContext);
      const expiresAt = new Date(
        Date.now() + context.expiresInMinutes * 60 * 1000,
      ).toISOString();
      const link: Link = await client.links.create({
        destinationUrl: context.destinationUrl,
        slug: context.slug,
        expiresAt,
        ...ctx,
      });
      return {
        shortUrl: link.shortUrl,
        id: link.id,
        expiresAt,
      };
    },
  });
}

const listRunsOutputSchema = z.object({
  runs: z.array(
    z.object({
      agentId: z.string().nullable(),
      agentRunId: z.string().nullable(),
      clicks: z.number(),
      firstClickAt: z.string(),
      lastClickAt: z.string(),
    }),
  ),
});

/**
 * Mastra tool: list the agent runs that have produced clicks. Lets the agent
 * answer questions like "how did my last research session perform?" without
 * a separate dashboard tab.
 */
export async function createGo2ListRunsTool(opts: Go2PluginOptions) {
  const client = makeClient(opts);
  const factory = await getCreateTool();
  return factory({
    id: "go2_list_runs",
    description:
      "List recent agent runs that have produced at least one click. Sorted " +
      "by last click. Use this to summarize how a previous session " +
      "performed.",
    inputSchema: z.object({}),
    outputSchema: listRunsOutputSchema,
    execute: async () => {
      const runs: AgentRun[] = await client.agentAttribution.runs();
      return { runs };
    },
  });
}

const getAttributionInputSchema = z.object({
  agentRunId: z
    .string()
    .optional()
    .describe(
      "Filter by run id. Omit to look across all runs (capped at 100 most-recent clicks).",
    ),
  agentActorId: z
    .string()
    .optional()
    .describe("Filter by actor id (typically your end-user id)."),
  perPage: z.number().int().min(1).max(100).optional(),
});

const getAttributionOutputSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      linkId: z.string(),
      shortUrl: z.string(),
      country: z.string().nullable(),
      device: z.string().nullable(),
      createdAt: z.string(),
      agentId: z.string().nullable(),
      agentRunId: z.string().nullable(),
      agentActorId: z.string().nullable(),
    }),
  ),
});

/**
 * Mastra tool: pull attributed clicks for a given run / actor. Returns the
 * raw click rows so the agent can summarize them however it likes.
 */
export async function createGo2GetAttributionTool(opts: Go2PluginOptions) {
  const client = makeClient(opts);
  const factory = await getCreateTool();
  return factory({
    id: "go2_get_attribution",
    description:
      "Fetch click events attributed to an agent run. Each event includes " +
      "country, device, and timestamp so the agent can summarize " +
      "performance.",
    inputSchema: getAttributionInputSchema,
    outputSchema: getAttributionOutputSchema,
    execute: async ({ context }) => {
      const result = await client.agentAttribution.list({
        agentRunId: context.agentRunId,
        agentActorId: context.agentActorId,
        perPage: context.perPage,
      });
      // Project AgentAttributionClick → output schema. We deliberately drop
      // a few fields (browser/os/referrer/isBot) to keep the agent's tool
      // response compact; consumers wanting the full row can call
      // `Go2.agentAttribution.list()` directly.
      const data = result.data.map((row) => ({
        id: row.id,
        linkId: row.linkId,
        shortUrl: row.shortUrl,
        country: row.country,
        device: row.device,
        createdAt: row.createdAt,
        agentId: row.agentId,
        agentRunId: row.agentRunId,
        agentActorId: row.agentActorId,
      }));
      return { data };
    },
  });
}

// ---------------------------------------------------------------------------
// Toolset bundle — the convenient one-liner
// ---------------------------------------------------------------------------

/**
 * The complete Go2 toolset for Mastra. Use this when you want every Go2
 * capability available to the agent without picking and choosing.
 *
 * Returns an object you can spread directly into `Agent.tools`:
 *
 * ```ts
 * const agent = new Agent({
 *   name: "Researcher",
 *   model: openai("gpt-4o"),
 *   tools: await createGo2Toolset({
 *     apiKey: process.env.GO2_API_KEY!,
 *     agentId: "researcher-v1",
 *   }),
 * });
 * ```
 */
export async function createGo2Toolset(opts: Go2PluginOptions) {
  const [shorten, createExpiring, listRuns, getAttribution] = await Promise.all(
    [
      createGo2Tool(opts),
      createGo2ExpiringTool(opts),
      createGo2ListRunsTool(opts),
      createGo2GetAttributionTool(opts),
    ],
  );

  return {
    go2_shorten: shorten,
    go2_create_expiring: createExpiring,
    go2_list_runs: listRuns,
    go2_get_attribution: getAttribution,
  };
}

// Re-export the Go2 client itself in case the consumer wants to call methods
// the plugin doesn't wrap (e.g. domains, webhooks).
export { Go2 } from "go2-sdk";
export type { AgentAttributionContext, Link, AgentRun } from "go2-sdk";
