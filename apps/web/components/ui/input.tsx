import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-3 text-base shadow-xs outline-none transition-all duration-200 selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
  {
    variants: {
      inputSize: {
        default: "h-10 py-2",
        sm: "h-8 rounded-md py-1 text-sm",
        lg: "h-12 rounded-xl py-3 text-base",
      },
      variant: {
        default:
          "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20",
        ghost:
          "border-transparent bg-muted/50 focus-visible:border-primary focus-visible:bg-transparent focus-visible:ring-[3px] focus-visible:ring-primary/20",
        filled:
          "border-transparent bg-muted focus-visible:border-primary focus-visible:bg-muted/70 focus-visible:ring-[3px] focus-visible:ring-primary/20",
      },
    },
    defaultVariants: {
      inputSize: "default",
      variant: "default",
    },
  }
);

interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  /** Show success state */
  success?: boolean;
  /** Show error state */
  error?: boolean;
}

function Input({ className, type, inputSize, variant, success, error, ...props }: InputProps) {
  return (
    <div className="relative">
      <input
        type={type}
        data-slot="input"
        data-success={success}
        data-error={error}
        className={cn(
          inputVariants({ inputSize, variant }),
          "aria-invalid:animate-shake aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          success &&
            "border-success pr-10 focus-visible:border-success focus-visible:ring-success/20",
          error &&
            "border-destructive pr-10 focus-visible:border-destructive focus-visible:ring-destructive/20",
          className
        )}
        aria-invalid={error}
        {...props}
      />
      {success && (
        <div className="-translate-y-1/2 absolute top-1/2 right-3 animate-scale-in">
          <Check className="h-4 w-4 text-success" />
        </div>
      )}
      {error && (
        <div className="-translate-y-1/2 absolute top-1/2 right-3 animate-scale-in">
          <AlertCircle className="h-4 w-4 text-destructive" />
        </div>
      )}
    </div>
  );
}

/** Input with icon on left side */
interface InputWithIconProps extends InputProps {
  icon: React.ReactNode;
  iconPosition?: "left" | "right";
}

function InputWithIcon({
  icon,
  iconPosition = "left",
  className,
  success,
  error,
  ...props
}: InputWithIconProps) {
  return (
    <div className="relative">
      <div
        className={cn(
          "-translate-y-1/2 pointer-events-none absolute top-1/2 text-muted-foreground transition-colors",
          iconPosition === "left" ? "left-3" : "right-3"
        )}
      >
        {icon}
      </div>
      <Input
        className={cn(iconPosition === "left" ? "pl-10" : "pr-10", className)}
        success={success}
        error={error}
        {...props}
      />
    </div>
  );
}

/** Floating label input */
interface FloatingInputProps extends Omit<InputProps, "placeholder"> {
  label: string;
}

function FloatingInput({ label, id, className, ...props }: FloatingInputProps) {
  const inputId = id || React.useId();
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(false);

  return (
    <div className="relative">
      <Input
        id={inputId}
        placeholder=" "
        className={cn("peer pt-4 pb-1", className)}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          setHasValue(!!e.target.value);
          props.onBlur?.(e);
        }}
        onChange={(e) => {
          setHasValue(!!e.target.value);
          props.onChange?.(e);
        }}
        {...props}
      />
      <label
        htmlFor={inputId}
        className={cn(
          "pointer-events-none absolute left-3 text-muted-foreground transition-all duration-200",
          "peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base",
          "peer-focus:-translate-y-0 peer-focus:top-2 peer-focus:text-primary peer-focus:text-xs",
          (isFocused || hasValue) && "-translate-y-0 top-2 text-xs",
          isFocused && "text-primary"
        )}
      >
        {label}
      </label>
    </div>
  );
}

export { Input, InputWithIcon, FloatingInput, inputVariants };
