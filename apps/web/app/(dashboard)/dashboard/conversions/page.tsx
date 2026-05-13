import { Suspense } from "react";
import { ConversionsPageGate } from "./conversions-page-gate";
import { ConversionsClient } from "./conversions-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Conversions | Dashboard",
  description: "Track conversions and revenue from your links",
};

export default function ConversionsPage() {
  return (
    <ConversionsPageGate>
      <Suspense fallback={<ConversionsSkeleton />}>
        <ConversionsClient />
      </Suspense>
    </ConversionsPageGate>
  );
}

function ConversionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {["s1", "s2", "s3", "s4"].map((id) => (
          <Skeleton key={id} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
