"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsage } from "@/hooks/use-queries";
import { UsageCard } from "./usage-card";
import { cn } from "@/lib/utils";

interface UsageCardClientProps {
  className?: string;
  showUpgradeButton?: boolean;
}

// Extended usage data type that may include trackedClicksThisMonth from API
interface ExtendedUsageData {
  links?: { current: number; limit: number | null; percentage: number | null };
  linksThisMonth?: { current: number; limit: number | null; percentage: number | null };
  trackedClicksThisMonth?: { current: number; limit: number | null; percentage: number | null };
  domains?: { current: number; limit: number | null; percentage: number | null };
  teamMembers?: { current: number; limit: number | null; percentage: number | null };
  plan?: string;
  status?: string;
}

export function UsageCardClient({ className, showUpgradeButton = true }: UsageCardClientProps) {
  const { data: rawUsage, isLoading, error } = useUsage();
  const usage = rawUsage as ExtendedUsageData | undefined;

  // Show skeleton while loading
  if (isLoading) {
    return (
      <Card className={cn(className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-2 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error || !usage) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load usage data</p>
        </CardContent>
      </Card>
    );
  }

  // Transform the usage data to match UsageCard's expected format
  const usageData = {
    linksThisMonth: {
      current: usage.linksThisMonth?.current ?? 0,
      limit: usage.linksThisMonth?.limit ?? 0,
      percentage: usage.linksThisMonth?.percentage ?? 0,
    },
    trackedClicksThisMonth: {
      current: usage.trackedClicksThisMonth?.current ?? 0,
      limit: usage.trackedClicksThisMonth?.limit ?? 0,
      percentage: usage.trackedClicksThisMonth?.percentage ?? 0,
    },
    domains: {
      current: usage.domains?.current ?? 0,
      limit: usage.domains?.limit ?? 0,
      percentage: usage.domains?.percentage ?? 0,
    },
    teamMembers: {
      current: usage.teamMembers?.current ?? 0,
      limit: usage.teamMembers?.limit ?? 1,
      percentage: usage.teamMembers?.percentage ?? 0,
    },
    plan: usage.plan ?? "free",
    status: usage.status,
  };

  return <UsageCard usage={usageData} className={className} showUpgradeButton={showUpgradeButton} />;
}
