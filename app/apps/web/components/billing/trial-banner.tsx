"use client";

import Link from "next/link";
import { Clock, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TrialBannerProps {
  trialEndsAt: string | null;
  plan?: string;
  status: string;
  className?: string;
}

export function TrialBanner({ trialEndsAt, status, className }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!trialEndsAt || status !== "trialing") {
      setDaysRemaining(null);
      return;
    }

    const endDate = new Date(trialEndsAt);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    setDaysRemaining(Math.max(0, diffDays));
  }, [trialEndsAt, status]);

  // Don't show if not on trial, dismissed, or no days remaining calculated
  if (status !== "trialing" || dismissed || daysRemaining === null) {
    return null;
  }

  const isUrgent = daysRemaining <= 3;

  return (
    <div
      className={cn(
        "relative rounded-lg border px-4 py-3 transition-colors",
        isUrgent
          ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
          : "bg-primary/5 border-primary/20",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              isUrgent
                ? "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400"
                : "bg-primary/10 text-primary"
            )}
          >
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {daysRemaining === 0
                ? "Your Pro trial ends today!"
                : daysRemaining === 1
                  ? "Your Pro trial ends tomorrow"
                  : `${daysRemaining} days left in your Pro trial`}
            </p>
            <p className="text-xs text-muted-foreground">
              {isUrgent
                ? "Upgrade now to keep all your Pro features"
                : "Enjoy all Pro features while you explore"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className={cn(isUrgent && "bg-amber-600 hover:bg-amber-700 text-white")}
          >
            <Link href="/dashboard/billing">
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              Upgrade Now
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
