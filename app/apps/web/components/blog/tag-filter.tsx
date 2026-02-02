"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TagFilterProps {
  tags: string[];
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
  className?: string;
}

/**
 * Tag filter component for blog list page
 */
export function TagFilter({ tags, selectedTag, onTagSelect, className }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        variant={selectedTag === null ? "default" : "outline"}
        size="sm"
        onClick={() => onTagSelect(null)}
        className={cn(
          "rounded-full transition-all",
          selectedTag === null
            ? "bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]"
            : "border-[var(--marketing-border)] text-[var(--marketing-text-muted)] hover:text-[var(--marketing-accent)] hover:border-[var(--marketing-accent)]/30 bg-transparent"
        )}
      >
        All
      </Button>
      {tags.map((tag) => (
        <Button
          key={tag}
          variant={selectedTag === tag ? "default" : "outline"}
          size="sm"
          onClick={() => onTagSelect(tag)}
          className={cn(
            "rounded-full transition-all capitalize",
            selectedTag === tag
              ? "bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]"
              : "border-[var(--marketing-border)] text-[var(--marketing-text-muted)] hover:text-[var(--marketing-accent)] hover:border-[var(--marketing-accent)]/30 bg-transparent"
          )}
        >
          {tag}
        </Button>
      ))}
    </div>
  );
}
