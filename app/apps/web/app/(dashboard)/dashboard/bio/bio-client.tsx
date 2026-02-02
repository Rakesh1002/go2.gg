"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GalleryItemsList, ThemeSelector } from "@/components/bio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Copy,
  Link2,
  ExternalLink,
  MoreHorizontal,
  GripVertical,
  Eye,
  EyeOff,
  Pencil,
  Palette,
  Settings,
  BarChart3,
  Image,
  Type,
  Minus,
  Youtube,
} from "lucide-react";

interface Gallery {
  id: string;
  slug: string;
  domain: string;
  url: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  theme: string;
  themeConfig: Record<string, unknown> | null;
  socialLinks: Array<{ platform: string; url: string }>;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  items?: GalleryItem[];
}

interface GalleryItem {
  id: string;
  type: "link" | "header" | "divider" | "embed" | "image";
  title: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  iconName: string | null;
  position: number;
  isVisible: boolean;
  clickCount: number;
  embedType: string | null;
  embedData: Record<string, unknown> | null;
}

const THEMES = [
  { id: "default", name: "Default", description: "Clean and minimal" },
  { id: "minimal", name: "Minimal", description: "Ultra-simple design" },
  { id: "gradient", name: "Gradient", description: "Beautiful color gradients" },
  { id: "dark", name: "Dark", description: "Dark mode styling" },
  { id: "neon", name: "Neon", description: "Vibrant neon colors" },
  { id: "pastel", name: "Pastel", description: "Soft pastel colors" },
];

const ITEM_TYPES = [
  { id: "link", name: "Link", icon: Link2, description: "Add a clickable link" },
  { id: "header", name: "Header", icon: Type, description: "Add a section header" },
  { id: "divider", name: "Divider", icon: Minus, description: "Add a visual separator" },
  { id: "embed", name: "Embed", icon: Youtube, description: "Embed video or audio" },
  { id: "image", name: "Image", icon: Image, description: "Add an image" },
] as const;

const createGallerySchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, hyphens, and underscores"),
  title: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
});

