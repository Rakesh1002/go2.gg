// Enhanced UI Components for Go2
// Re-export all UI components from a single entry point

// Animation & Interaction
export {
  AnimatedCounter,
  AnimatedNumber,
  AnimatedPercentage,
  AnimatedCurrency,
} from "./animated-counter";
export { AnimatedSection, StaggeredContainer, Parallax } from "./animated-section";

// Layout & Content
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "./card";
export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard } from "./skeleton";
export {
  Progress,
  ProgressWithLabel,
  CircularProgress,
  progressVariants,
  indicatorVariants,
} from "./progress";

// Form Elements
export { Button, buttonVariants, type ButtonProps } from "./button";
export { Input, InputWithIcon, FloatingInput, inputVariants } from "./input";

// Feedback
export { ConfirmDialog, useConfirm } from "./confirm-dialog";
export { CopyButton, CopyButtonInline, CopyField } from "./copy-button";
export { LoadingOverlay, LoadingCard, LoadingInline, PageLoading } from "./loading-overlay";
export { StatusDot, StatusBadge, statusDotVariants } from "./status-dot";

// Typography
export { GradientText, TypewriterText, gradientTextVariants } from "./gradient-text";

// Note: Other shadcn/ui components should be imported directly from their files
// e.g., import { Dialog } from "@/components/ui/dialog"
