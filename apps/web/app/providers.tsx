"use client";

/**
 * Application Providers
 *
 * Wraps the app with necessary context providers:
 * - PostHog analytics
 * - Toaster notifications
 */

import { Suspense, useEffect, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { Toaster } from "sonner";
import { CookieConsent } from "@/components/cookie-consent";
import { DemoBanner, DemoModeIndicator } from "@/components/demo-banner";

// Initialize PostHog client-side
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY && !posthog.__loaded) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: false, // We capture manually for SPAs
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") {
        // Don't track in dev, but allow testing
        posthog.debug();
      }
    },
  });
}

interface ProvidersProps {
  children: ReactNode;
}

/**
 * PostHog page view tracker for SPA navigation
 */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url += `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

/**
 * PostHog Provider wrapper that handles SSR gracefully
 */
function PostHogProviderWrapper({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <PostHogProviderWrapper>
      <DemoBanner />
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
      <DemoModeIndicator />
      <CookieConsent />
      <Toaster
        richColors
        position="bottom-right"
        toastOptions={{
          duration: 4000,
        }}
      />
    </PostHogProviderWrapper>
  );
}
