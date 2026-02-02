"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const COOKIE_CONSENT_KEY = "cookie-consent";

type ConsentValue = "accepted" | "declined" | null;

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentValue;
    if (stored) {
      setConsent(stored);
    } else {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setConsent("accepted");
    setIsVisible(false);

    // Enable analytics if accepted
    if (
      typeof window !== "undefined" &&
      (window as unknown as { posthog?: { opt_in_capturing: () => void } }).posthog
    ) {
      (
        window as unknown as { posthog: { opt_in_capturing: () => void } }
      ).posthog.opt_in_capturing();
    }
  }

  function handleDecline() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setConsent("declined");
    setIsVisible(false);

    // Disable analytics if declined
    if (
      typeof window !== "undefined" &&
      (window as unknown as { posthog?: { opt_out_capturing: () => void } }).posthog
    ) {
      (
        window as unknown as { posthog: { opt_out_capturing: () => void } }
      ).posthog.opt_out_capturing();
    }
  }

  function handleClose() {
    setIsVisible(false);
  }

  // Don't render if consent already given or banner not visible
  if (consent !== null || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto max-w-4xl rounded-lg border bg-background p-4 shadow-lg md:flex md:items-center md:justify-between md:gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            We use cookies to enhance your experience and analyze site traffic. By clicking
            "Accept", you consent to our use of cookies. Read our{" "}
            <Link href="/cookies" className="text-primary underline underline-offset-2">
              Cookie Policy
            </Link>{" "}
            for more information.
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2 md:mt-0">
          <Button variant="outline" size="sm" onClick={handleDecline}>
            Decline
          </Button>
          <Button size="sm" onClick={handleAccept}>
            Accept
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if user has consented to cookies
 */
export function useCookieConsent(): ConsentValue {
  const [consent, setConsent] = useState<ConsentValue>(null);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentValue;
    setConsent(stored);
  }, []);

  return consent;
}
