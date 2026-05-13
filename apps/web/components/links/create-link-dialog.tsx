"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSubscription } from "@/contexts/subscription-context";
import { getPlanCapabilities } from "@/lib/plan-capabilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  FlaskConical,
  Link2,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCw,
  Settings2,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  ABTestingConfig,
  ABTestingLocked,
  type ABVariant,
  createInitialVariants,
} from "./ab-testing-config";
import { ShortLinkPreview } from "./short-link-preview";
import { SMSPreview } from "./sms-preview";
import { type TrackingPixel, TrackingPixelsConfig } from "./tracking-pixels-config";
import { FolderPicker } from "@/components/folders/folder-picker";

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
  description: z.string().max(500).optional(),
  tags: z.string().max(500).optional(),
  folderId: z.string().uuid().nullable().optional(),
  password: z.string().min(4).max(100).optional().or(z.literal("")),
  expiresAt: z.string().optional(),
  clickLimit: z.coerce.number().int().positive().optional().or(z.nan()),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmTerm: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
  iosUrl: z.string().url("Invalid iOS URL").optional().or(z.literal("")),
  androidUrl: z.string().url("Invalid Android URL").optional().or(z.literal("")),
  smsMessage: z.string().max(1000).optional(),
  ogTitle: z.string().max(200).optional(),
  ogDescription: z.string().max(500).optional(),
  ogImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
  // Tracking pixels
  trackingPixels: z.array(trackingPixelSchema).optional(),
  enablePixelTracking: z.boolean().optional(),
  requirePixelConsent: z.boolean().optional(),
  // A/B testing
  enableABTest: z.boolean().optional(),
  abTestName: z.string().max(200).optional(),
  abTrafficPercentage: z.number().int().min(10).max(100).optional(),
  // Agent attribution (all optional — see /agents)
  agentId: z.string().max(200).optional(),
  agentRunId: z.string().max(200).optional(),
  agentActorId: z.string().max(200).optional(),
  agentMetadata: z
    .string()
    .max(4000)
    .optional()
    .refine(
      (value) => {
        if (!value || value.trim() === "") return true;
        try {
          const parsed = JSON.parse(value);
          return parsed && typeof parsed === "object" && !Array.isArray(parsed);
        } catch {
          return false;
        }
      },
      { message: 'Must be a valid JSON object (e.g. {"prompt":"hello"})' }
    ),
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
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [suggestingSlug, setSuggestingSlug] = useState(false);
  const [aiSuggestedSlug, setAiSuggestedSlug] = useState(false);

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
      description: "",
      tags: "",
      folderId: null,
      password: "",
      expiresAt: "",
      clickLimit: undefined,
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmTerm: "",
      utmContent: "",
      iosUrl: "",
      androidUrl: "",
      smsMessage: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      trackingPixels: [],
      enablePixelTracking: false,
      requirePixelConsent: false,
      enableABTest: false,
      abTestName: "",
      abTrafficPercentage: 100,
      agentId: "",
      agentRunId: "",
      agentActorId: "",
      agentMetadata: "",
    },
  });

  // A/B test variants live alongside the form rather than inside the zod
  // schema — the ABTestingConfig component already enforces sum-to-100 and
  // 10–90% bounds, and React Hook Form's array handling adds friction here.
  const [abVariants, setAbVariants] = useState<ABVariant[]>([]);

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
  const watchEnableABTest = form.watch("enableABTest") || false;
  const watchAbTrafficPercentage = form.watch("abTrafficPercentage") ?? 100;

  // When the user toggles A/B on for the first time, seed two variants
  // (Control = current destination, Variant B = blank). Re-seeds Control if
  // the destination changes while no URL has been entered for Variant B.
  useEffect(() => {
    if (!watchEnableABTest) return;
    if (abVariants.length === 0) {
      setAbVariants(createInitialVariants(watchDestinationUrl || ""));
      return;
    }
    // Keep Control's URL synced to destinationUrl until the user has typed
    // anything into Variant B — once they do, leave variants alone.
    const variantBHasUrl = abVariants.slice(1).some((v) => v.url.trim() !== "");
    if (!variantBHasUrl && abVariants[0]) {
      const control = abVariants[0];
      if (control.url !== (watchDestinationUrl || "")) {
        setAbVariants([{ ...control, url: watchDestinationUrl || "" }, ...abVariants.slice(1)]);
      }
    }
  }, [watchEnableABTest, watchDestinationUrl, abVariants]);

  async function suggestAiSlug() {
    const url = watchDestinationUrl?.trim();
    if (!url) {
      toast.error("Enter a destination URL first");
      return;
    }
    try {
      setSuggestingSlug(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
      const res = await fetch(`${apiUrl}/api/v1/slugs/suggest`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, count: 1, style: "memorable", maxLength: 12 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { data?: { suggestions?: string[] } };
      const slug = json.data?.suggestions?.[0];
      if (!slug) {
        toast.error("No suggestion returned — try again");
        return;
      }
      form.setValue("slug", slug, { shouldValidate: true });
      setAiSuggestedSlug(true);
      toast.success(`Suggested: ${slug}`);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't suggest a slug");
    } finally {
      setSuggestingSlug(false);
    }
  }

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

      // Parse tags (comma-separated string → array)
      const tagsArray = data.tags
        ? data.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const clickLimit =
        typeof data.clickLimit === "number" &&
        Number.isFinite(data.clickLimit) &&
        data.clickLimit > 0
          ? data.clickLimit
          : undefined;

      const payload = {
        destinationUrl: data.destinationUrl,
        ...(data.slug && { slug: data.slug }),
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(tagsArray.length > 0 && { tags: tagsArray }),
        ...(data.folderId && { folderId: data.folderId }),
        ...(data.password && { password: data.password }),
        ...(data.expiresAt && { expiresAt: new Date(data.expiresAt).toISOString() }),
        ...(clickLimit !== undefined && { clickLimit }),
        ...(data.utmSource && { utmSource: data.utmSource }),
        ...(data.utmMedium && { utmMedium: data.utmMedium }),
        ...(data.utmCampaign && { utmCampaign: data.utmCampaign }),
        ...(data.utmTerm && { utmTerm: data.utmTerm }),
        ...(data.utmContent && { utmContent: data.utmContent }),
        ...(data.iosUrl && { iosUrl: data.iosUrl }),
        ...(data.androidUrl && { androidUrl: data.androidUrl }),
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
        // Agent attribution: explicit user-entered values win;
        // workers-ai stamp is only applied if the user didn't set anything.
        ...(data.agentId
          ? { agentId: data.agentId }
          : aiSuggestedSlug
            ? { agentId: "workers-ai" }
            : {}),
        ...(data.agentRunId && { agentRunId: data.agentRunId }),
        ...(data.agentActorId && { agentActorId: data.agentActorId }),
        ...(data.agentMetadata?.trim() && {
          agentMetadata: JSON.parse(data.agentMetadata),
        }),
      };

      // Validate A/B inputs before hitting the API so we don't create an
      // orphan link when the variant config is incomplete.
      if (data.enableABTest) {
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

      // Step 2: attach an A/B test if the user opted in. The link already
      // exists; an A/B failure is non-fatal — the user can still use the link
      // and create the test from the dashboard later.
      if (data.enableABTest && result.data?.id) {
        try {
          const abResponse = await fetch(`${apiUrl}/api/v1/ab-tests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              name: data.abTestName,
              linkId: result.data.id,
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
          toast.success("A/B test created — start it from the A/B Tests dashboard");
        } catch (abErr) {
          toast.error(
            abErr instanceof Error
              ? `Link created, but A/B test failed: ${abErr.message}`
              : "Link created, but A/B test failed"
          );
        }
      }

      // Copy to clipboard
      await navigator.clipboard.writeText(result.data.shortUrl);
      toast.success("Short URL copied to clipboard");

      // Invalidate React Query caches to update all related components
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });

      setOpen(false);
      form.reset();
      setSlugAvailable(null);
      setAbVariants([]);
      router.push("/dashboard/links");
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
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-[600px]">
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
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic" className="gap-1.5 text-xs sm:text-sm">
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Basic</span>
                </TabsTrigger>
                <TabsTrigger value="advanced" className="gap-1.5 text-xs sm:text-sm">
                  <Settings2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Advanced</span>
                </TabsTrigger>
                <TabsTrigger value="ab" className="gap-1.5 text-xs sm:text-sm">
                  <FlaskConical className="h-4 w-4" />
                  <span className="hidden sm:inline">A/B</span>
                </TabsTrigger>
                <TabsTrigger value="agents" className="gap-1.5 text-xs sm:text-sm">
                  <Bot className="h-4 w-4" />
                  <span className="hidden sm:inline">Agent</span>
                </TabsTrigger>
                <TabsTrigger value="pixels" className="gap-1.5 text-xs sm:text-sm">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Pixels</span>
                </TabsTrigger>
                <TabsTrigger value="sms" className="gap-1.5 text-xs sm:text-sm">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">SMS</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="max-h-[50vh] space-y-4 overflow-y-auto pt-4">
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
                          <span className="hidden text-muted-foreground sm:inline">go2.gg/</span>
                          <Input placeholder="my-link" {...field} />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            title="Suggest a slug from the URL (AI)"
                            disabled={suggestingSlug || !watchDestinationUrl}
                            onClick={suggestAiSlug}
                          >
                            {suggestingSlug ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </Button>
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
                  onAvailabilityCheck={setSlugAvailable}
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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Internal note about this link" rows={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="newsletter, launch, q2" {...field} />
                      </FormControl>
                      <FormDescription>Comma-separated tags for filtering</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {capabilities.canAddFolder && (
                  <FormField
                    control={form.control}
                    name="folderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Folder</FormLabel>
                        <FormControl>
                          <FolderPicker
                            value={field.value ?? null}
                            onChange={(value) =>
                              field.onChange(value === "none" ? null : value)
                            }
                            includeNone={false}
                            placeholder="No folder"
                          />
                        </FormControl>
                        <FormDescription>Group this link with related ones</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              <TabsContent value="advanced" className="max-h-[50vh] space-y-4 overflow-y-auto pt-4">
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
                  <>
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
                    <FormField
                      control={form.control}
                      name="clickLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Click Limit</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder="e.g. 100"
                              {...field}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Stop redirecting after this many clicks (leave blank for unlimited)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <LockedFeatureField
                    label="Link Expiration & Click Limit"
                    description="Set links to expire after a certain date or click count"
                    requiredPlan="Pro"
                  />
                )}

                {/* Platform-specific deep links */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium text-sm">Platform-Specific URLs</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="iosUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>iOS URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://apps.apple.com/..." {...field} />
                          </FormControl>
                          <FormDescription>iOS visitors redirect here</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="androidUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Android URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://play.google.com/..." {...field} />
                          </FormControl>
                          <FormDescription>Android visitors redirect here</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

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
                    <FormField
                      control={form.control}
                      name="utmTerm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Term</FormLabel>
                          <FormControl>
                            <Input placeholder="keyword" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="utmContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Input placeholder="cta-top" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Social Previews (Open Graph)</h4>
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
                </div>
              </TabsContent>

              <TabsContent value="ab" className="max-h-[50vh] space-y-4 overflow-y-auto pt-4">
                {capabilities.canUseABTesting ? (
                  <>
                    <FormField
                      control={form.control}
                      name="enableABTest"
                      render={({ field }) => (
                        <FormItem className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-3">
                          <div className="space-y-1">
                            <FormLabel className="flex items-center gap-2">
                              <FlaskConical className="h-4 w-4" />
                              Enable A/B testing
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Split traffic between 2–4 destination URLs. The link starts in draft —
                              start the test from the A/B Tests dashboard once you're happy with the
                              variants.
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
                              <FormDescription>
                                Helps you find this test on the A/B Tests dashboard.
                              </FormDescription>
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
                                Percentage of visitors entered into the test (10–100). Visitors not
                                in the test get the link's default destination URL.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </>
                ) : (
                  <ABTestingLocked />
                )}
              </TabsContent>

              <TabsContent value="agents" className="max-h-[50vh] space-y-4 overflow-y-auto pt-4">
                <div className="rounded-lg border bg-muted/30 p-3 text-muted-foreground text-xs">
                  Stamp this link with agent attribution context. Every click on it will carry these
                  fields and be queryable from{" "}
                  <code className="text-foreground">/api/v1/agent-attribution</code> or the{" "}
                  <code className="text-foreground">get_run_attribution</code> MCP tool. All fields
                  are optional.
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="agentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="claude-code, cursor, mastra, ..."
                            list="agent-id-suggestions"
                            {...field}
                          />
                        </FormControl>
                        <datalist id="agent-id-suggestions">
                          <option value="claude-code" />
                          <option value="claude-desktop" />
                          <option value="cursor" />
                          <option value="windsurf" />
                          <option value="codex" />
                          <option value="mastra" />
                          <option value="vercel-ai-sdk" />
                          <option value="langchain" />
                        </datalist>
                        <FormDescription>Stable identifier for the agent.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agentRunId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent Run ID</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input placeholder="run_..." {...field} />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              title="Generate UUID"
                              onClick={() =>
                                form.setValue(
                                  "agentRunId",
                                  `run_${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`,
                                  { shouldValidate: true }
                                )
                              }
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>Per-execution identifier.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="agentActorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Actor ID</FormLabel>
                      <FormControl>
                        <Input placeholder="user_42 (optional end-user / persona)" {...field} />
                      </FormControl>
                      <FormDescription>
                        End-user / persona the agent acted on behalf of.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agentMetadata"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Metadata (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={'{"prompt": "summarize", "tool_call_id": "tc_abc"}'}
                          rows={3}
                          className="font-mono text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Free-form JSON object. Stored on the link, returned in attribution queries.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Link
                  href="/agents"
                  className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                >
                  How agent attribution works →
                </Link>
              </TabsContent>

              <TabsContent value="pixels" className="max-h-[50vh] space-y-4 overflow-y-auto pt-4">
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

              <TabsContent value="sms" className="max-h-[50vh] space-y-4 overflow-y-auto pt-4">
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
              <Button type="submit" disabled={loading || (!!watchSlug && slugAvailable === false)}>
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
    <div className="rounded-lg border border-dashed bg-muted/30 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          <Sparkles className="mr-1 h-3 w-3" />
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
    <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mb-2 font-semibold text-lg">{title}</h3>
      <p className="mb-4 text-muted-foreground text-sm">{description}</p>
      <Badge variant="secondary" className="mb-4">
        <Sparkles className="mr-1 h-3 w-3" />
        Requires {requiredPlan} plan
      </Badge>
      <ul className="mx-auto mb-4 max-w-xs space-y-2 text-left">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
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
