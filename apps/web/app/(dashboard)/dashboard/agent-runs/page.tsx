import type { Metadata } from "next";
import { AgentRunsClient } from "./agent-runs-client";

export const metadata: Metadata = {
  title: "Agent Runs",
  description:
    "Per-agent-run link attribution. See which AI agent runs generated which links and clicks.",
};

export default function AgentRunsPage() {
  return <AgentRunsClient />;
}
