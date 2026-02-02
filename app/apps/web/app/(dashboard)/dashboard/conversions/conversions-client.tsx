"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Target,
  TrendingUp,
  DollarSign,
  Activity,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Code,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [trackingCodeDialogOpen, setTrackingCodeDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("signup");
  const [urlPattern, setUrlPattern] = useState("");
  const [eventName, setEventName] = useState("");
  const [hasValue, setHasValue] = useState(false);
  const [defaultValue, setDefaultValue] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [goalsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/conversions/goals`, { credentials: "include" }),
        fetch(`${API_URL}/api/v1/conversions/stats`, { credentials: "include" }),
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

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setName("");
    setType("signup");
    setUrlPattern("");
    setEventName("");
    setHasValue(false);
    setDefaultValue("");
  };

  const handleCreateGoal = async () => {
    if (!name.trim()) {
      toast.error("Please enter a goal name");
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/conversions/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          type,
          urlPattern: urlPattern || undefined,
          eventName: eventName || undefined,
          hasValue,
          defaultValue: hasValue && defaultValue ? parseInt(defaultValue, 10) : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to create goal");
      }

      toast.success("Conversion goal created");
      setCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create goal");
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
    } catch (error) {
      toast.error("Failed to delete goal");
    }
  };

  const copyTrackingCode = () => {
    const code = `<!-- Go2 Conversion Tracking -->
<script>
  (function() {
    var go2 = window.go2 = window.go2 || {};
    go2.track = function(type, data) {
      var payload = Object.assign({ type: type }, data || {});
      fetch('${API_URL}/api/v1/public/conversions/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    };
  })();
</script>

<!-- Track a conversion -->
<script>
  // Example: Track a signup
  go2.track('signup', { eventName: 'user_registered' });
  
  // Example: Track a purchase with value
  go2.track('purchase', { 
    value: 9900, // Amount in cents
    currency: 'usd',
    externalId: 'order_123'
  });
</script>`;

    navigator.clipboard.writeText(code);
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
        <h1 className="text-2xl font-bold">Conversions</h1>
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conversions</h1>
          <p className="text-muted-foreground">Track conversions and revenue from your links</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTrackingCodeDialogOpen(true)}>
            <Code className="h-4 w-4 mr-2" />
            Get Code
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Conversion Goal</DialogTitle>
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
                  <p className="text-xs text-muted-foreground">
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
                    <p className="text-xs text-muted-foreground">
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGoal} disabled={formLoading}>
                  Create Goal
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
        </TabsList>

        <TabsContent value="goals" className="space-y-4">
          {goals.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No conversion goals yet</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-sm">
                  Create goals to track specific user actions like signups, purchases, or downloads.
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
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
                          <DropdownMenuItem>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
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
                          <DollarSign className="h-3 w-3 mr-1" />
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
                <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No conversions yet</h3>
                <p className="text-muted-foreground text-center max-w-sm">
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
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="font-medium capitalize">
                          {conversion.type.replace("_", " ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
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
      </Tabs>

      {/* Tracking Code Dialog */}
      <Dialog open={trackingCodeDialogOpen} onOpenChange={setTrackingCodeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tracking Code</DialogTitle>
            <DialogDescription>
              Add this code to your website to track conversions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`<!-- Go2 Conversion Tracking -->
<script>
  (function() {
    var go2 = window.go2 = window.go2 || {};
    go2.track = function(type, data) {
      var payload = Object.assign({ type: type }, data || {});
      fetch('${API_URL}/api/v1/public/conversions/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    };
  })();
</script>`}</pre>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Example Usage:</p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                <pre>{`// Track a signup
go2.track('signup', { eventName: 'user_registered' });

// Track a purchase with value
go2.track('purchase', { 
  value: 9900, // Amount in cents
  currency: 'usd',
  externalId: 'order_123'
});`}</pre>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackingCodeDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={copyTrackingCode}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
