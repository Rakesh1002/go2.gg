"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, CheckCircle2, FlaskConical, Pause, Play, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface ABVariant {
  id: string;
  name: string;
  url: string;
  weight: number;
  clicks?: number;
  conversions?: number;
}

interface ABTest {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "running" | "paused" | "completed";
  variants: ABVariant[];
  winnerVariantId: string | null;
  trafficPercentage: number;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export function ABTestsClient() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/ab-tests`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        // API returns { success, data: ABTest[], meta }
        setTests(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error("Failed to fetch A/B tests:", error);
      toast.error("Failed to load A/B tests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  async function handleAction(testId: string, action: "start" | "stop" | "complete") {
    try {
      const response = await fetch(`${API_URL}/api/v1/ab-tests/${testId}/${action}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || `Failed to ${action} test`);
      }

      toast.success(
        `Test ${action === "start" ? "started" : action === "stop" ? "paused" : "completed"}`
      );
      fetchTests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${action} test`);
    }
  }

  const getStatusBadge = (status: ABTest["status"]) => {
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
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={`skeleton-${i}`}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <FlaskConical className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 font-semibold text-lg">No A/B Tests Yet</h3>
          <p className="mb-6 max-w-md text-center text-muted-foreground">
            A/B tests help you optimize your links by testing different destinations. Create a new
            link with A/B testing enabled to get started.
          </p>
          <Button asChild>
            <Link href="/dashboard/links">
              <Plus className="mr-2 h-4 w-4" />
              Create Link with A/B Test
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {tests.map((test) => (
        <Card key={test.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {test.name}
                  {getStatusBadge(test.status)}
                </CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  {test.description && (
                    <span className="text-muted-foreground text-xs">{test.description}</span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {test.status === "draft" && (
                  <Button size="sm" onClick={() => handleAction(test.id, "start")}>
                    <Play className="mr-1 h-3 w-3" />
                    Start
                  </Button>
                )}
                {test.status === "running" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(test.id, "stop")}
                    >
                      <Pause className="mr-1 h-3 w-3" />
                      Pause
                    </Button>
                    <Button size="sm" onClick={() => handleAction(test.id, "complete")}>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Complete
                    </Button>
                  </>
                )}
                {test.status === "paused" && (
                  <Button size="sm" onClick={() => handleAction(test.id, "start")}>
                    <Play className="mr-1 h-3 w-3" />
                    Resume
                  </Button>
                )}
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/dashboard/ab-tests/${test.id}`}>
                    <BarChart3 className="mr-1 h-3 w-3" />
                    Results
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Variants</h4>
              <div className="grid gap-2">
                {test.variants.map((variant, index) => (
                  <div
                    key={`${test.id}-variant-${index}`}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          index === 0 ? "bg-blue-500" : "bg-orange-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-sm">{variant.name}</p>
                        <p className="max-w-xs truncate text-muted-foreground text-xs">
                          {variant.url}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-medium">{variant.weight}%</p>
                        <p className="text-muted-foreground text-xs">Traffic</p>
                      </div>
                      {variant.clicks !== undefined && (
                        <div className="text-right">
                          <p className="font-medium">{variant.clicks}</p>
                          <p className="text-muted-foreground text-xs">Clicks</p>
                        </div>
                      )}
                      {test.winnerVariantId === variant.id && (
                        <Badge className="border-green-200 bg-green-500/10 text-green-600">
                          Winner
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
