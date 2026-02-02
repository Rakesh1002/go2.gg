import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { ApiKeysClient } from "./api-keys-client";

export const metadata: Metadata = {
  title: "API Keys",
};

export default async function ApiKeysPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="text-muted-foreground">
          Manage API keys for programmatic access to your account
        </p>
      </div>

      <ApiKeysClient />
    </div>
  );
}
