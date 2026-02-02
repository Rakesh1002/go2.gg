"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Copy,
  Download,
  QrCode,
  MoreHorizontal,
  Link2,
  Sparkles,
  ScanLine,
} from "lucide-react";
import { QRCustomizer, type QRStyle } from "@/components/qr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface QRCodeData {
  id: string;
  name: string;
  url: string;
  trackingUrl: string;
  linkId: string | null;
  style: {
    size: number;
    foregroundColor: string;
    backgroundColor: string;
    logoUrl: string | null;
    logoSize: number;
    cornerRadius: number;
    errorCorrection: string;
  };
  imageUrl: string;
  stats: {
    scanCount: number;
    lastScannedAt: string | null;
  };
  createdAt: string;
}

const createQRSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  url: z.string().url("Invalid URL"),
});

type CreateQRFormData = z.infer<typeof createQRSchema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export function QRClient() {
  const [qrCodes, setQRCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [activeTab, setActiveTab] = useState("standard");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // QR customization state
  const [customStyle, setCustomStyle] = useState<QRStyle>({
    size: 256,
    foregroundColor: "#000000",
    backgroundColor: "#FFFFFF",
    logoUrl: null,
    logoSize: 0.2,
    cornerRadius: 0,
    errorCorrection: "M",
    frame: "none",
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateQRFormData>({
    resolver: zodResolver(createQRSchema),
    defaultValues: {
      url: "",
    },
  });

  const watchUrl = watch("url");

  const isValidUrl = useCallback((url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchQRCodes = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/qr`, {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        setQRCodes(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch QR codes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  async function generateAiQR() {
    if (!aiPrompt) return;
    setIsGeneratingAi(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/qr/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        // Use the AI image as the logo/background or handle it as specific AI style
        // For this implementation, we'll set it as the logoUrl to verify the flow
        setCustomStyle((prev) => ({
          ...prev,
          logoUrl: result.data.imageUrl,
          errorCorrection: "H",
        }));
        toast.success("AI Design generated!");
      } else {
        throw new Error("Failed to generate AI QR");
      }
    } catch (error) {
      toast.error("Failed to generate AI design");
      console.error(error);
    } finally {
      setIsGeneratingAi(false);
    }
  }

  async function onCreateQR(data: CreateQRFormData) {
    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          ...customStyle,
          logoSize: Math.round(customStyle.logoSize * 100), // Convert back to percentage for API if needed, or keep consistent. API schema expects 10-100.
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message ?? "Failed to create QR code");
      }

      setQRCodes((prev) => [result.data, ...prev]);
      reset();
      setDialogOpen(false);
      toast.success("QR code created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create QR code");
    } finally {
      setCreating(false);
    }
  }

  async function deleteQR(id: string) {
    try {
      const response = await fetch(`${API_URL}/api/v1/qr/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setQRCodes((prev) => prev.filter((qr) => qr.id !== id));
        if (selectedQR?.id === id) {
          setSelectedQR(null);
        }
        toast.success("QR code deleted");
      } else {
        throw new Error("Failed to delete QR code");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete QR code");
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("Copied to clipboard");
  }

  function downloadQR(qr: QRCodeData) {
    const link = document.createElement("a");
    link.download = `qr-${qr.name.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    link.href = qr.imageUrl;
    link.click();
    toast.success("QR code downloaded");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function downloadPreviewQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "qr-code.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR code downloaded");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* QR Code List */}
      <div className="lg:col-span-2 space-y-6">
        {/* Create Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your QR Codes</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit(onCreateQR)}>
                <DialogHeader>
                  <DialogTitle>Create QR Code</DialogTitle>
                  <DialogDescription>
                    Generate a customized QR code with tracking.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="e.g., Website QR" {...register("name")} />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">Destination URL</Label>
                      <Input id="url" placeholder="https://example.com" {...register("url")} />
                      {errors.url && (
                        <p className="text-sm text-destructive">{errors.url.message}</p>
                      )}
                    </div>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="standard">Standard Design</TabsTrigger>
                      <TabsTrigger value="ai">
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Generation
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="standard" className="mt-4">
                      <QRCustomizer
                        url={watchUrl}
                        initialStyle={customStyle}
                        onStyleChange={setCustomStyle}
                      />
                    </TabsContent>

                    <TabsContent value="ai" className="mt-4 space-y-4">
                      <div className="rounded-lg border bg-muted/30 p-6">
                        <Label>Describe your QR Code style</Label>
                        <div className="flex gap-2 mt-2">
                          <Textarea
                            placeholder="e.g., A futuristic neon city with blue and purple glowing lights"
                            className="resize-none"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          className="mt-4 w-full"
                          onClick={generateAiQR}
                          disabled={!aiPrompt || isGeneratingAi}
                        >
                          {isGeneratingAi ? (
                            <>Generating with AI...</>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generate Design
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Reuse Customizer to show result/preview */}
                      {customStyle.logoUrl && activeTab === "ai" && (
                        <div className="mt-8">
                          <h3 className="mb-4 font-medium">Preview</h3>
                          <QRCustomizer
                            url={watchUrl}
                            initialStyle={customStyle}
                            onStyleChange={setCustomStyle}
                          />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create QR Code"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* QR Codes Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((key) => (
              <Skeleton key={key} className="h-48 w-full" />
            ))}
          </div>
        ) : qrCodes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <QrCode className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No QR codes yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first QR code to start tracking scans.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {qrCodes.map((qr) => (
              <Card
                key={qr.id}
                className={`cursor-pointer transition-colors hover:border-primary/50 ${
                  selectedQR?.id === qr.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedQR(qr)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <img
                        src={qr.imageUrl}
                        alt={qr.name}
                        className="h-24 w-24 rounded-lg border"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold truncate">{qr.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{qr.url}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadQR(qr);
                              }}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download PNG
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                copyUrl(qr.trackingUrl);
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Tracking URL
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteQR(qr.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 flex items-center gap-4">
                        <Badge variant="secondary">
                          <ScanLine className="mr-1 h-3 w-3" />
                          {qr.stats.scanCount} scans
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Details Panel */}
      <div className="lg:sticky lg:top-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedQR ? "QR Code Details" : "Quick Generate"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedQR ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <img
                    src={selectedQR.imageUrl}
                    alt={selectedQR.name}
                    className="h-48 w-48 rounded-lg border"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedQR.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{selectedQR.url}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{selectedQR.stats.scanCount}</p>
                    <p className="text-xs text-muted-foreground">Total Scans</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-bold">{selectedQR.style.size}px</p>
                    <p className="text-xs text-muted-foreground">Size</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => downloadQR(selectedQR)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={() => copyUrl(selectedQR.trackingUrl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="pt-4 border-t">
                  <Label className="text-muted-foreground">Tracking URL</Label>
                  <p className="text-sm mt-1 break-all">{selectedQR.trackingUrl}</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a QR code to view details</p>
                <p className="text-sm mt-2">or create a new one to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
