"use client";

import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";

interface ToastWithUndoProps {
  id: string | number;
  message: string;
  undo: () => void;
}

/**
 * Toast component with undo button and Cmd+Z support
 */
function ToastWithUndo({ id, message, undo }: ToastWithUndoProps) {
  const handleUndo = useCallback(() => {
    undo();
    toast.dismiss(id);
  }, [id, undo]);

  // Listen for Cmd/Ctrl+Z to undo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "z" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleUndo();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo]);

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </div>
        <p className="font-medium text-sm">{message}</p>
      </div>
      <button
        type="button"
        onClick={handleUndo}
        className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent active:scale-95"
      >
        Undo
      </button>
    </div>
  );
}

interface ToastWithUndoOptions {
  /** Unique ID for the toast */
  id: string | number;
  /** Message to display */
  message: string;
  /** Callback to execute when undo is clicked or Cmd+Z is pressed */
  undo: () => void;
  /** Duration in milliseconds (default: 8000) */
  duration?: number;
}

/**
 * Hook for showing toasts with undo functionality.
 *
 * Features:
 * - Undo button in toast
 * - Cmd/Ctrl+Z keyboard shortcut to undo
 * - Extended duration for undo actions
 *
 * @example
 * const showToastWithUndo = useToastWithUndo();
 *
 * // After deleting something
 * showToastWithUndo({
 *   id: "delete-link",
 *   message: "Link deleted",
 *   undo: () => restoreLink(linkId),
 *   duration: 8000,
 * });
 */
export function useToastWithUndo() {
  const showToastWithUndo = useCallback(
    ({ id, message, undo, duration = 8000 }: ToastWithUndoOptions) => {
      return toast(<ToastWithUndo id={id} message={message} undo={undo} />, {
        id,
        duration,
        // Prevent dismissing on click outside since we have an undo button
        dismissible: true,
      });
    },
    []
  );

  return showToastWithUndo;
}

/**
 * Quick helper for success messages with undo
 */
export function toastWithUndo(options: ToastWithUndoOptions) {
  return toast(<ToastWithUndo id={options.id} message={options.message} undo={options.undo} />, {
    id: options.id,
    duration: options.duration ?? 8000,
    dismissible: true,
  });
}
