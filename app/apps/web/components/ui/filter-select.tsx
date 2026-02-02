"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Filter, X, Sparkles } from "lucide-react";

export interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface FilterCategory {
  id: string;
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  multiSelect?: boolean;
}

interface FilterSelectProps {
  /** Filter categories with options */
  categories: FilterCategory[];
  /** Currently selected filters */
  selectedFilters: Record<string, string[]>;
  /** Callback when filters change */
  onFiltersChange: (filters: Record<string, string[]>) => void;
  /** Keyboard shortcut to open (default: "f") */
  shortcut?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to show AI search option */
  showAISearch?: boolean;
  /** Callback for AI search */
  onAISearch?: (query: string) => void;
  /** Custom trigger element */
  trigger?: React.ReactNode;
  /** Align popover */
  align?: "start" | "center" | "end";
  className?: string;
}

export function FilterSelect({
  categories,
  selectedFilters,
  onFiltersChange,
  shortcut = "f",
  placeholder = "Filter...",
  showAISearch = false,
  onAISearch,
  trigger,
  align = "start",
  className,
}: FilterSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  // Count total active filters
  const activeFilterCount = Object.values(selectedFilters).reduce(
    (acc, filters) => acc + filters.length,
    0
  );

  // Keyboard shortcut handler
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key.toLowerCase() === shortcut &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setOpen(true);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcut]);

  const toggleFilter = React.useCallback(
    (categoryId: string, optionId: string, multiSelect: boolean) => {
      const currentFilters = selectedFilters[categoryId] || [];
      let newFilters: string[];

      if (currentFilters.includes(optionId)) {
        // Remove filter
        newFilters = currentFilters.filter((f) => f !== optionId);
      } else {
        // Add filter
        if (multiSelect) {
          newFilters = [...currentFilters, optionId];
        } else {
          newFilters = [optionId];
        }
      }

      onFiltersChange({
        ...selectedFilters,
        [categoryId]: newFilters,
      });
    },
    [selectedFilters, onFiltersChange]
  );

  const clearAllFilters = React.useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  // Clear filters for a specific category (available for future use)
  const _clearCategoryFilters = React.useCallback(
    (categoryId: string) => {
      const newFilters = { ...selectedFilters };
      delete newFilters[categoryId];
      onFiltersChange(newFilters);
    },
    [selectedFilters, onFiltersChange]
  );
  void _clearCategoryFilters; // Suppress unused warning

  // Render category selection or option selection
  const renderContent = () => {
    if (activeCategory) {
      const category = categories.find((c) => c.id === activeCategory);
      if (!category) return null;

      return (
        <>
          <CommandInput
            placeholder={`Search ${category.label.toLowerCase()}...`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {category.options
                .filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
                .map((option) => {
                  const isSelected = (selectedFilters[category.id] || []).includes(option.id);

                  return (
                    <CommandItem
                      key={option.id}
                      value={option.id}
                      onSelect={() =>
                        toggleFilter(category.id, option.id, category.multiSelect ?? true)
                      }
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "opacity-50"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      {option.icon && (
                        <span className="mr-2 text-muted-foreground">{option.icon}</span>
                      )}
                      <span className="flex-1">{option.label}</span>
                      {option.count !== undefined && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {option.count}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </CommandList>
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => setActiveCategory(null)}
            >
              <ChevronDown className="mr-2 h-4 w-4 rotate-90" />
              Back to categories
            </Button>
          </div>
        </>
      );
    }

    return (
      <>
        <CommandInput placeholder={placeholder} value={search} onValueChange={setSearch} />
        <CommandList>
          <CommandEmpty>
            {showAISearch && search ? (
              <div className="py-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    onAISearch?.(search);
                    setOpen(false);
                  }}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  Ask AI: "{search}"
                </Button>
              </div>
            ) : (
              "No filters found."
            )}
          </CommandEmpty>

          {categories
            .filter(
              (cat) =>
                cat.label.toLowerCase().includes(search.toLowerCase()) ||
                cat.options.some((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
            )
            .map((category, index) => (
              <React.Fragment key={category.id}>
                {index > 0 && <CommandSeparator />}
                <CommandGroup heading={category.label}>
                  {category.options
                    .filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
                    .slice(0, 4) // Show first 4 options
                    .map((option) => {
                      const isSelected = (selectedFilters[category.id] || []).includes(option.id);

                      return (
                        <CommandItem
                          key={option.id}
                          value={`${category.id}-${option.id}`}
                          onSelect={() =>
                            toggleFilter(category.id, option.id, category.multiSelect ?? true)
                          }
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "opacity-50"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          {option.icon && (
                            <span className="mr-2 text-muted-foreground">{option.icon}</span>
                          )}
                          <span className="flex-1">{option.label}</span>
                        </CommandItem>
                      );
                    })}
                  {category.options.length > 4 && (
                    <CommandItem
                      value={`more-${category.id}`}
                      onSelect={() => setActiveCategory(category.id)}
                      className="text-muted-foreground"
                    >
                      View all {category.options.length} {category.label.toLowerCase()}...
                    </CommandItem>
                  )}
                </CommandGroup>
              </React.Fragment>
            ))}
        </CommandList>

        {/* Bottom gradient fade */}
        <div className="pointer-events-none absolute bottom-12 left-0 right-0 h-8 bg-gradient-to-t from-popover to-transparent" />

        {activeFilterCount > 0 && (
          <div className="border-t p-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {activeFilterCount} filter{activeFilterCount !== 1 && "s"} active
            </span>
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 text-xs">
              Clear all
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className={cn("gap-2", className)}>
            <Filter className="h-4 w-4" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5">
                {activeFilterCount}
              </Badge>
            )}
            <Kbd className="ml-1">{shortcut.toUpperCase()}</Kbd>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] p-0 relative"
        align={align}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory || "categories"}
            initial={{ opacity: 0, x: activeCategory ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeCategory ? -10 : 10 }}
            transition={{ duration: 0.15 }}
          >
            <Command>{renderContent()}</Command>
          </motion.div>
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}

interface ActiveFiltersProps {
  categories: FilterCategory[];
  selectedFilters: Record<string, string[]>;
  onFiltersChange: (filters: Record<string, string[]>) => void;
  className?: string;
}

/**
 * Display active filters as removable badges
 */
export function ActiveFilters({
  categories,
  selectedFilters,
  onFiltersChange,
  className,
}: ActiveFiltersProps) {
  const activeFilters: Array<{
    categoryId: string;
    categoryLabel: string;
    optionId: string;
    optionLabel: string;
  }> = [];

  for (const category of categories) {
    const filters = selectedFilters[category.id] || [];
    for (const optionId of filters) {
      const option = category.options.find((o) => o.id === optionId);
      if (option) {
        activeFilters.push({
          categoryId: category.id,
          categoryLabel: category.label,
          optionId: option.id,
          optionLabel: option.label,
        });
      }
    }
  }

  if (activeFilters.length === 0) return null;

  const removeFilter = (categoryId: string, optionId: string) => {
    const newFilters = {
      ...selectedFilters,
      [categoryId]: (selectedFilters[categoryId] || []).filter((f) => f !== optionId),
    };
    // Clean up empty arrays
    if (newFilters[categoryId]?.length === 0) {
      delete newFilters[categoryId];
    }
    onFiltersChange(newFilters);
  };

  const clearAll = () => {
    onFiltersChange({});
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <AnimatePresence>
        {activeFilters.map((filter) => (
          <motion.div
            key={`${filter.categoryId}-${filter.optionId}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Badge variant="secondary" className="gap-1 pr-1">
              <span className="text-muted-foreground">{filter.categoryLabel}:</span>
              {filter.optionLabel}
              <button
                type="button"
                onClick={() => removeFilter(filter.categoryId, filter.optionId)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                aria-label={`Remove ${filter.optionLabel} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </motion.div>
        ))}
      </AnimatePresence>
      {activeFilters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-6 text-xs text-muted-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
