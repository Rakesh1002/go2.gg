"use client";

/**
 * Dashboard Error Boundary
 */

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">We couldn't load this page. Please try again.</p>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-4 overflow-auto rounded bg-muted p-4 text-xs">{error.message}</pre>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
            Go to Dashboard
          </Button>
          <Button onClick={reset}>Try again</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
