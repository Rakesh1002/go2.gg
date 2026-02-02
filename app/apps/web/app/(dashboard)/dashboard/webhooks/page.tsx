import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { WebhooksClient } from "./webhooks-client";
import { WebhooksPageGate } from "./webhooks-page-gate";

export const metadata: Metadata = {
  title: "Webhooks",
};

export default async function WebhooksPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <WebhooksPageGate>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Receive real-time notifications when events happen in your account
          </p>
        </div>

        <WebhooksClient />
      </div>
    </WebhooksPageGate>
  );
}
