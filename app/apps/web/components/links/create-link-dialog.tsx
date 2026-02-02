"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Link2,
  Settings2,
  Wand2,
  MessageSquare,
  Target,
  Lock,
  Sparkles,
} from "lucide-react";
import { SMSPreview } from "./sms-preview";
import { ShortLinkPreview } from "./short-link-preview";
import { TrackingPixelsConfig, type TrackingPixel } from "./tracking-pixels-config";
import { useSubscription } from "@/contexts/subscription-context";
import { getPlanCapabilities } from "@/lib/plan-capabilities";

// Tracking pixel schema
const trackingPixelSchema = z.object({
  type: z.enum([
    "facebook",
    "google",
    "linkedin",
    "tiktok",
    "twitter",
    "pinterest",
    "ga4",
    "custom",
  ]),
  pixelId: z.string().min(1).max(100),
  enabled: z.boolean(),
  events: z.array(z.string().max(50)).optional(),
  customScript: z.string().max(5000).optional(),
});

const createLinkSchema = z.object({
  destinationUrl: z.string().url("Please enter a valid URL"),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Slug can only contain letters, numbers, hyphens, and underscores")
    .optional()
    .or(z.literal("")),
  title: z.string().max(200).optional(),
  password: z.string().min(4).max(100).optional().or(z.literal("")),
  expiresAt: z.string().optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  smsMessage: z.string().max(1000).optional(),
  ogTitle: z.string().max(200).optional(),
  ogDescription: z.string().max(500).optional(),
  ogImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
  // Tracking pixels
  trackingPixels: z.array(trackingPixelSchema).optional(),
  enablePixelTracking: z.boolean().optional(),
  requirePixelConsent: z.boolean().optional(),
});

type CreateLinkForm = z.infer<typeof createLinkSchema>;

