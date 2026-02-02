"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { boilerplateConfig } from "@repo/config";

/**
 * Demo Banner
 *
 * Shows a banner indicating this is a demo of the ShipQuest boilerplate.
 * Only visible when NEXT_PUBLIC_DEMO_MODE=true
 */
export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (!isDemoMode || !isVisible) {
    return null;
  }

  return (
    <div className="relative bg-linear-to-r from-primary to-purple-600 px-4 py-2 text-center text-sm text-white">
      <p>
        🚀 This is a live demo of <strong>{boilerplateConfig.productName}</strong>.{" "}
        <Link href="/buy" className="underline underline-offset-2 hover:no-underline">
          Get the source code →
        </Link>
      </p>
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-white/20"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Demo Mode Indicator
 *
 * Floating badge that shows demo mode is active.
 */
export function DemoModeIndicator() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  if (!isDemoMode) {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <Link href="/buy">
        <Button
          size="sm"
          className="gap-2 bg-linear-to-r from-primary to-purple-600 shadow-lg hover:shadow-xl"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Get {boilerplateConfig.productName}
        </Button>
      </Link>
    </div>
  );
}
