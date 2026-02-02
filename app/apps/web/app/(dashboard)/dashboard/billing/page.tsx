import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { BillingClient } from "./billing-client";
import { UsageCardClient } from "@/components/billing";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Billing",
};

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceId: null,
    description: "For individuals getting started",
    features: ["50 links", "1 custom domain", "Basic analytics", "QR codes", "Community support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 9,
    priceId: process.env.STRIPE_PRICE_ID_PRO ?? "price_pro",
    description: "For creators and small teams",
    features: [
      "500 links/month",
      "5 custom domains",
      "Advanced analytics",
      "Password protection",
      "Link expiration",
      "Priority support",
    ],
    recommended: true,
  },
  {
    id: "business",
    name: "Business",
    price: 49,
    priceId: process.env.STRIPE_PRICE_ID_BUSINESS ?? "price_business",
    description: "For growing businesses",
    features: [
      "5,000 links/month",
      "25 custom domains",
      "Team members (5)",
      "Advanced targeting",
      "API access",
      "Audit logs",
    ],
  },
];

function UsageSection() {
  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-semibold">Current Usage</h2>
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
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      {/* Usage Stats Section */}
      <Suspense
        fallback={
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Current Usage</h2>
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
