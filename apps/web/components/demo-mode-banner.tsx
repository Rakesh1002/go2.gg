"use client";

import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";

/**
 * Renders a slim banner at the top of the dashboard when the app is running in
 * demo mode (NEXT_PUBLIC_DEMO_MODE === "true"). Returns null otherwise.
 */
export function DemoModeBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;
  return (
    <div className="flex items-center justify-between gap-3 border-amber-300/60 border-b bg-amber-100/80 px-4 py-2 text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200">
      <div className="flex items-center gap-2 text-sm">
        <Eye className="h-4 w-4 shrink-0" />
        <span>
          You&rsquo;re viewing a read-only demo &mdash; changes will not be saved.
        </span>
      </div>
      <Link
        href="/register"
        className="inline-flex items-center gap-1 rounded-md bg-amber-900 px-3 py-1 font-medium text-amber-50 text-xs transition hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-900 dark:hover:bg-amber-100"
      >
        Sign up free
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
