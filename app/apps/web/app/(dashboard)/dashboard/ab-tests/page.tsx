import type { Metadata } from "next";
import { ABTestsPageGate } from "./ab-tests-page-gate";
import { ABTestsClient } from "./ab-tests-client";

export const metadata: Metadata = {
  title: "A/B Tests | Dashboard",
  description: "Manage and analyze your A/B tests",
};

export default function ABTestsPage() {
  return (
    <ABTestsPageGate>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">A/B Tests</h1>
          <p className="text-muted-foreground">
            Test different destinations and optimize your link performance
          </p>
        </div>

        <ABTestsClient />
      </div>
    </ABTestsPageGate>
  );
}
