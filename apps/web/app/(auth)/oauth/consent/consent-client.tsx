"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, ShieldCheck, X } from "lucide-react";

interface ConsentClientProps {
  clientId: string;
  clientName: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state?: string;
  resource?: string;
  scope: string;
  userEmail: string;
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  "links:read": "View your short links and their metadata",
  "links:write": "Create, update, and archive short links",
  "analytics:read": "Read per-link click analytics",
  "attribution:read": "Read agent attribution streams (run/actor click data)",
  "attribution:write": "Modify agent attribution metadata on links",
  "webhooks:read": "List webhook subscriptions",
  "webhooks:write": "Create, update, and delete webhook subscriptions",
};

export function ConsentClient(props: ConsentClientProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://api.go2.gg";
  const scopes = props.scope.split(/\s+/).filter(Boolean);
  const [busy, setBusy] = useState<"allow" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "allow" | "deny") {
    setBusy(decision);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/api/v1/auth/oauth2/authorize/confirm`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: props.clientId,
          redirect_uri: props.redirectUri,
          code_challenge: props.codeChallenge,
          code_challenge_method: props.codeChallengeMethod,
          state: props.state,
          resource: props.resource,
          scope: scopes.join(" "),
          decision,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error?.message ?? `HTTP ${res.status}`);
      }
      const body = (await res.json()) as { redirect?: string };
      if (body.redirect) {
        window.location.href = body.redirect;
      } else {
        setError("No redirect returned. Check the API response.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authorization failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Authorize {props.clientName}</CardTitle>
        <CardDescription>
          {props.clientName} wants to access your Go2 account ({props.userEmail}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-md border bg-muted/40 px-4 py-3 text-muted-foreground text-xs">
          <div className="flex justify-between">
            <span>Client</span>
            <code className="font-mono text-foreground">{props.clientId}</code>
          </div>
          <div className="mt-1 flex justify-between">
            <span>Redirects to</span>
            <code className="truncate font-mono text-foreground" title={props.redirectUri}>
              {new URL(props.redirectUri).host}
            </code>
          </div>
        </div>

        <div className="space-y-3">
          <p className="font-medium text-sm">This app will be able to:</p>
          {scopes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No scopes requested.</p>
          ) : (
            <ul className="space-y-2">
              {scopes.map((s) => (
                <li key={s} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <div className="flex flex-col">
                    <Badge variant="secondary" className="w-fit font-mono text-[10px]">
                      {s}
                    </Badge>
                    <span className="mt-0.5 text-muted-foreground">
                      {SCOPE_DESCRIPTIONS[s] ?? "Unknown scope"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Separator />

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            disabled={busy !== null}
            onClick={() => decide("deny")}
          >
            <X className="mr-1 h-4 w-4" />
            {busy === "deny" ? "Denying..." : "Deny"}
          </Button>
          <Button
            className="flex-1"
            disabled={busy !== null}
            onClick={() => decide("allow")}
          >
            {busy === "allow" ? "Authorizing..." : "Allow access"}
          </Button>
        </div>
        <p className="text-center text-muted-foreground text-xs">
          You can revoke this access any time from the Integrations page.
        </p>
      </CardContent>
    </Card>
  );
}
