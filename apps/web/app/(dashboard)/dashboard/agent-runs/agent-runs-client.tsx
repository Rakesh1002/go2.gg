"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, MousePointerClick, Users, Activity } from "lucide-react";
import { AnimatedStat } from "@/components/analytics/animated-stat";
import { formatDistanceToNow } from "date-fns";

const WorldMap = dynamic(
  () => import("@/components/analytics/world-map").then((m) => m.WorldMap),
  {
    ssr: false,
    loading: () => <div className="h-[260px] animate-pulse rounded-md bg-muted/40" />,
  },
);

interface RunRow {
  agentId: string | null;
  agentRunId: string | null;
  actorId?: string | null;
  status?: "running" | "completed" | "failed" | "revoked";
  linkCount?: number;
  clicks: number;
  firstClickAt?: string;
  lastClickAt: string;
}

interface AgentRunRow {
  id: string;
  agentId: string;
  runId: string;
  actorId: string | null;
  status: "running" | "completed" | "failed" | "revoked";
  linkCount: number;
  clickCount: number;
  startedAt: string;
  endedAt: string | null;
  updatedAt: string;
}

interface ClickRow {
  id: string;
  linkId: string;
  slug: string;
  domain: string;
  destinationUrl: string;
  country: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  isBot: number | boolean;
  isUnique: number | boolean;
  agentId: string | null;
  agentRunId: string | null;
  agentActorId: string | null;
  agentToolCallId: string | null;
  timestamp: string;
}

const AGENT_EMOJI: Record<string, string> = {
  "claude-code": "🤖",
  cursor: "⚡",
  "openai-assistants": "🧠",
  langchain: "🦜",
  mastra: "🪄",
  "vercel-ai-sdk": "▲",
  "workers-ai": "✨",
};

function emojiFor(agentId: string | null | undefined) {
  if (!agentId) return "🤖";
  return AGENT_EMOJI[agentId] ?? "🤖";
}

