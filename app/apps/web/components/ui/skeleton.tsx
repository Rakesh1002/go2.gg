import { cn } from "@/lib/utils";

interface SkeletonProps extends React.ComponentProps<"div"> {
  /** Use shimmer animation instead of pulse */
  shimmer?: boolean;
  /** Preset shape variants */
  variant?: "default" | "circle" | "text" | "button" | "card";
}

function Skeleton({ className, shimmer = true, variant = "default", ...props }: SkeletonProps) {
  const variantClasses = {
    default: "rounded-md",
    circle: "rounded-full aspect-square",
    text: "rounded h-4 w-full",
    button: "rounded-lg h-10 w-24",
    card: "rounded-2xl",
  };

  return (
    <div
      data-slot="skeleton"
      data-variant={variant}
      className={cn(
        "relative overflow-hidden",
        variantClasses[variant],
        shimmer
          ? "bg-gradient-to-r from-accent via-accent/50 to-accent bg-[length:200%_100%] animate-shimmer"
          : "bg-accent animate-pulse",
        className
      )}
      {...props}
    />
  );
}

/** Skeleton text with multiple lines */
interface SkeletonTextProps extends React.ComponentProps<"div"> {
  lines?: number;
  lastLineWidth?: "full" | "3/4" | "1/2" | "1/4";
}

function SkeletonText({
  lines = 3,
  lastLineWidth = "3/4",
  className,
  ...props
}: SkeletonTextProps) {
  const lastLineClasses = {
    full: "w-full",
    "3/4": "w-3/4",
    "1/2": "w-1/2",
    "1/4": "w-1/4",
  };

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, lineIndex) => (
        <Skeleton
          key={`text-line-${lineIndex}-of-${lines}`}
          variant="text"
          className={cn(
            lineIndex === lines - 1 && lastLineClasses[lastLineWidth],
            `stagger-${Math.min(lineIndex + 1, 8)}`
          )}
        />
      ))}
    </div>
  );
}

/** Skeleton avatar with optional text */
function SkeletonAvatar({
  className,
  withText = false,
  ...props
}: React.ComponentProps<"div"> & { withText?: boolean }) {
  if (withText) {
    return (
      <div className={cn("flex items-center gap-3", className)} {...props}>
        <Skeleton variant="circle" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-4 w-24" />
          <Skeleton variant="text" className="h-3 w-32" />
        </div>
      </div>
    );
  }

  return <Skeleton variant="circle" className={cn("h-10 w-10", className)} {...props} />;
}

/** Skeleton card with header and content */
function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-2xl border bg-card p-6 space-y-4", className)} {...props}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton variant="circle" className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton variant="text" className="h-3 w-32" />
      </div>
    </div>
  );
}

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard };
