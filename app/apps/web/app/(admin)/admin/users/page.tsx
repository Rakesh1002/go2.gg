import type { Metadata } from "next";
import { UserManagement } from "./user-management";

export const metadata: Metadata = {
  title: "User Management - Admin",
  description: "Manage platform users",
};

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">View, manage, and moderate platform users.</p>
      </div>
      <UserManagement />
    </div>
  );
}
