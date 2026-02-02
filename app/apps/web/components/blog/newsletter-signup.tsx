"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NewsletterSignupProps {
  className?: string;
  variant?: "card" | "inline" | "minimal";
}

/**
 * Newsletter signup component for blog
 */
export function NewsletterSignup({ className, variant = "card" }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setStatus("loading");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
      const response = await fetch(`${apiUrl}/api/v1/newsletter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source: "blog",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setStatus("success");
      setEmail("");

      if (data.alreadyExists) {
        toast.success("You're already subscribed! We'll keep you updated.");
      } else {
        toast.success("Thanks for subscribing! Check your email for confirmation.");
      }

      // Reset after a few seconds
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      toast.error(
        err instanceof Error ? err.message : "Failed to subscribe. Please try again."
      );
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  if (variant === "minimal") {
    return (
      <form onSubmit={handleSubmit} className={cn("flex gap-2", className)}>
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-[var(--marketing-border)] focus:border-[var(--marketing-accent)]"
          disabled={status === "loading" || status === "success"}
        />
        <Button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="bg-[var(--marketing-accent)] hover:bg-[var(--marketing-accent-light)] text-white shrink-0"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Button>
      </form>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-col sm:flex-row gap-4 items-center", className)}>
        <div className="flex items-center gap-2 text-[var(--marketing-text)]">
          <Mail className="h-5 w-5 text-[var(--marketing-accent)]" />
          <span className="font-medium">Get updates in your inbox</span>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full sm:w-auto">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-[var(--marketing-border)] focus:border-[var(--marketing-accent)] min-w-[200px]"
            disabled={status === "loading" || status === "success"}
          />
          <Button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="bg-[var(--marketing-accent)] hover:bg-[var(--marketing-accent-light)] text-white"
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === "success" ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Subscribed
              </>
            ) : (
              "Subscribe"
            )}
          </Button>
        </form>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--marketing-border)] bg-gradient-to-br from-[var(--marketing-bg-elevated)] to-[var(--marketing-accent)]/5 p-8 text-center",
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--marketing-accent)]/10">
        <Mail className="h-7 w-7 text-[var(--marketing-accent)]" />
      </div>

      <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-2">Stay in the loop</h3>
      <p className="text-[var(--marketing-text-muted)] mb-6 max-w-md mx-auto">
        Get the latest articles, tutorials, and product updates delivered straight to your inbox.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-[var(--marketing-border)] focus:border-[var(--marketing-accent)] bg-white"
          disabled={status === "loading" || status === "success"}
        />
        <Button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="bg-[var(--marketing-accent)] hover:bg-[var(--marketing-accent-light)] text-white px-6"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Subscribing...
            </>
          ) : status === "success" ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Subscribed!
            </>
          ) : (
            <>
              Subscribe
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </form>

      <p className="text-xs text-[var(--marketing-text-muted)] mt-4">
        No spam, unsubscribe anytime.
      </p>
    </div>
  );
}
