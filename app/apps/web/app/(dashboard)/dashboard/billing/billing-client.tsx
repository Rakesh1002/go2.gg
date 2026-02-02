"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [managingPortal, setManagingPortal] = useState(false);

  // Show success/cancel message from checkout redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Subscription updated successfully!");
    } else if (searchParams.get("canceled") === "true") {
      toast.info("Checkout canceled");
    }
  }, [searchParams]);

  // Fetch organization and subscription
  useEffect(() => {
    async function fetchData() {
      try {
        // First, get the user's organization
        const orgResponse = await fetch(`${API_URL}/api/v1/organizations`, {
          credentials: "include",
        });

        if (!orgResponse.ok) {
          console.error("Failed to fetch organizations:", orgResponse.status);
          setLoading(false);
          return;
        }

        const orgResult = await orgResponse.json();
        const orgs = orgResult.data || [];

        // Get the first organization (user's primary org)
        const org = orgs[0];
        if (!org) {
          console.error("No organization found");
          setLoading(false);
          return;
        }

        setOrganization(org);

        // Now fetch subscription for this organization
        const subResponse = await fetch(
          `${API_URL}/api/v1/billing/subscription?organizationId=${org.id}`,
          { credentials: "include" }
        );

        if (subResponse.ok) {
          const subResult = await subResponse.json();
          if (subResult.success) {
            if (subResult.data.subscription) {
              setSubscription(subResult.data.subscription);
            }
            // Use the plan from the API response (handles trial status correctly)
            if (subResult.data.plan) {
              setCurrentPlan(subResult.data.plan);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch billing data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
      ? `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} (Trial)`
      : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);

  return (
    <>
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            {subscription?.status === "trialing"
              ? `You are on a ${currentPlan} trial`
              : subscription
                ? `You are on the ${currentPlan} plan`
                : "You are currently on the Free plan"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
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
                <p className="text-2xl font-bold">{planDisplayName}</p>
                {subscription?.currentPeriodEnd && (
                  <p className="text-sm text-muted-foreground">
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
        <h2 className="mb-4 text-xl font-semibold">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isUpgrading = upgrading === plan.id;

            // Plan hierarchy for comparison
            const planOrder = { free: 0, pro: 1, business: 2, enterprise: 3 };
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
                        <span className="text-3xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    ) : (
                      <span className="text-3xl font-bold">Custom</span>
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
    </>
  );
}
