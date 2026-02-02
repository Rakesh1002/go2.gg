import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Customize your Go2 experience with defaults and preferences
        </p>
      </div>

      <SettingsClient />
    </div>
  );
}
