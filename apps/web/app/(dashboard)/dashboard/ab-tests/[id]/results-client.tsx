"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Crown,
  ExternalLink,
  FlaskConical,
  Loader2,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface VariantResult {
  id: string;
  name: string;
  url: string;
  weight: number;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

interface ResultsResponse {
  test: {
    id: string;
    name: string;
    description: string | null;
    status: "draft" | "running" | "paused" | "completed";
    variants: VariantResult[];
    winnerVariantId: string | null;
    trafficPercentage: number;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
  };
  variants: VariantResult[];
  summary: {
    totalClicks: number;
    totalConversions: number;
    overallConversionRate: number;
    leaderId: string;
    leaderName: string;
    isSignificant: boolean;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

const VARIANT_COLORS = ["bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500"];

export function ABTestResultsClient({ testId }: { testId: string }) {
  const router = useRouter();
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/ab-tests/${testId}/results`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("A/B test not found");
          router.push("/dashboard/ab-tests");
          return;
        }
        throw new Error("Failed to load results");
      }
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error("Failed to fetch A/B test results:", error);
      toast.error("Failed to load A/B test results");
    } finally {
      setLoading(false);
    }
  }, [testId, router]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  async function handleAction(action: "start" | "stop" | "complete" | "delete") {
    setActionLoading(action);
    try {
      const method = action === "delete" ? "DELETE" : "POST";
      const path = action === "delete" ? "" : `/${action}`;
      const response = await fetch(`${API_URL}/api/v1/ab-tests/${testId}${path}`, {
        method,
        credentials: "include",
      });
      if (!response.ok && response.status !== 204) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error?.message || `Failed to ${action} test`);
      }
      if (action === "delete") {
        toast.success("Test deleted");
        router.push("/dashboard/ab-tests");
        return;
      }
      toast.success(
        action === "start"
          ? "Test started"
          : action === "stop"
            ? "Test paused"
            : "Test completed — winner picked"
      );
      fetchResults();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${action} test`);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { test, variants, summary } = data;
  const statusBadge = getStatusBadge(test.status);
  const winnerVariant = variants.find((v) => v.id === test.winnerVariantId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/ab-tests">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-muted-foreground" />
              <h1 className="font-bold text-2xl tracking-tight">{test.name}</h1>
              {statusBadge}
            </div>
            {test.description && (
              <p className="mt-1 text-muted-foreground text-sm">{test.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {test.status === "draft" && (
            <Button onClick={() => handleAction("start")} disabled={actionLoading !== null}>
              {actionLoading === "start" ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Play className="mr-1 h-3 w-3" />
              )}
              Start
            </Button>
          )}
          {test.status === "running" && (
            <>
              <Button
                variant="outline"
                onClick={() => handleAction("stop")}
                disabled={actionLoading !== null}
              >
                {actionLoading === "stop" ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Pause className="mr-1 h-3 w-3" />
                )}
                Pause
              </Button>
              <Button
                onClick={() => handleAction("complete")}
                disabled={actionLoading !== null || summary.totalClicks === 0}
              >
                {actionLoading === "complete" ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                )}
                Complete & pick winner
              </Button>
            </>
          )}
          {test.status === "paused" && (
            <>
              <Button onClick={() => handleAction("start")} disabled={actionLoading !== null}>
                {actionLoading === "start" ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Play className="mr-1 h-3 w-3" />
                )}
                Resume
              </Button>
              <Button
                onClick={() => handleAction("complete")}
                disabled={actionLoading !== null || summary.totalClicks === 0}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Complete
              </Button>
            </>
          )}
          {test.status !== "completed" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleAction("delete")}
              disabled={actionLoading !== null}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Total clicks" value={summary.totalClicks.toLocaleString()} />
        <SummaryCard label="Total conversions" value={summary.totalConversions.toLocaleString()} />
        <SummaryCard
          label="Overall conversion rate"
          value={`${summary.overallConversionRate.toFixed(2)}%`}
        />
        <SummaryCard
          label="Traffic in test"
          value={`${test.trafficPercentage}%`}
          hint={
            test.trafficPercentage < 100
              ? `${100 - test.trafficPercentage}% goes to default URL`
              : undefined
          }
        />
      </div>

      {/* Significance / leader callout */}
      {test.status === "running" && summary.totalClicks > 0 && (
        <Alert>
          <BarChart3 className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Current leader: {summary.leaderName}
            {summary.isSignificant ? (
              <Badge className="border-green-200 bg-green-500/10 text-green-600">
                Likely significant
              </Badge>
            ) : (
              <Badge variant="secondary">Gathering data</Badge>
            )}
          </AlertTitle>
          <AlertDescription>
            {summary.isSignificant
              ? "Enough traffic has accumulated to act on this result. You can complete the test to lock in the winner."
              : `Need at least 100 total clicks for a confident call (have ${summary.totalClicks}).`}
          </AlertDescription>
        </Alert>
      )}

      {test.status === "completed" && winnerVariant && (
        <Alert className="border-green-200 bg-green-500/5">
          <Crown className="h-4 w-4 text-green-600" />
          <AlertTitle>Winner: {winnerVariant.name}</AlertTitle>
          <AlertDescription>
            The link now redirects all traffic to{" "}
            <span className="font-mono text-xs">{winnerVariant.url}</span>.
          </AlertDescription>
        </Alert>
      )}

      {/* Variant breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Per-variant clicks, conversions, and revenue.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {variants.map((variant, index) => {
              const isLeader = variant.id === summary.leaderId;
              const isWinner = variant.id === test.winnerVariantId;
              const colorClass = VARIANT_COLORS[index % VARIANT_COLORS.length];
              return (
                <div key={variant.id} className="rounded-lg border bg-card p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex flex-1 items-center gap-3">
                      <div className={cn("h-8 w-1 rounded-full", colorClass)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{variant.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {variant.weight}% traffic
                          </Badge>
                          {isWinner && (
                            <Badge className="border-green-200 bg-green-500/10 text-green-600">
                              <Crown className="mr-1 h-3 w-3" />
                              Winner
                            </Badge>
                          )}
                          {!isWinner && isLeader && test.status === "running" && (
                            <Badge className="border-blue-200 bg-blue-500/10 text-blue-600">
                              Leader
                            </Badge>
                          )}
                        </div>
                        <a
                          href={variant.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 truncate text-muted-foreground text-xs hover:text-foreground"
                        >
                          {variant.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Stat label="Clicks" value={variant.clicks.toLocaleString()} />
                    <Stat label="Conversions" value={variant.conversions.toLocaleString()} />
                    <Stat label="Conversion rate" value={`${variant.conversionRate.toFixed(2)}%`} />
                  </div>

                  {summary.totalClicks > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-muted-foreground text-xs">
                        <span>Share of clicks</span>
                        <span>{((variant.clicks / summary.totalClicks) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={(variant.clicks / summary.totalClicks) * 100}
                        className="h-2"
                      />
                    </div>
                  )}

                  {variant.revenue > 0 && (
                    <p className="mt-3 text-muted-foreground text-xs">
                      Revenue: ${variant.revenue.toFixed(2)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusBadge(status: ResultsResponse["test"]["status"]) {
  switch (status) {
    case "running":
      return <Badge className="border-green-200 bg-green-500/10 text-green-600">Running</Badge>;
    case "paused":
      return <Badge variant="secondary">Paused</Badge>;
    case "completed":
      return <Badge className="border-blue-200 bg-blue-500/10 text-blue-600">Completed</Badge>;
    default:
      return <Badge variant="outline">Draft</Badge>;
  }
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
        <p className="mt-1 font-bold text-2xl">{value}</p>
        {hint && <p className="mt-1 text-muted-foreground text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-0.5 font-semibold text-base">{value}</p>
    </div>
  );
}
