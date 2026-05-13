"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useFolderAnalytics } from "@/hooks/use-queries";
import { ArrowLeft, Folder, Globe, Link2, MousePointer, Smartphone, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Period = "7d" | "30d" | "90d";

export function FolderDetailClient({ folderId }: { folderId: string }) {
  const [period, setPeriod] = useState<Period>("30d");
  const { data, isLoading, error } = useFolderAnalytics(folderId, period);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Failed to load folder.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/dashboard/folders">Back to folders</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { folder, totalClicks, uniqueVisitors, topCountry, topDevice, topLinks } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/folders" aria-label="Back to folders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Folder className="h-6 w-6" style={{ color: folder.color }} />
          <div>
            <h1 className="font-semibold text-2xl">{folder.name}</h1>
            <p className="text-muted-foreground text-sm">
              {folder.linkCount} {folder.linkCount === 1 ? "link" : "links"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild variant="outline">
            <Link href={`/dashboard/links?folder=${folder.id}`}>
              <Link2 className="mr-2 h-4 w-4" />
              View links
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={<MousePointer className="h-4 w-4" />} label="Clicks" value={totalClicks} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Unique" value={uniqueVisitors} />
        <StatCard
          icon={<Globe className="h-4 w-4" />}
          label="Top country"
          value={topCountry ?? "—"}
        />
        <StatCard
          icon={<Smartphone className="h-4 w-4" />}
          label="Top device"
          value={topDevice ?? "—"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top links</CardTitle>
        </CardHeader>
        <CardContent>
          {topLinks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No clicks recorded in this period yet.</p>
          ) : (
            <ul className="divide-y">
              {topLinks.map((link) => (
                <li key={link.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/links/${link.id}`}
                      className="block truncate font-medium hover:underline"
                    >
                      {link.title || link.slug || link.id}
                    </Link>
                    {link.slug && link.title && (
                      <p className="truncate text-muted-foreground text-xs">/{link.slug}</p>
                    )}
                  </div>
                  <span className="ml-4 shrink-0 tabular-nums">{link.clicks.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          {icon}
          {label}
        </div>
        <div className="mt-2 font-semibold text-2xl tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
      </CardContent>
    </Card>
  );
}
