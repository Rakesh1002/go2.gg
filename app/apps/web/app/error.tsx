"use client";

/**
 * Global Error Boundary
 *
 * Catches errors in the application and displays a user-friendly error page.
 */

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);

    // Send to Sentry/PostHog if configured
    if (
      typeof window !== "undefined" &&
      (window as unknown as { posthog?: { capture: (event: string, props: object) => void } })
        .posthog
    ) {
      (
        window as unknown as { posthog: { capture: (event: string, props: object) => void } }
      ).posthog.capture("client_error", {
        error_message: error.message,
        error_digest: error.digest,
      });
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-destructive">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            We encountered an unexpected error. Our team has been notified.
          </p>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-4 overflow-auto rounded bg-muted p-4 text-left text-sm">
              {error.message}
            </pre>
          )}
          {error.digest && (
            <p className="mt-2 text-xs text-muted-foreground">Error ID: {error.digest}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
          <Button onClick={reset}>Try again</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
