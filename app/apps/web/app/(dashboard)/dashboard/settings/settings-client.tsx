"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link2, Bell, BarChart3, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface UserPreferences {
  userId: string;
  defaultDomainId: string | null;
  defaultTrackAnalytics: boolean;
  defaultPublicStats: boolean;
  defaultFolderId: string | null;
  emailNotificationsEnabled: boolean;
  emailUsageAlerts: boolean;
  emailWeeklyDigest: boolean;
  emailMarketing: boolean;
  theme: "light" | "dark" | "system";
  defaultTimeRange: "7d" | "30d" | "90d" | "all";
  itemsPerPage: number;
}

interface Domain {
  id: string;
  domain: string;
  verified: boolean;
}

export function SettingsClient() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch preferences and domains on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [prefsRes, domainsRes] = await Promise.all([
          fetch(`${API_URL}/api/v1/users/me/preferences`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/api/v1/domains`, {
            credentials: "include",
          }),
        ]);

        if (prefsRes.ok) {
          const prefsData = await prefsRes.json();
          setPreferences(prefsData.data);
        }

        if (domainsRes.ok) {
          const domainsData = await domainsRes.json();
          setDomains(domainsData.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Save preferences
  async function savePreferences(updates: Partial<UserPreferences>) {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/users/me/preferences`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      const result = await response.json();
      setPreferences(result.data);
      toast.success("Settings saved");
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Unable to load settings</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Link Defaults */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Link Defaults</CardTitle>
          </div>
          <CardDescription>Set default options for new links you create</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Domain */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Default Domain</Label>
              <p className="text-sm text-muted-foreground">
                The domain used when creating new short links
              </p>
            </div>
            <Select
              value={preferences.defaultDomainId || "default"}
              onValueChange={(value) =>
                savePreferences({
                  defaultDomainId: value === "default" ? null : value,
                })
              }
              disabled={saving}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">go2.gg (default)</SelectItem>
                {domains
                  .filter((d) => d.verified)
                  .map((domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.domain}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Track Analytics */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Track Analytics</Label>
              <p className="text-sm text-muted-foreground">
                Enable click tracking and analytics by default
              </p>
            </div>
            <Switch
              checked={preferences.defaultTrackAnalytics}
              onCheckedChange={(checked) => savePreferences({ defaultTrackAnalytics: checked })}
              disabled={saving}
            />
          </div>

          {/* Public Stats */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Stats</Label>
              <p className="text-sm text-muted-foreground">
                Make link statistics publicly viewable by default
              </p>
            </div>
            <Switch
              checked={preferences.defaultPublicStats}
              onCheckedChange={(checked) => savePreferences({ defaultPublicStats: checked })}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Manage your email notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications Master Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications from Go2
              </p>
            </div>
            <Switch
              checked={preferences.emailNotificationsEnabled}
              onCheckedChange={(checked) =>
                savePreferences({ emailNotificationsEnabled: checked })
              }
              disabled={saving}
            />
          </div>

          {/* Usage Alerts */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Usage Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when approaching plan limits
              </p>
            </div>
            <Switch
              checked={preferences.emailUsageAlerts}
              onCheckedChange={(checked) => savePreferences({ emailUsageAlerts: checked })}
              disabled={saving || !preferences.emailNotificationsEnabled}
            />
          </div>

          {/* Weekly Digest */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your link performance
              </p>
            </div>
            <Switch
              checked={preferences.emailWeeklyDigest}
              onCheckedChange={(checked) => savePreferences({ emailWeeklyDigest: checked })}
              disabled={saving || !preferences.emailNotificationsEnabled}
            />
          </div>

          {/* Marketing Emails */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Product Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive news about new features and updates
              </p>
            </div>
            <Switch
              checked={preferences.emailMarketing}
              onCheckedChange={(checked) => savePreferences({ emailMarketing: checked })}
              disabled={saving || !preferences.emailNotificationsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Display</CardTitle>
          </div>
          <CardDescription>Configure how data is displayed in the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Time Range */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Default Analytics Range</Label>
              <p className="text-sm text-muted-foreground">
                Default time period for analytics views
              </p>
            </div>
            <Select
              value={preferences.defaultTimeRange}
              onValueChange={(value) =>
                savePreferences({
                  defaultTimeRange: value as "7d" | "30d" | "90d" | "all",
                })
              }
              disabled={saving}
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
          </div>

          {/* Items Per Page */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Items Per Page</Label>
              <p className="text-sm text-muted-foreground">
                Number of items to show in lists
              </p>
            </div>
            <Select
              value={String(preferences.itemsPerPage)}
              onValueChange={(value) => savePreferences({ itemsPerPage: Number(value) })}
              disabled={saving}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Saving...</span>
        </div>
      )}
    </div>
  );
}
