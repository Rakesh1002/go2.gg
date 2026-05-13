"use client";

import type * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { siteConfig } from "@repo/config";

interface LoadingOverlayProps {
  /** Whether to show the overlay */
  visible?: boolean;
  /** Loading message */
  message?: string;
  /** Submessage or description */
  description?: string;
  /** Show branded spinner with logo */
  branded?: boolean;
  /** Show full screen or inline */
  fullScreen?: boolean;
  /** Custom spinner */
  spinner?: React.ReactNode;
  /** Background blur */
  blur?: boolean;
  /** Z-index */
  zIndex?: number;
}

export function LoadingOverlay({
  visible = true,
  message = "Loading...",
  description,
  branded = false,
  fullScreen = true,
  spinner,
  blur = true,
  zIndex = 50,
}: LoadingOverlayProps) {
  if (!visible) return null;

  const content = (
    <div className="flex animate-fade-in-up flex-col items-center justify-center gap-4">
      {branded ? (
        <div className="relative">
          <div className="flex h-16 w-16 animate-pulse-glow items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/30">
            <span className="font-extrabold text-2xl">{siteConfig.name.charAt(0)}</span>
          </div>
          <div className="-inset-2 absolute animate-ping rounded-3xl border-2 border-primary/20" />
        </div>
      ) : spinner ? (
        spinner
      ) : (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      )}

      {message && (
        <div className="space-y-1 text-center">
          <p className="font-semibold text-foreground">{message}</p>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center",
          blur && "bg-background/80 backdrop-blur-sm",
          !blur && "bg-background"
        )}
        style={{ zIndex }}
      >
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{content}</div>;
}

/** Loading state for cards and sections */
interface LoadingCardProps {
  message?: string;
  className?: string;
}

export function LoadingCard({ message = "Loading...", className }: LoadingCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border bg-card p-8",
        className
      )}
    >
      <Loader2 className="mb-3 h-6 w-6 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

/** Inline loading spinner with text */
interface LoadingInlineProps {
  message?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function LoadingInline({ message, className, size = "default" }: LoadingInlineProps) {
  const sizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-muted-foreground", sizes[size])} />
      {message && <span className="text-muted-foreground">{message}</span>}
    </span>
  );
}

/** Page loading with progress bar */
interface PageLoadingProps {
  progress?: number;
  message?: string;
}

export function PageLoading({ progress, message = "Loading..." }: PageLoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 px-8">
        {/* Logo */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
          <span className="font-extrabold text-xl">{siteConfig.name.charAt(0)}</span>
        </div>

        {/* Progress bar */}
        {typeof progress === "number" && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Message */}
        <p className="text-center text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}
