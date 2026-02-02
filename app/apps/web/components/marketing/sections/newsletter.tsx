"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

interface NewsletterProps {
  headline?: string;
  description?: string;
  buttonText?: string;
  className?: string;
}

export function Newsletter({
  headline = "Stay up to date",
  description = "Get the latest news and updates delivered to your inbox.",
  buttonText = "Subscribe",
  className,
}: NewsletterProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);

    try {
      // In production, this would call your newsletter API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Thanks for subscribing!");
      setEmail("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className={className}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-2xl border bg-muted/50 p-8 text-center md:p-12">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>

          <h2 className="text-2xl font-bold md:text-3xl">{headline}</h2>
          <p className="mt-2 text-muted-foreground">{description}</p>

          <form onSubmit={handleSubmit} className="mt-6 flex gap-2 sm:mx-auto sm:max-w-md">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : buttonText}
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">No spam. Unsubscribe at any time.</p>
        </div>
      </div>
    </section>
  );
}
