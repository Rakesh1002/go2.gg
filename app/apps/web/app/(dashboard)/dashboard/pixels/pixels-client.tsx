"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Target, Link2, Search, Settings2 } from "lucide-react";
import {
  TrackingPixelsConfig,
  type TrackingPixel,
} from "@/components/links/tracking-pixels-config";
import { cn } from "@/lib/utils";

interface Link {
  id: string;
  slug: string;
  destinationUrl: string;
  domain: string;
  title?: string;
  trackingPixels?: TrackingPixel[];
  enablePixelTracking: boolean;
  requirePixelConsent: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

// Pixel type icons
const PIXEL_ICONS: Record<string, string> = {
  facebook: "📘",
  google: "🔵",
  linkedin: "💼",
  tiktok: "🎵",
  twitter: "🐦",
  pinterest: "📌",
  ga4: "📊",
  custom: "⚡",
};

export function PixelsClient() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [saving, setSaving] = useState(false);

  // Pixel configuration state for dialog
  const [editPixels, setEditPixels] = useState<TrackingPixel[]>([]);
  const [editEnableTracking, setEditEnableTracking] = useState(false);
  const [editRequireConsent, setEditRequireConsent] = useState(false);

  useEffect(() => {
    fetchLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchLinks() {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/v1/links?limit=100`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setLinks(result.data?.links || []);
      } else {
        toast.error("Failed to fetch links");
      }
    } catch (error) {
      console.error("Error fetching links:", error);
      toast.error("Failed to fetch links");
    } finally {
      setLoading(false);
    }
  }

  function openEditDialog(link: Link) {
    setSelectedLink(link);
    setEditPixels(link.trackingPixels || []);
    setEditEnableTracking(link.enablePixelTracking);
    setEditRequireConsent(link.requirePixelConsent);
  }

  async function savePixelConfig() {
    if (!selectedLink) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/links/${selectedLink.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          trackingPixels: editPixels,
          enablePixelTracking: editEnableTracking,
          requirePixelConsent: editRequireConsent,
        }),
      });

      if (response.ok) {
        toast.success("Pixel configuration saved");
        // Update local state
        setLinks((prev) =>
          prev.map((l) =>
            l.id === selectedLink.id
              ? {
                  ...l,
                  trackingPixels: editPixels,
                  enablePixelTracking: editEnableTracking,
                  requirePixelConsent: editRequireConsent,
                }
              : l
          )
        );
        setSelectedLink(null);
      } else {
        const error = await response.json();
        toast.error(error.error?.message || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving pixel config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  const filteredLinks = links.filter((link) => {
    const searchLower = search.toLowerCase();
    return (
      link.slug.toLowerCase().includes(searchLower) ||
      link.destinationUrl.toLowerCase().includes(searchLower) ||
      link.title?.toLowerCase().includes(searchLower)
    );
  });

  const linksWithPixels = filteredLinks.filter(
    (link) => link.enablePixelTracking && link.trackingPixels && link.trackingPixels.length > 0
  );

  const linksWithoutPixels = filteredLinks.filter(
    (link) => !link.enablePixelTracking || !link.trackingPixels || link.trackingPixels.length === 0
  );

  if (loading) {
    return <PixelsClientSkeleton />;
  }

  return (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search links..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Links with Pixels</CardDescription>
            <CardTitle className="text-3xl">{linksWithPixels.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Active retargeting on these links</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pixels</CardDescription>
            <CardTitle className="text-3xl">
              {links.reduce((acc, link) => acc + (link.trackingPixels?.length || 0), 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Across all your links</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>GDPR Consent</CardDescription>
            <CardTitle className="text-3xl">
              {links.filter((l) => l.requirePixelConsent).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Links with consent banners</p>
          </CardContent>
        </Card>
      </div>

      {/* Links with Pixels */}
      {linksWithPixels.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Links with Pixels</h2>
          <div className="space-y-2">
            {linksWithPixels.map((link) => (
              <LinkPixelCard key={link.id} link={link} onEdit={() => openEditDialog(link)} />
            ))}
          </div>
        </div>
      )}

      {/* Links without Pixels */}
      {linksWithoutPixels.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Links without Pixels ({linksWithoutPixels.length})
          </h2>
          <div className="space-y-2">
            {linksWithoutPixels.slice(0, 10).map((link) => (
              <LinkPixelCard key={link.id} link={link} onEdit={() => openEditDialog(link)} />
            ))}
            {linksWithoutPixels.length > 10 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                +{linksWithoutPixels.length - 10} more links
              </p>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredLinks.length === 0 && (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-semibold">No links found</h3>
          <p className="text-muted-foreground">
            {search ? "Try a different search term" : "Create some links to add pixel tracking"}
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!selectedLink} onOpenChange={(open) => !open && setSelectedLink(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Pixels</DialogTitle>
            <DialogDescription>
              {selectedLink && (
                <span className="flex items-center gap-2 mt-1">
                  <Link2 className="h-3.5 w-3.5" />
                  {selectedLink.domain}/{selectedLink.slug}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <TrackingPixelsConfig
            pixels={editPixels}
            onChange={setEditPixels}
            enablePixelTracking={editEnableTracking}
            onEnablePixelTrackingChange={setEditEnableTracking}
            requirePixelConsent={editRequireConsent}
            onRequirePixelConsentChange={setEditRequireConsent}
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSelectedLink(null)}>
              Cancel
            </Button>
            <Button onClick={savePixelConfig} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface LinkPixelCardProps {
  link: Link;
  onEdit: () => void;
}

function LinkPixelCard({ link, onEdit }: LinkPixelCardProps) {
  const hasPixels =
    link.enablePixelTracking && link.trackingPixels && link.trackingPixels.length > 0;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-4 transition-colors",
        hasPixels ? "bg-card" : "bg-muted/30"
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            hasPixels ? "bg-primary/10" : "bg-muted"
          )}
        >
          <Target className={cn("h-5 w-5", hasPixels ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">
              {link.domain}/{link.slug}
            </span>
            {hasPixels && (
              <Badge variant="secondary" className="shrink-0">
                {link.trackingPixels?.length} pixel{link.trackingPixels?.length !== 1 && "s"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {hasPixels ? (
              <div className="flex items-center gap-1">
                {link.trackingPixels?.slice(0, 4).map((pixel) => (
                  <span
                    key={`${pixel.type}-${pixel.pixelId}`}
                    title={pixel.type}
                    className="text-sm"
                  >
                    {PIXEL_ICONS[pixel.type] || "📊"}
                  </span>
                ))}
                {(link.trackingPixels?.length || 0) > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{(link.trackingPixels?.length || 0) - 4}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No pixels configured</span>
            )}
          </div>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit}>
        <Settings2 className="h-4 w-4 mr-2" />
        {hasPixels ? "Edit" : "Add Pixels"}
      </Button>
    </div>
  );
}

function PixelsClientSkeleton() {
  return (
    <>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </>
  );
}
