import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { PixelsClient } from "./pixels-client";
import { PixelsPageGate } from "./pixels-page-gate";

export const metadata: Metadata = {
  title: "Pixel Tracking | Go2",
  description: "Configure retargeting pixels for your links",
};

export default async function PixelsPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <PixelsPageGate>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Pixel Tracking</h1>
          <p className="text-muted-foreground">
            Add retargeting pixels to track conversions from your links
          </p>
        </div>

        <PixelsClient />
      </div>
    </PixelsPageGate>
  );
}
