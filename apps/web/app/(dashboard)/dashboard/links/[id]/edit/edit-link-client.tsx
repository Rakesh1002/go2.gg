"use client";

import {
  ABTestingConfig,
  ABTestingLocked,
  type ABVariant,
  createInitialVariants,
} from "@/components/links/ab-testing-config";
import {
  type TrackingPixel,
  TrackingPixelsConfig,
} from "@/components/links/tracking-pixels-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSubscription } from "@/contexts/subscription-context";
import { getPlanCapabilities } from "@/lib/plan-capabilities";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  BarChart3,
  ExternalLink,
  FlaskConical,
  Link2,
  Loader2,
  Save,
  Settings2,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
  // A/B testing (only used when no test is currently attached)
  enableABTest: z.boolean().optional(),
  abTestName: z.string().max(200).optional(),
  abTrafficPercentage: z.number().int().min(10).max(100).optional(),
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
  abTestId?: string | null;
  abVariant?: string | null;
}

interface AttachedABTest {
  id: string;
  name: string;
  status: "draft" | "running" | "paused" | "completed";
  variants: Array<{ id: string; name: string; url: string; weight: number }>;
}

interface EditLinkClientProps {
  linkId: string;
}

export function EditLinkClient({ linkId }: EditLinkClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [link, setLink] = useState<LinkData | null>(null);
  const [attachedTest, setAttachedTest] = useState<AttachedABTest | null>(null);
  const [abVariants, setAbVariants] = useState<ABVariant[]>([]);
  const { subscription } = useSubscription();
  const capabilities = getPlanCapabilities(subscription.plan);

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
      enableABTest: false,
      abTestName: "",
      abTrafficPercentage: 100,
    },
  });

  // Watch tracking pixel fields
  const watchTrackingPixels = form.watch("trackingPixels") || [];
  const watchEnablePixelTracking = form.watch("enablePixelTracking") || false;
  const watchRequirePixelConsent = form.watch("requirePixelConsent") || false;
  const watchEnableABTest = form.watch("enableABTest") || false;
  const watchAbTrafficPercentage = form.watch("abTrafficPercentage") ?? 100;
  const watchDestinationUrl = form.watch("destinationUrl");

  // Seed default variants when the user opts in (only when no test attached).
  useEffect(() => {
    if (!watchEnableABTest || attachedTest) return;
    if (abVariants.length === 0) {
      setAbVariants(createInitialVariants(watchDestinationUrl || ""));
    }
  }, [watchEnableABTest, watchDestinationUrl, abVariants.length, attachedTest]);

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
          enableABTest: false,
          abTestName: "",
          abTrafficPercentage: 100,
        });

        // Fetch attached A/B test, if any.
        if (linkData.abTestId) {
          try {
            const abRes = await fetch(`${apiUrl}/api/v1/ab-tests/${linkData.abTestId}`, {
              credentials: "include",
            });
            if (abRes.ok) {
              const abJson = await abRes.json();
              if (abJson.data) {
                setAttachedTest({
                  id: abJson.data.id,
                  name: abJson.data.name,
                  status: abJson.data.status,
                  variants: abJson.data.variants ?? [],
                });
              }
            }
          } catch (abErr) {
            console.error("Failed to load attached A/B test", abErr);
          }
        }
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

      // Validate A/B inputs only when the user is creating a new test from
      // this form (no test currently attached).
      if (!attachedTest && data.enableABTest) {
        if (!data.abTestName || data.abTestName.trim().length === 0) {
          throw new Error("Give your A/B test a name");
        }
        if (abVariants.length < 2) {
          throw new Error("A/B tests need at least 2 variants");
        }
        if (abVariants.some((v) => !v.url || v.url.trim().length === 0)) {
          throw new Error("Every A/B variant needs a destination URL");
        }
        const totalWeight = abVariants.reduce((sum, v) => sum + v.weight, 0);
        if (totalWeight !== 100) {
          throw new Error(`A/B variant weights must sum to 100% (currently ${totalWeight}%)`);
        }
      }

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

      // Attach a new A/B test if the user opted in and there isn't one already.
      if (!attachedTest && data.enableABTest) {
        try {
          const abResponse = await fetch(`${apiUrl}/api/v1/ab-tests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              name: data.abTestName,
              linkId,
              trafficPercentage: data.abTrafficPercentage ?? 100,
              variants: abVariants.map((v) => ({
                id: v.id,
                url: v.url,
                weight: v.weight,
                name: v.name,
              })),
            }),
          });
          if (!abResponse.ok) {
            const abError = await abResponse.json().catch(() => ({}));
            throw new Error(abError.error?.message ?? "Failed to create A/B test");
          }
          toast.success("A/B test attached — start it from the A/B Tests dashboard");
        } catch (abErr) {
          toast.error(
            abErr instanceof Error
              ? `Link saved, but A/B test failed: ${abErr.message}`
              : "Link saved, but A/B test failed"
          );
        }
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
          <h1 className="font-bold text-2xl">Edit Link</h1>
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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic" className="gap-2">
                    <Link2 className="h-4 w-4" />
                    Basic
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    Advanced
                  </TabsTrigger>
                  <TabsTrigger value="ab" className="gap-2">
                    <FlaskConical className="h-4 w-4" />
                    A/B
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
                            <span className="text-muted-foreground text-sm">{link.domain}/</span>
                            <Input placeholder="my-link" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          The custom slug for your short link. Changing this will break existing
                          links.
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
                            <span className="ml-2 text-muted-foreground text-xs">
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
                    <h4 className="font-medium text-sm">UTM Parameters</h4>
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

                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium text-sm">Social Previews (Open Graph)</h4>

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
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded border">
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

                <TabsContent value="ab" className="space-y-4 pt-4">
                  {!capabilities.canUseABTesting ? (
                    <ABTestingLocked />
                  ) : attachedTest ? (
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                              <FlaskConical className="h-4 w-4" />
                              {attachedTest.name}
                              <Badge
                                className={
                                  attachedTest.status === "running"
                                    ? "border-green-200 bg-green-500/10 text-green-600"
                                    : attachedTest.status === "completed"
                                      ? "border-blue-200 bg-blue-500/10 text-blue-600"
                                      : ""
                                }
                                variant={attachedTest.status === "draft" ? "outline" : "secondary"}
                              >
                                {attachedTest.status}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              This link is part of an A/B test. Manage variants, traffic split, and
                              winner from the A/B Tests dashboard.
                            </CardDescription>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/ab-tests/${attachedTest.id}`}>
                              <BarChart3 className="mr-1 h-3 w-3" />
                              View results
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {attachedTest.variants.map((v) => (
                            <div
                              key={v.id}
                              className="flex items-center justify-between rounded-md border bg-muted/30 p-2 text-sm"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium">{v.name}</p>
                                <p className="truncate text-muted-foreground text-xs">{v.url}</p>
                              </div>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {v.weight}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="enableABTest"
                        render={({ field }) => (
                          <FormItem className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-3">
                            <div className="space-y-1">
                              <FormLabel className="flex items-center gap-2">
                                <FlaskConical className="h-4 w-4" />
                                Attach an A/B test
                              </FormLabel>
                              <FormDescription className="text-xs">
                                Split traffic between 2–4 destination URLs. Starts in draft — start
                                it from the A/B Tests dashboard once you're ready.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {watchEnableABTest && (
                        <>
                          <FormField
                            control={form.control}
                            name="abTestName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Test name *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Homepage hero CTA — orange vs. blue"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <ABTestingConfig variants={abVariants} onChange={setAbVariants} />

                          <FormField
                            control={form.control}
                            name="abTrafficPercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Traffic in test: {watchAbTrafficPercentage}%</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={10}
                                    max={100}
                                    step={5}
                                    value={field.value ?? 100}
                                    onChange={(e) =>
                                      field.onChange(Number.parseInt(e.target.value, 10) || 100)
                                    }
                                  />
                                </FormControl>
                                <FormDescription>
                                  Percentage of visitors entered into the test (10–100). The rest
                                  get the link's default destination.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </>
                  )}
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
