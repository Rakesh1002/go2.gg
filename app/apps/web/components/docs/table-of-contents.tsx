"use client";

/**
 * Table of Contents
 *
 * A sticky sidebar showing document headings with active state tracking.
 * Modern Mintlify-inspired design with visual indicator line.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: TocItem[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: "-100px 0% -75% 0%",
        threshold: 0,
      }
    );

    // Observe all heading elements
    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="hidden xl:block w-[200px] shrink-0">
      <div className="sticky top-24">
        <div className="pb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-4">
            On This Page
          </h4>
          <nav className="relative">
            {/* Vertical line indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border/60" />

            <ul className="space-y-0.5">
              {headings.map((heading) => (
                <li key={heading.id} className="relative">
                  {/* Active indicator */}
                  {activeId === heading.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-5 bg-[var(--docs-accent)] transition-all" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleClick(heading.id)}
                    className={cn(
                      "block w-full text-left text-[13px] leading-relaxed py-1.5 transition-colors duration-150",
                      heading.level === 2 && "pl-4",
                      heading.level === 3 && "pl-7",
                      heading.level === 4 && "pl-10",
                      activeId === heading.id
                        ? "text-[var(--docs-accent)] font-medium"
                        : "text-foreground/50 hover:text-foreground/80"
                    )}
                  >
                    {heading.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </aside>
  );
}
