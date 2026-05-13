"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { List, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

/**
 * Extract headings from MDX content
 */
export function extractHeadings(content: string): TocItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const headings: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    headings.push({ id, text, level });
  }

  return headings;
}

/**
 * Table of Contents component with scroll tracking
 */
export function TableOfContents({ items, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Track scroll position and update active heading
  useEffect(() => {
    if (items.length === 0) return;

    // Maintain a Set of ids whose heading is currently inside the active strip.
    // IntersectionObserver only delivers entries for *changes*, so we have to
    // remember state across calls — picking the first id that's still in the
    // set (in document order) keeps the highlight stable on scroll up + down.
    const intersecting = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersecting.add(entry.target.id);
          } else {
            intersecting.delete(entry.target.id);
          }
        });

        const firstActive = items.find((item) => intersecting.has(item.id));
        if (firstActive) {
          setActiveId(firstActive.id);
          return;
        }

        // No headings in the active strip — fall back to whichever heading
        // is currently above the viewport's top (i.e. the section we're
        // scrolled into but whose H2/H3 has already scrolled offscreen).
        let lastAbove: string | null = null;
        for (const item of items) {
          const el = document.getElementById(item.id);
          if (!el) continue;
          if (el.getBoundingClientRect().top < 100) {
            lastAbove = item.id;
          } else {
            break;
          }
        }
        if (lastAbove) setActiveId(lastAbove);
      },
      {
        rootMargin: "-80px 0px -70% 0px",
        threshold: 0,
      }
    );

    // Observe all heading elements
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  // Smooth scroll to heading
  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <nav className={cn("relative", className)}>
      {/* Mobile toggle */}
      <div className="mb-4 lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-between border-[var(--marketing-border)] text-[var(--marketing-text-muted)]"
        >
          <span className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Table of Contents
          </span>
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {/* TOC content */}
      <div className={cn("lg:block", isCollapsed ? "hidden" : "block")}>
        {/* Desktop header */}
        <div className="mb-4 hidden items-center gap-2 font-semibold text-[var(--marketing-text)] text-sm lg:flex">
          <List className="h-4 w-4" />
          On this page
        </div>

        {/* TOC items */}
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.id} style={{ paddingLeft: `${(item.level - 2) * 12}px` }}>
              <button
                type="button"
                onClick={() => scrollToHeading(item.id)}
                className={cn(
                  "block w-full py-1.5 text-left text-sm transition-colors hover:text-[var(--marketing-accent)] sm:py-1",
                  activeId === item.id
                    ? "font-medium text-[var(--marketing-accent)]"
                    : "text-[var(--marketing-text-muted)]"
                )}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

/**
 * Sticky TOC wrapper for desktop sidebar
 */
export function StickyTableOfContents({ items, className }: TableOfContentsProps) {
  return (
    <div className={cn("sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto", className)}>
      <TableOfContents items={items} />
    </div>
  );
}
