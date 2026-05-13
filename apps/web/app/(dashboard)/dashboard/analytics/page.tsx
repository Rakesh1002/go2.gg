"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MousePointerClick,
  Users,
  Globe,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Link2,
  ExternalLink,
  BarChart3,
  Bot,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ChartViewSwitcher, type ChartViewType } from "@/components/analytics/chart-view-switcher";
import { AnimatedStat } from "@/components/analytics/animated-stat";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { DateRangeProvider, useDateRange } from "@/contexts/date-range-context";
import dynamic from "next/dynamic";

const WorldMap = dynamic(
  () => import("@/components/analytics/world-map").then((m) => m.WorldMap),
  { ssr: false, loading: () => <div className="h-[260px] animate-pulse rounded-md bg-muted/40" /> },
);

interface OverviewData {
  totalClicks: number;
  uniqueVisitors: number;
  topCountry: string | null;
  topDevice: string | null;
  clicksTrend: number;
}

interface ClickData {
  date: string;
  clicks: number;
}

interface CompareClickData extends ClickData {
  previous?: number;
}

interface GeoData {
  country: string;
  clicks: number;
}

interface DeviceData {
  devices: { device: string; clicks: number }[];
  browsers: { browser: string; clicks: number }[];
  os?: { os: string; clicks: number }[];
  matrix?: { browser: string; os: string; clicks: number }[];
}

interface ReferrerData {
  referrer: string;
  clicks: number;
}

interface TopLink {
  id: string;
  slug: string;
  destinationUrl: string;
  title: string | null;
  clicks: number;
}

const CHART_COLORS = [
  "oklch(0.62 0.22 25)", // Coral (brand primary)
  "oklch(0.7 0.16 45)", // Orange
  "oklch(0.6 0.16 150)", // Teal
  "oklch(0.75 0.14 85)", // Amber
  "oklch(0.55 0.12 240)", // Blue
];

const chartConfig = {
  clicks: {
    label: "Clicks",
    color: "oklch(0.62 0.22 25)", // Coral (brand)
  },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  return (
    <DateRangeProvider defaultPreset="last-30d">
      <AnalyticsPageInner />
    </DateRangeProvider>
  );
}

