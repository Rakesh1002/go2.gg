"use client";

import Link from "next/link";
import { Link2, Globe, Zap, Sparkles, MousePointer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UsageMeter } from "./usage-meter";
import { cn } from "@/lib/utils";

interface UsageStat {
  current: number;
  limit: number;
  percentage: number;
}

interface UsageData {
  linksThisMonth: UsageStat;
  trackedClicksThisMonth: UsageStat;
  domains: UsageStat;
  teamMembers: UsageStat;
  plan: string;
  status?: string;
}

interface UsageCardProps {
  usage: UsageData;
  className?: string;
  showUpgradeButton?: boolean;
}

export function UsageCard({ usage, className, showUpgradeButton = true }: UsageCardProps) {
  const isNearAnyLimit =
    usage.linksThisMonth.percentage >= 80 ||
    usage.trackedClicksThisMonth.percentage >= 80 ||
    usage.domains.percentage >= 80;

  const isTrial = usage.status === "trialing";
  const planDisplay = usage.plan.charAt(0).toUpperCase() + usage.plan.slice(1);

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Usage</CardTitle>
        <div className="flex items-center gap-2">
          {isTrial && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 gap-1">
              <Sparkles className="h-3 w-3" />
              Trial
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">{planDisplay} Plan</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <UsageMeter
          label="Links This Month"
          current={usage.linksThisMonth.current}
          limit={usage.linksThisMonth.limit}
        />
        <UsageMeter
          label="Tracked Clicks"
          current={usage.trackedClicksThisMonth.current}
          limit={usage.trackedClicksThisMonth.limit}
        />
        <UsageMeter
          label="Custom Domains"
          current={usage.domains.current}
          limit={usage.domains.limit}
        />
        {/* Only show team members for plans that support teams (limit > 1) */}
        {usage.teamMembers.limit > 1 && (
          <UsageMeter
            label="Team Members"
            current={usage.teamMembers.current}
            limit={usage.teamMembers.limit}
          />
        )}

        {showUpgradeButton && (usage.plan === "free" || isNearAnyLimit) && (
          <Button asChild variant="outline" className="w-full mt-4">
            <Link href="/dashboard/billing">
              <Zap className="mr-2 h-4 w-4" />
              Upgrade for More
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * A compact row of usage stats for the dashboard header
 */
interface UsageStatsRowProps {
  usage: UsageData;
  className?: string;
}

export function UsageStatsRow({ usage, className }: UsageStatsRowProps) {
  return (
    <div className={cn("flex items-center gap-6", className)}>
      <UsageStat
        icon={Link2}
        label="Links"
        current={usage.linksThisMonth.current}
        limit={usage.linksThisMonth.limit}
      />
      <UsageStat
        icon={MousePointer}
        label="Clicks"
        current={usage.trackedClicksThisMonth.current}
        limit={usage.trackedClicksThisMonth.limit}
      />
      <UsageStat
        icon={Globe}
        label="Domains"
        current={usage.domains.current}
        limit={usage.domains.limit}
      />
    </div>
  );
}

interface UsageStatItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  current: number;
  limit: number;
}

function UsageStat({ icon: Icon, label, current, limit }: UsageStatItemProps) {
  const percentage = (current / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  // Format large numbers (e.g., 50000 -> 50K)
  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span
        className={cn(
          "font-medium tabular-nums",
          isAtLimit && "text-destructive",
          isNearLimit && !isAtLimit && "text-amber-500"
        )}
      >
        {formatNumber(current)}
        <span className="text-muted-foreground">/{formatNumber(limit)}</span>
      </span>
    </div>
  );
}
