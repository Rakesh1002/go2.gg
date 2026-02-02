"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UpgradeNudgeProps {
  title?: string;
  description: string;
  variant?: "default" | "warning" | "limit-reached";
  ctaText?: string;
  ctaHref?: string;
  className?: string;
  compact?: boolean;
}

export function UpgradeNudge({
  title,
  description,
  variant = "default",
  ctaText = "Upgrade Now",
  ctaHref = "/dashboard/billing",
  className,
  compact = false,
}: UpgradeNudgeProps) {
  const variantClasses = {
    default: "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20",
    warning: "bg-warning/5 border-warning/30",
    "limit-reached": "bg-destructive/5 border-destructive/30",
  };

  const iconColors = {
    default: "text-primary",
    warning: "text-warning",
    "limit-reached": "text-destructive",
  };

  const Icon = variant === "default" ? Sparkles : AlertTriangle;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 rounded-lg border p-3",
          variantClasses[variant],
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("h-4 w-4 flex-shrink-0", iconColors[variant])} />
          <p className="text-sm">{description}</p>
        </div>
        <Button asChild size="sm" variant="secondary" className="flex-shrink-0">
          <Link href={ctaHref}>
            {ctaText}
            <ArrowRight className="ml-1.5 h-3 w-3" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border p-6", variantClasses[variant], className)}>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
            variant === "default" && "bg-primary/10",
            variant === "warning" && "bg-warning/10",
            variant === "limit-reached" && "bg-destructive/10"
          )}
        >
          <Icon className={cn("h-5 w-5", iconColors[variant])} />
        </div>
        <div className="flex-1 space-y-3">
          {title && <h3 className="font-semibold text-lg">{title}</h3>}
          <p className="text-muted-foreground">{description}</p>
          <Button asChild className="mt-2">
            <Link href={ctaHref}>
              {ctaText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * A smaller inline upgrade prompt for use within forms or dialogs
 */
interface InlineUpgradePromptProps {
  feature: string;
  planRequired?: string;
  className?: string;
}

export function InlineUpgradePrompt({
  feature,
  planRequired = "Pro",
  className,
}: InlineUpgradePromptProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground",
        className
      )}
    >
      <Sparkles className="h-4 w-4 text-primary" />
      <span>
        {feature} requires{" "}
        <Link href="/dashboard/billing" className="font-medium text-primary hover:underline">
          {planRequired} plan
        </Link>
      </span>
    </div>
  );
}
