import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { SecurityClient } from "./security-client";
import { LockedFeaturePage } from "@/components/locked-feature-page";

export const metadata: Metadata = {
  title: "Security & Compliance",
};

export default async function SecurityPage() {
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-3xl">Security & Compliance</h1>
        <p className="text-muted-foreground">
          SAML SSO, audit logs, and access controls for your organization.
        </p>
      </div>

      <LockedFeaturePage feature="teamMembers">
        <SecurityClient />
      </LockedFeaturePage>
    </div>
  );
}
