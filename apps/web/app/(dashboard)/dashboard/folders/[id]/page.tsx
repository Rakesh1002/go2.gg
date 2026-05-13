import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { FoldersPageGate } from "../folders-page-gate";
import { FolderDetailClient } from "./folder-detail-client";

export const metadata = {
  title: "Folder | Dashboard",
  description: "Folder analytics and links",
};

export default async function FolderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <FoldersPageGate>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <FolderDetailClient folderId={id} />
      </Suspense>
    </FoldersPageGate>
  );
}
