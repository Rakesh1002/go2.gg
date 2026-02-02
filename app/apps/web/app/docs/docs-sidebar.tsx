"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Define docs navigation structure
const docsNav = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Quick Start", href: "/docs/quickstart" },
      { title: "Project Structure", href: "/docs/structure" },
    ],
  },
  {
    title: "Features",
    items: [
      { title: "Short Links", href: "/docs/features/links" },
      { title: "Custom Domains", href: "/docs/features/domains" },
      { title: "Analytics", href: "/docs/features/analytics" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { title: "Overview", href: "/docs/api/overview" },
      { title: "Authentication", href: "/docs/api/authentication" },
      { title: "Links API", href: "/docs/api/links" },
      { title: "Webhooks", href: "/docs/api/webhooks" },
      { title: "QR Codes", href: "/docs/api/qr-codes" },
      { title: "Galleries", href: "/docs/api/galleries" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { title: "Zapier", href: "/docs/integrations/zapier" },
      { title: "Make", href: "/docs/integrations/make" },
      { title: "Slack", href: "/docs/integrations/slack" },
      { title: "MCP Server", href: "/docs/integrations/mcp" },
    ],
  },
  {
    title: "SDKs",
    items: [{ title: "TypeScript SDK", href: "/docs/sdks/typescript" }],
  },
  {
    title: "Guides",
    items: [{ title: "UTM Tracking", href: "/docs/guides/utm-tracking" }],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-8">
      {docsNav.map((section) => (
        <div key={section.title}>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/50">
            {section.title}
          </h4>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center py-1.5 text-[14px] transition-colors duration-150",
                    pathname === item.href
                      ? "text-[var(--docs-accent)] font-medium"
                      : "text-foreground/65 hover:text-foreground"
                  )}
                >
                  {/* Active indicator dot */}
                  <span
                    className={cn(
                      "mr-3 h-1 w-1 rounded-full transition-all duration-150",
                      pathname === item.href
                        ? "bg-[var(--docs-accent)]"
                        : "bg-transparent group-hover:bg-foreground/30"
                    )}
                  />
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
