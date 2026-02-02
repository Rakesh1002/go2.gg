import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LinksTable } from "./links-table";
import { LinkStats } from "./link-stats";
import { CreateLinkDialog } from "@/components/links/create-link-dialog";
import { AISchedulingInsight } from "@/components/analytics/ai-scheduling-insight";

export const metadata: Metadata = {
  title: "Links | Go2",
  description: "Manage your short links",
};

function LinksHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Links</h1>
        <p className="text-muted-foreground">Create, manage, and track your short links</p>
      </div>
      <CreateLinkDialog>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Link
        </Button>
      </CreateLinkDialog>
    </div>
  );
}

function StatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={`stat-${i}`} className="h-24" />
      ))}
    </div>
  );
}

function TableLoading() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={`row-${i}`} className="h-16" />
        ))}
      </div>
    </div>
  );
}

export default function LinksPage() {
  return (
    <div className="space-y-8">
      <LinksHeader />

      <Suspense fallback={<StatsLoading />}>
        <LinkStats />
      </Suspense>

      <Suspense>
        <AISchedulingInsight />
      </Suspense>

      <Suspense fallback={<TableLoading />}>
        <LinksTable />
      </Suspense>
    </div>
  );
}
