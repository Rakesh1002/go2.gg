import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DomainsList } from "./domains-list";
import { AddDomainDialog } from "./add-domain-dialog";

export const metadata: Metadata = {
  title: "Domains | Go2",
  description: "Manage your custom domains",
};

function DomainsHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Custom Domains</h1>
        <p className="text-muted-foreground">Use your own domain for branded short links</p>
      </div>
      <AddDomainDialog>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Domain
        </Button>
      </AddDomainDialog>
    </div>
  );
}

function ListLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={`domain-${i}`} className="h-32" />
      ))}
    </div>
  );
}

export default function DomainsPage() {
  return (
    <div className="space-y-8">
      <DomainsHeader />

      <Suspense fallback={<ListLoading />}>
        <DomainsList />
      </Suspense>
    </div>
  );
}
