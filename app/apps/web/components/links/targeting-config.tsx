"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Lock,
  Sparkles,
  Globe,
  Smartphone,
  Laptop,
  Apple,
  Chrome,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Common countries for geo targeting
const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
];

export interface GeoTarget {
  country: string;
  url: string;
}

export interface DeviceTargets {
  mobile?: string;
  desktop?: string;
  tablet?: string;
}

export interface DeepLinks {
  ios?: string;
  android?: string;
}

interface TargetingConfigProps {
  geoTargets: GeoTarget[];
  onGeoTargetsChange: (targets: GeoTarget[]) => void;
  deviceTargets: DeviceTargets;
  onDeviceTargetsChange: (targets: DeviceTargets) => void;
  deepLinks: DeepLinks;
  onDeepLinksChange: (links: DeepLinks) => void;
  disabled?: boolean;
  className?: string;
}

export function TargetingConfig({
  geoTargets,
  onGeoTargetsChange,
  deviceTargets,
  onDeviceTargetsChange,
  deepLinks,
  onDeepLinksChange,
  disabled = false,
  className,
}: TargetingConfigProps) {
  const [activeTab, setActiveTab] = useState("geo");

  const addGeoTarget = () => {
    const usedCountries = geoTargets.map((t) => t.country);
    const availableCountry = COUNTRIES.find((c) => !usedCountries.includes(c.code));
    if (!availableCountry) return;

    onGeoTargetsChange([...geoTargets, { country: availableCountry.code, url: "" }]);
  };

  const updateGeoTarget = (country: string, updates: Partial<GeoTarget>) => {
    const updated = geoTargets.map((t) => (t.country === country ? { ...t, ...updates } : t));
    onGeoTargetsChange(updated);
  };

  const removeGeoTarget = (country: string) => {
    onGeoTargetsChange(geoTargets.filter((t) => t.country !== country));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="geo" className="gap-2">
            <Globe className="h-4 w-4" />
            Geo
          </TabsTrigger>
          <TabsTrigger value="device" className="gap-2">
            <Smartphone className="h-4 w-4" />
            Device
          </TabsTrigger>
          <TabsTrigger value="deeplinks" className="gap-2">
            <Apple className="h-4 w-4" />
            Deep Links
          </TabsTrigger>
        </TabsList>

        {/* Geo Targeting */}
        <TabsContent value="geo" className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Geographic Targeting</Label>
              <p className="text-xs text-muted-foreground">Redirect users based on their country</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addGeoTarget}
              disabled={disabled || geoTargets.length >= COUNTRIES.length}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Country
            </Button>
          </div>

          {geoTargets.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-lg">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No geo targets configured.
              <br />
              All users will go to the default URL.
            </div>
          ) : (
            <div className="space-y-3">
              {geoTargets.map((target) => (
                <div
                  key={target.country}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <Select
                    value={target.country}
                    onValueChange={(value) => updateGeoTarget(target.country, { country: value })}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem
                          key={country.code}
                          value={country.code}
                          disabled={geoTargets.some(
                            (t) => t.country !== target.country && t.country === country.code
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={target.url}
                    onChange={(e) => updateGeoTarget(target.country, { url: e.target.value })}
                    placeholder="https://example.com/country-page"
                    disabled={disabled}
                    className="flex-1"
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGeoTarget(target.country)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Device Targeting */}
        <TabsContent value="device" className="space-y-4 pt-4">
          <div>
            <Label className="text-sm font-medium">Device Targeting</Label>
            <p className="text-xs text-muted-foreground">
              Redirect users based on their device type
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Label className="text-sm">Mobile</Label>
                <Input
                  value={deviceTargets.mobile || ""}
                  onChange={(e) =>
                    onDeviceTargetsChange({
                      ...deviceTargets,
                      mobile: e.target.value || undefined,
                    })
                  }
                  placeholder="https://m.example.com"
                  disabled={disabled}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Laptop className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Label className="text-sm">Desktop</Label>
                <Input
                  value={deviceTargets.desktop || ""}
                  onChange={(e) =>
                    onDeviceTargetsChange({
                      ...deviceTargets,
                      desktop: e.target.value || undefined,
                    })
                  }
                  placeholder="https://example.com"
                  disabled={disabled}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Leave empty to use the default destination URL
          </p>
        </TabsContent>

        {/* Deep Links */}
        <TabsContent value="deeplinks" className="space-y-4 pt-4">
          <div>
            <Label className="text-sm font-medium">App Deep Links</Label>
            <p className="text-xs text-muted-foreground">
              Open your mobile app directly or redirect to app stores
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Apple className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Label className="text-sm">iOS App URL</Label>
                <Input
                  value={deepLinks.ios || ""}
                  onChange={(e) =>
                    onDeepLinksChange({
                      ...deepLinks,
                      ios: e.target.value || undefined,
                    })
                  }
                  placeholder="https://apps.apple.com/app/..."
                  disabled={disabled}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  App Store URL or custom URL scheme (e.g., myapp://page)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Chrome className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <Label className="text-sm">Android App URL</Label>
                <Input
                  value={deepLinks.android || ""}
                  onChange={(e) =>
                    onDeepLinksChange({
                      ...deepLinks,
                      android: e.target.value || undefined,
                    })
                  }
                  placeholder="https://play.google.com/store/apps/..."
                  disabled={disabled}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Play Store URL or intent URL</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Locked state for targeting features (shown to Free users)
 */
export function TargetingLocked() {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Smart Targeting</CardTitle>
          </div>
          <Badge variant="secondary">
            <Sparkles className="h-3 w-3 mr-1" />
            Pro
          </Badge>
        </div>
        <CardDescription>Route users based on location, device, and more</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Upgrade to unlock targeting</p>
            <p className="text-xs text-muted-foreground">
              Send users to the right destination automatically
            </p>
          </div>
        </div>

        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Geo-targeting by country
          </li>
          <li className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            Device-based routing
          </li>
          <li className="flex items-center gap-2">
            <Apple className="h-4 w-4 text-primary" />
            iOS & Android deep links
          </li>
        </ul>

        <Button asChild className="w-full">
          <Link href="/dashboard/billing">Upgrade to Pro</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Convert geoTargets array to record format for API
 */
export function geoTargetsToRecord(targets: GeoTarget[]): Record<string, string> | undefined {
  if (targets.length === 0) return undefined;
  return targets.reduce(
    (acc, t) => {
      if (t.url) acc[t.country] = t.url;
      return acc;
    },
    {} as Record<string, string>
  );
}

/**
 * Convert record format to geoTargets array
 */
export function recordToGeoTargets(record: Record<string, string> | null | undefined): GeoTarget[] {
  if (!record) return [];
  return Object.entries(record).map(([country, url]) => ({ country, url }));
}