const createItemSchema = z.object({
  type: z.enum(["link", "header", "divider", "embed", "image"]),
  title: z.string().max(100).optional(),
  url: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type CreateGalleryFormData = z.infer<typeof createGallerySchema>;
type CreateItemFormData = z.infer<typeof createItemSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export function BioClient() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [selectedItemType, setSelectedItemType] =
    useState<(typeof ITEM_TYPES)[number]["id"]>("link");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGalleryFormData>({
    resolver: zodResolver(createGallerySchema),
  });

  const {
    register: registerItem,
    handleSubmit: handleSubmitItem,
    reset: resetItem,
    formState: { errors: itemErrors },
  } = useForm<CreateItemFormData>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      type: "link",
    },
  });

  useEffect(() => {
    fetchGalleries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchGalleries() {
    try {
      const response = await fetch(`${API_URL}/api/v1/galleries`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setGalleries(result.data);
        if (result.data.length > 0) {
          fetchGalleryDetails(result.data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch galleries:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGalleryDetails(id: string) {
    try {
      const response = await fetch(`${API_URL}/api/v1/galleries/${id}`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedGallery(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch gallery details:", error);
    }
  }

  async function onCreateGallery(data: CreateGalleryFormData) {
    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/galleries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Failed to create gallery");
      }

      setGalleries((prev) => [result.data, ...prev]);
      setSelectedGallery(result.data);
      reset();
      setDialogOpen(false);
      toast.success("Bio page created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create gallery");
    } finally {
      setCreating(false);
    }
  }

  async function deleteGallery(id: string) {
    try {
      const response = await fetch(`${API_URL}/api/v1/galleries/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setGalleries((prev) => prev.filter((g) => g.id !== id));
        if (selectedGallery?.id === id) {
          setSelectedGallery(galleries.find((g) => g.id !== id) ?? null);
        }
        toast.success("Bio page deleted");
      } else {
        throw new Error("Failed to delete gallery");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete gallery");
    }
  }

  async function togglePublish(id: string, isPublished: boolean) {
    try {
      const response = await fetch(`${API_URL}/api/v1/galleries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished }),
        credentials: "include",
      });

      if (response.ok) {
        setGalleries((prev) => prev.map((g) => (g.id === id ? { ...g, isPublished } : g)));
        if (selectedGallery?.id === id) {
          setSelectedGallery((prev) => (prev ? { ...prev, isPublished } : null));
        }
        toast.success(isPublished ? "Bio page published" : "Bio page unpublished");
      } else {
        throw new Error("Failed to update gallery");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update gallery");
    }
  }

  async function updateTheme(id: string, theme: string) {
    try {
      const response = await fetch(`${API_URL}/api/v1/galleries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
        credentials: "include",
      });

      if (response.ok) {
        await response.json();
        setGalleries((prev) => prev.map((g) => (g.id === id ? { ...g, theme } : g)));
        if (selectedGallery?.id === id) {
          setSelectedGallery((prev) => (prev ? { ...prev, theme } : null));
        }
        toast.success("Theme updated");
      } else {
        throw new Error("Failed to update theme");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update theme");
    }
  }

  async function addItem(data: CreateItemFormData) {
    if (!selectedGallery) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/galleries/${selectedGallery.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedItemType,
          title: data.title,
          url: data.url || undefined,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Failed to add item");
      }

      setSelectedGallery((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          items: [...(prev.items ?? []), result.data],
        };
      });
      resetItem();
      setAddItemDialogOpen(false);
      toast.success("Item added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add item");
    }
  }

  async function deleteItem(itemId: string) {
    if (!selectedGallery) return;

    try {
      const response = await fetch(
        `${API_URL}/api/v1/galleries/${selectedGallery.id}/items/${itemId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setSelectedGallery((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: (prev.items ?? []).filter((item) => item.id !== itemId),
          };
        });
        toast.success("Item deleted");
      } else {
        throw new Error("Failed to delete item");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete item");
    }
  }

  async function toggleItemVisibility(itemId: string, isVisible: boolean) {
    if (!selectedGallery) return;

    try {
      const response = await fetch(
        `${API_URL}/api/v1/galleries/${selectedGallery.id}/items/${itemId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isVisible }),
          credentials: "include",
        }
      );

      if (response.ok) {
        setSelectedGallery((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            items: (prev.items ?? []).map((item) =>
              item.id === itemId ? { ...item, isVisible } : item
            ),
          };
        });
      } else {
        throw new Error("Failed to update item");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update item");
    }
  }

  const reorderItems = useCallback(
    async (items: Array<{ id: string; position: number }>) => {
      if (!selectedGallery) return;

      try {
        const response = await fetch(
          `${API_URL}/api/v1/galleries/${selectedGallery.id}/items/reorder`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items }),
            credentials: "include",
          }
        );

        if (response.ok) {
          const result = await response.json();
          setSelectedGallery((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              items: result.data,
            };
          });
          toast.success("Items reordered");
        } else {
          throw new Error("Failed to reorder items");
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to reorder items");
      }
    },
    [selectedGallery]
  );

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("Copied to clipboard");
  }

  function getItemIcon(type: string) {
    const itemType = ITEM_TYPES.find((t) => t.id === type);
    return itemType?.icon ?? Link2;
  }

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-[600px] w-full" />
        </div>
        <div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Gallery Editor */}
      <div className="lg:col-span-2 space-y-6">
        {/* Gallery Selector & Create */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {galleries.length > 0 && (
              <Select
                value={selectedGallery?.id ?? ""}
                onValueChange={(id) => fetchGalleryDetails(id)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a bio page" />
                </SelectTrigger>
                <SelectContent>
                  {galleries.map((gallery) => (
                    <SelectItem key={gallery.id} value={gallery.id}>
                      @{gallery.slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Bio Page
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit(onCreateGallery)}>
                <DialogHeader>
                  <DialogTitle>Create Bio Page</DialogTitle>
                  <DialogDescription>
                    Create a new link-in-bio page to share your links.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="slug">Username / Slug</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-muted-foreground">@</span>
                      <Input id="slug" placeholder="myprofile" {...register("slug")} />
                    </div>
                    {errors.slug && (
                      <p className="mt-1 text-sm text-destructive">{errors.slug.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="title">Display Name (optional)</Label>
                    <Input
                      id="title"
                      placeholder="Your Name"
                      className="mt-2"
                      {...register("title")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio (optional)</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell the world about yourself..."
                      className="mt-2"
                      {...register("bio")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Editor Content */}
        {selectedGallery ? (
          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">
                <Link2 className="mr-2 h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="appearance">
                <Palette className="mr-2 h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              {/* Add Item Button */}
              <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSubmitItem(addItem)}>
                    <DialogHeader>
                      <DialogTitle>Add Item</DialogTitle>
                      <DialogDescription>Add a new item to your bio page.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Item Type</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {ITEM_TYPES.map((type) => (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setSelectedItemType(type.id)}
                              className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                                selectedItemType === type.id
                                  ? "border-primary bg-primary/5"
                                  : "border-muted hover:border-muted-foreground/50"
                              }`}
                            >
                              <type.icon className="h-5 w-5" />
                              <span className="text-sm font-medium">{type.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      {selectedItemType !== "divider" && (
                        <div>
                          <Label htmlFor="item-title">Title</Label>
                          <Input
                            id="item-title"
                            placeholder={
                              selectedItemType === "header" ? "Section Header" : "Link Title"
                            }
                            className="mt-2"
                            {...registerItem("title")}
                          />
                        </div>
                      )}
                      {(selectedItemType === "link" || selectedItemType === "embed") && (
                        <div>
                          <Label htmlFor="item-url">URL</Label>
                          <Input
                            id="item-url"
                            placeholder="https://example.com"
                            className="mt-2"
                            {...registerItem("url")}
                          />
                          {itemErrors.url && (
                            <p className="mt-1 text-sm text-destructive">
                              {itemErrors.url.message}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddItemDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Add Item</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Items List with Drag-and-Drop */}
              <GalleryItemsList
                items={selectedGallery.items ?? []}
                onReorder={reorderItems}
                onToggleVisibility={toggleItemVisibility}
                onDelete={deleteItem}
              />
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <ThemeSelector
                selectedTheme={selectedGallery.theme}
                onSelectTheme={(theme) => updateTheme(selectedGallery.id, theme)}
              />
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Page Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Published</Label>
                      <p className="text-sm text-muted-foreground">
                        Make your bio page visible to the public.
                      </p>
                    </div>
                    <Switch
                      checked={selectedGallery.isPublished}
                      onCheckedChange={(checked) => togglePublish(selectedGallery.id, checked)}
                    />
                  </div>
                  <div className="border-t pt-6">
                    <Label className="text-destructive">Danger Zone</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete this bio page and all its items.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this bio page?")) {
                          deleteGallery(selectedGallery.id);
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Bio Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Total Views</p>
                      <p className="text-3xl font-bold">{selectedGallery.viewCount}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Total Clicks</p>
                      <p className="text-3xl font-bold">
                        {selectedGallery.items?.reduce(
                          (sum, item) => sum + (item.clickCount ?? 0),
                          0
                        ) ?? 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Link2 className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No bio pages yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first link-in-bio page to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Panel */}
      <div className="lg:sticky lg:top-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Preview</CardTitle>
            {selectedGallery && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => copyUrl(selectedGallery.url)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <a href={selectedGallery.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {selectedGallery ? (
              <div className="rounded-xl border bg-muted/30 p-4 min-h-[400px]">
                {/* Mobile frame preview */}
                <div className="mx-auto max-w-[320px] rounded-3xl border-4 border-muted bg-background p-4 shadow-lg">
                  <div className="flex flex-col items-center text-center">
                    {selectedGallery.avatarUrl ? (
                      <img
                        src={selectedGallery.avatarUrl}
                        alt={selectedGallery.title ?? "Avatar"}
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                        {selectedGallery.title?.[0] ?? selectedGallery.slug[0]?.toUpperCase()}
                      </div>
                    )}
                    <h3 className="mt-4 font-bold">
                      {selectedGallery.title ?? `@${selectedGallery.slug}`}
                    </h3>
                    {selectedGallery.bio && (
                      <p className="mt-2 text-xs text-muted-foreground">{selectedGallery.bio}</p>
                    )}
                    <div className="mt-6 w-full space-y-3">
                      {selectedGallery.items
                        ?.filter((i) => i.isVisible)
                        .map((item) => (
                          <div key={item.id}>
                            {item.type === "divider" ? (
                              <hr className="border-muted" />
                            ) : item.type === "header" ? (
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {item.title}
                              </p>
                            ) : (
                              <div className="rounded-lg border bg-card p-3 text-sm font-medium hover:bg-muted transition-colors cursor-pointer">
                                {item.title}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
                Select or create a bio page to see preview
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
