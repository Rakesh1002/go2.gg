"use client";

import * as React from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CopyButtonProps extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  value: string;
  /** Label shown in tooltip before copy */
  label?: string;
  /** Label shown after successful copy */
  successLabel?: string;
  /** Show toast notification on copy */
  showToast?: boolean;
  /** Toast message */
  toastMessage?: string;
  /** Icon to show (defaults to Copy) */
  icon?: "copy" | "link";
  /** Callback after copy */
  onCopy?: () => void;
}

export function CopyButton({
  value,
  label = "Copy to clipboard",
  successLabel = "Copied!",
  showToast = true,
  toastMessage = "Copied to clipboard",
  icon = "copy",
  onCopy,
  className,
  variant = "ghost",
  size = "icon",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      if (showToast) {
        toast.success(toastMessage);
      }

      onCopy?.();

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset after 2 seconds
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  }

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const IconComponent = icon === "link" ? Link2 : Copy;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          onClick={handleCopy}
          className={cn(
            "relative transition-all duration-200",
            copied && "text-success",
            className
          )}
          {...props}
        >
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-200",
              copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
            )}
          >
            <IconComponent className="h-4 w-4" />
          </span>
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-200",
              copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
            )}
          >
            <Check className="h-4 w-4 animate-checkmark" />
          </span>
          {/* Invisible spacer to maintain button size */}
          <span className="invisible">
            <IconComponent className="h-4 w-4" />
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{copied ? successLabel : label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/** Inline copy button with text */
interface CopyButtonInlineProps extends Omit<CopyButtonProps, "size" | "variant"> {
  /** Text to display next to button */
  text?: string;
  /** Whether to truncate long text */
  truncate?: boolean;
  /** Max width for text container */
  maxWidth?: string;
}

export function CopyButtonInline({
  value,
  text,
  truncate = true,
  maxWidth = "200px",
  className,
  ...props
}: CopyButtonInlineProps) {
  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      <span
        className={cn("text-sm font-medium", truncate && "truncate")}
        style={truncate ? { maxWidth } : undefined}
        title={value}
      >
        {text || value}
      </span>
      <CopyButton
        value={value}
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        {...props}
      />
    </div>
  );
}

/** Copy button with visual text field */
interface CopyFieldProps extends Omit<CopyButtonProps, "size" | "variant"> {
  /** Display text (defaults to value) */
  displayValue?: string;
}

export function CopyField({ value, displayValue, className, ...props }: CopyFieldProps) {
  return (
    <div
      className={cn("flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2", className)}
    >
      <span className="flex-1 truncate text-sm font-mono">{displayValue || value}</span>
      <CopyButton
        value={value}
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        {...props}
      />
    </div>
  );
}
