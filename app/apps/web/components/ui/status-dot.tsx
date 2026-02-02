"use client";

import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusDotVariants = cva("rounded-full shrink-0", {
  variants: {
    status: {
      online: "bg-success",
      offline: "bg-muted-foreground/50",
      busy: "bg-warning",
      away: "bg-warning",
      error: "bg-destructive",
      pending: "bg-info",
    },
    size: {
      sm: "h-2 w-2",
      default: "h-2.5 w-2.5",
      lg: "h-3 w-3",
    },
    pulse: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    {
      status: "online",
      pulse: true,
      className: "animate-pulse",
    },
    {
      status: "pending",
      pulse: true,
      className: "animate-pulse",
    },
    {
      status: "error",
      pulse: true,
      className: "animate-pulse",
    },
  ],
  defaultVariants: {
    status: "offline",
    size: "default",
    pulse: false,
  },
});

interface StatusDotProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusDotVariants> {
  /** Optional label to show next to dot */
  label?: string;
  /** Show ring animation for active status */
  ring?: boolean;
}

export function StatusDot({
  className,
  status,
  size,
  pulse,
  label,
  ring = false,
  ...props
}: StatusDotProps) {
  const statusLabels: Record<string, string> = {
    online: "Online",
    offline: "Offline",
    busy: "Busy",
    away: "Away",
    error: "Error",
    pending: "Pending",
  };

  const dotContent = (
    <span className="relative inline-flex">
      <span className={cn(statusDotVariants({ status, size, pulse }), className)} {...props} />
      {ring && status === "online" && (
        <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
      )}
    </span>
  );

  if (label !== undefined) {
    return (
      <span className="inline-flex items-center gap-2">
        {dotContent}
        <span className="text-sm">{label || statusLabels[status || "offline"]}</span>
      </span>
    );
  }

  return dotContent;
}

/** Status indicator with more details */
interface StatusBadgeProps extends StatusDotProps {
  /** Title for the status */
  title: string;
  /** Optional description */
  description?: string;
}

export function StatusBadge({ title, description, status, ...props }: StatusBadgeProps) {
  return (
    <div className="flex items-start gap-3">
      <StatusDot status={status} size="lg" ring pulse className="mt-1" {...props} />
      <div>
        <p className="font-medium text-sm">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

export { statusDotVariants };
