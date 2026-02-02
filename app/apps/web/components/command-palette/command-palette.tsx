"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useKeyboardShortcut, Kbd } from "@/contexts/keyboard-shortcut-context";
import {
  Link2,
  BarChart3,
  Globe,
  QrCode,
  Plus,
  Settings,
  CreditCard,
  Users,
  Upload,
  LayoutDashboard,
  FolderOpen,
  Search,
  ExternalLink,
  Copy,
  Code,
} from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

interface Link {
  id: string;
  slug: string;
  destinationUrl: string;
  title: string | null;
  clickCount: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

// Navigation items
const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "G D" },
  { href: "/dashboard/links", label: "Links", icon: Link2, shortcut: "G L" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, shortcut: "G A" },
  { href: "/dashboard/domains", label: "Domains", icon: Globe },
  { href: "/dashboard/qr", label: "QR Codes", icon: QrCode },
  { href: "/dashboard/folders", label: "Folders", icon: FolderOpen },
  { href: "/dashboard/import", label: "Import", icon: Upload },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/developer", label: "Developer", icon: Code },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

// Quick actions
const quickActions = [
  { id: "create-link", label: "Create New Link", icon: Plus, shortcut: "C" },
  { id: "search-links", label: "Search Links", icon: Search, shortcut: "/" },
];

interface CommandPaletteProps {
  onCreateLink?: () => void;
}

export function CommandPalette({ onCreateLink }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Register Cmd+K shortcut
  useKeyboardShortcut(["meta+k", "ctrl+k"], () => setOpen(true), { priority: 100 });

  // Search for links when search changes
  useEffect(() => {
    async function searchLinks() {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setLinks([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/api/v1/links?search=${encodeURIComponent(debouncedSearch)}&limit=5`,
          { credentials: "include" }
        );

        if (response.ok) {
          const result = await response.json();
          setLinks(result.data || []);
        }
      } catch (error) {
        console.error("Failed to search links:", error);
      } finally {
        setLoading(false);
      }
    }

    searchLinks();
  }, [debouncedSearch]);

  const handleSelect = useCallback(
    (value: string) => {
      setOpen(false);
      setSearch("");

      // Handle navigation
      if (value.startsWith("/")) {
        router.push(value);
        return;
      }

      // Handle actions
      switch (value) {
        case "create-link":
          onCreateLink?.();
          break;
        case "search-links":
          router.push("/dashboard/links");
          // Focus search after navigation
          setTimeout(() => {
            const searchInput = document.querySelector<HTMLInputElement>(
              'input[placeholder*="Search"]'
            );
            searchInput?.focus();
          }, 100);
          break;
      }

      // Handle link actions
      if (value.startsWith("link:")) {
        const [, linkId, action] = value.split(":");
        const link = links.find((l) => l.id === linkId);
        if (!link) return;

        switch (action) {
          case "view":
            router.push(`/dashboard/links/${linkId}`);
            break;
          case "copy":
            navigator.clipboard.writeText(`go2.gg/${link.slug}`);
            toast.success("Link copied to clipboard");
            break;
          case "open":
            window.open(link.destinationUrl, "_blank");
            break;
        }
      }
    },
    [router, onCreateLink, links]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      showCloseButton={false}
    >
      <CommandInput
        placeholder="Search links, pages, or actions..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>{loading ? "Searching..." : "No results found."}</CommandEmpty>

        {/* Search Results */}
        {links.length > 0 && (
          <CommandGroup heading="Links">
            {links.map((link) => (
              <CommandItem
                key={link.id}
                value={`link:${link.id}:view`}
                onSelect={handleSelect}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">go2.gg/{link.slug}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {link.title || link.destinationUrl}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button
                    type="button"
                    className="p-1 hover:bg-accent rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(`go2.gg/${link.slug}`);
                      toast.success("Link copied");
                    }}
                    title="Copy link"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    className="p-1 hover:bg-accent rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(link.destinationUrl, "_blank");
                    }}
                    title="Open destination"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Quick Actions */}
        {!search && (
          <>
            <CommandGroup heading="Quick Actions">
              {quickActions.map((action) => (
                <CommandItem key={action.id} value={action.id} onSelect={handleSelect}>
                  <action.icon className="mr-2 h-4 w-4" />
                  <span>{action.label}</span>
                  {action.shortcut && (
                    <CommandShortcut>
                      <Kbd>{action.shortcut}</Kbd>
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            {/* Navigation */}
            <CommandGroup heading="Navigation">
              {navigationItems.map((item) => (
                <CommandItem key={item.href} value={item.href} onSelect={handleSelect}>
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <CommandShortcut>
                      <Kbd>{item.shortcut}</Kbd>
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Footer with keyboard hints */}
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Navigate</span>
          <Kbd>↑↓</Kbd>
          <span>Select</span>
          <Kbd>↵</Kbd>
          <span>Close</span>
          <Kbd>Esc</Kbd>
        </div>
        <div className="flex items-center gap-1">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </div>
      </div>
    </CommandDialog>
  );
}
