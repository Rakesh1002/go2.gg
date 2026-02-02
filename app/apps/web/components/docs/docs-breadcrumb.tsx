/**
 * Docs Breadcrumb
 *
 * Navigation breadcrumb for documentation pages.
 * Modern, minimal design inspired by Mintlify.
 */

import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";

interface DocsBreadcrumbProps {
  slug: string;
  title: string;
  section?: string;
}

export function DocsBreadcrumb({ slug, title, section }: DocsBreadcrumbProps) {
  const parts = slug.split("/");

  // Build breadcrumb items
  const items: Array<{ label: string; href?: string }> = [{ label: "Docs", href: "/docs" }];

  // Add section if present
  if (section) {
    items.push({ label: section, href: `/docs/${parts[0]}` });
  } else if (parts.length > 1) {
    // Use folder name as section
    const sectionName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    items.push({ label: sectionName, href: `/docs/${parts[0]}` });
  }

  // Add current page (no link)
  items.push({ label: title });

  return (
    <nav className="flex items-center gap-1.5 text-[13px]">
      <FileText className="h-3.5 w-3.5 text-foreground/40" />
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight className="h-3 w-3 text-foreground/30" />}
          {item.href ? (
            <Link
              href={item.href}
              className="text-foreground/50 hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground/80">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
