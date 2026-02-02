"use client";

import * as React from "react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Sparkles, ChevronUp, MousePointer, Link2, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UsageItem {
  label: string;
  current: number;
  limit: number | null;
  icon?: React.ReactNode;
}

interface SidebarUsageProps {
  /** Usage items to display */
  items: UsageItem[];
  /** User's current plan */
  plan: string;
  /** Whether the user is on a trial */
  isTrial?: boolean;
  /** When the trial/billing period ends */
  periodEnd?: Date | null;
  /** Whether the sidebar is collapsed */
  collapsed?: boolean;
  className?: string;
}

export function SidebarUsage({
  items,
  plan,
  isTrial = false,
  periodEnd,
  collapsed = false,
  className,
}: SidebarUsageProps) {
  const [expanded, setExpanded] = React.useState(false);

  // If collapsed, just show a small indicator
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("px-3 py-2", className)}>
            <div className="flex flex-col items-center gap-1">
              {items.map((item, i) => {
                const percentage = item.limit
                  ? Math.min((item.current / item.limit) * 100, 100)
                  : 0;
                const isNearLimit = item.limit !== null && percentage >= 80;

                return (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isNearLimit ? "bg-amber-500" : "bg-primary/40"
                    )}
                  />
                );
              })}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="space-y-1 text-xs">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span>{item.label}:</span>
                <span className="font-medium">
                  {item.current}
                  {item.limit !== null && `/${item.limit}`}
                </span>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn("px-3 py-3 border-t", className)}>
      {/* Header with plan badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isTrial && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <Sparkles className="h-3 w-3" />
              <span>Trial</span>
            </div>
          )}
          <span className="text-xs text-muted-foreground capitalize">{plan} Plan</span>
        </div>
        {expanded ? (
          <button
            onClick={() => setExpanded(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Usage bars */}
      <div className="space-y-3">
        {items.slice(0, expanded ? undefined : 2).map((item, i) => {
          const percentage = item.limit ? Math.min((item.current / item.limit) * 100, 100) : 0;
          const isNearLimit = item.limit !== null && percentage >= 80;
          const isUnlimited = item.limit === null;

          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  {item.icon}
                  {item.label}
                </span>
                <span className={cn("font-medium tabular-nums", isNearLimit && "text-amber-500")}>
                  {item.current.toLocaleString()}
                  {!isUnlimited && (
                    <span className="text-muted-foreground">/{item.limit?.toLocaleString()}</span>
                  )}
                  {isUnlimited && <span className="text-muted-foreground ml-0.5">used</span>}
                </span>
              </div>
              {!isUnlimited && (
                <Progress
                  value={percentage}
                  className={cn("h-1.5", isNearLimit && "[&>div]:bg-amber-500")}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Expand/collapse button */}
      {items.length > 2 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Show more
        </button>
      )}

      {/* Reset date */}
      {periodEnd && (
        <p className="text-xs text-muted-foreground mt-3">
          {isTrial ? "Trial ends" : "Resets"} {formatDistanceToNow(periodEnd, { addSuffix: true })}
        </p>
      )}

      {/* Upgrade button */}
      {(plan === "free" || isTrial) && (
        <Button asChild size="sm" className="w-full mt-3 gap-1.5" variant="outline">
          <Link href="/dashboard/billing">
            <Zap className="h-3.5 w-3.5" />
            Upgrade
          </Link>
        </Button>
      )}
    </div>
  );
}

/**
 * Pre-built usage widget with common metrics
 */
interface SidebarUsageWidgetProps {
  /** Current events/clicks count */
  events: number;
  /** Events limit */
  eventsLimit: number | null;
  /** Current links count */
  links: number;
  /** Links limit */
  linksLimit: number | null;
  /** User's plan */
  plan: string;
  /** Whether on trial */
  isTrial?: boolean;
  /** When period resets */
  periodEnd?: Date | null;
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  className?: string;
}

export function SidebarUsageWidget({
  events,
  eventsLimit,
  links,
  linksLimit,
  plan,
  isTrial = false,
  periodEnd,
  collapsed = false,
  className,
}: SidebarUsageWidgetProps) {
  const items: UsageItem[] = [
    {
      label: "Events",
      current: events,
      limit: eventsLimit,
      icon: <MousePointer className="h-3 w-3" />,
    },
    {
      label: "Links",
      current: links,
      limit: linksLimit,
      icon: <Link2 className="h-3 w-3" />,
    },
  ];

  return (
    <SidebarUsage
      items={items}
      plan={plan}
      isTrial={isTrial}
      periodEnd={periodEnd}
      collapsed={collapsed}
      className={className}
    />
  );
}
