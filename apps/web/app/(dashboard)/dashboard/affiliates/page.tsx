import { Suspense } from "react";
import { AffiliatesClient } from "./affiliates-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Affiliates | Dashboard",
  description: "Earn 40% recurring commission for every customer you refer to Go2.",
};

export default function AffiliatesPage() {
  return (
    <Suspense fallback={<AffiliatesSkeleton />}>
      <AffiliatesClient />
    </Suspense>
  );
}

function AffiliatesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <Skeleton className="h-72 rounded-lg" />
    </div>
  );
}
