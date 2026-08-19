"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  price: number | null;
  priceId: string | null;
  description: string;
  features: string[];
  recommended?: boolean;
}

interface BillingClientProps {
  plans: Plan[];
}

interface Subscription {
  id: string;
  status: string;
  plan: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface Organization {
  id: string;
  name: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export function BillingClient({ plans }: BillingClientProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [managingPortal, setManagingPortal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);

  // Fetch the org + subscription. Returns the resolved org so callers can chain
  // (e.g. the post-checkout confirm flow needs the org before it can refetch).
  const loadData = useCallback(async (): Promise<Organization | null> => {
    try {
      const orgResponse = await fetch(`${API_URL}/api/v1/organizations`, {
        credentials: "include",
      });
      if (!orgResponse.ok) {
        console.error("Failed to fetch organizations:", orgResponse.status);
        return null;
      }
      const orgResult = await orgResponse.json();
      const org = (orgResult.data || [])[0];
      if (!org) {
        console.error("No organization found");
        return null;
      }
      setOrganization(org);

      const subResponse = await fetch(
        `${API_URL}/api/v1/billing/subscription?organizationId=${org.id}`,
        { credentials: "include" }
      );
      if (subResponse.ok) {
        const subResult = await subResponse.json();
        if (subResult.success) {
          setSubscription(subResult.data.subscription ?? null);
          if (subResult.data.plan) {
            setCurrentPlan(subResult.data.plan);
          }
        }
      }
      return org;
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load.
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Post-checkout: reconcile the subscription synchronously instead of waiting
  // for the (eventually-consistent) Stripe webhook, so the plan flips to paid
  // the moment this page loads. Then invalidate the cross-app usage/stats caches
  // so the dashboard + home reflect the upgrade immediately too.
  const confirmRan = useRef(false);
  useEffect(() => {
    if (confirmRan.current) return;

    if (searchParams.get("canceled") === "true") {
      confirmRan.current = true;
      toast.info("Checkout canceled — you have not been charged.");
      return;
    }

    if (searchParams.get("success") !== "true") return;
    confirmRan.current = true;
    setConfirming(true);

    const sessionId = searchParams.get("session_id");

    (async () => {
      try {
        let confirmedPlan: string | null = null;
        if (sessionId) {
          const res = await fetch(`${API_URL}/api/v1/billing/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
            credentials: "include",
          });
          const result = await res.json().catch(() => null);
          if (res.ok && result?.success && result.data?.plan) {
            confirmedPlan = result.data.plan as string;
          }
        }

        // Refresh local + cross-app state from the source of truth.
        await loadData();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.usage }),
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats }),
        ]);

        if (confirmedPlan && confirmedPlan !== "free") {
          setCurrentPlan(confirmedPlan);
          setSuccessPlan(confirmedPlan);
        } else {
          // Webhook hasn't settled and confirm didn't resolve a paid plan —
          // tell the truth rather than show a false success.
          toast.success("Payment received. Your plan is updating — this can take a few seconds.");
        }
      } catch (error) {
        console.error("Failed to confirm checkout:", error);
        toast.error("We received your payment but couldn't refresh the page. Please reload.");
      } finally {
        setConfirming(false);
        // Strip the checkout params so a refresh doesn't re-trigger confirm.
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    })();
  }, [searchParams, loadData, queryClient]);

  const planLabel = (id: string) =>
    plans.find((p) => p.id === id)?.name ?? id.charAt(0).toUpperCase() + id.slice(1);

  // Pricing-CTA funnel: /dashboard/billing?upgrade=pro auto-starts checkout
  // once the current plan is known, so a signup that began on the pricing
  // page lands directly on Stripe instead of a wall of plan cards.
  const autoUpgradeFired = useRef(false);
  useEffect(() => {
    if (loading || autoUpgradeFired.current) return;
    const upgrade = searchParams.get("upgrade");
    if (!upgrade || upgrade === currentPlan) return;
    const target = plans.find((p) => p.id === upgrade);
    if (target?.priceId) {
      autoUpgradeFired.current = true;
      handleUpgrade(target.priceId, target.id);
    }
  });

  async function handleUpgrade(priceId: string, planId: string) {
    setUpgrading(planId);

    try {
      const response = await fetch(`${API_URL}/api/v1/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Failed to create checkout");
      }

      // Redirect to Stripe Checkout
      if (result.data.url) {
        window.location.href = result.data.url;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upgrade");
      setUpgrading(null);
    }
  }

  async function handleManageSubscription() {
    if (!organization) {
      toast.error("Organization not found");
      return;
    }

    setManagingPortal(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/billing/portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: organization.id }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Failed to open portal");
      }

      if (result.data.url) {
        window.location.href = result.data.url;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open billing portal");
      setManagingPortal(false);
    }
  }

  // Get display name for plan (handles trial status)
  const planDisplayName =
    subscription?.status === "trialing"
      ? `${planLabel(currentPlan)} (Trial)`
      : planLabel(currentPlan);

  return (
    <>
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            {confirming
              ? "Finalizing your upgrade…"
              : subscription?.status === "trialing"
                ? `You are on a ${currentPlan} trial`
                : subscription
                  ? `You are on the ${currentPlan} plan`
                  : "You are currently on the Free plan"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading || confirming ? (
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-2xl">{planDisplayName}</p>
                {subscription?.currentPeriodEnd && (
                  <p className="text-muted-foreground text-sm">
                    {subscription.status === "trialing"
                      ? `Trial ends on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                      : subscription.cancelAtPeriodEnd
                        ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                        : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                  </p>
                )}
              </div>
              {subscription && (
                <Button
                  variant="outline"
                  onClick={handleManageSubscription}
                  disabled={managingPortal}
                >
                  {managingPortal ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Manage subscription"
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="mb-4 font-semibold text-xl">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isUpgrading = upgrading === plan.id;

            // Plan hierarchy for comparison
            const planOrder = { free: 0, pro: 1, business: 2, scale: 3, enterprise: 4 };
            const currentPlanOrder = planOrder[currentPlan as keyof typeof planOrder] ?? 0;
            const thisPlanOrder = planOrder[plan.id as keyof typeof planOrder] ?? 0;
            const isDowngrade = thisPlanOrder < currentPlanOrder;

            return (
              <Card
                key={plan.id}
                className={plan.recommended ? "border-primary shadow-lg" : undefined}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {isCurrent && <Badge variant="secondary">Current</Badge>}
                    {plan.recommended && !isCurrent && <Badge>Recommended</Badge>}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    {plan.price !== null ? (
                      <>
                        <span className="font-bold text-3xl">${plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    ) : (
                      <span className="font-bold text-3xl">Custom</span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={
                      isCurrent
                        ? "outline"
                        : isDowngrade
                          ? "ghost"
                          : plan.recommended
                            ? "default"
                            : "secondary"
                    }
                    disabled={isCurrent || isUpgrading || isDowngrade || !plan.priceId}
                    onClick={() => plan.priceId && handleUpgrade(plan.priceId, plan.id)}
                  >
                    {isUpgrading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      "Current plan"
                    ) : isDowngrade ? (
                      "—"
                    ) : plan.price === null ? (
                      "Contact sales"
                    ) : (
                      "Upgrade"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Post-upgrade success modal */}
      <Dialog open={successPlan !== null} onOpenChange={(open) => !open && setSuccessPlan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">
              You're on {successPlan ? planLabel(successPlan) : "your new plan"}
            </DialogTitle>
            <DialogDescription className="text-center">
              Payment received and your account has been upgraded. All{" "}
              {successPlan ? planLabel(successPlan) : "plan"} features are unlocked across your
              workspace right now.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setSuccessPlan(null)} className="w-full sm:w-auto">
              Start using {successPlan ? planLabel(successPlan) : "your plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
