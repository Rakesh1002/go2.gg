import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { siteConfig } from "@repo/config";
import { getServerUser } from "@/lib/auth/server";
import { ConsentClient } from "./consent-client";

export const metadata: Metadata = {
  title: `Authorize app | ${siteConfig.name}`,
  description: "Review the access an MCP client is requesting and decide whether to allow it.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{
    client_id?: string;
    client_name?: string;
    redirect_uri?: string;
    code_challenge?: string;
    code_challenge_method?: string;
    state?: string;
    resource?: string;
    scope?: string;
  }>;
}

export default async function ConsentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getServerUser();

  if (!user) {
    const next = `/oauth/consent?${new URLSearchParams(params as Record<string, string>).toString()}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const required = [
    "client_id",
    "redirect_uri",
    "code_challenge",
    "code_challenge_method",
  ] as const;
  for (const key of required) {
    if (!params[key]) {
      return (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm">
          <p className="font-medium text-destructive">Invalid authorization request.</p>
          <p className="mt-2 text-muted-foreground">
            Missing required parameter: <code>{key}</code>.
          </p>
        </div>
      );
    }
  }

  return (
    <ConsentClient
      clientId={params.client_id ?? ""}
      clientName={params.client_name ?? "Unnamed app"}
      redirectUri={params.redirect_uri ?? ""}
      codeChallenge={params.code_challenge ?? ""}
      codeChallengeMethod={params.code_challenge_method ?? "S256"}
      state={params.state}
      resource={params.resource}
      scope={params.scope ?? ""}
      userEmail={user.email}
    />
  );
}
