"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Link2,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Lock,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth/client";

interface GuestLinkResponse {
  data: {
    id: string;
    shortUrl: string;
    destinationUrl: string;
    slug: string;
    domain: string;
    expiresAt?: string;
    isGuest?: boolean;
    message?: string;
  };
}

export function LinkShortenerDemo() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  const [url, setUrl] = useState("");
  const [result, setResult] = useState<GuestLinkResponse["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  // Track whether the created link was authenticated (permanent) or guest (temporary)
  const [isAuthenticatedLink, setIsAuthenticatedLink] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    // Validate URL
    let validUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      validUrl = `https://${url}`;
    }

    try {
      new URL(validUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

      // Use authenticated endpoint if user is signed in, otherwise use public/guest endpoint
      if (isAuthenticated) {
        const response = await fetch(`${apiUrl}/api/v1/links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // Include auth cookies
          body: JSON.stringify({ destinationUrl: validUrl }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || "Failed to create link");
        }

        const data: GuestLinkResponse = await response.json();
        setResult(data.data);
        setIsAuthenticatedLink(true);
        toast.success("Link created and saved to your dashboard!");
      } else {
        // Use public endpoint for guest links
        const response = await fetch(`${apiUrl}/api/v1/public/links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destinationUrl: validUrl }),
        });

        if (!response.ok) {
          const error = await response.json();
          if (
            response.status === 400 &&
            error.error?.message?.includes("Rate limit")
          ) {
            toast.error("Rate limit reached. Sign up for unlimited links!");
            router.push("/register");
            return;
          }
          throw new Error(error.error?.message || "Failed to create link");
        }

        const data: GuestLinkResponse = await response.json();
        setResult(data.data);
        setIsAuthenticatedLink(false);
        toast.success("Link created!");
      }
    } catch (error) {
      console.error("Error creating link:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create link",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!result) return;
    await navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setUrl("");
    setResult(null);
    setIsAuthenticatedLink(false);
  }

  function handleSignUp() {
    // Store the destination URL so we can create a permanent link after signup
    if (result) {
      sessionStorage.setItem("go2_pending_url", result.destinationUrl);
    }
    router.push("/register?redirect=/dashboard/links");
  }

  if (result) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-lg space-y-4">
        {/* Success state */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-sm text-success mb-3">
            <Check className="h-4 w-4" />
            Link created!
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link2 className="h-5 w-5 text-primary" />
            <span className="text-xl font-semibold text-primary">
              {result.shortUrl}
            </span>
          </div>
        </div>

        {/* Copy button */}
        <div className="flex gap-2">
          <Button
            variant="default"
            className="flex-1"
            onClick={copyToClipboard}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
          <Button variant="outline" onClick={reset}>
            Shorten Another
          </Button>
        </div>

        {/* Show different messaging based on auth state */}
        {isAuthenticatedLink ? (
          // Authenticated user - link is permanent
          <div className="rounded-lg border border-dashed border-success/50 bg-success/5 p-4">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-success mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Link saved to your dashboard
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This permanent link is now available in your dashboard with
                  full analytics.
                </p>
              </div>
            </div>
            <Link href="/dashboard/links">
              <Button
                variant="default"
                className="w-full mt-3 bg-primary hover:bg-primary/90"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                View in Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          // Guest user - link expires in 24 hours
          <div className="rounded-lg border border-dashed border-warning/50 bg-warning/5 p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-warning mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  This link expires in 24 hours
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a free account for permanent links and analytics.
                </p>
              </div>
            </div>
            <Button
              variant="default"
              className="w-full mt-3 bg-primary hover:bg-primary/90"
              onClick={handleSignUp}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Sign Up to Claim This Link
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border-2 bg-card p-3 shadow-xl"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Link2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Paste your long URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-14 pl-12 text-lg border-0 bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
          />
        </div>
        <Button
          type="submit"
          size="xl"
          className="gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Shorten
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-3">
        No signup required.{" "}
        <Link
          href="/register"
          className="text-primary font-medium hover:underline"
        >
          Create an account
        </Link>{" "}
        for unlimited links.
      </p>
    </form>
  );
}
