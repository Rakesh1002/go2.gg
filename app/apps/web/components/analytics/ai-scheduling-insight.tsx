"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Calendar, Clock, TrendingUp, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SchedulingData {
  bestDays: string[];
  bestHours: number[];
  timezone: string;
  confidence: number;
  reasoning: string;
}

export function AISchedulingInsight() {
  const [data, setData] = useState<SchedulingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this
    const isDismissed = localStorage.getItem("ai-insight-dismissed");
    if (isDismissed) {
      setDismissed(true);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
        const response = await fetch(`${apiUrl}/api/v1/ai/scheduling`, {
          credentials: "include",
        });

        if (response.ok) {
          const result = await response.json();
          setData(result.data);
        }
      } catch (error) {
        console.error("Error fetching scheduling insights:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("ai-insight-dismissed", "true");
  };

  if (loading) {
    return <SchedulingSkeleton />;
  }

  // Hide if dismissed or no data or confidence is too low (< 30%) - not enough real click data
  if (dismissed || !data || data.confidence < 0.3) return null;

  const confidenceLabel =
    data.confidence >= 0.7 ? "High" : data.confidence >= 0.5 ? "Medium" : "Low";
  const confidenceColor =
    data.confidence >= 0.7
      ? "text-green-600"
      : data.confidence >= 0.5
        ? "text-amber-600"
        : "text-muted-foreground";

  return (
    <Card className="relative overflow-hidden border-border/50 bg-gradient-to-r from-muted/30 to-muted/10">
      {/* Subtle accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/50 via-primary/30 to-transparent" />

      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left section - Icon and content */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Icon */}
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">AI Engagement Insights</h3>
                <Badge variant="secondary" className="text-xs">
                  Beta
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{data.reasoning}</p>
            </div>
          </div>

          {/* Right section - Stats */}
          <div className="hidden sm:flex flex-col gap-2 text-sm min-w-[200px]">
            {data.bestDays.length > 0 && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-xs">Best Days</span>
                </div>
                <span className="text-xs font-medium truncate">
                  {data.bestDays.slice(0, 3).join(", ")}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">Peak Hours</span>
              </div>
              <span className="text-xs font-medium">
                {data.bestHours
                  .slice(0, 3)
                  .map((h) => `${h}:00`)
                  .join(", ")}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-xs">Confidence</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={data.confidence * 100} className="h-1.5 w-12" />
                <span className={cn("text-xs font-medium", confidenceColor)}>
                  {confidenceLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Dismiss button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile stats */}
        <div className="sm:hidden mt-4 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            <span>{data.bestDays.slice(0, 2).join(", ")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>
              {data.bestHours
                .slice(0, 2)
                .map((h) => `${h}:00`)
                .join(", ")}
            </span>
          </div>
          <div className={cn("flex items-center gap-1.5", confidenceColor)}>
            <TrendingUp className="h-3 w-3" />
            <span>{confidenceLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SchedulingSkeleton() {
  return (
    <Card className="border-border/50 bg-muted/20">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <div className="hidden sm:block space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