export function AgentRunsClient() {
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [recentClicks, setRecentClicks] = useState<ClickRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErrored(false);
      try {
        // /agent-runs is the first-class read path — it includes zero-click
        // runs, run status, and actor id. /agent-attribution/runs is the
        // legacy click-derived view, used as a fallback so older deployments
        // (or workspaces created before the agent_runs migration) still
        // render something. recentClicks still comes from attribution since
        // we don't store click samples on the run row.
        const [runsRes, clicksRes, fallbackRunsRes] = await Promise.all([
          fetch(`${apiUrl}/api/v1/agent-runs?perPage=200`, {
            credentials: "include",
          }),
          fetch(`${apiUrl}/api/v1/agent-attribution?perPage=200`, {
            credentials: "include",
          }),
          fetch(`${apiUrl}/api/v1/agent-attribution/runs?limit=500`, {
            credentials: "include",
          }),
        ]);
        if (cancelled) return;
        if (!runsRes.ok && !fallbackRunsRes.ok && !clicksRes.ok) {
          setErrored(true);
          return;
        }

        let mappedRuns: RunRow[] = [];
        if (runsRes.ok) {
          const j = (await runsRes.json()) as { data?: AgentRunRow[] };
          mappedRuns = (j.data ?? []).map((r) => ({
            agentId: r.agentId,
            agentRunId: r.runId,
            actorId: r.actorId,
            status: r.status,
            linkCount: r.linkCount,
            clicks: r.clickCount,
            lastClickAt: r.updatedAt,
          }));
        } else if (fallbackRunsRes.ok) {
          const j = (await fallbackRunsRes.json()) as { data?: { runs?: RunRow[] } };
          mappedRuns = j.data?.runs ?? [];
        }

        const clicksJson = clicksRes.ok
          ? ((await clicksRes.json()) as { data?: { clicks?: ClickRow[] } })
          : null;
        setRuns(mappedRuns);
        setRecentClicks(clicksJson?.data?.clicks ?? []);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setErrored(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  const stats = useMemo(() => {
    const totalRuns = runs.length;
    const totalClicks = runs.reduce((acc, r) => acc + (r.clicks ?? 0), 0);
    // Prefer actor ids stored on runs (more reliable than the click sample).
    // Fall back to clicks for workspaces still on the legacy code path.
    const actorsFromRuns = runs
      .map((r) => r.actorId)
      .filter((v): v is string => !!v);
    const actorsFromClicks = recentClicks
      .map((c) => c.agentActorId)
      .filter((v): v is string => !!v);
    const uniqueActors = new Set(
      actorsFromRuns.length > 0 ? actorsFromRuns : actorsFromClicks,
    ).size;
    const distinctAgents = new Set(runs.map((r) => r.agentId).filter(Boolean)).size;
    return { totalRuns, totalClicks, uniqueActors, distinctAgents };
  }, [runs, recentClicks]);

  const geoData = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of recentClicks) {
      if (!c.country) continue;
      m.set(c.country, (m.get(c.country) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([country, clicks]) => ({ country, clicks }));
  }, [recentClicks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-2xl tracking-tight">Agent runs</h2>
          <Badge variant="secondary" className="gap-1">
            <Bot className="h-3 w-3" />
            New
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Every link generated by an AI agent carries{" "}
          <code className="rounded bg-muted px-1 text-xs">agent_id</code>,{" "}
          <code className="rounded bg-muted px-1 text-xs">agent_run_id</code>, and{" "}
          <code className="rounded bg-muted px-1 text-xs">agent_actor_id</code>. Slice
          your link attribution by the agent run that generated it.
        </p>
      </div>

      {errored && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Couldn&apos;t load agent attribution data. Make sure your MCP server has
            sent at least one run.
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Agent runs"
          icon={<Bot className="h-4 w-4 text-muted-foreground" />}
          value={stats.totalRuns}
          loading={loading}
        />
        <KpiCard
          title="Clicks attributed"
          icon={<MousePointerClick className="h-4 w-4 text-muted-foreground" />}
          value={stats.totalClicks}
          loading={loading}
        />
        <KpiCard
          title="Unique actors"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          value={stats.uniqueActors}
          loading={loading}
        />
        <KpiCard
          title="Distinct agents"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          value={stats.distinctAgents}
          loading={loading}
        />
      </div>

      {/* World map */}
      <Card>
        <CardHeader>
          <CardTitle>Where the clicks landed</CardTitle>
          <CardDescription>
            Geographic distribution of clicks attributed to your agent runs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {geoData.length > 0 ? (
            <WorldMap data={geoData} />
          ) : (
            <p className="py-8 text-center text-muted-foreground text-sm">
              No geo data yet — run an agent that generates a tracked link.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Runs list */}
      <Card>
        <CardHeader>
          <CardTitle>Recent runs</CardTitle>
          <CardDescription>
            Click counts per <code className="text-xs">(agent_id, agent_run_id)</code>{" "}
            pair, sorted by most recent activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <div className="space-y-3 py-10 text-center">
              <p className="text-muted-foreground text-sm">
                No agent runs yet. Stamp a link with{" "}
                <code className="rounded bg-muted px-1 text-xs">agent_id</code> +{" "}
                <code className="rounded bg-muted px-1 text-xs">agent_run_id</code> via the API,
                MCP server, or the Agent tab in the link-create dialog.
              </p>
              <a
                href="/agents/quickstart"
                className="inline-block font-medium text-primary text-sm hover:underline"
              >
                Read the 5-minute quickstart →
              </a>
            </div>
          ) : (
            <div className="divide-y">
              {runs.map((r) => (
                <div
                  key={`${r.agentId}-${r.agentRunId}`}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-lg">{emojiFor(r.agentId)}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{r.agentId ?? "—"}</span>
                        {r.status && r.status !== "completed" ? (
                          <Badge
                            variant={r.status === "running" ? "secondary" : "destructive"}
                            className="h-4 px-1.5 text-[10px] uppercase"
                          >
                            {r.status}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="truncate font-mono text-muted-foreground text-xs">
                        {r.agentRunId ?? "—"}
                      </div>
                      {r.actorId ? (
                        <div className="truncate text-muted-foreground text-xs">
                          actor: {r.actorId}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-6 text-right">
                    {typeof r.linkCount === "number" ? (
                      <div>
                        <div className="font-medium">{r.linkCount.toLocaleString()}</div>
                        <div className="text-muted-foreground text-xs">links</div>
                      </div>
                    ) : null}
                    <div>
                      <div className="font-medium">{r.clicks.toLocaleString()}</div>
                      <div className="text-muted-foreground text-xs">clicks</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">last seen</div>
                      <div className="text-xs">
                        {formatDistanceToNow(new Date(r.lastClickAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  title,
  icon,
  value,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  value: number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <AnimatedStat
            value={value}
            blurWhenEmpty={false}
            className="font-bold text-2xl"
          />
        )}
      </CardContent>
    </Card>
  );
}