function AnalyticsPageInner() {
  const { legacyPeriod: period } = useDateRange();
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [clicksData, setClicksData] = useState<CompareClickData[]>([]);
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [referrerData, setReferrerData] = useState<ReferrerData[]>([]);
  const [topLinks, setTopLinks] = useState<TopLink[]>([]);
  const [compareEnabled, setCompareEnabled] = useState(false);
  // Chart view state with localStorage persistence
  const [chartView, setChartView] = useState<ChartViewType>(() => {
    if (typeof window === "undefined") return "area";
    const stored = localStorage.getItem("analytics-chart-view");
    if (stored && ["area", "bar", "line"].includes(stored)) {
      return stored as ChartViewType;
    }
    return "area";
  });

  // Save chart view preference when it changes
  const handleChartViewChange = (value: ChartViewType) => {
    setChartView(value);
    localStorage.setItem("analytics-chart-view", value);
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setErrored(false);
      const compareSuffix = compareEnabled ? "&compare=previous" : "";
      try {
        const [overviewRes, clicksRes, geoRes, devicesRes, referrersRes, topLinksRes] =
          await Promise.all([
            fetch(`${apiUrl}/api/v1/analytics/overview?period=${period}`, {
              credentials: "include",
            }),
            fetch(`${apiUrl}/api/v1/analytics/clicks?period=${period}${compareSuffix}`, {
              credentials: "include",
            }),
            fetch(`${apiUrl}/api/v1/analytics/geo?period=${period}`, { credentials: "include" }),
            fetch(`${apiUrl}/api/v1/analytics/devices?period=${period}`, {
              credentials: "include",
            }),
            fetch(`${apiUrl}/api/v1/analytics/referrers?period=${period}`, {
              credentials: "include",
            }),
            fetch(`${apiUrl}/api/v1/analytics/top-links?period=${period}`, {
              credentials: "include",
            }),
          ]);

        if (overviewRes.ok) {
          const data = await overviewRes.json();
          setOverview(data.data);
        }
        if (clicksRes.ok) {
          const data = await clicksRes.json();
          const current: ClickData[] = data.data?.data || [];
          const previous: ClickData[] = data.data?.previous || [];
          // Merge previous-period clicks into the same row by index so the
          // chart can render both lines on a shared x-axis.
          const merged: CompareClickData[] = current.map((row, i) => ({
            ...row,
            previous: previous[i]?.clicks,
          }));
          setClicksData(merged);
        }
        if (geoRes.ok) {
          const data = await geoRes.json();
          setGeoData(data.data?.data || []);
        }
        if (devicesRes.ok) {
          const data = await devicesRes.json();
          setDeviceData(data.data);
        }
        if (referrersRes.ok) {
          const data = await referrersRes.json();
          setReferrerData(data.data?.data || []);
        }
        if (topLinksRes.ok) {
          const data = await topLinksRes.json();
          setTopLinks(data.data?.data || []);
        }
        // If everything failed, surface an error rather than an empty state.
        if (
          !overviewRes.ok &&
          !clicksRes.ok &&
          !geoRes.ok &&
          !devicesRes.ok &&
          !referrersRes.ok &&
          !topLinksRes.ok
        ) {
          setErrored(true);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        setErrored(true);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [period, apiUrl, compareEnabled]);

  const hasData = overview && overview.totalClicks > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Track your link performance and audience insights.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-muted-foreground text-xs">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-muted-foreground/40"
              checked={compareEnabled}
              onChange={(e) => setCompareEnabled(e.target.checked)}
            />
            Compare to previous period
          </label>
          <DateRangePicker />
        </div>
      </div>

      {/* Agent attribution callout */}
      <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-0.5">
            <p className="font-medium text-sm">Tracking links for an AI agent?</p>
            <p className="text-muted-foreground text-xs">
              See per-run attribution by agent_id, agent_run_id, and tool call.
            </p>
          </div>
        </div>
        <Link href="/dashboard/agent-runs">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            Open agent runs
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <AnalyticsSkeleton />
      ) : errored ? (
        <ErrorState />
      ) : !hasData ? (
        <EmptyState />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Total Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <AnimatedStat
                  value={overview?.totalClicks ?? 0}
                  className="font-bold text-2xl"
                />
                <div className="flex items-center gap-1 text-xs">
                  {overview?.clicksTrend !== undefined && overview.clicksTrend !== 0 ? (
                    <>
                      {overview.clicksTrend > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span
                        className={overview.clicksTrend > 0 ? "text-green-600" : "text-red-600"}
                      >
                        {overview.clicksTrend > 0 ? "+" : ""}
                        {overview.clicksTrend}%
                      </span>
                      <span className="text-muted-foreground">vs previous period</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">No change</span>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Unique Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <AnimatedStat
                  value={overview?.uniqueVisitors ?? 0}
                  className="font-bold text-2xl"
                />
                <p className="text-muted-foreground text-xs">Based on IP address</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Top Country</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{overview?.topCountry || "—"}</div>
                <p className="text-muted-foreground text-xs">Most clicks from</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Top Device</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl capitalize">{overview?.topDevice || "—"}</div>
                <p className="text-muted-foreground text-xs">Most used device</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Clicks Over Time */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Clicks Over Time</CardTitle>
                  <CardDescription>Daily click activity for your links</CardDescription>
                </div>
                <ChartViewSwitcher value={chartView} onChange={handleChartViewChange} />
              </CardHeader>
              <CardContent>
                {clicksData.length === 0 || clicksData.every((d) => d.clicks === 0) ? (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                    No click activity in this period yet
                  </div>
                ) : null}
                {clicksData.length > 0 && clicksData.some((d) => d.clicks > 0) && chartView === "area" && (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <AreaChart
                      data={clicksData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="fillClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.62 0.22 25)" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="oklch(0.62 0.22 25)" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      {compareEnabled && (
                        <Area
                          type="monotone"
                          dataKey="previous"
                          stroke="oklch(0.6 0.04 250)"
                          fill="oklch(0.6 0.04 250 / 0.15)"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          name="Previous period"
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        stroke="oklch(0.62 0.22 25)"
                        fill="url(#fillClicks)"
                        strokeWidth={2}
                        name="Current period"
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
                {clicksData.length > 0 && clicksData.some((d) => d.clicks > 0) && chartView === "bar" && (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart data={clicksData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="clicks" fill="oklch(0.62 0.22 25)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
                {clicksData.length > 0 && clicksData.some((d) => d.clicks > 0) && chartView === "line" && (
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <RechartsLineChart
                      data={clicksData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      {compareEnabled && (
                        <Line
                          type="monotone"
                          dataKey="previous"
                          stroke="oklch(0.6 0.04 250)"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          dot={false}
                          name="Previous period"
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="clicks"
                        stroke="oklch(0.62 0.22 25)"
                        strokeWidth={2}
                        dot={{ fill: "oklch(0.62 0.22 25)", strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5 }}
                        name="Current period"
                      />
                    </RechartsLineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Geographic Distribution — world map + top-5 list */}
            <Card>
              <CardHeader>
                <CardTitle>Geographic distribution</CardTitle>
                <CardDescription>Where your clicks come from</CardDescription>
              </CardHeader>
              <CardContent>
                {geoData.length > 0 ? (
                  <div className="space-y-4">
                    <WorldMap
                      data={geoData.map((d) => ({ country: d.country, clicks: d.clicks }))}
                    />
                    <div className="space-y-2 pt-2">
                      {geoData.slice(0, 5).map((item, index) => {
                        const maxClicks = geoData[0]?.clicks || 1;
                        const percentage = Math.round((item.clicks / maxClicks) * 100);
                        return (
                          <div key={item.country} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{item.country}</span>
                              <span className="text-muted-foreground">
                                {item.clicks.toLocaleString()}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground text-sm">
                    No geographic data yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Device Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>How visitors access your links</CardDescription>
              </CardHeader>
              <CardContent>
                {deviceData?.devices && deviceData.devices.length > 0 ? (
                  <div className="flex items-center justify-center">
                    <ChartContainer config={chartConfig} className="h-[200px] w-[200px]">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          data={deviceData.devices}
                          dataKey="clicks"
                          nameKey="device"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                        >
                          {deviceData.devices.map((item, index) => (
                            <Cell
                              key={`cell-${item.device}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                    <div className="ml-4 space-y-2">
                      {deviceData.devices.map((item, index) => (
                        <div key={item.device} className="flex items-center gap-2 text-sm">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                          />
                          <span className="capitalize">{item.device}</span>
                          <span className="text-muted-foreground">({item.clicks})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground text-sm">
                    No device data yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Live clicks (polls every 5s) */}
          <LiveClicksCard apiUrl={apiUrl} />

          {/* Browser × OS Matrix */}
          {deviceData?.matrix && deviceData.matrix.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Browser × OS</CardTitle>
                <CardDescription>
                  Top browser/OS combinations driving clicks. Useful for spotting where to invest
                  in cross-browser polish.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BrowserOsMatrix data={deviceData.matrix} />
              </CardContent>
            </Card>
          )}

          {/* Bottom Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Referrers */}
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where your visitors come from</CardDescription>
              </CardHeader>
              <CardContent>
                {referrerData.length > 0 ? (
                  <div className="space-y-4">
                    {referrerData.slice(0, 5).map((item) => (
                      <div key={item.referrer} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{item.referrer}</span>
                        </div>
                        <span className="text-muted-foreground text-sm">
                          {item.clicks.toLocaleString()} clicks
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground text-sm">
                    No referrer data yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Top Links */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Links</CardTitle>
                <CardDescription>Your most clicked links this period</CardDescription>
              </CardHeader>
              <CardContent>
                {topLinks.length > 0 ? (
                  <div className="space-y-2">
                    {topLinks.map((link) => (
                      <a
                        key={link.id}
                        href={`/dashboard/links/${link.id}`}
                        className="-mx-2 flex items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-sm">/{link.slug}</p>
                            <p className="truncate text-muted-foreground text-xs">
                              {link.destinationUrl}
                            </p>
                          </div>
                        </div>
                        <span className="ml-2 shrink-0 font-medium text-sm tabular-nums">
                          {link.clicks.toLocaleString()}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground text-sm">No link data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

interface RecentClick {
  id: string;
  linkId: string;
  slug: string | null;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  referrer: string | null;
  isBot: boolean | null;
  isUnique: boolean | null;
  agentId: string | null;
  timestamp: string;
}

function LiveClicksCard({ apiUrl }: { apiUrl: string }) {
  const [clicks, setClicks] = useState<RecentClick[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    let cancelled = false;
    let lastTimestamp: string | undefined;

    async function poll() {
      try {
        const url = lastTimestamp
          ? `${apiUrl}/api/v1/analytics/recent?since=${encodeURIComponent(lastTimestamp)}&limit=20`
          : `${apiUrl}/api/v1/analytics/recent?limit=20`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok || cancelled) return;
        const body = await res.json();
        const rows: RecentClick[] = body.data?.data || body.data || [];
        if (rows.length === 0) return;
        // Keep newest first, cap to 30 rows.
        setClicks((prev) => {
          const next = [...rows, ...prev];
          const seen = new Set<string>();
          const unique = next.filter((c) => {
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
          });
          return unique.slice(0, 30);
        });
        lastTimestamp = rows[0]?.timestamp;
      } catch {
        // swallow — next tick will retry
      }
    }

    // Prime then poll every 5s.
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [apiUrl, paused]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${paused ? "bg-muted-foreground" : "animate-pulse bg-green-500"}`}
            />
            Live clicks
          </CardTitle>
          <CardDescription>Refreshes every 5s. Last 30 events.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setPaused((p) => !p)}>
          {paused ? "Resume" : "Pause"}
        </Button>
      </CardHeader>
      <CardContent>
        {clicks.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            Waiting for clicks…
          </p>
        ) : (
          <div className="max-h-[280px] space-y-1 overflow-y-auto font-mono text-xs">
            {clicks.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 border-muted/40 border-b py-1 last:border-0"
              >
                <span className="w-20 shrink-0 text-muted-foreground">
                  {new Date(c.timestamp).toLocaleTimeString()}
                </span>
                <span className="w-24 shrink-0 truncate">/{c.slug ?? "?"}</span>
                <span className="w-20 shrink-0 truncate text-muted-foreground">
                  {c.country ?? "—"}
                </span>
                <span className="w-20 shrink-0 truncate text-muted-foreground">
                  {c.device ?? "—"}
                </span>
                <span className="flex-1 truncate text-muted-foreground">
                  {c.referrer ?? "direct"}
                </span>
                {c.agentId ? (
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                    {c.agentId}
                  </span>
                ) : null}
                {c.isBot ? (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    bot
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BrowserOsMatrix({ data }: { data: { browser: string; os: string; clicks: number }[] }) {
  // Pivot the flat (browser, os, clicks) rows into a [browser][os] map so we
  // can render an actual matrix. Browsers across columns, OS down rows.
  const browsers = Array.from(new Set(data.map((d) => d.browser))).slice(0, 8);
  const oses = Array.from(new Set(data.map((d) => d.os))).slice(0, 8);
  const totals = new Map<string, number>();
  let max = 0;
  for (const row of data) {
    const key = `${row.browser}::${row.os}`;
    totals.set(key, row.clicks);
    if (row.clicks > max) max = row.clicks;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1.5 text-left font-medium text-muted-foreground text-xs">
              OS \ Browser
            </th>
            {browsers.map((b) => (
              <th
                key={b}
                className="px-2 py-1.5 text-center font-medium text-muted-foreground text-xs"
              >
                {b}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {oses.map((os) => (
            <tr key={os} className="border-t border-muted/40">
              <td className="px-2 py-1.5 font-medium">{os}</td>
              {browsers.map((b) => {
                const clicks = totals.get(`${b}::${os}`) ?? 0;
                const intensity = max > 0 ? clicks / max : 0;
                return (
                  <td
                    key={`${os}-${b}`}
                    className="px-2 py-1.5 text-center tabular-nums"
                    style={{
                      backgroundColor:
                        clicks > 0 ? `oklch(0.62 0.22 25 / ${0.08 + intensity * 0.4})` : undefined,
                    }}
                  >
                    {clicks > 0 ? clicks.toLocaleString() : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4"].map((id) => (
          <Card key={id}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-semibold text-lg">Couldn&apos;t load analytics</h3>
        <p className="mb-6 max-w-sm text-muted-foreground">
          We couldn&apos;t fetch your analytics right now. Check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
          type="button"
        >
          Retry
        </button>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-semibold text-lg">No analytics data yet</h3>
        <p className="mb-6 max-w-sm text-muted-foreground">
          Create and share some links to start seeing click analytics and audience insights here.
        </p>
        <a
          href="/dashboard/links"
          className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
        >
          <Link2 className="h-4 w-4" />
          Create your first link
        </a>
      </CardContent>
    </Card>
  );
}
