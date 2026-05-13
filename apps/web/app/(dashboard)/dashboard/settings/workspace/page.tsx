import type { Metadata } from "next";
import { WorkspaceSettingsClient } from "./workspace-client";

export const metadata: Metadata = {
  title: "Workspace Settings",
  description: "Manage your workspace name, slug, logo, and members",
};

export default function WorkspaceSettingsPage() {
  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl">Workspace settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your workspace name, branding, and ownership.
        </p>
      </div>
      <WorkspaceSettingsClient />
    </div>
  );
}
