"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Code,
  Copy,
  DollarSign,
  Link as LinkIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

interface ConversionGoal {
  id: string;
  name: string;
  type: string;
  urlPattern?: string;
  eventName?: string;
  attributionWindow: number;
  hasValue: boolean;
  defaultValue?: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

interface ConversionStats {
  totalConversions: number;
  totalRevenue: number;
  conversionRate: number;
  byGoal: Array<{
    goalId: string;
    goalName: string;
    conversions: number;
    revenue: number;
  }>;
  byLink: Array<{
    linkId: string;
    slug: string;
    domain: string;
    destinationUrl: string;
    conversions: number;
    revenue: number;
  }>;
  recentConversions: Array<{
    id: string;
    type: string;
    value?: number;
    createdAt: string;
    linkId: string;
  }>;
}

const GOAL_TYPES = [
  { value: "page_view", label: "Page View", icon: Activity },
  { value: "signup", label: "Sign Up", icon: Target },
  { value: "purchase", label: "Purchase", icon: DollarSign },
  { value: "lead", label: "Lead", icon: TrendingUp },
  { value: "download", label: "Download", icon: Target },
  { value: "custom", label: "Custom Event", icon: Code },
];

export function ConversionsClient() {
  const [goals, setGoals] = useState<ConversionGoal[]>([]);
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [trackingCodeDialogOpen, setTrackingCodeDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("signup");
  const [urlPattern, setUrlPattern] = useState("");
  const [eventName, setEventName] = useState("");
  const [hasValue, setHasValue] = useState(false);
  const [defaultValue, setDefaultValue] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  // Manage links state
  const [linksDialogOpen, setLinksDialogOpen] = useState(false);
  const [linksDialogGoalId, setLinksDialogGoalId] = useState<string | null>(null);
  const [linksDialogLoading, setLinksDialogLoading] = useState(false);
  const [allLinks, setAllLinks] = useState<
    Array<{ id: string; slug: string; domain: string; destinationUrl: string }>
  >([]);
  const [scopedLinkIds, setScopedLinkIds] = useState<Set<string>>(new Set());
  const [linkSearch, setLinkSearch] = useState("");

  // Stats filter state
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  // Per-link drilldown state
  const [linkDrilldownOpen, setLinkDrilldownOpen] = useState(false);
  const [linkDrilldownLoading, setLinkDrilldownLoading] = useState(false);
  const [linkDrilldownLinkId, setLinkDrilldownLinkId] = useState<string | null>(null);
  const [linkDrilldownData, setLinkDrilldownData] = useState<{
    stats: { totalConversions: number; totalValue: number };
    conversions: Array<{
      id: string;
      type: string;
      value: number | null;
      convertedAt: string;
      eventName: string | null;
      externalId: string | null;
    }>;
  } | null>(null);

  const fetchData = async (range: "7d" | "30d" | "90d" | "all" = dateRange) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (range !== "all") {
        const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
        const start = new Date();
        start.setUTCDate(start.getUTCDate() - days);
        params.set("startDate", start.toISOString());
        params.set("endDate", new Date().toISOString());
      }
      const statsUrl = `${API_URL}/api/v1/conversions/stats${
        params.toString() ? `?${params}` : ""
      }`;
      const [goalsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/conversions/goals`, { credentials: "include" }),
        fetch(statsUrl, { credentials: "include" }),
      ]);

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData.data || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }
    } catch (error) {
      console.error("Failed to fetch conversion data:", error);
      toast.error("Failed to load conversion data");
    } finally {
      setLoading(false);
    }
  };

  const openLinkDrilldown = async (linkId: string) => {
    setLinkDrilldownLinkId(linkId);
    setLinkDrilldownOpen(true);
    setLinkDrilldownLoading(true);
    setLinkDrilldownData(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/conversions/link/${linkId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load link conversions");
      const data = await res.json();
      setLinkDrilldownData(data.data);
    } catch (_error) {
      toast.error("Failed to load link conversions");
    } finally {
      setLinkDrilldownLoading(false);
    }
  };

  useEffect(() => {
    fetchData(dateRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const resetForm = () => {
    setName("");
    setType("signup");
    setUrlPattern("");
    setEventName("");
    setHasValue(false);
    setDefaultValue("");
    setIsActive(true);
    setEditingGoalId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setGoalDialogOpen(true);
  };

  const openEditDialog = (goal: ConversionGoal) => {
    setEditingGoalId(goal.id);
    setName(goal.name);
    setType(goal.type);
    setUrlPattern(goal.urlPattern ?? "");
    setEventName(goal.eventName ?? "");
    setHasValue(goal.hasValue);
    setDefaultValue(goal.defaultValue != null ? String(goal.defaultValue) : "");
    setIsActive(goal.isActive);
    setGoalDialogOpen(true);
  };

  const handleSaveGoal = async () => {
    if (!name.trim()) {
      toast.error("Please enter a goal name");
      return;
    }

    setFormLoading(true);
    try {
      const isEdit = editingGoalId !== null;
      const url = isEdit
        ? `${API_URL}/api/v1/conversions/goals/${editingGoalId}`
        : `${API_URL}/api/v1/conversions/goals`;
      const body: Record<string, unknown> = {
        name,
        type,
        urlPattern: urlPattern || undefined,
        eventName: eventName || undefined,
        hasValue,
        defaultValue: hasValue && defaultValue ? Number.parseInt(defaultValue, 10) : undefined,
      };
      if (isEdit) body.isActive = isActive;

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `Failed to ${isEdit ? "update" : "create"} goal`);
      }

      toast.success(`Conversion goal ${isEdit ? "updated" : "created"}`);
      setGoalDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save goal");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this conversion goal?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/conversions/goals/${goalId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete goal");
      }

      toast.success("Conversion goal deleted");
      fetchData();
    } catch (_error) {
      toast.error("Failed to delete goal");
    }
  };

  const openManageLinks = async (goalId: string) => {
    setLinksDialogGoalId(goalId);
    setLinksDialogOpen(true);
    setLinksDialogLoading(true);
    setLinkSearch("");
    try {
      const [linksRes, scopedRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/links?perPage=200`, { credentials: "include" }),
        fetch(`${API_URL}/api/v1/conversions/goals/${goalId}/links`, {
          credentials: "include",
        }),
      ]);
      if (linksRes.ok) {
        const data = await linksRes.json();
        const items = (data.data?.items ?? data.data ?? []) as Array<{
          id: string;
          slug: string;
          domain: string;
          destinationUrl: string;
        }>;
        setAllLinks(items);
      }
      if (scopedRes.ok) {
        const data = await scopedRes.json();
        setScopedLinkIds(new Set((data.data ?? []) as string[]));
      } else {
        setScopedLinkIds(new Set());
      }
    } catch (_error) {
      toast.error("Failed to load links");
    } finally {
      setLinksDialogLoading(false);
    }
  };

  const toggleScopedLink = (linkId: string) => {
    setScopedLinkIds((prev) => {
      const next = new Set(prev);
      if (next.has(linkId)) next.delete(linkId);
      else next.add(linkId);
      return next;
    });
  };

  const saveScopedLinks = async () => {
    if (!linksDialogGoalId) return;
    setLinksDialogLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/v1/conversions/goals/${linksDialogGoalId}/links`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ linkIds: [...scopedLinkIds] }),
        }
      );
      if (!response.ok) throw new Error("Failed to save link scope");
      toast.success(
        scopedLinkIds.size === 0
          ? "Goal now applies to all links"
          : `Goal scoped to ${scopedLinkIds.size} link${scopedLinkIds.size === 1 ? "" : "s"}`
      );
      setLinksDialogOpen(false);
    } catch (_error) {
      toast.error("Failed to save link scope");
    } finally {
      setLinksDialogLoading(false);
    }
  };

  const hostedSnippet = `<!-- Go2 Conversion Tracking -->
<script src="${API_URL}/api/v1/public/conversions/script.js" data-auto-track="true" async></script>`;

  const inlineSnippet = `<!-- Go2 Conversion Tracking (inline) -->
<script>
  (function() {
    var API = '${API_URL}/api/v1/public/conversions/track';
    var COOKIE = 'go2_tid';
    var PARAM = 'go2_ref';

    function getTrackingId() {
      var url = new URLSearchParams(window.location.search).get(PARAM);
      if (url) {
        document.cookie = COOKIE + '=' + url + ';max-age=' + (30*24*60*60) + ';path=/;SameSite=Lax';
        return url;
      }
      var m = document.cookie.match(new RegExp('(?:^|; )' + COOKIE + '=([^;]+)'));
      return m ? m[1] : null;
    }

    window.go2 = window.go2 || {};
    window.go2.track = function(type, data) {
      var trackingId = getTrackingId();
      if (!trackingId) return;
      var payload = Object.assign({ trackingId: trackingId, type: type }, data || {});
      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
    };
  })();
</script>`;

  const copyTrackingCode = () => {
    navigator.clipboard.writeText(hostedSnippet);
    toast.success("Tracking code copied to clipboard");
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-bold text-2xl">Conversions</h1>
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-2xl">Conversions</h1>
          <p className="text-muted-foreground">Track conversions and revenue from your links</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={dateRange}
            onValueChange={(v) => setDateRange(v as "7d" | "30d" | "90d" | "all")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setTrackingCodeDialogOpen(true)}>
            <Code className="mr-2 h-4 w-4" />
            Get Code
          </Button>
          <Dialog
            open={goalDialogOpen}
            onOpenChange={(open) => {
              setGoalDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingGoalId ? "Edit Conversion Goal" : "Create Conversion Goal"}
                </DialogTitle>
                <DialogDescription>Define what actions count as conversions</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Goal Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Newsletter Signup"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Conversion Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urlPattern">URL Pattern (optional)</Label>
                  <Input
                    id="urlPattern"
                    value={urlPattern}
                    onChange={(e) => setUrlPattern(e.target.value)}
                    placeholder="e.g., /thank-you*"
                  />
                  <p className="text-muted-foreground text-xs">
                    Track conversions when users land on matching URLs
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventName">Event Name (optional)</Label>
                  <Input
                    id="eventName"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g., user_registered"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Track Revenue</Label>
                    <p className="text-muted-foreground text-xs">
                      Record monetary value for this conversion
                    </p>
                  </div>
                  <Switch checked={hasValue} onCheckedChange={setHasValue} />
                </div>
                {hasValue && (
                  <div className="space-y-2">
                    <Label htmlFor="defaultValue">Default Value (cents)</Label>
                    <Input
                      id="defaultValue"
                      type="number"
                      value={defaultValue}
                      onChange={(e) => setDefaultValue(e.target.value)}
                      placeholder="e.g., 9900 for $99"
                    />
                  </div>
                )}
                {editingGoalId && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Active</Label>
                      <p className="text-muted-foreground text-xs">
                        Pause this goal to stop tracking new conversions
                      </p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveGoal} disabled={formLoading}>
                  {editingGoalId ? "Save Changes" : "Create Goal"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Conversions</CardDescription>
            <CardTitle className="text-3xl">
              {stats?.totalConversions.toLocaleString() ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(stats?.totalRevenue ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conversion Rate</CardDescription>
            <CardTitle className="text-3xl">
              {((stats?.conversionRate ?? 0) * 100).toFixed(2)}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Goals</CardDescription>
            <CardTitle className="text-3xl">{goals.filter((g) => g.isActive).length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">Conversion Goals</TabsTrigger>
          <TabsTrigger value="recent">Recent Conversions</TabsTrigger>
          <TabsTrigger value="byLink">By Link</TabsTrigger>
        </TabsList>

        <TabsContent value="goals" className="space-y-4">
          {goals.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-lg">No conversion goals yet</h3>
                <p className="mb-4 max-w-sm text-center text-muted-foreground">
                  Create goals to track specific user actions like signups, purchases, or downloads.
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <Card key={goal.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{goal.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {goal.type.replace("_", " ")}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(goal)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openManageLinks(goal.id)}>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Manage links
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant={goal.isActive ? "default" : "secondary"}>
                        {goal.isActive ? "Active" : "Paused"}
                      </Badge>
                      {goal.hasValue && (
                        <Badge variant="outline">
                          <DollarSign className="mr-1 h-3 w-3" />
                          Tracks Revenue
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent">
          {!stats?.recentConversions?.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-lg">No conversions yet</h3>
                <p className="max-w-sm text-center text-muted-foreground">
                  Conversions will appear here once users complete your goals.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {stats.recentConversions.map((conversion) => (
                    <div
                      key={conversion.id}
                      className="flex items-center justify-between border-b py-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium capitalize">
                          {conversion.type.replace("_", " ")}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {new Date(conversion.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {conversion.value && (
                        <Badge variant="outline">{formatCurrency(conversion.value)}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="byLink">
          {!stats?.byLink?.length ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <LinkIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-lg">No conversions by link yet</h3>
                <p className="max-w-sm text-center text-muted-foreground">
                  Once a link drives a conversion, it'll show up here with totals you can drill
                  into.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {stats.byLink.map((row) => (
                    <button
                      key={row.linkId}
                      type="button"
                      onClick={() => openLinkDrilldown(row.linkId)}
                      className="flex w-full items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                          {row.domain}/{row.slug}
                        </p>
                        <p className="truncate text-muted-foreground text-xs">
                          {row.destinationUrl}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <p className="font-medium text-sm">{row.conversions}</p>
                          <p className="text-muted-foreground text-xs">conversions</p>
                        </div>
                        {row.revenue > 0 && (
                          <Badge variant="outline">{formatCurrency(row.revenue)}</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Tracking Code Dialog */}
      <Dialog open={trackingCodeDialogOpen} onOpenChange={setTrackingCodeDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] sm:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tracking Code</DialogTitle>
            <DialogDescription>
              Add this code to your website to track conversions
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] min-w-0 space-y-4 overflow-y-auto">
            <p className="text-muted-foreground text-sm">
              Drop this one-liner into the &lt;head&gt; of every page you want to track. It captures
              the <code className="rounded bg-muted px-1">go2_ref</code> param Go2 appends to your
              redirect destination, persists it for 30 days, and exposes{" "}
              <code className="rounded bg-muted px-1">window.go2</code> with{" "}
              <code className="rounded bg-muted px-1">trackPageView()</code>,{" "}
              <code className="rounded bg-muted px-1">trackSignup()</code>,{" "}
              <code className="rounded bg-muted px-1">trackPurchase()</code>, and{" "}
              <code className="rounded bg-muted px-1">trackCustom()</code>.
            </p>
            <div className="min-w-0 max-w-full overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs sm:p-4 sm:text-sm">
              <pre className="whitespace-pre">{hostedSnippet}</pre>
            </div>
            <div className="min-w-0 space-y-2">
              <p className="font-medium text-sm">Example Usage:</p>
              <div className="min-w-0 max-w-full overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs sm:p-4 sm:text-sm">
                <pre className="whitespace-pre">{`// Track a signup
go2.trackSignup({ eventName: 'user_registered' });

// Track a purchase ($99 = pass dollars, the SDK converts to cents)
go2.trackPurchase(99, 'usd', 'order_123');

// Custom event
go2.trackCustom('checkout_started', { plan: 'pro' });`}</pre>
              </div>
            </div>
            <details className="group min-w-0 space-y-2">
              <summary className="cursor-pointer text-muted-foreground text-sm hover:text-foreground">
                Prefer a self-contained snippet? Use this inline version instead.
              </summary>
              <p className="text-muted-foreground text-xs">
                Same behavior, no external script — useful if your CSP blocks third-party scripts.
              </p>
              <div className="min-w-0 max-w-full overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs sm:p-4 sm:text-sm">
                <pre className="whitespace-pre">{inlineSnippet}</pre>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(inlineSnippet);
                  toast.success("Inline snippet copied to clipboard");
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy inline snippet
              </Button>
            </details>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingCodeDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={copyTrackingCode}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Links Dialog */}
      <Dialog open={linksDialogOpen} onOpenChange={setLinksDialogOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Manage scoped links</DialogTitle>
            <DialogDescription>
              Restrict this goal to specific links. Leave empty for the goal to apply to all of your
              links.
            </DialogDescription>
          </DialogHeader>
          <div className="min-w-0 space-y-3">
            <Input
              placeholder="Search links by slug or destination"
              value={linkSearch}
              onChange={(e) => setLinkSearch(e.target.value)}
            />
            <div className="max-h-[50vh] min-w-0 space-y-1 overflow-y-auto rounded-md border p-2">
              {linksDialogLoading && allLinks.length === 0 ? (
                <p className="py-6 text-center text-muted-foreground text-sm">Loading links…</p>
              ) : allLinks.length === 0 ? (
                <p className="py-6 text-center text-muted-foreground text-sm">
                  You don't have any links yet.
                </p>
              ) : (
                allLinks
                  .filter((link) => {
                    if (!linkSearch) return true;
                    const q = linkSearch.toLowerCase();
                    return (
                      link.slug.toLowerCase().includes(q) ||
                      link.destinationUrl?.toLowerCase().includes(q)
                    );
                  })
                  .map((link) => (
                    <label
                      key={link.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={scopedLinkIds.has(link.id)}
                        onChange={() => toggleScopedLink(link.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                          {link.domain}/{link.slug}
                        </p>
                        <p className="truncate text-muted-foreground text-xs">
                          {link.destinationUrl}
                        </p>
                      </div>
                    </label>
                  ))
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {scopedLinkIds.size === 0
                ? "Goal applies to all links."
                : `Goal scoped to ${scopedLinkIds.size} link${scopedLinkIds.size === 1 ? "" : "s"}.`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinksDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveScopedLinks} disabled={linksDialogLoading}>
              Save scope
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Per-link drilldown */}
      <Dialog open={linkDrilldownOpen} onOpenChange={setLinkDrilldownOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link conversions</DialogTitle>
            <DialogDescription>
              {linkDrilldownLinkId
                ? `Conversion history for ${
                    stats?.byLink.find((r) => r.linkId === linkDrilldownLinkId)
                      ? `${stats.byLink.find((r) => r.linkId === linkDrilldownLinkId)?.domain}/${
                          stats.byLink.find((r) => r.linkId === linkDrilldownLinkId)?.slug
                        }`
                      : "this link"
                  }`
                : "Conversion history"}
            </DialogDescription>
          </DialogHeader>
          <div className="min-w-0 space-y-3">
            {linkDrilldownLoading ? (
              <p className="py-6 text-center text-muted-foreground text-sm">Loading…</p>
            ) : !linkDrilldownData ? (
              <p className="py-6 text-center text-muted-foreground text-sm">No data.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total conversions</CardDescription>
                      <CardTitle className="text-2xl">
                        {linkDrilldownData.stats.totalConversions}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total revenue</CardDescription>
                      <CardTitle className="text-2xl">
                        {formatCurrency(linkDrilldownData.stats.totalValue)}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>
                {linkDrilldownData.conversions.length === 0 ? (
                  <p className="py-6 text-center text-muted-foreground text-sm">
                    No conversions yet for this link.
                  </p>
                ) : (
                  <div className="max-h-[40vh] min-w-0 space-y-1 overflow-y-auto rounded-md border">
                    {linkDrilldownData.conversions.map((conversion) => (
                      <div
                        key={conversion.id}
                        className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm capitalize">
                            {conversion.type.replace("_", " ")}
                            {conversion.eventName ? (
                              <span className="ml-2 text-muted-foreground text-xs">
                                {conversion.eventName}
                              </span>
                            ) : null}
                          </p>
                          <p className="truncate text-muted-foreground text-xs">
                            {new Date(conversion.convertedAt).toLocaleString()}
                            {conversion.externalId ? ` · ${conversion.externalId}` : ""}
                          </p>
                        </div>
                        {conversion.value != null && (
                          <Badge variant="outline">{formatCurrency(conversion.value)}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDrilldownOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
