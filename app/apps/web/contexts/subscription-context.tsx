"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { canAccessFeature, type Feature, type PlanId } from "@/lib/feature-gates";

interface Subscription {
  plan: PlanId;
  status: "active" | "trialing" | "canceled" | "past_due";
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

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
}

interface SubscriptionContextType {
  subscription: Subscription;
  usage: UsageData | null;
  loading: boolean;
  error: string | null;
  canAccess: (feature: Feature) => boolean;
  isTrialing: boolean;
  isFree: boolean;
  isPro: boolean;
  isBusiness: boolean;
  refetch: () => Promise<void>;
}

const defaultSubscription: Subscription = {
  plan: "free",
  status: "active",
  trialEndsAt: null,
  currentPeriodEnd: null,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription>(defaultSubscription);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats which includes subscription info
      const [statsResponse, usageResponse] = await Promise.all([
        fetch(`${API_URL}/api/v1/stats/dashboard`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/api/v1/usage`, {
          credentials: "include",
        }),
      ]);

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        if (statsResult.data?.subscription) {
          setSubscription({
            plan: (statsResult.data.subscription.plan as PlanId) || "free",
            status: statsResult.data.subscription.status || "active",
            trialEndsAt: statsResult.data.subscription.trialEndsAt || null,
            currentPeriodEnd: null,
          });
        }
      }

      if (usageResponse.ok) {
        const usageResult = await usageResponse.json();
        if (usageResult.data) {
          const defaultStat = { current: 0, limit: 1, percentage: 0 };
          setUsage({
            linksThisMonth: usageResult.data.linksThisMonth || defaultStat,
            trackedClicksThisMonth: usageResult.data.trackedClicksThisMonth || defaultStat,
            domains: usageResult.data.domains || defaultStat,
            teamMembers: usageResult.data.teamMembers || defaultStat,
          });

          // Also get plan from usage if available
          if (usageResult.data.plan) {
            setSubscription((prev) => ({
              ...prev,
              plan: usageResult.data.plan as PlanId,
            }));
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
      setError("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const canAccess = useCallback(
    (feature: Feature) => {
      return canAccessFeature(subscription.plan, feature);
    },
    [subscription.plan]
  );

  const value: SubscriptionContextType = {
    subscription,
    usage,
    loading,
    error,
    canAccess,
    isTrialing: subscription.status === "trialing",
    isFree: subscription.plan === "free",
    isPro: subscription.plan === "pro",
    isBusiness: subscription.plan === "business" || subscription.plan === "enterprise",
    refetch: fetchSubscription,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}

/**
 * Hook to check if user can access a specific feature
 */
export function useFeatureAccess(feature: Feature) {
  const { canAccess, loading, subscription } = useSubscription();

  return {
    canAccess: canAccess(feature),
    loading,
    plan: subscription.plan,
    isTrialing: subscription.status === "trialing",
  };
}
