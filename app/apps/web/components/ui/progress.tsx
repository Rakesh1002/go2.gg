"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const progressVariants = cva("relative w-full overflow-hidden rounded-full", {
  variants: {
    size: {
      sm: "h-1.5",
      default: "h-2",
      lg: "h-3",
      xl: "h-4",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const indicatorVariants = cva(
  "h-full w-full flex-1 rounded-full transition-transform duration-500 ease-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        secondary: "bg-secondary",
        success: "bg-success",
        warning: "bg-warning",
        destructive: "bg-destructive",
        gradient:
          "bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-shimmer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ProgressProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof indicatorVariants> {
  /** Animate the fill on mount */
  animate?: boolean;
  /** Show glow effect at progress tip */
  glow?: boolean;
  /** Show shimmer animation on the indicator */
  shimmer?: boolean;
}

function Progress({
  className,
  value,
  size,
  variant,
  animate = true,
  glow = false,
  shimmer = false,
  ...props
}: ProgressProps) {
  const [displayValue, setDisplayValue] = React.useState(animate ? 0 : value);

  React.useEffect(() => {
    if (animate && typeof value === "number") {
      // Delay to allow initial render
      const timeout = setTimeout(() => {
        setDisplayValue(value);
      }, 100);
      return () => clearTimeout(timeout);
    } else {
      setDisplayValue(value);
    }
  }, [value, animate]);

  // Determine background color based on variant
  const trackBg = {
    default: "bg-primary/20",
    secondary: "bg-secondary/20",
    success: "bg-success/20",
    warning: "bg-warning/20",
    destructive: "bg-destructive/20",
    gradient: "bg-muted",
  };

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(progressVariants({ size }), trackBg[variant || "default"], className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          indicatorVariants({ variant: shimmer ? "gradient" : variant }),
          glow && "shadow-[0_0_10px] shadow-current",
          animate && "transition-transform duration-700 ease-out"
        )}
        style={{ transform: `translateX(-${100 - (displayValue || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

/** Progress bar with label */
interface ProgressWithLabelProps extends ProgressProps {
  label?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
}

function ProgressWithLabel({
  label,
  showValue = true,
  value,
  valueFormatter,
  className,
  ...props
}: ProgressWithLabelProps) {
  const displayText = valueFormatter ? valueFormatter(value || 0) : `${Math.round(value || 0)}%`;

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium">{label}</span>}
          {showValue && <span className="text-muted-foreground tabular-nums">{displayText}</span>}
        </div>
      )}
      <Progress value={value} {...props} />
    </div>
  );
}

/** Circular progress indicator */
interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  variant?: "default" | "secondary" | "success" | "warning" | "destructive";
  showValue?: boolean;
  animate?: boolean;
}

function CircularProgress({
  value,
  size = 48,
  strokeWidth = 4,
  className,
  variant = "default",
  showValue = false,
  animate = true,
}: CircularProgressProps) {
  const [displayValue, setDisplayValue] = React.useState(animate ? 0 : value);

  React.useEffect(() => {
    if (animate) {
      const timeout = setTimeout(() => setDisplayValue(value), 100);
      return () => clearTimeout(timeout);
    } else {
      setDisplayValue(value);
    }
  }, [value, animate]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayValue / 100) * circumference;

  const strokeColors = {
    default: "stroke-primary",
    secondary: "stroke-secondary",
    success: "stroke-success",
    warning: "stroke-warning",
    destructive: "stroke-destructive",
  };

  return (
    <div className={cn("relative inline-flex", className)} style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} aria-hidden="true">
        {/* Background circle */}
        <circle
          className="stroke-muted"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className={cn(
            strokeColors[variant],
            animate && "transition-[stroke-dashoffset] duration-700 ease-out"
          )}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold tabular-nums">{Math.round(displayValue)}%</span>
        </div>
      )}
    </div>
  );
}

export { Progress, ProgressWithLabel, CircularProgress, progressVariants, indicatorVariants };
