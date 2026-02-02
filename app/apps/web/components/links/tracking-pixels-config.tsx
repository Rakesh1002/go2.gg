"use client";

import { useState, useId } from "react";
import { Plus, Trash2, Target, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Pixel type configuration
const PIXEL_TYPES = [
  {
    value: "facebook",
    label: "Facebook Pixel",
    placeholder: "e.g., 1234567890123456",
    description: "Track conversions from Facebook/Instagram ads",
    icon: "📘",
    defaultEvents: ["PageView"],
    availableEvents: [
      "PageView",
      "Lead",
      "CompleteRegistration",
      "ViewContent",
      "Purchase",
      "AddToCart",
    ],
  },
  {
    value: "google",
    label: "Google Ads",
    placeholder: "e.g., AW-123456789",
    description: "Track conversions from Google Ads",
    icon: "🔵",
    defaultEvents: ["conversion"],
    availableEvents: ["conversion", "page_view", "purchase", "sign_up", "lead"],
  },
  {
    value: "linkedin",
    label: "LinkedIn Insight Tag",
    placeholder: "e.g., 1234567",
    description: "Track conversions from LinkedIn ads",
    icon: "💼",
    defaultEvents: ["conversion"],
    availableEvents: ["conversion"],
  },
  {
    value: "tiktok",
    label: "TikTok Pixel",
    placeholder: "e.g., ABCDEF123456",
    description: "Track conversions from TikTok ads",
    icon: "🎵",
    defaultEvents: ["PageView"],
    availableEvents: [
      "PageView",
      "ClickButton",
      "CompleteRegistration",
      "ViewContent",
      "AddToCart",
      "Purchase",
    ],
  },
  {
    value: "twitter",
    label: "Twitter Pixel",
    placeholder: "e.g., abcde",
    description: "Track conversions from Twitter/X ads",
    icon: "🐦",
    defaultEvents: ["PageView"],
    availableEvents: ["PageView", "Lead", "Signup", "Purchase"],
  },
  {
    value: "pinterest",
    label: "Pinterest Tag",
    placeholder: "e.g., 1234567890123",
    description: "Track conversions from Pinterest ads",
    icon: "📌",
    defaultEvents: ["pagevisit"],
    availableEvents: ["pagevisit", "lead", "signup", "checkout", "addtocart"],
  },
  {
    value: "ga4",
    label: "Google Analytics 4",
    placeholder: "e.g., G-XXXXXXXXXX",
    description: "Track visits in Google Analytics",
    icon: "📊",
    defaultEvents: ["page_view"],
    availableEvents: ["page_view", "click", "conversion"],
  },
  {
    value: "custom",
    label: "Custom Script",
    placeholder: "Custom pixel ID",
    description: "Add your own tracking script",
    icon: "⚡",
    defaultEvents: [],
    availableEvents: [],
  },
] as const;

export type PixelType = (typeof PIXEL_TYPES)[number]["value"];

export interface TrackingPixel {
  type: PixelType;
  pixelId: string;
  enabled: boolean;
  events?: string[];
  customScript?: string;
}

interface TrackingPixelsConfigProps {
  pixels: TrackingPixel[];
  onChange: (pixels: TrackingPixel[]) => void;
  enablePixelTracking: boolean;
  onEnablePixelTrackingChange: (enabled: boolean) => void;
  requirePixelConsent: boolean;
  onRequirePixelConsentChange: (required: boolean) => void;
}

export function TrackingPixelsConfig({
  pixels,
  onChange,
  enablePixelTracking,
  onEnablePixelTrackingChange,
  requirePixelConsent,
  onRequirePixelConsentChange,
}: TrackingPixelsConfigProps) {
  const [expandedPixel, setExpandedPixel] = useState<string | undefined>(undefined);
  const baseId = useId();

  const addPixel = () => {
    const newPixel: TrackingPixel = {
      type: "facebook",
      pixelId: "",
      enabled: true,
      events: ["PageView"],
    };
    onChange([...pixels, newPixel]);
    setExpandedPixel(`pixel-${pixels.length}`);
  };

  const removePixel = (index: number) => {
    const newPixels = pixels.filter((_, i) => i !== index);
    onChange(newPixels);
  };

  const updatePixel = (index: number, updates: Partial<TrackingPixel>) => {
    const newPixels = [...pixels];
    newPixels[index] = { ...newPixels[index], ...updates };

    // Reset events when pixel type changes
    if (updates.type) {
      const typeConfig = PIXEL_TYPES.find((t) => t.value === updates.type);
      newPixels[index].events = [...(typeConfig?.defaultEvents || [])];
      if (updates.type !== "custom") {
        newPixels[index].customScript = undefined;
      }
    }

    onChange(newPixels);
  };

  const getPixelTypeConfig = (type: PixelType) => {
    return PIXEL_TYPES.find((t) => t.value === type);
  };

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Retargeting Pixels</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Fire tracking pixels when users click this link
          </p>
        </div>
      </div>

      {/* Master toggle */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor={`${baseId}-enable-pixels`} className="text-sm font-medium">
            Enable Pixel Tracking
          </Label>
          <p className="text-xs text-muted-foreground">
            Shows a brief interstitial page to fire pixels before redirecting
          </p>
        </div>
        <Switch
          id={`${baseId}-enable-pixels`}
          checked={enablePixelTracking}
          onCheckedChange={onEnablePixelTrackingChange}
        />
      </div>

      {/* GDPR consent toggle */}
      {enablePixelTracking && (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Label htmlFor={`${baseId}-require-consent`} className="text-sm font-medium">
                Require GDPR Consent
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Shows a consent banner before firing any tracking pixels. Recommended for EU
                      visitors.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground">
              Display a consent banner before firing pixels
            </p>
          </div>
          <Switch
            id={`${baseId}-require-consent`}
            checked={requirePixelConsent}
            onCheckedChange={onRequirePixelConsentChange}
          />
        </div>
      )}

      {/* Pixels list */}
      {enablePixelTracking && (
        <div className="space-y-3">
          {pixels.length > 0 ? (
            <Accordion
              type="single"
              collapsible
              value={expandedPixel}
              onValueChange={setExpandedPixel}
              className="space-y-2"
            >
              {pixels.map((pixel, index) => {
                const typeConfig = getPixelTypeConfig(pixel.type);
                // Use a stable key based on type and pixelId, or fallback to baseId + index
                const pixelKey = pixel.pixelId
                  ? `${pixel.type}-${pixel.pixelId}`
                  : `${baseId}-new-${index}`;
                return (
                  <AccordionItem
                    key={pixelKey}
                    value={`pixel-${index}`}
                    className="rounded-lg border px-3"
                  >
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-lg">{typeConfig?.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{typeConfig?.label}</span>
                            {!pixel.enabled && (
                              <Badge variant="secondary" className="text-xs">
                                Disabled
                              </Badge>
                            )}
                          </div>
                          {pixel.pixelId && (
                            <span className="text-xs text-muted-foreground">{pixel.pixelId}</span>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pt-1">
                      <div className="space-y-4">
                        {/* Pixel type selector */}
                        <div className="grid gap-2">
                          <Label className="text-xs">Pixel Type</Label>
                          <Select
                            value={pixel.type}
                            onValueChange={(value: PixelType) =>
                              updatePixel(index, { type: value })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PIXEL_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <span>{type.icon}</span>
                                    <span>{type.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Pixel ID */}
                        <div className="grid gap-2">
                          <Label className="text-xs">Pixel ID</Label>
                          <Input
                            placeholder={typeConfig?.placeholder}
                            value={pixel.pixelId}
                            onChange={(e) => updatePixel(index, { pixelId: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">{typeConfig?.description}</p>
                        </div>

                        {/* Events (for non-custom pixels) */}
                        {pixel.type !== "custom" &&
                          typeConfig &&
                          typeConfig.availableEvents.length > 0 && (
                            <div className="grid gap-2">
                              <Label className="text-xs">Events to Fire</Label>
                              <div className="flex flex-wrap gap-2">
                                {typeConfig.availableEvents.map((event) => (
                                  <button
                                    key={event}
                                    type="button"
                                    onClick={() => {
                                      const events = pixel.events || [];
                                      const newEvents = events.includes(event)
                                        ? events.filter((e) => e !== event)
                                        : [...events, event];
                                      updatePixel(index, { events: newEvents });
                                    }}
                                    className={cn(
                                      "rounded-md border px-2.5 py-1 text-xs transition-colors",
                                      pixel.events?.includes(event)
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-input hover:bg-accent"
                                    )}
                                  >
                                    {event}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Custom script */}
                        {pixel.type === "custom" && (
                          <div className="grid gap-2">
                            <Label className="text-xs">Custom Script</Label>
                            <Textarea
                              placeholder="<script>// Your tracking code here</script>"
                              value={pixel.customScript || ""}
                              onChange={(e) => updatePixel(index, { customScript: e.target.value })}
                              rows={4}
                              className="font-mono text-xs"
                            />
                            <p className="text-xs text-muted-foreground">
                              Enter your custom tracking script. It will be executed on the
                              interstitial page.
                            </p>
                          </div>
                        )}

                        {/* Enable toggle and delete */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`${baseId}-pixel-enabled-${index}`}
                              checked={pixel.enabled}
                              onCheckedChange={(enabled) => updatePixel(index, { enabled })}
                            />
                            <Label htmlFor={`${baseId}-pixel-enabled-${index}`} className="text-xs">
                              Enabled
                            </Label>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePixel(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Target className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No tracking pixels configured</p>
              <p className="text-xs text-muted-foreground">
                Add a pixel to start retargeting visitors
              </p>
            </div>
          )}

          {/* Add pixel button */}
          <Button type="button" variant="outline" size="sm" onClick={addPixel} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Tracking Pixel
          </Button>
        </div>
      )}
    </div>
  );
}
