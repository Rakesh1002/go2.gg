"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SelectionToolbarProps {
  /** Number of selected items */
  selectedCount: number;
  /** Callback to clear selection */
  onClearSelection: () => void;
  /** Action buttons to display */
  actions?: React.ReactNode;
  /** Custom content */
  children?: React.ReactNode;
  className?: string;
}

export function SelectionToolbar({
  selectedCount,
  onClearSelection,
  actions,
  children,
  className,
}: SelectionToolbarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
            "flex items-center gap-3 rounded-lg border bg-background px-4 py-2 shadow-lg",
            className
          )}
        >
          {/* Selection count */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{selectedCount}</span>
            <span className="text-muted-foreground">selected</span>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-border" />

          {/* Actions */}
          {actions}
          {children}

          {/* Clear button */}
          <Button variant="ghost" size="sm" onClick={onClearSelection} className="h-8 gap-1">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface BulkActionButtonProps {
  /** Button label */
  label: string;
  /** Button icon */
  icon?: React.ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Variant */
  variant?: "default" | "destructive" | "outline" | "ghost";
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

export function BulkActionButton({
  label,
  icon,
  onClick,
  variant = "outline",
  disabled = false,
  loading = false,
}: BulkActionButtonProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={disabled || loading}
      className="h-8 gap-1.5"
    >
      {icon}
      {label}
    </Button>
  );
}
