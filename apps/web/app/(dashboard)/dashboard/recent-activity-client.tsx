"use client";

import { Activity, ArrowUpRight, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLinks } from "@/hooks/use-queries";

interface RecentLink {
  id: string;
  shortUrl: string;
  clickCount: number;
  createdAt: string;
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function RecentActivityClient() {
  const { data, isLoading, error } = useLinks({ perPage: 5, sort: "created" });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    );
  }

  const recentLinks: RecentLink[] = (
    (data as { data?: RecentLink[] } | undefined)?.data ?? []
  ).slice(0, 5);

  if (error || recentLinks.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Activity className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p>{error ? "Couldn't load recent activity" : "No links yet"}</p>
          <a
            href="/dashboard/links"
            className="text-primary text-sm hover:underline"
          >
            {error ? "Open links" : "Create your first link"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentLinks.map((link) => (
        <a
          key={link.id ?? link.shortUrl}
          href={
            link.id
              ? `/dashboard/links/${link.id}`
              : `/dashboard/links?q=${encodeURIComponent(link.shortUrl)}`
          }
          className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 truncate font-medium text-sm">
              <span className="truncate">{link.shortUrl}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-xs">
              {formatRelativeTime(link.createdAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground text-sm tabular-nums">
            <BarChart3 className="h-3.5 w-3.5" />
            {(link.clickCount ?? 0).toLocaleString()}
          </div>
        </a>
      ))}
    </div>
  );
}
