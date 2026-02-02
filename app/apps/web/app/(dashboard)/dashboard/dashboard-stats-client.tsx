"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Skeleton } from "@/components/ui/skeleton";
import { Link2, Globe, BarChart3, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardStats } from "@/hooks/use-queries";

interface DashboardStats {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
  customDomains: number;
  clicksToday: number;
  clicksTrend: number;
}

interface DashboardStatsClientProps {
  stats: DashboardStats; // Server-side fallback stats
}

// Safe number helper to guard against NaN/undefined
function safeNumber(value: number | undefined | null): number {
  if (value === undefined || value === null || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return value;
}

function formatNumber(num: number): string {
  const safe = safeNumber(num);
  if (safe >= 1000000) return `${(safe / 1000000).toFixed(1)}M`;
  if (safe >= 1000) return `${(safe / 1000).toFixed(1)}K`;
  return safe.toString();
}

export function DashboardStatsClient({ stats: serverStats }: DashboardStatsClientProps) {
  // Fetch fresh data client-side (server stats are fallback for SSR)
  const { data: clientStats, isLoading } = useDashboardStats();

  // Use client data if available, otherwise fall back to server data
  const stats = clientStats || serverStats;

  // Guard all stat values against NaN
  const safeStats = {
    totalLinks: safeNumber(stats.totalLinks),
    totalClicks: safeNumber(stats.totalClicks),
    activeLinks: safeNumber(stats.activeLinks),
    customDomains: safeNumber(stats.customDomains),
    clicksToday: safeNumber(stats.clicksToday),
    clicksTrend: safeNumber(stats.clicksTrend),
  };

  const statCards = [
    {
      title: "Total Links",
      value: safeStats.totalLinks,
      subtitle:
        safeStats.totalLinks === 0 ? (
          <a
            href="/dashboard/links"
            className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
          >
            Create your first link
            <ArrowUpRight className="h-3 w-3" />
          </a>
        ) : (
          <>
            <AnimatedCounter
              value={safeStats.activeLinks}
              className="text-primary font-medium"
              delay={800}
            />{" "}
            active
          </>
        ),
      icon: Link2,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      gradientFrom: "from-primary/10",
    },
    {
      title: "Total Clicks",
      value: safeStats.totalClicks,
      subtitle:
        safeStats.totalClicks === 0 ? "Share links to track clicks" : "Across all your links",
      icon: BarChart3,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
      gradientFrom: "from-secondary/10",
      formatValue: true,
    },
    {
      title: "Today's Clicks",
      value: safeStats.clicksToday,
      subtitle:
        safeStats.clicksToday === 0 && safeStats.clicksTrend === 0 ? (
          "No activity yet today"
        ) : (
          <span
            className={cn(
              "font-medium",
              safeStats.clicksTrend >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            {safeStats.clicksTrend > 0 && "+"}
            <AnimatedCounter value={safeStats.clicksTrend} delay={1000} />%
            <span className="text-muted-foreground font-normal"> from yesterday</span>
          </span>
        ),
      icon: safeStats.clicksTrend >= 0 ? TrendingUp : TrendingDown,
      iconBg: "bg-green-500/10",
      iconColor: "text-green-600 dark:text-green-400",
      gradientFrom: "from-green-500/10",
    },
    {
      title: "Custom Domains",
      value: safeStats.customDomains,
      subtitle: (
        <a
          href="/dashboard/domains"
          className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
        >
          {safeStats.customDomains === 0 ? "Add your domain" : "Manage domains"}
          <ArrowUpRight className="h-3 w-3" />
        </a>
      ),
      icon: Globe,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      gradientFrom: "from-primary/10",
    },
  ];

  // Show skeleton cards while loading (only on initial load with no server data)
  const showLoading = isLoading && safeStats.totalLinks === 0 && safeStats.totalClicks === 0;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;

        return (
          <Card
            key={card.title}
            className={cn(
              "relative overflow-hidden group animate-fade-in-up",
              `stagger-${index + 1}`
            )}
            style={{ animationFillMode: "forwards" }}
          >
            {/* Hover gradient accent */}
            <div
              className={cn(
                "absolute top-0 right-0 w-24 h-24 bg-gradient-to-br to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                card.gradientFrom
              )}
            />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-md",
                  card.iconBg,
                  card.iconColor
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {showLoading ? (
                <>
                  <Skeleton className="h-9 w-16 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </>
              ) : (
                <>
                  <div className="text-3xl font-extrabold">
                    {card.formatValue ? (
                      <AnimatedCounter
                        value={card.value}
                        formatFn={formatNumber}
                        delay={index * 100}
                        duration={1200}
                      />
                    ) : (
                      <AnimatedCounter value={card.value} delay={index * 100} duration={1200} />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
