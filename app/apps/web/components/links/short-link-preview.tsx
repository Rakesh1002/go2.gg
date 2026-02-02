"use client";

import { useState, useEffect, useMemo } from "react";
import { Copy, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

interface ShortLinkPreviewProps {
  /** The slug (custom or generated) */
  slug: string;
  /** The destination URL */
  destinationUrl: string;
  /** The domain to use (defaults to go2.gg) */
  domain?: string;
  /** Whether to check slug availability */
  checkAvailability?: boolean;
  /** Callback when availability is checked */
  onAvailabilityCheck?: (available: boolean) => void;
  className?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

/**
 * Real-time preview of the short link with copy functionality.
 *
 * Features:
 * - Live preview as user types
 * - Slug availability check (debounced)
 * - Copy to clipboard
 * - Visual feedback for available/taken slugs
 */
export function ShortLinkPreview({
  slug,
  destinationUrl,
  domain = "go2.gg",
  checkAvailability = true,
  onAvailabilityCheck,
  className,
}: ShortLinkPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  const debouncedSlug = useDebounce(slug, 500);

  // Display slug - show placeholder if empty
  const displaySlug = slug || "your-slug";
  const shortUrl = `${domain}/${displaySlug}`;
  const isCustomSlug = slug && slug.length > 0;

  // Check slug availability
  useEffect(() => {
    async function checkSlugAvailability() {
      if (!checkAvailability || !debouncedSlug || debouncedSlug.length < 2) {
        setAvailable(null);
        return;
      }

      setChecking(true);
      try {
        const response = await fetch(
          `${API_URL}/api/v1/links/check-slug?slug=${encodeURIComponent(debouncedSlug)}`,
          { credentials: "include" }
        );

        if (response.ok) {
          const result = await response.json();
          setAvailable(result.data?.available ?? null);
          onAvailabilityCheck?.(result.data?.available ?? false);
        } else {
          setAvailable(null);
        }
      } catch (error) {
        console.error("Failed to check slug availability:", error);
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }

    checkSlugAvailability();
  }, [debouncedSlug, checkAvailability, onAvailabilityCheck]);

  async function handleCopy() {
    if (!destinationUrl) return;

    try {
      await navigator.clipboard.writeText(`https://${shortUrl}`);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }

  // Availability indicator
  const availabilityIndicator = useMemo(() => {
    if (!isCustomSlug) return null;

    if (checking) {
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-xs">Checking...</span>
        </div>
      );
    }

    if (available === true) {
      return (
        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
          <Check className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Available</span>
        </div>
      );
    }

    if (available === false) {
      return (
        <div className="flex items-center gap-1.5 text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Taken</span>
        </div>
      );
    }

    return null;
  }, [isCustomSlug, checking, available]);

  return (
    <div className={cn("rounded-lg border bg-muted/30 p-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            Your short link preview
          </p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold truncate">
              <span className="text-muted-foreground">{domain}/</span>
              <span className={cn(slug ? "text-foreground" : "text-muted-foreground/50")}>
                {displaySlug}
              </span>
            </p>
            {availabilityIndicator}
          </div>
          {destinationUrl && (
            <p className="text-xs text-muted-foreground mt-1 truncate">→ {destinationUrl}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!destinationUrl}
            className="h-8 gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
