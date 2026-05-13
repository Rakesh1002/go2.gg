"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  ScanLine,
} from "lucide-react";
import { QRCustomizer, type QRStyle } from "@/components/qr";

// Matches the flat shape returned by GET /api/v1/qr and POST /api/v1/qr.
// The server does not return imageUrl/trackingUrl — the QR is rendered
// client-side from the saved style fields.
interface QRCodeData {
  id: string;
  name: string;
  url: string;
  linkId: string | null;
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  logoUrl: string | null;
  logoSize?: number;
  cornerRadius?: number;
  errorCorrection?: string;
  scanCount: number;
  lastScannedAt?: string | null;
  createdAt: string;
}

interface QRRenderInstance {
  update: (o: unknown) => void;
  append: (el: HTMLElement) => void;
  download: (o: { name: string; extension: "png" | "svg" }) => void;
}

async function preflightLogoUrl(
  logoUrl: string | null | undefined,
  budgetMs: number,
): Promise<string | undefined> {
  if (!logoUrl) return undefined;
  return new Promise<string | undefined>((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (val: string | undefined) => {
      if (done) return;
      done = true;
      resolve(val);
    };
    const t = setTimeout(() => finish(undefined), budgetMs);
    img.onload = () => {
      clearTimeout(t);
      finish(logoUrl);
    };
    img.onerror = () => {
      clearTimeout(t);
      finish(undefined);
    };
    img.src = logoUrl;
  });
}

function QRThumbnail({
  qr,
  pixelSize,
  className,
  instanceRef,
}: {
  qr: QRCodeData;
  pixelSize: number;
  className?: string;
  instanceRef?: React.MutableRefObject<QRRenderInstance | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { default: QRCodeStyling } = await import("qr-code-styling");
      if (cancelled || !containerRef.current) return;

      // Defensive: skip legacy oversized logos and anything that doesn't
      // decode in time. qr-code-styling has no onerror on its internal
      // Image, so a stuck logo blanks the entire QR pattern.
      const MAX_LOGO_BYTES = 500_000;
      const candidate =
        qr.logoUrl && qr.logoUrl.length <= MAX_LOGO_BYTES ? qr.logoUrl : null;
      const usableLogo = await preflightLogoUrl(candidate, 1500);
      if (cancelled || !containerRef.current) return;

      const options = {
        width: pixelSize,
        height: pixelSize,
        type: "canvas" as const,
        data: qr.url,
        margin: 4,
        qrOptions: {
          errorCorrectionLevel: (qr.errorCorrection ?? "M") as "L" | "M" | "Q" | "H",
        },
        dotsOptions: { type: "rounded" as const, color: qr.foregroundColor },
        backgroundOptions: { color: qr.backgroundColor },
        cornersSquareOptions: {
          type: "extra-rounded" as const,
          color: qr.foregroundColor,
        },
        cornersDotOptions: { type: "dot" as const, color: qr.foregroundColor },
        image: usableLogo,
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: Math.min(0.25, (qr.logoSize ?? 20) / 100),
          margin: 2,
        },
      };

      // Always reinstantiate per change. update() wipes the container before
      // awaiting loadImage(), which leaves the box blank if loadImage stalls.
      const Ctor = QRCodeStyling as unknown as new (o: unknown) => QRRenderInstance;
      const instance = new Ctor(options);
      containerRef.current.innerHTML = "";
      instance.append(containerRef.current);
      if (instanceRef) instanceRef.current = instance;
    })();
    return () => {
      cancelled = true;
    };
  }, [
    qr.url,
    qr.foregroundColor,
    qr.backgroundColor,
    qr.logoUrl,
    qr.logoSize,
    qr.errorCorrection,
    pixelSize,
    instanceRef,
  ]);

  return <div ref={containerRef} className={className} />;
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

  const _isValidUrl = useCallback((url: string) => {
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

  const detailQrRef = useRef<QRRenderInstance | null>(null);

  function downloadQR(qr: QRCodeData) {
    const safeName = qr.name.replace(/[^a-zA-Z0-9]/g, "_");
    const instance = detailQrRef.current;
    if (instance) {
      instance.download({ name: `qr-${safeName}`, extension: "png" });
      toast.success("QR code downloaded");
      return;
    }
    toast.error("QR not ready yet — open it first, then try again");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* QR Code List */}
      <div className="space-y-6 lg:col-span-2">
        {/* Create Button */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Your QR Codes</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
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
                        <p className="text-destructive text-sm">{errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">Destination URL</Label>
                      <Input id="url" placeholder="https://example.com" {...register("url")} />
                      {errors.url && (
                        <p className="text-destructive text-sm">{errors.url.message}</p>
                      )}
                    </div>
                  </div>

                  <QRCustomizer
                    url={watchUrl}
                    initialStyle={customStyle}
                    onStyleChange={setCustomStyle}
                  />
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
              <p className="mt-2 text-muted-foreground text-sm">
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
                      <QRThumbnail
                        qr={qr}
                        pixelSize={96}
                        className="h-24 w-24 overflow-hidden rounded-lg border [&>svg]:h-full [&>svg]:w-full [&>canvas]:h-full [&>canvas]:w-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="truncate font-semibold">{qr.name}</h3>
                          <p className="truncate text-muted-foreground text-sm">{qr.url}</p>
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
                                copyUrl(qr.url);
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy URL
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
                          {qr.scanCount ?? 0} scans
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
              {selectedQR ? "QR Code Details" : "QR Code Preview"}
            </CardTitle>
            {!selectedQR && (
              <CardDescription>
                Pick a QR from the list to see its scans and tracking URL, or
                hit “Create QR Code” to make a new one.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedQR ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <QRThumbnail
                    qr={selectedQR}
                    pixelSize={192}
                    instanceRef={detailQrRef}
                    className="h-48 w-48 overflow-hidden rounded-lg border [&>svg]:h-full [&>svg]:w-full [&>canvas]:h-full [&>canvas]:w-full"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedQR.name}</h3>
                  <p className="truncate text-muted-foreground text-sm">{selectedQR.url}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-lg border p-3">
                    <p className="font-bold text-2xl">{selectedQR.scanCount ?? 0}</p>
                    <p className="text-muted-foreground text-xs">Total Scans</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="font-bold text-2xl">{selectedQR.size}px</p>
                    <p className="text-muted-foreground text-xs">Size</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => downloadQR(selectedQR)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={() => copyUrl(selectedQR.url)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Encoded URL</Label>
                  <p className="mt-1 break-all text-sm">{selectedQR.url}</p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <QrCode className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Select a QR code to view details</p>
                <p className="mt-2 text-sm">or create a new one to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
