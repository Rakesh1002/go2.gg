"use client";

import { cn } from "@/lib/utils";

interface UsageMeterProps {
  label: string;
  current: number;
  limit: number | null;
  className?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

export function UsageMeter({
  label,
  current,
  limit,
  className,
  showPercentage = true,
  size = "md",
}: UsageMeterProps) {
  // If no limit is set, don't render (all plans should have limits)
  if (limit === null) {
    return null;
  }

  const percentage = Math.min(100, (current / limit) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const heightClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span
          className={cn(
            "font-medium tabular-nums flex items-center gap-1",
            isAtLimit && "text-destructive",
            isNearLimit && !isAtLimit && "text-amber-500"
          )}
        >
          {current.toLocaleString()}
          <span className="text-muted-foreground"> / {limit.toLocaleString()}</span>
          {showPercentage && (
            <span className="ml-2 text-muted-foreground text-xs">({Math.round(percentage)}%)</span>
          )}
        </span>
      </div>
      <div className={cn("overflow-hidden rounded-full bg-muted", heightClasses[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isAtLimit ? "bg-destructive" : isNearLimit ? "bg-amber-500" : "bg-primary"
          )}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        />
      </div>
    </div>
  );
}
