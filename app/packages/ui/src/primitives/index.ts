/**
 * UI Primitives
 *
 * Base components built on Radix UI and shadcn/ui patterns.
 * These are the atomic building blocks for the design system.
 */

export { Avatar, AvatarImage, AvatarFallback } from "./avatar.js";
export { Badge, badgeVariants, type BadgeProps } from "./badge.js";
export { Button, buttonVariants, type ButtonProps } from "./button.js";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "./card.js";
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog.js";
export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from "./form.js";
export { Input, type InputProps } from "./input.js";
export { Label } from "./label.js";
export { Separator } from "./separator.js";
export { Skeleton } from "./skeleton.js";
export { Spinner, spinnerVariants, type SpinnerProps } from "./spinner.js";
