"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import {
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
  Bot,
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

interface AgentRun {
  agentId: string | null;
  agentRunId: string | null;
  clicks: number;
  lastClickAt: string;
}

const AGENT_EMOJI: Record<string, string> = {
  "claude-code": "🤖",
  cursor: "⚡",
  "openai-assistants": "🧠",
  langchain: "🦜",
  mastra: "🪄",
  "vercel-ai-sdk": "▲",
  "workers-ai": "✨",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

// Navigation items
const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "G D" },
  { href: "/dashboard/links", label: "Links", icon: Link2, shortcut: "G L" },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, shortcut: "G A" },
  { href: "/dashboard/agent-runs", label: "Agent Runs", icon: Bot, shortcut: "G R" },
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
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const recentLinksRef = useRef<Link[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  // Lazily prefetch the user's most recent links the first time the palette
  // opens. Drives an in-memory Fuse index for sub-frame fuzzy matching.
  useEffect(() => {
    if (!open || recentLinksRef.current.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/links?limit=200`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { data?: Link[] };
        if (!cancelled) recentLinksRef.current = json.data ?? [];
      } catch {
        // silent — we'll still have API fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const fuse = useMemo(
    () =>
      new Fuse<Link>(recentLinksRef.current, {
        keys: ["slug", "destinationUrl", "title"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    // Re-build when the prefetched list changes (length is a cheap proxy).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recentLinksRef.current.length, open],
  );

  // Register Cmd+K shortcut
  useKeyboardShortcut(["meta+k", "ctrl+k"], () => setOpen(true), { priority: 100 });

  // Lazily fetch top agent runs the first time the palette opens.
  useEffect(() => {
    if (!open || agentRuns.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/v1/agent-attribution/runs?limit=8`,
          { credentials: "include" },
        );
        if (!res.ok) return;
        const json = (await res.json()) as { data?: { runs?: AgentRun[] } };
        if (!cancelled) setAgentRuns(json.data?.runs ?? []);
      } catch {
        // silent — agent attribution is opt-in
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, agentRuns.length]);

  // Instant local fuzzy search — runs as the user types, no debounce.
  useEffect(() => {
    if (!search) {
      setLinks([]);
      return;
    }
    const local = fuse
      .search(search, { limit: 5 })
      .map((r) => r.item)
      // Avoid showing partial junk for single-char queries
      .filter(() => search.length >= 1);
    if (local.length > 0) {
      setLinks(local);
      setLoading(false);
    }
  }, [search, fuse]);

  // API fallback — only fires when local index produced too few results AND
  // the query is meaningful (>=2 chars, debounced).
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return;
    const local = fuse.search(debouncedSearch, { limit: 5 });
    if (local.length >= 3) return; // local is enough
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/api/v1/links?search=${encodeURIComponent(debouncedSearch)}&limit=5`,
          { credentials: "include" },
        );
        if (!response.ok || cancelled) return;
        const result = (await response.json()) as { data?: Link[] };
        if (!cancelled) setLinks(result.data ?? []);
      } catch (error) {
        if (!cancelled) console.error("Failed to search links:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, fuse]);

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

      // Handle agent-run jumps
      if (value.startsWith("agent-run:")) {
        const runId = value.slice("agent-run:".length);
        router.push(`/dashboard/agent-runs?runId=${encodeURIComponent(runId)}`);
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
                <div className="flex min-w-0 items-center gap-2">
                  <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">go2.gg/{link.slug}</p>
                    <p className="truncate text-muted-foreground text-xs">
                      {link.title || link.destinationUrl}
                    </p>
                  </div>
                </div>
                <div className="ml-2 flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-accent"
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
                    className="rounded p-1 hover:bg-accent"
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

            {/* Recent agent runs */}
            {agentRuns.length > 0 && (
              <>
                <CommandGroup heading="Jump to agent run">
                  {agentRuns.map((run) => {
                    const emoji = run.agentId
                      ? (AGENT_EMOJI[run.agentId] ?? "🤖")
                      : "🤖";
                    return (
                      <CommandItem
                        key={`${run.agentId}-${run.agentRunId}`}
                        value={`agent-run:${run.agentRunId ?? ""}`}
                        onSelect={handleSelect}
                      >
                        <span className="mr-2 text-base leading-none">{emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">
                            {run.agentId ?? "unknown agent"}
                          </p>
                          <p className="truncate font-mono text-muted-foreground text-xs">
                            {run.agentRunId ?? "—"}
                          </p>
                        </div>
                        <span className="ml-2 shrink-0 text-muted-foreground text-xs">
                          {run.clicks.toLocaleString()} clicks
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

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
      <div className="flex items-center justify-between border-t px-3 py-2 text-muted-foreground text-xs">
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
