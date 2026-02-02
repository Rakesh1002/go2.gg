import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { DangerZone } from "./danger-zone";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account and personal information</p>
      </div>

      <div className="grid gap-6">
        <ProfileForm
          user={{
            id: user.id,
            email: user.email ?? "",
            name: user.name ?? "",
          }}
        />
        <PasswordForm />
        <DangerZone />
      </div>
    </div>
  );
}
