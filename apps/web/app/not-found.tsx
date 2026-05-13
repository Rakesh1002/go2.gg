/**
 * 404 Not Found Page
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="text-center">
        <h1 className="font-bold text-9xl text-muted-foreground">404</h1>
        <h2 className="mt-4 font-semibold text-2xl">Page not found</h2>
        <p className="mt-2 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div className="mt-6 flex gap-4">
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
