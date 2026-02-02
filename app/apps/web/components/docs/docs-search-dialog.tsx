"use client";

/**
 * Docs Search Dialog
 *
 * A Cmd+K activated search dialog for documentation.
 * Uses the existing CommandDialog component with custom search logic.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Hash, Search, Book, ArrowRight } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface DocResult {
  slug: string;
  title: string;
  description: string;
  section?: string;
  content: string;
  score: number;
}

interface DocsSearchDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DocsSearchDialog({ open, onOpenChange }: DocsSearchDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<DocResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = React.useCallback(
    (value: boolean) => {
      if (isControlled && onOpenChange) {
        onOpenChange(value);
      } else {
        setInternalOpen(value);
      }
    },
    [isControlled, onOpenChange]
  );

  // Handle keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, setIsOpen]);

  // Search when query changes
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const abortController = new AbortController();

    const searchDocs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/docs-search?q=${encodeURIComponent(query)}&limit=10`, {
          signal: abortController.signal,
        });
        if (response.ok) {
          const data = await response.json();
          setResults(data.results);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Search failed:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchDocs, 150);
    return () => {
      clearTimeout(debounceTimer);
      abortController.abort();
    };
  }, [query]);

  const handleSelect = (slug: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/docs/${slug}`);
  };

  // Get section icon
  const getSectionIcon = (section?: string) => {
    switch (section?.toLowerCase()) {
      case "api":
        return <Hash className="h-4 w-4" />;
      case "features":
        return <Book className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Search Documentation"
      description="Search through all documentation pages"
    >
      <CommandInput placeholder="Search docs..." value={query} onValueChange={setQuery} />
      <CommandList>
        {!query && (
          <CommandEmpty className="py-6 text-center text-sm">
            <Search className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">Type to search documentation...</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Esc</kbd> to close
            </p>
          </CommandEmpty>
        )}
        {query && !isLoading && results.length === 0 && (
          <CommandEmpty>No results found for &quot;{query}&quot;</CommandEmpty>
        )}
        {query && isLoading && (
          <CommandEmpty>
            <div className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Searching...
            </div>
          </CommandEmpty>
        )}
        {results.length > 0 && (
          <CommandGroup heading="Documentation">
            {results.map((result) => (
              <CommandItem
                key={result.slug}
                value={result.slug}
                onSelect={() => handleSelect(result.slug)}
                className="flex items-start gap-3 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                  {getSectionIcon(result.section)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{result.title}</span>
                    {result.section && (
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {result.section}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {result.description || result.content}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
