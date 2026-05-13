import { Suspense } from "react";
import { FoldersPageGate } from "./folders-page-gate";
import { FoldersClient } from "./folders-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Folders | Dashboard",
  description: "Organize your links with folders",
};

export default function FoldersPage() {
  return (
    <FoldersPageGate>
      <Suspense fallback={<FoldersSkeleton />}>
        <FoldersClient />
      </Suspense>
    </FoldersPageGate>
  );
}

function FoldersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"].map((id) => (
          <Skeleton key={id} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
