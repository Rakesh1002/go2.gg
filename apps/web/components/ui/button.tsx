import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, Check } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "hover:-translate-y-[1px] inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold text-sm outline-none transition-all duration-200 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25",
        destructive:
          "bg-destructive text-white shadow-md hover:bg-destructive/90 hover:shadow-destructive/25 hover:shadow-lg focus-visible:ring-destructive/20 dark:bg-destructive/80 dark:focus-visible:ring-destructive/40",
        outline:
          "border-2 bg-background shadow-sm hover:border-primary/50 hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/90 hover:shadow-lg hover:shadow-secondary/25",
        ghost:
          "hover:translate-y-0 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:translate-y-0 hover:underline",
        gradient:
          "animate-gradient bg-[length:200%_100%] bg-gradient-to-r from-primary via-secondary to-primary text-white shadow-lg hover:shadow-primary/30 hover:shadow-xl",
        success:
          "bg-success text-success-foreground shadow-md hover:bg-success/90 hover:shadow-lg hover:shadow-success/25",
        "ghost-destructive":
          "text-destructive hover:translate-y-0 hover:bg-destructive/10 hover:text-destructive",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 rounded-md px-3.5 text-xs has-[>svg]:px-2.5",
        lg: "h-12 rounded-lg px-8 text-base has-[>svg]:px-5",
        xl: "h-14 rounded-xl px-10 text-lg has-[>svg]:px-6",
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
