"use client";

/**
 * Docs Mobile Navigation
 *
 * A slide-out navigation menu for mobile devices.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

// Define docs navigation structure (same as docs-sidebar)
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

export function DocsMobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-left text-lg font-semibold">Documentation</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <nav className="px-4 py-4 space-y-6">
            {docsNav.map((section) => (
              <div key={section.title}>
                <h4 className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h4>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "block rounded-lg px-3 py-2.5 text-sm transition-colors text-left",
                          pathname === item.href
                            ? "bg-[var(--docs-accent)]/10 text-[var(--docs-accent)] font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
