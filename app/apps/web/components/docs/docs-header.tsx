"use client";

/**
 * Docs Header
 *
 * Client component for the docs header with search functionality.
 */

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { DocsSearchDialog } from "./docs-search-dialog";
import { DocsMobileNav } from "./docs-mobile-nav";

export function DocsHeader() {
  const [searchOpen, setSearchOpen] = React.useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-[var(--docs-bg)]/95 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4 md:gap-6">
            <DocsMobileNav />
            <Logo showText />
            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/docs"
                className="text-sm font-medium text-foreground hover:text-[var(--docs-accent)] transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="/docs/api/overview"
                className="text-sm font-medium text-muted-foreground hover:text-[var(--docs-accent)] transition-colors"
              >
                API Reference
              </Link>
              <Link
                href="/docs/guides/utm-tracking"
                className="text-sm font-medium text-muted-foreground hover:text-[var(--docs-accent)] transition-colors"
              >
                Guides
              </Link>
            </nav>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="hidden w-full max-w-[260px] md:block">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-muted-foreground h-9 px-3 border-border hover:border-[var(--docs-accent)]/50"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span>Search docs...</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
            {/* Mobile search button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search docs</span>
            </Button>
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-medium hover:text-[var(--docs-accent)]"
              >
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <DocsSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
