import type { Metadata } from "next";
import { OrgManagement } from "./org-management";

export const metadata: Metadata = {
  title: "Organization Management - Admin",
  description: "Manage platform organizations",
};

export default function OrgsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Management</h1>
        <p className="text-muted-foreground">View and manage all organizations on the platform.</p>
      </div>
      <OrgManagement />
    </div>
  );
}
