"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

type CardListVariant = "compact" | "loose";

interface CardListContextValue {
  variant: CardListVariant;
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelectable: boolean;
  lastSelectedId: string | null;
  setLastSelectedId: (id: string | null) => void;
}

const CardListContext = React.createContext<CardListContextValue | null>(null);

function useCardList() {
  const context = React.useContext(CardListContext);
  if (!context) {
    throw new Error("useCardList must be used within a CardList");
  }
  return context;
}

interface CardListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Display variant - compact has less padding, loose has more spacing */
  variant?: CardListVariant;
  /** Enable selection mode with checkboxes */
  selectable?: boolean;
  /** Controlled selected IDs */
  selectedIds?: string[];
  /** Callback when selection changes */
  onSelectionChange?: (ids: string[]) => void;
  /** All selectable item IDs (for "select all" functionality) */
  allIds?: string[];
}

export function CardList({
  children,
  className,
  variant = "loose",
  selectable = false,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  allIds = [],
  ...props
}: CardListProps) {
  const [internalSelectedIds, setInternalSelectedIds] = React.useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = React.useState<string | null>(null);

  const isControlled = controlledSelectedIds !== undefined;
  const selectedIds = isControlled ? new Set(controlledSelectedIds) : internalSelectedIds;

  const updateSelection = React.useCallback(
    (newIds: Set<string>) => {
      if (isControlled) {
        onSelectionChange?.(Array.from(newIds));
      } else {
        setInternalSelectedIds(newIds);
        onSelectionChange?.(Array.from(newIds));
      }
    },
    [isControlled, onSelectionChange]
  );

  const toggleSelection = React.useCallback(
    (id: string) => {
      const newIds = new Set(selectedIds);
      if (newIds.has(id)) {
        newIds.delete(id);
      } else {
        newIds.add(id);
      }
      updateSelection(newIds);
    },
    [selectedIds, updateSelection]
  );

  const selectAll = React.useCallback(() => {
    updateSelection(new Set(allIds));
  }, [allIds, updateSelection]);

  const clearSelection = React.useCallback(() => {
    updateSelection(new Set());
  }, [updateSelection]);

  const contextValue = React.useMemo(
    () => ({
      variant,
      selectedIds,
      toggleSelection,
      selectAll,
      clearSelection,
      isSelectable: selectable,
      lastSelectedId,
      setLastSelectedId,
    }),
    [variant, selectedIds, toggleSelection, selectAll, clearSelection, selectable, lastSelectedId]
  );

  return (
    <CardListContext.Provider value={contextValue}>
      <div
        className={cn(
          "relative rounded-lg border bg-card",
          variant === "compact" ? "divide-y" : "space-y-px",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </CardListContext.Provider>
  );
}

interface CardListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Unique ID for selection */
  id: string;
  /** Whether to show selection checkbox */
  showCheckbox?: boolean;
}

export function CardListItem({
  children,
  className,
  id,
  showCheckbox,
  onClick,
  ...props
}: CardListItemProps) {
  const { variant, selectedIds, toggleSelection, isSelectable, setLastSelectedId } = useCardList();
  const isSelected = selectedIds.has(id);
  const showSelection = showCheckbox ?? isSelectable;

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isSelectable) {
        // Handle shift-click for range selection
        if (e.shiftKey) {
          // Range selection would be handled by parent with allIds
          toggleSelection(id);
        } else if (e.ctrlKey || e.metaKey) {
          toggleSelection(id);
        }
        setLastSelectedId(id);
      }
      onClick?.(e);
    },
    [id, isSelectable, onClick, toggleSelection, setLastSelectedId]
  );

  const handleCheckboxClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleSelection(id);
      setLastSelectedId(id);
    },
    [id, toggleSelection, setLastSelectedId]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (isSelectable) {
          toggleSelection(id);
          setLastSelectedId(id);
        }
      }
    },
    [id, isSelectable, toggleSelection, setLastSelectedId]
  );

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 bg-card transition-colors",
        variant === "compact" ? "px-4 py-3" : "px-5 py-4",
        isSelected && "bg-primary/5",
        "hover:bg-muted/50",
        "first:rounded-t-lg last:rounded-b-lg",
        isSelectable && "cursor-pointer",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isSelectable ? "button" : undefined}
      tabIndex={isSelectable ? 0 : undefined}
      {...props}
    >
      {showSelection && (
        <div className="flex items-center pt-0.5" onClick={handleCheckboxClick}>
          <Checkbox
            checked={isSelected}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

interface CardListHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show "select all" checkbox */
  showSelectAll?: boolean;
  /** Total count for display */
  totalCount?: number;
}

export function CardListHeader({
  children,
  className,
  showSelectAll = false,
  totalCount,
  ...props
}: CardListHeaderProps) {
  const { variant, selectedIds, selectAll, clearSelection, isSelectable } = useCardList();
  const hasSelection = selectedIds.size > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b bg-muted/30",
        variant === "compact" ? "px-4 py-2" : "px-5 py-3",
        "rounded-t-lg",
        className
      )}
      {...props}
    >
      {isSelectable && showSelectAll && (
        <Checkbox
          checked={hasSelection && totalCount !== undefined && selectedIds.size === totalCount}
          onCheckedChange={(checked) => {
            if (checked) {
              selectAll();
            } else {
              clearSelection();
            }
          }}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      )}
      <div className="flex-1 min-w-0">{children}</div>
      {hasSelection && (
        <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
      )}
    </div>
  );
}

interface CardListEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Action button/element */
  action?: React.ReactNode;
}

export function CardListEmpty({
  children,
  className,
  icon,
  title,
  description,
  action,
  ...props
}: CardListEmptyProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-12 px-6 text-center", className)}
      {...props}
    >
      {icon && <div className="mb-4 text-muted-foreground/50">{icon}</div>}
      {title && <h3 className="font-medium text-foreground mb-1">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>}
      {action}
      {children}
    </div>
  );
}

interface SelectionToolbarProps {
  children?: React.ReactNode;
  className?: string;
  /** Number of selected items (if not using CardList context) */
  selectedCount?: number;
  /** Clear selection callback (if not using CardList context) */
  onClearSelection?: () => void;
  /** Actions to show when items are selected */
  actions?: React.ReactNode;
}

export function SelectionToolbar({
  children,
  className,
  selectedCount: externalSelectedCount,
  onClearSelection: externalClearSelection,
  actions,
}: SelectionToolbarProps) {
  // Try to use context, but fall back to props
  const context = React.useContext(CardListContext);

  const selectedCount = externalSelectedCount ?? context?.selectedIds.size ?? 0;
  const clearSelection = externalClearSelection ?? context?.clearSelection ?? (() => {});

  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-3 rounded-lg border bg-background px-4 py-2 shadow-lg",
          className
        )}
      >
        <span className="text-sm font-medium">{selectedCount} selected</span>
        <div className="h-4 w-px bg-border" />
        {actions}
        {children}
        <button
          type="button"
          onClick={clearSelection}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export { useCardList };
