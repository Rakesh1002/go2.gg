"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/ui/copy-button";
import {
  ArrowLeft,
  ExternalLink,
  MousePointer,
  Globe,
  Monitor,
  Smartphone,
  Clock,
  Lock,
  QrCode,
  Pencil,
  BarChart3,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const WorldMap = dynamic(
  () => import("@/components/analytics/world-map").then((m) => m.WorldMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] animate-pulse rounded-md bg-muted/40" />
    ),
  },
);

interface LinkData {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  slug: string;
  domain: string;
  title?: string;
  clickCount: number;
  createdAt: string;
  expiresAt?: string;
  hasPassword: boolean;
  tags: string[];
}

interface AnalyticsData {
  totalClicks: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  topCountries: Array<{ country: string; clicks: number }>;
  topDevices: Array<{ device: string; clicks: number }>;
  topBrowsers: Array<{ browser: string; clicks: number }>;
  clicksByDate: Array<{ date: string; clicks: number }>;
}

interface LinkAnalyticsClientProps {
  linkId: string;
}

export function LinkAnalyticsClient({ linkId }: LinkAnalyticsClientProps) {
  const router = useRouter();
  const [link, setLink] = useState<LinkData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

        // Fetch link data
        const linkResponse = await fetch(`${apiUrl}/api/v1/links/${linkId}`, {
          credentials: "include",
        });

        if (!linkResponse.ok) {
          if (linkResponse.status === 404) {
            setError("Link not found");
          } else {
            throw new Error("Failed to fetch link");
          }
          return;
        }

        const linkResult = await linkResponse.json();
        setLink(linkResult.data);

        // Fetch analytics data
        const analyticsResponse = await fetch(`${apiUrl}/api/v1/links/${linkId}/analytics`, {
          credentials: "include",
        });

        if (analyticsResponse.ok) {
          const analyticsResult = await analyticsResponse.json();
          setAnalytics(analyticsResult.data);
        } else {
          // Analytics might not be available, that's okay
          setAnalytics({
            totalClicks: linkResult.data.clickCount || 0,
            clicksToday: 0,
            clicksThisWeek: 0,
            clicksThisMonth: 0,
            topCountries: [],
            topDevices: [],
            topBrowsers: [],
            clicksByDate: [],
          });
        }
      } catch (err) {
        console.error("Error fetching link data:", err);
        setError("Failed to load link data");
        toast.error("Failed to load link data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [linkId]);

  if (loading) {
    return <LinkAnalyticsSkeleton />;
  }

  if (error || !link) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg">{error || "Link not found"}</h3>
        <p className="mb-4 text-muted-foreground">
          The link you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button onClick={() => router.push("/dashboard/links")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Links
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/links")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-2xl">{link.title || link.slug}</h1>
              {link.hasPassword && (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Protected
                </Badge>
              )}
              {link.expiresAt && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Expires {formatDistanceToNow(new Date(link.expiresAt), { addSuffix: true })}
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <a
                href={link.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {link.shortUrl}
              </a>
              <CopyButton value={link.shortUrl} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/links/${linkId}/qr`}>
              <QrCode className="mr-2 h-4 w-4" />
              QR Code
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/links/${linkId}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Destination URL */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground text-sm">Redirects to:</span>
            <a
              href={link.destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sm hover:underline"
            >
              {link.destinationUrl}
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Clicks"
          value={analytics?.totalClicks || link.clickCount}
          icon={MousePointer}
          accent="primary"
        />
        <StatsCard
          title="Today"
          value={analytics?.clicksToday || 0}
          icon={Calendar}
          accent="green"
        />
        <StatsCard
          title="This Week"
          value={analytics?.clicksThisWeek || 0}
          icon={TrendingUp}
          accent="blue"
        />
        <StatsCard
          title="This Month"
          value={analytics?.clicksThisMonth || 0}
          icon={BarChart3}
          accent="violet"
        />
      </div>

      {/* Geographic Distribution — full-width card with the world map */}
      {analytics?.topCountries && analytics.topCountries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              Geographic distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <WorldMap
              data={analytics.topCountries.map((c) => ({
                country: c.country,
                clicks: c.clicks,
              }))}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {analytics.topCountries.slice(0, 6).map((item) => {
                const max = analytics.topCountries[0]?.clicks || 1;
                const pct = Math.round((item.clicks / max) * 100);
                return (
                  <div key={item.country} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.country}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {item.clicks.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Countries — kept as compact list when map is hidden (no data) */}
        {!analytics?.topCountries?.length && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4" />
                Top Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="py-4 text-center text-muted-foreground text-sm">
                No country data yet
              </p>
            </CardContent>
          </Card>
        )}

        {/* Top Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4" />
              Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.topDevices && analytics.topDevices.length > 0 ? (
              <div className="space-y-3">
                {analytics.topDevices.slice(0, 5).map((item) => (
                  <div key={item.device} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.device.toLowerCase().includes("mobile") ? (
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{item.device}</span>
                    </div>
                    <span className="text-sm tabular-nums">{item.clicks}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-muted-foreground text-sm">No device data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top Browsers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Monitor className="h-4 w-4" />
              Browsers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.topBrowsers && analytics.topBrowsers.length > 0 ? (
              <div className="space-y-3">
                {analytics.topBrowsers.slice(0, 5).map((item) => (
                  <div key={item.browser} className="flex items-center justify-between">
                    <span className="font-medium text-sm">{item.browser}</span>
                    <span className="text-sm tabular-nums">{item.clicks}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-muted-foreground text-sm">No browser data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Created date */}
      <p className="text-center text-muted-foreground text-sm">
        Created {format(new Date(link.createdAt), "MMMM d, yyyy 'at' h:mm a")}
      </p>
    </div>
  );
}

type Accent = "primary" | "green" | "blue" | "violet";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: Accent;
}

const ACCENT_STYLES: Record<Accent, { bg: string; text: string; ring: string }> = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    ring: "from-primary/10",
  },
  green: {
    bg: "bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    ring: "from-green-500/10",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    ring: "from-blue-500/10",
  },
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    ring: "from-violet-500/10",
  },
};

function StatsCard({ title, value, icon: Icon, accent = "primary" }: StatsCardProps) {
  const a = ACCENT_STYLES[accent];
  return (
    <Card className="group relative overflow-hidden">
      <div
        className={cn(
          "absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-gradient-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100",
          a.ring,
        )}
      />
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <p className="font-bold text-2xl tabular-nums">{value.toLocaleString()}</p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
              a.bg,
              a.text,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LinkAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-6 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(5)].map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
