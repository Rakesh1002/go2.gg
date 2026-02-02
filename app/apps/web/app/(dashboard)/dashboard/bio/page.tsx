import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { BioClient } from "./bio-client";
import { BioPageGate } from "./bio-page-gate";

export const metadata: Metadata = {
  title: "Link in Bio | Go2",
  description: "Create and manage your bio link pages",
};

export default async function BioPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <BioPageGate>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Link in Bio</h1>
          <p className="text-muted-foreground">
            Create beautiful link pages to share with your audience
          </p>
        </div>

        <BioClient />
      </div>
    </BioPageGate>
  );
}
