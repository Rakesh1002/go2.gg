import type { GetPromptResult, Prompt } from "@modelcontextprotocol/sdk/types.js";

export const PROMPTS: Record<string, Prompt> = {
  "go2:track-this-run": {
    name: "go2:track-this-run",
    description:
      "Drop-in instruction that tells the model to wrap any URL it shares in a Go2 tracked link with the current run context.",
    arguments: [
      {
        name: "agent_run_id",
        description: "Run id to stamp links with. Defaults to GO2_AGENT_RUN_ID.",
        required: false,
      },
      {
        name: "agent_actor_id",
        description: "End-user / persona id to stamp links with. Defaults to GO2_AGENT_ACTOR_ID.",
        required: false,
      },
    ],
  },
  "go2:summarize-attribution": {
    name: "go2:summarize-attribution",
    description:
      "Ask the model to summarize click attribution for the current run: who clicked, from where, on which links.",
    arguments: [
      {
        name: "agent_run_id",
        description: "Run id to summarize. Defaults to GO2_AGENT_RUN_ID.",
        required: false,
      },
    ],
  },
};

export type PromptName = keyof typeof PROMPTS;

export function getPrompt(name: PromptName, args: Record<string, unknown>): GetPromptResult {
  switch (name) {
    case "go2:track-this-run": {
      const runId = (args.agent_run_id as string | undefined) ?? "<env: GO2_AGENT_RUN_ID>";
      const actorId = (args.agent_actor_id as string | undefined) ?? "<env: GO2_AGENT_ACTOR_ID>";
      return {
        description: PROMPTS["go2:track-this-run"]?.description,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                "From now on, every URL you share with the user must be wrapped in a Go2 tracked link.\n\n" +
                "Use the `track_agent_link` tool with:\n" +
                `- agentRunId: ${runId}\n` +
                `- agentActorId: ${actorId}\n\n` +
                "Always pass the original URL as `destinationUrl`. Set a clear `title` (max 80 chars) describing why this link exists.\n" +
                "Do not embed raw destination URLs in your reply. Only the short URL Go2 returns.",
            },
          },
        ],
      };
    }
    case "go2:summarize-attribution": {
      const runId = (args.agent_run_id as string | undefined) ?? "<env: GO2_AGENT_RUN_ID>";
      return {
        description: PROMPTS["go2:summarize-attribution"]?.description,
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Summarize click attribution for agent_run_id=${runId}.\n\n` +
                "1. Call `get_run_attribution` with that run id.\n" +
                "2. Group clicks by link, then by country and device.\n" +
                "3. Report total clicks, unique clicks, the most-clicked link, and any anomalies (>50% bot, single user driving most clicks, etc).\n" +
                "4. Suggest one follow-up action.",
            },
          },
        ],
      };
    }
    default:
      throw new Error(`Unknown prompt: ${String(name)}`);
  }
}
