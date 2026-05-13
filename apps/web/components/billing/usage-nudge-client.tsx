"use client";

import { useUsage } from "@/hooks/use-queries";
import { UpgradeNudge } from "./upgrade-nudge";

// Extended usage data type that may include trackedClicksThisMonth from API
interface ExtendedUsageData {
  linksThisMonth?: { percentage: number | null };
  trackedClicksThisMonth?: { percentage: number | null };
  domains?: { percentage: number | null };
}

export function UsageNudgeClient() {
  const { data: rawUsage, isLoading } = useUsage();
  const usage = rawUsage as ExtendedUsageData | undefined;

  // Don't show anything while loading or if no data
  if (isLoading || !usage) {
    return null;
  }

  // Transform data to expected format with safe defaults
  const linksPercentage = usage.linksThisMonth?.percentage ?? 0;
  const clicksPercentage = usage.trackedClicksThisMonth?.percentage ?? 0;
  const domainsPercentage = usage.domains?.percentage ?? 0;

  // Check if user is approaching any limits
  const isNearLimit = linksPercentage >= 80 || clicksPercentage >= 80 || domainsPercentage >= 80;
  const isAtLimit = linksPercentage >= 100 || clicksPercentage >= 100 || domainsPercentage >= 100;

  if (isAtLimit) {
    return (
      <UpgradeNudge
        variant="limit-reached"
        title="You've reached your plan limits"
        description="Upgrade to a higher plan to continue creating links and unlock more features."
        ctaText="View Upgrade Options"
      />
    );
  }

  if (isNearLimit) {
    return (
      <UpgradeNudge
        variant="warning"
        description="You're approaching your plan limits. Consider upgrading for more capacity."
        compact
      />
    );
  }

  return null;
}
