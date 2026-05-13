import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { DeveloperClient } from "./developer-client";

export const metadata: Metadata = {
  title: "Developer",
};

export default async function DeveloperPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-3xl">Developer</h1>
        <p className="text-muted-foreground">
          API keys, MCP server, OpenAPI, webhooks, and skill bundles. Build for humans and agents.
        </p>
      </div>

      <DeveloperClient />
    </div>
  );
}
