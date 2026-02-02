"use client";

import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { AnimatedSizeContainer } from "@/components/ui/animated-size-container";
import { useKeyboardShortcut, Kbd } from "@/contexts/keyboard-shortcut-context";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X, Tag, Trash2, FolderInput, Archive } from "lucide-react";

interface PaginationInfo {
  page: number;
  perPage: number;
  total: number;
  hasMore: boolean;
}

interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  variant?: "default" | "destructive" | "outline";
  onClick: () => void;
  disabled?: boolean;
}

interface LinksToolbarProps {
  /** Current selection state */
  selectedIds: string[];
  /** Callback to clear selection */
  onClearSelection: () => void;
  /** Pagination info */
  pagination: PaginationInfo;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Whether the toolbar is loading */
  loading?: boolean;
  /** Bulk actions configuration */
  onBulkDelete?: (ids: string[]) => void;
  onBulkTag?: (ids: string[]) => void;
  onBulkArchive?: (ids: string[]) => void;
  onBulkMove?: (ids: string[]) => void;
}

export const LinksToolbar = memo(function LinksToolbar({
  selectedIds,
  onClearSelection,
  pagination,
  onPageChange,
  loading,
  onBulkDelete,
  onBulkTag,
  onBulkArchive,
  onBulkMove,
}: LinksToolbarProps) {
  const isSelecting = selectedIds.length > 0;

  // Build bulk actions array
  const bulkActions: BulkAction[] = useMemo(
    () =>
      [
        onBulkTag && {
          id: "tag",
          label: "Tags",
          icon: Tag,
          shortcut: "t",
          variant: "outline" as const,
          onClick: () => onBulkTag(selectedIds),
        },
        onBulkMove && {
          id: "move",
          label: "Move",
          icon: FolderInput,
          shortcut: "m",
          variant: "outline" as const,
          onClick: () => onBulkMove(selectedIds),
        },
        onBulkArchive && {
          id: "archive",
          label: "Archive",
          icon: Archive,
          shortcut: "a",
          variant: "outline" as const,
          onClick: () => onBulkArchive(selectedIds),
        },
        onBulkDelete && {
          id: "delete",
          label: "Delete",
          icon: Trash2,
          shortcut: "x",
          variant: "destructive" as const,
          onClick: () => onBulkDelete(selectedIds),
        },
      ].filter(Boolean) as BulkAction[],
    [selectedIds, onBulkTag, onBulkMove, onBulkArchive, onBulkDelete]
  );

  // Register keyboard shortcuts for bulk actions
  useKeyboardShortcut(
    bulkActions.map((a) => a.shortcut).filter(Boolean) as string[],
    (e) => {
      const action = bulkActions.find((a) => a.shortcut === e.key.toLowerCase());
      if (action && !action.disabled) {
        action.onClick();
      }
    },
    {
      enabled: isSelecting,
      priority: 5,
    }
  );

  // Escape to clear selection
  useKeyboardShortcut("Escape", () => onClearSelection(), {
    enabled: isSelecting,
    priority: 5,
  });

  const { page, total, perPage, hasMore } = pagination;
  const startItem = (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, total);

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed toolbar */}
      <div className="h-20" />

      {/* Fixed bottom toolbar */}
      <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 md:left-[256px] md:right-0">
        <div className="w-full max-w-3xl">
          <div className="overflow-hidden rounded-xl border border-border bg-background shadow-lg">
            <AnimatedSizeContainer height="auto">
              {/* Pagination mode */}
              <div
                className={cn(
                  "relative px-4 py-3 transition-all duration-200",
                  isSelecting && "pointer-events-none absolute inset-0 translate-y-full opacity-0"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {loading ? (
                      <span className="animate-pulse">Loading...</span>
                    ) : (
                      <>
                        Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
                        <span className="font-medium text-foreground">{endItem}</span> of{" "}
                        <span className="font-medium text-foreground">{total}</span> links
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(page - 1)}
                      disabled={page <= 1 || loading}
                      className="h-8 gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(page + 1)}
                      disabled={!hasMore || loading}
                      className="h-8 gap-1"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Selection mode */}
              <div
                className={cn(
                  "relative px-4 py-3 transition-all duration-200",
                  !isSelecting && "pointer-events-none absolute inset-0 translate-y-full opacity-0"
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClearSelection}
                      className="rounded-md p-1.5 transition-colors hover:bg-muted"
                      aria-label="Clear selection"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{selectedIds.length}</span>{" "}
                      selected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {bulkActions.map((action) => (
                      <Button
                        key={action.id}
                        variant={action.variant ?? "outline"}
                        size="sm"
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className="h-8 gap-1.5"
                      >
                        <action.icon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{action.label}</span>
                        {action.shortcut && (
                          <Kbd className="ml-1 hidden md:inline-flex">
                            {action.shortcut.toUpperCase()}
                          </Kbd>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSizeContainer>
          </div>
        </div>
      </div>
    </>
  );
});
