import { UsageCardClient } from "@/components/billing";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerUser } from "@/lib/auth/server";
import { getStripePriceId } from "@repo/config";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BillingClient } from "./billing-client";

export const metadata: Metadata = {
  title: "Billing",
};

// Plan cards. Stays in sync with the marketing /pricing source of truth in
// @repo/config/pricing — REST API, MCP server, and per-run agent attribution
// are all on the Free tier.
const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceId: null,
    description: "For solo devs evaluating the MCP server",
    features: [
      "100 tracked links / month",
      "5K attributed clicks / month",
      "REST API + MCP server",
      "Per-run agent attribution",
      "1 custom domain",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    priceId: getStripePriceId("pro", false),
    description: "Indie AI app shipping its first agent",
    features: [
      "2K tracked links / month",
      "100K attributed clicks / month",
      "3 team seats",
      "Webhooks + pixels",
      "Geo + device targeting",
      "5 custom domains",
      "1-year analytics retention",
      "Priority support",
    ],
    recommended: true,
  },
  {
    id: "business",
    name: "Business",
    price: 49,
    priceId: getStripePriceId("business", false),
    description: "Funded AI startup with a team",
    features: [
      "20K tracked links / month",
      "500K attributed clicks / month",
      "A/B testing + conversions",
      "SAML SSO + audit logs",
      "10 team seats with RBAC",
      "25 custom domains",
      "2-year analytics retention",
      "Dedicated support + 99.9% SLA",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    price: 99,
    priceId: getStripePriceId("scale", false),
    description: "High-volume agent fleets and platforms",
    features: [
      "Everything in Business",
      "1M attributed events / month included",
      "$0.40 / 1K events beyond that",
      "Volume discounts at 10M+ events",
      "5-year analytics retention",
      "Priority engineering support",
    ],
  },
];

function UsageSection() {
  return (
    <div className="mb-8">
      <h2 className="mb-4 font-semibold text-xl">Current Usage</h2>
      <UsageCardClient showUpgradeButton={false} />
    </div>
  );
}

export default async function BillingPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-3xl">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      {/* Usage Stats Section */}
      <Suspense
        fallback={
          <div className="mb-8">
            <h2 className="mb-4 font-semibold text-xl">Current Usage</h2>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[200px]" />
              </CardContent>
            </Card>
          </div>
        }
      >
        <UsageSection />
      </Suspense>

      <BillingClient plans={plans} />
    </div>
  );
}
