import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { InviteAcceptance } from "./invite-acceptance";

export const metadata: Metadata = {
  title: "Accept Invitation",
};

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const user = await getServerUser();

  // If not logged in, redirect to login with callback
  if (!user) {
    redirect(`/login?next=/invite/${token}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <InviteAcceptance token={token} userEmail={user.email ?? ""} />
      </div>
    </div>
  );
}
