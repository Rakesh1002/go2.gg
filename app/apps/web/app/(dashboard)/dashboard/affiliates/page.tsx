import type { Metadata } from "next";
import { AffiliateDashboard } from "./affiliate-dashboard";

export const metadata: Metadata = {
  title: "Affiliate Dashboard",
  description: "Track your referrals, earnings, and payouts",
};

export default function AffiliatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Affiliate Dashboard</h2>
        <p className="text-muted-foreground">
          Track your referrals, earnings, and manage your affiliate links.
        </p>
      </div>
      <AffiliateDashboard />
    </div>
  );
}
