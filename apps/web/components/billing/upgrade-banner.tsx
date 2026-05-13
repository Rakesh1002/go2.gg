"use client";

import Link from "next/link";
import { useSubscription } from "@/contexts/subscription-context";
import { Crown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type LimitType = "links" | "clicks" | "domains" | "payment";

/**
 * Hook to check if the upgrade banner should be visible
 */
export function useUpgradeBannerVisible() {
  const { usage, subscription, loading } = useSubscription();

  if (loading) return { visible: false, limitInfo: null };

  // Check for payment failure
  if (subscription.status === "past_due") {
    return {
      visible: true,
      limitInfo: {
        type: "payment" as LimitType,
        message: "Your last payment failed. Please update your payment method.",
        shortMessage: "Payment failed",
      },
    };
  }

  // Check usage limits
  if (usage) {
    if (usage.linksThisMonth.percentage >= 100) {
      return {
        visible: true,
        limitInfo: {
          type: "links" as LimitType,
          message: "You've hit the monthly links limit on your current plan.",
          shortMessage: "Links limit reached",
        },
      };
    }
    if (usage.trackedClicksThisMonth.percentage >= 100) {
      return {
        visible: true,
        limitInfo: {
          type: "clicks" as LimitType,
          message: "You've hit the monthly tracked clicks limit on your current plan.",
          shortMessage: "Clicks limit reached",
        },
      };
    }
    if (usage.domains.percentage >= 100) {
      return {
        visible: true,
        limitInfo: {
          type: "domains" as LimitType,
          message: "You've hit the custom domains limit on your current plan.",
          shortMessage: "Domains limit reached",
        },
      };
    }
  }

  return { visible: false, limitInfo: null };
}

/**
 * Fixed top banner that appears when usage limits are exceeded or payment fails.
 *
 * Features:
 * - Shows when exceeding links, clicks, or domains limits
 * - Shows when payment has failed
 * - Animated slide-down entrance
 * - Can be dismissed (but reappears on page reload)
 */
export function UpgradeBanner() {
  const { visible, limitInfo } = useUpgradeBannerVisible();
  const [dismissed, setDismissed] = useState(false);

  const limitType = limitInfo?.type;

  // Reset dismissed state when the limit changes
  useEffect(() => {
    setDismissed(false);
  }, [limitType]);

  const showBanner = visible && !dismissed;
  const isPaymentIssue = limitInfo?.type === "payment";

  return (
    <AnimatePresence>
      {showBanner && limitInfo && (
        <motion.div
          initial={{ y: -48 }}
          animate={{ y: 0 }}
          exit={{ y: -48 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed top-0 right-0 left-0 z-50 flex h-12 items-center justify-center px-4",
            isPaymentIssue
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground"
          )}
        >
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Crown className="h-4 w-4 shrink-0" />
              <p className="truncate font-medium text-sm">
                <span className="hidden sm:inline">{limitInfo.message}</span>
                <span className="sm:hidden">{limitInfo.shortMessage}</span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isPaymentIssue ? (
                <Link
                  href="/dashboard/billing"
                  className={cn(
                    "inline-flex items-center justify-center rounded-md px-3 py-1.5 font-medium text-sm",
                    "bg-background text-foreground transition-colors hover:bg-accent"
                  )}
                >
                  Update Payment
                </Link>
              ) : (
                <Link
                  href="/dashboard/billing"
                  className={cn(
                    "inline-flex items-center justify-center rounded-md px-3 py-1.5 font-medium text-sm",
                    "bg-background text-foreground transition-colors hover:bg-accent"
                  )}
                >
                  Upgrade
                </Link>
              )}

              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="rounded p-1 transition-colors hover:bg-white/10"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Spacer component to push content down when banner is visible.
 * Place this at the top of your main content area.
 */
export function UpgradeBannerSpacer() {
  const { visible } = useUpgradeBannerVisible();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 48 }}
          exit={{ height: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </AnimatePresence>
  );
}
