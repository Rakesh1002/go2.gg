"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Link2, Settings2, Target, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  TrackingPixelsConfig,
  type TrackingPixel,
} from "@/components/links/tracking-pixels-config";

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

const editLinkSchema = z.object({
  destinationUrl: z.string().url("Please enter a valid URL"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Slug can only contain letters, numbers, hyphens, and underscores"),
  title: z.string().max(200).optional(),
  password: z.string().min(4).max(100).optional().or(z.literal("")),
  expiresAt: z.string().optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  ogTitle: z.string().max(200).optional(),
  ogDescription: z.string().max(500).optional(),
  ogImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
  // Tracking pixels
  trackingPixels: z.array(trackingPixelSchema).optional(),
  enablePixelTracking: z.boolean().optional(),
  requirePixelConsent: z.boolean().optional(),
});

type EditLinkForm = z.infer<typeof editLinkSchema>;

interface LinkData {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  slug: string;
  domain: string;
  title?: string;
  clickCount: number;
  createdAt: string;
  expiresAt?: string;
  hasPassword: boolean;
  tags: string[];
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  trackingPixels?: TrackingPixel[];
  enablePixelTracking?: boolean;
  requirePixelConsent?: boolean;
}

interface EditLinkClientProps {
  linkId: string;
}

export function EditLinkClient({ linkId }: EditLinkClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState<LinkData | null>(null);

  const form = useForm<EditLinkForm>({
    resolver: zodResolver(editLinkSchema),
    defaultValues: {
      destinationUrl: "",
      slug: "",
      title: "",
      password: "",
      expiresAt: "",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      trackingPixels: [],
      enablePixelTracking: false,
      requirePixelConsent: false,
    },
  });

  // Watch tracking pixel fields
  const watchTrackingPixels = form.watch("trackingPixels") || [];
  const watchEnablePixelTracking = form.watch("enablePixelTracking") || false;
  const watchRequirePixelConsent = form.watch("requirePixelConsent") || false;

  useEffect(() => {
    async function fetchLink() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
        const response = await fetch(`${apiUrl}/api/v1/links/${linkId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Link not found");
            router.push("/dashboard/links");
            return;
          }
          throw new Error("Failed to fetch link");
        }

        const result = await response.json();
        const linkData = result.data as LinkData;
        setLink(linkData);

        // Format expiration date for datetime-local input
        let formattedExpiresAt = "";
        if (linkData.expiresAt) {
          const date = new Date(linkData.expiresAt);
          formattedExpiresAt = date.toISOString().slice(0, 16);
        }

        // Set form values
        form.reset({
          destinationUrl: linkData.destinationUrl,
          slug: linkData.slug,
          title: linkData.title || "",
          password: "", // Don't show existing password
          expiresAt: formattedExpiresAt,
          utmSource: linkData.utmSource || "",
          utmMedium: linkData.utmMedium || "",
          utmCampaign: linkData.utmCampaign || "",
          ogTitle: linkData.ogTitle || "",
          ogDescription: linkData.ogDescription || "",
          ogImage: linkData.ogImage || "",
          trackingPixels: linkData.trackingPixels || [],
          enablePixelTracking: linkData.enablePixelTracking || false,
          requirePixelConsent: linkData.requirePixelConsent || false,
        });
      } catch (error) {
        console.error("Error fetching link:", error);
        toast.error("Failed to load link");
      } finally {
        setLoading(false);
      }
    }

    fetchLink();
  }, [linkId, form, router]);

  async function onSubmit(data: EditLinkForm) {
    setSaving(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

      // Filter valid tracking pixels
      const validPixels = (data.trackingPixels || []).filter(
        (pixel) => pixel.pixelId && pixel.pixelId.trim() !== ""
      );

      const payload = {
        destinationUrl: data.destinationUrl,
        slug: data.slug,
        ...(data.title !== undefined && { title: data.title || null }),
        ...(data.password && { password: data.password }),
        ...(data.expiresAt && { expiresAt: new Date(data.expiresAt).toISOString() }),
        ...(data.utmSource !== undefined && { utmSource: data.utmSource || null }),
        ...(data.utmMedium !== undefined && { utmMedium: data.utmMedium || null }),
        ...(data.utmCampaign !== undefined && { utmCampaign: data.utmCampaign || null }),
        ...(data.ogTitle !== undefined && { ogTitle: data.ogTitle || null }),
        ...(data.ogDescription !== undefined && { ogDescription: data.ogDescription || null }),
        ...(data.ogImage !== undefined && { ogImage: data.ogImage || null }),
        // Tracking pixels
        trackingPixels: validPixels.length > 0 ? validPixels : [],
        clearTrackingPixels: validPixels.length === 0,
        enablePixelTracking: data.enablePixelTracking ?? false,
        requirePixelConsent: data.requirePixelConsent ?? false,
      };

      const response = await fetch(`${apiUrl}/api/v1/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message ?? "Failed to update link");
      }

      toast.success("Link updated successfully");
      router.push("/dashboard/links");
      router.refresh();
    } catch (error) {
      console.error("Error updating link:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update link");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <EditLinkSkeleton />;
  }

  if (!link) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Link</h1>
          <p className="text-muted-foreground">{link.shortUrl}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Link Settings</CardTitle>
              <CardDescription>Update your link destination and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
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
                </TabsList>

                <TabsContent value="basic" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Link *</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {link.domain}/
                            </span>
                            <Input placeholder="my-link" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          The custom slug for your short link. Changing this will break existing links.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destinationUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination URL *</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/very/long/url" {...field} />
                        </FormControl>
                        <FormDescription>The URL this short link redirects to</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
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

                <TabsContent value="advanced" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Password Protection
                          {link.hasPassword && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (currently set)
                            </span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={
                              link.hasPassword ? "Leave blank to keep current" : "Optional password"
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Require a password to access this link</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="text-sm font-medium">Social Previews (Open Graph)</h4>

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
                </TabsContent>

                <TabsContent value="pixels" className="space-y-4 pt-4">
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function EditLinkSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
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
