"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, Building2 } from "lucide-react";

interface InviteAcceptanceProps {
  token: string;
  userEmail: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export function InviteAcceptance({ token, userEmail }: InviteAcceptanceProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<{ name: string } | null>(null);

  async function handleAccept() {
    setStatus("loading");
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/organizations/accept-invite/${token}`, {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Failed to accept invitation");
      }

      setOrganization(result.data.organization);
      setStatus("success");
      toast.success("Successfully joined organization!");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <div className="text-center">
            <h3 className="font-semibold">You're in!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You've successfully joined {organization?.name ?? "the organization"}. Redirecting to
              dashboard...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <XCircle className="h-12 w-12 text-destructive" />
          <div className="text-center">
            <h3 className="font-semibold">Invitation Failed</h3>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
          <Button onClick={() => setStatus("idle")}>Try Again</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Organization Invitation</CardTitle>
        <CardDescription>You've been invited to join an organization</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium">{userEmail}</span>
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Click accept to join the organization and start collaborating.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Decline
        </Button>
        <Button onClick={handleAccept} disabled={status === "loading"}>
          {status === "loading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Accepting...
            </>
          ) : (
            "Accept Invitation"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
