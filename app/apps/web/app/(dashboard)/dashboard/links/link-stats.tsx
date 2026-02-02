"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, MousePointer, Globe, TrendingUp } from "lucide-react";
import { useLinkStats } from "@/hooks/use-queries";

export function LinkStats() {
  const { data: stats, isLoading: loading } = useLinkStats();

  const defaultStats = {
    totalLinks: 0,
    totalClicks: 0,
    clicksToday: 0,
    topCountry: null,
  };

  const displayStats = stats || defaultStats;

  const statCards = [
    {
      title: "Total Links",
      value: displayStats.totalLinks,
      icon: Link2,
      description: "Active short links",
    },
    {
      title: "Total Clicks",
      value: displayStats.totalClicks,
      icon: MousePointer,
      description: "All-time clicks",
    },
    {
      title: "Clicks Today",
      value: displayStats.clicksToday,
      icon: TrendingUp,
      description: "Last 24 hours",
    },
    {
      title: "Top Country",
      value: displayStats.topCountry ?? "—",
      icon: Globe,
      description: displayStats.topCountry ? "Most clicks from" : "No click data yet",
      isText: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : stat.isText ? (
                stat.value
              ) : (
                (stat.value as number).toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
