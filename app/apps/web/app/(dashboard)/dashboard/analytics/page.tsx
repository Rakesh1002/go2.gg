"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
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

interface GeoData {
  country: string;
  clicks: number;
}

interface DeviceData {
  devices: { device: string; clicks: number }[];
  browsers: { browser: string; clicks: number }[];
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
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [clicksData, setClicksData] = useState<ClickData[]>([]);
  const [geoData, setGeoData] = useState<GeoData[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [referrerData, setReferrerData] = useState<ReferrerData[]>([]);
  const [topLinks, setTopLinks] = useState<TopLink[]>([]);
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
      try {
        const [overviewRes, clicksRes, geoRes, devicesRes, referrersRes, topLinksRes] =
          await Promise.all([
            fetch(`${apiUrl}/api/v1/analytics/overview?period=${period}`, {
              credentials: "include",
            }),
            fetch(`${apiUrl}/api/v1/analytics/clicks?period=${period}`, { credentials: "include" }),
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
          setClicksData(data.data?.data || []);
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
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [period, apiUrl]);

  const hasData = overview && overview.totalClicks > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Track your link performance and audience insights.
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <AnalyticsSkeleton />
      ) : !hasData ? (
        <EmptyState />
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.totalClicks.toLocaleString()}</div>
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
                <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overview?.uniqueVisitors.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Based on IP address</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Country</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.topCountry || "—"}</div>
                <p className="text-xs text-muted-foreground">Most clicks from</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Device</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{overview?.topDevice || "—"}</div>
                <p className="text-xs text-muted-foreground">Most used device</p>
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
                {chartView === "area" && (
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
                      <Area
                        type="monotone"
                        dataKey="clicks"
                        stroke="oklch(0.62 0.22 25)"
                        fill="url(#fillClicks)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
                {chartView === "bar" && (
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
                {chartView === "line" && (
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
                      <Line
                        type="monotone"
                        dataKey="clicks"
                        stroke="oklch(0.62 0.22 25)"
                        strokeWidth={2}
                        dot={{ fill: "oklch(0.62 0.22 25)", strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </RechartsLineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
                <CardDescription>Where your clicks come from</CardDescription>
              </CardHeader>
              <CardContent>
                {geoData.length > 0 ? (
                  <div className="space-y-4">
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
                          <div className="h-2 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full transition-all"
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
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
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
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No device data yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

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
                          <span className="text-sm font-medium">{item.referrer}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {item.clicks.toLocaleString()} clicks
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
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
                  <div className="space-y-4">
                    {topLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">/{link.slug}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {link.destinationUrl}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-medium ml-2">
                          {link.clicks.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No link data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
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
              <Skeleton className="h-8 w-20 mb-2" />
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

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <BarChart3 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No analytics data yet</h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          Create and share some links to start seeing click analytics and audience insights here.
        </p>
        <a
          href="/dashboard/links"
          className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
        >
          <Link2 className="h-4 w-4" />
          Create your first link
        </a>
      </CardContent>
    </Card>
  );
}
