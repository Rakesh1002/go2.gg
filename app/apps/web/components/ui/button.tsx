import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, Check } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive active:scale-[0.98] hover:-translate-y-[1px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25",
        destructive:
          "bg-destructive text-white shadow-md hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/25 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/80",
        outline:
          "border-2 bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-primary/50 dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/90 hover:shadow-lg hover:shadow-secondary/25",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 hover:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline hover:translate-y-0",
        gradient:
          "bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] text-white shadow-lg hover:shadow-xl hover:shadow-primary/30 animate-gradient",
        success:
          "bg-success text-success-foreground shadow-md hover:bg-success/90 hover:shadow-lg hover:shadow-success/25",
        "ghost-destructive":
          "text-destructive hover:bg-destructive/10 hover:text-destructive hover:translate-y-0",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-8 rounded-md gap-1.5 px-3.5 has-[>svg]:px-2.5 text-xs",
        lg: "h-12 rounded-lg px-8 has-[>svg]:px-5 text-base",
        xl: "h-14 rounded-xl px-10 has-[>svg]:px-6 text-lg",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Show loading spinner and disable button */
  loading?: boolean;
  /** Show success state with checkmark */
  success?: boolean;
  /** Text to show while loading */
  loadingText?: string;
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  success = false,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  // If asChild is true, we can't add loading/success state
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  const isDisabled = disabled || loading;

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading}
      data-success={success}
      className={cn(
        buttonVariants({ variant: success ? "success" : variant, size, className }),
        loading && "cursor-wait"
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : success ? (
        <>
          <Check className="h-4 w-4 animate-checkmark" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