interface CreateLinkDialogProps {
  /** Trigger element (optional when using controlled mode) */
  children?: ReactNode;
  defaultUrl?: string;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

export function CreateLinkDialog({
  children,
  defaultUrl,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateLinkDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled
    ? (value: boolean) => controlledOnOpenChange?.(value)
    : setInternalOpen;

  const form = useForm<CreateLinkForm>({
    resolver: zodResolver(createLinkSchema),
    defaultValues: {
      destinationUrl: defaultUrl || "",
      slug: "",
      title: "",
      password: "",
      expiresAt: "",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      smsMessage: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      trackingPixels: [],
      enablePixelTracking: false,
      requirePixelConsent: false,
    },
  });

  // Get subscription and plan capabilities
  const { subscription } = useSubscription();
  const capabilities = getPlanCapabilities(subscription.plan);

  // Watch tracking pixel fields
  const watchTrackingPixels = form.watch("trackingPixels") || [];
  const watchEnablePixelTracking = form.watch("enablePixelTracking") || false;
  const watchRequirePixelConsent = form.watch("requirePixelConsent") || false;

  const watchDestinationUrl = form.watch("destinationUrl");
  const watchSlug = form.watch("slug");
  const watchSmsMessage = form.watch("smsMessage");

  // Generate preview short URL
  const previewShortUrl = watchSlug
    ? `go2.gg/${watchSlug}`
    : watchDestinationUrl
      ? "go2.gg/abc123"
      : "";

  async function generateAiMetadata() {
    if (!watchDestinationUrl) {
      toast.error("Please enter a destination URL first");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
      const response = await fetch(`${apiUrl}/api/v1/ai/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ url: watchDestinationUrl }),
      });

      if (!response.ok) throw new Error("Failed to generate metadata");

      const data = await response.json();

      if (data.data) {
        form.setValue("ogTitle", data.data.title);
        form.setValue("ogDescription", data.data.description);
        form.setValue("ogImage", data.data.suggestedImage);

        // Also set main title/desc if empty
        if (!form.getValues("title")) form.setValue("title", data.data.title);
        // We don't have description field in main form part, but if we did we'd set it

        toast.success("Metadata generated with AI");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate metadata");
    } finally {
      setLoading(false);
    }
  }

  // Update form when defaultUrl changes
  useEffect(() => {
    if (defaultUrl) {
      form.setValue("destinationUrl", defaultUrl);
    }
  }, [defaultUrl, form]);

  async function onSubmit(data: CreateLinkForm) {
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

      // Clean up empty strings and filter valid tracking pixels
      const validPixels = (data.trackingPixels || []).filter(
        (pixel) => pixel.pixelId && pixel.pixelId.trim() !== ""
      );

      const payload = {
        destinationUrl: data.destinationUrl,
        ...(data.slug && { slug: data.slug }),
        ...(data.title && { title: data.title }),
        ...(data.password && { password: data.password }),
        ...(data.expiresAt && { expiresAt: new Date(data.expiresAt).toISOString() }),
        ...(data.utmSource && { utmSource: data.utmSource }),
        ...(data.utmMedium && { utmMedium: data.utmMedium }),
        ...(data.utmCampaign && { utmCampaign: data.utmCampaign }),
        ...(data.ogTitle && { ogTitle: data.ogTitle }),
        ...(data.ogDescription && { ogDescription: data.ogDescription }),
        ...(data.ogImage && { ogImage: data.ogImage }),
        // Tracking pixels
        ...(validPixels.length > 0 && { trackingPixels: validPixels }),
        ...(data.enablePixelTracking !== undefined && {
          enablePixelTracking: data.enablePixelTracking,
        }),
        ...(data.requirePixelConsent !== undefined && {
          requirePixelConsent: data.requirePixelConsent,
        }),
      };

      const response = await fetch(`${apiUrl}/api/v1/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message ?? "Failed to create link");
      }

      const result = await response.json();
      toast.success("Link created successfully");

      // Copy to clipboard
      await navigator.clipboard.writeText(result.data.shortUrl);
      toast.success("Short URL copied to clipboard");

      // Invalidate React Query caches to update all related components
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });

      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      console.error("Error creating link:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Create Short Link
          </DialogTitle>
          <DialogDescription>Shorten a URL and customize its settings</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic" className="gap-2">
                  <Link2 className="h-4 w-4" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="advanced" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Advanced
                </TabsTrigger>
                <TabsTrigger value="pixels" className="gap-2">
                  <Target className="h-4 w-4" />
                  Pixels
                </TabsTrigger>
                <TabsTrigger value="sms" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  SMS
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4 max-h-[50vh] overflow-y-auto">
                <FormField
                  control={form.control}
                  name="destinationUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination URL *</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/very/long/url" {...field} />
                      </FormControl>
                      <FormDescription>The URL you want to shorten</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Slug</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground hidden sm:inline">go2.gg/</span>
                          <Input placeholder="my-link" {...field} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                title="Generate random slug"
                              >
                                <Wand2 className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  const random = Math.random().toString(36).substring(2, 9);
                                  form.setValue("slug", random);
                                }}
                              >
                                Standard (7 chars)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const random = Math.random().toString(36).substring(2, 6);
                                  form.setValue("slug", random);
                                }}
                              >
                                SMS Optimized (4 chars)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </FormControl>
                      <FormDescription>Leave empty for a random slug</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Live Short Link Preview */}
                <ShortLinkPreview
                  slug={watchSlug || ""}
                  destinationUrl={watchDestinationUrl || ""}
                  checkAvailability={!!watchSlug}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="My awesome link" {...field} />
                      </FormControl>
                      <FormDescription>A friendly name for this link</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 pt-4 max-h-[50vh] overflow-y-auto">
                {/* Password Protection - Pro+ Feature */}
                {capabilities.canUsePasswordProtection ? (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password Protection</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Optional password" {...field} />
                        </FormControl>
                        <FormDescription>Require a password to access this link</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <LockedFeatureField
                    label="Password Protection"
                    description="Protect your links with a password"
                    requiredPlan="Pro"
                  />
                )}

                {/* Link Expiration - Pro+ Feature */}
                {capabilities.canUseLinkExpiration ? (
                  <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormDescription>Link will stop working after this date</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <LockedFeatureField
                    label="Link Expiration"
                    description="Set links to expire after a certain date"
                    requiredPlan="Pro"
                  />
                )}

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">UTM Parameters</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="utmSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source</FormLabel>
                          <FormControl>
                            <Input placeholder="twitter" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="utmMedium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medium</FormLabel>
                          <FormControl>
                            <Input placeholder="social" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="utmCampaign"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign</FormLabel>
                          <FormControl>
                            <Input placeholder="launch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Social Previews (Open Graph)</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateAiMetadata}
                        disabled={loading || !watchDestinationUrl}
                      >
                        <Wand2 className="mr-2 h-3.5 w-3.5" />
                        Auto-Fill with AI
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name="ogTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Engaging title for social media" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ogDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Description shown on Facebook, Twitter, etc."
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ogImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Image URL</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input placeholder="https://..." {...field} />
                              {field.value && (
                                <div className="h-10 w-10 shrink-0 rounded border overflow-hidden">
                                  <img
                                    src={field.value}
                                    alt="Preview"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pixels" className="space-y-4 pt-4 max-h-[50vh] overflow-y-auto">
                {capabilities.canUsePixelTracking ? (
                  <TrackingPixelsConfig
                    pixels={watchTrackingPixels as TrackingPixel[]}
                    onChange={(pixels) => form.setValue("trackingPixels", pixels)}
                    enablePixelTracking={watchEnablePixelTracking}
                    onEnablePixelTrackingChange={(enabled) =>
                      form.setValue("enablePixelTracking", enabled)
                    }
                    requirePixelConsent={watchRequirePixelConsent}
                    onRequirePixelConsentChange={(required) =>
                      form.setValue("requirePixelConsent", required)
                    }
                  />
                ) : (
                  <LockedFeaturePanel
                    title="Pixel Tracking"
                    description="Add retargeting pixels to track conversions and build audiences"
                    requiredPlan="Pro"
                    benefits={[
                      "Facebook Pixel integration",
                      "Google Ads conversion tracking",
                      "TikTok, LinkedIn, and more",
                      "Build retargeting audiences",
                    ]}
                  />
                )}
              </TabsContent>

              <TabsContent value="sms" className="space-y-4 pt-4 max-h-[50vh] overflow-y-auto">
                <FormField
                  control={form.control}
                  name="smsMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMS Message Template</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Check out this link:" rows={3} {...field} />
                      </FormControl>
                      <FormDescription>Preview how your link will appear in SMS</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {previewShortUrl && <SMSPreview url={previewShortUrl} message={watchSmsMessage} />}
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Link
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Inline locked feature field for form fields
 */
interface LockedFeatureFieldProps {
  label: string;
  description: string;
  requiredPlan: string;
}

function LockedFeatureField({ label, description, requiredPlan }: LockedFeatureFieldProps) {
  return (
    <div className="rounded-lg border border-dashed p-4 bg-muted/30">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          <Sparkles className="h-3 w-3 mr-1" />
          {requiredPlan}
        </Badge>
      </div>
    </div>
  );
}

/**
 * Full locked feature panel for tab content
 */
interface LockedFeaturePanelProps {
  title: string;
  description: string;
  requiredPlan: string;
  benefits: string[];
}

function LockedFeaturePanel({
  title,
  description,
  requiredPlan,
  benefits,
}: LockedFeaturePanelProps) {
  return (
    <div className="rounded-lg border border-dashed p-6 bg-muted/30 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <Badge variant="secondary" className="mb-4">
        <Sparkles className="h-3 w-3 mr-1" />
        Requires {requiredPlan} plan
      </Badge>
      <ul className="text-left space-y-2 mb-4 max-w-xs mx-auto">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            {benefit}
          </li>
        ))}
      </ul>
      <Button asChild size="sm">
        <Link href="/dashboard/billing">Upgrade to {requiredPlan}</Link>
      </Button>
    </div>
  );
}
