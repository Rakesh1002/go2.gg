"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Trash2, Info, CheckCircle, Loader2 } from "lucide-react";

type ConfirmVariant = "default" | "destructive" | "warning" | "success";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

const variantConfig: Record<
  ConfirmVariant,
  {
    icon: typeof AlertTriangle;
    iconClassName: string;
    confirmButtonVariant: "default" | "destructive" | "secondary" | "outline";
  }
> = {
  default: {
    icon: Info,
    iconClassName: "text-primary bg-primary/10",
    confirmButtonVariant: "default",
  },
  destructive: {
    icon: Trash2,
    iconClassName: "text-destructive bg-destructive/10",
    confirmButtonVariant: "destructive",
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: "text-amber-500 bg-amber-500/10",
    confirmButtonVariant: "default",
  },
  success: {
    icon: CheckCircle,
    iconClassName: "text-green-500 bg-green-500/10",
    confirmButtonVariant: "default",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const [isConfirming, setIsConfirming] = React.useState(false);

  async function handleConfirm() {
    setIsConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Confirm action failed:", error);
    } finally {
      setIsConfirming(false);
    }
  }

  function handleCancel() {
    onCancel?.();
    onOpenChange(false);
  }

  const isLoading = loading || isConfirming;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="animate-scale-in">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full animate-bounce-in",
                config.iconClassName
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 pt-1">
              <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="mt-2">{description}</AlertDialogDescription>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={config.confirmButtonVariant}
              onClick={handleConfirm}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for easier usage
interface UseConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

export function useConfirm() {
  const [state, setState] = React.useState<{
    open: boolean;
    options: UseConfirmOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    open: false,
    options: { title: "" },
    resolve: null,
  });

  const confirm = React.useCallback((options: UseConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        open: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = React.useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [state.resolve]);

  const handleCancel = React.useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [state.resolve]);

  const ConfirmDialogComponent = React.useCallback(
    () => (
      <ConfirmDialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        {...state.options}
      />
    ),
    [state.open, state.options, handleConfirm, handleCancel]
  );

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
}
