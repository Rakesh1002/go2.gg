import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-lg border bg-transparent px-3 text-base shadow-xs transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      inputSize: {
        default: "h-10 py-2",
        sm: "h-8 py-1 text-sm rounded-md",
        lg: "h-12 py-3 text-base rounded-xl",
      },
      variant: {
        default:
          "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px]",
        ghost:
          "border-transparent bg-muted/50 focus-visible:bg-transparent focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px]",
        filled:
          "border-transparent bg-muted focus-visible:bg-muted/70 focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px]",
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
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive aria-invalid:animate-shake",
          success &&
            "border-success focus-visible:border-success focus-visible:ring-success/20 pr-10",
          error &&
            "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 pr-10",
          className
        )}
        aria-invalid={error}
        {...props}
      />
      {success && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-scale-in">
          <Check className="h-4 w-4 text-success" />
        </div>
      )}
      {error && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-scale-in">
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
          "absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors",
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
          "absolute left-3 transition-all duration-200 pointer-events-none text-muted-foreground",
          "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base",
          "peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary peer-focus:-translate-y-0",
          (isFocused || hasValue) && "top-2 text-xs -translate-y-0",
          isFocused && "text-primary"
        )}
      >
        {label}
      </label>
    </div>
  );
}

export { Input, InputWithIcon, FloatingInput, inputVariants };
