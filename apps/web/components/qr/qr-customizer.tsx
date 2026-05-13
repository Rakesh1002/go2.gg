"use client";

import { useState, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Upload, X, } from "lucide-react";
import { cn } from "@/lib/utils";

type DotType = "square" | "rounded" | "dots" | "classy" | "classy-rounded" | "extra-rounded";
type CornerSquareType = "square" | "dot" | "extra-rounded";

interface QRCustomizerProps {
  url: string;
  initialStyle?: QRStyle;
  onStyleChange: (style: QRStyle) => void;
}

export interface QRStyle {
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  logoUrl: string | null;
  logoSize: number;
  cornerRadius: number;
  errorCorrection: "L" | "M" | "Q" | "H";
  frame: "none" | "simple" | "branded";
  /** Dot rendering style — added when migrating to qr-code-styling */
  dotType?: DotType;
  /** Corner-square rendering style — added when migrating to qr-code-styling */
  cornerSquareType?: CornerSquareType;
}

const DEFAULT_STYLE: QRStyle = {
  size: 256,
  foregroundColor: "#000000",
  backgroundColor: "#ffffff",
  logoUrl: null,
  logoSize: 0.2, // 20% of QR size
  cornerRadius: 0,
  errorCorrection: "M",
  frame: "none",
  dotType: "rounded",
  cornerSquareType: "extra-rounded",
};

// Resolve to the logo URL only if the browser can actually decode it within
// the budget. qr-code-styling has no onerror on its internal Image, so a
// silently failing logo would otherwise hang the entire render.
async function preflightLogo(
  logoUrl: string | null,
  budgetMs: number,
): Promise<string | null> {
  if (!logoUrl) return null;
  return new Promise<string | null>((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (val: string | null) => {
      if (done) return;
      done = true;
      resolve(val);
    };
    const t = setTimeout(() => finish(null), budgetMs);
    img.onload = () => {
      clearTimeout(t);
      finish(logoUrl);
    };
    img.onerror = () => {
      clearTimeout(t);
      finish(null);
    };
    img.src = logoUrl;
  });
}

export function QRCustomizer({ url, initialStyle, onStyleChange }: QRCustomizerProps) {
  const [style, setStyle] = useState<QRStyle>(initialStyle || DEFAULT_STYLE);
  const previewRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<unknown>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Propagate changes to parent
  useEffect(() => {
    onStyleChange(style);
  }, [style, onStyleChange]);

  // Render QR locally with qr-code-styling. Lazy-imported because the library
  // is browser-only and pulls in canvas/svg dependencies.
  //
  // We always tear down + recreate the instance instead of calling update().
  // qr-code-styling's update() clears the container synchronously, then awaits
  // loadImage() before redrawing — and its loadImage has no onerror handler,
  // so any hiccup loading the logo data: URI leaves the preview permanently
  // blank. Fully reinstantiating per change avoids that whole code path.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!previewRef.current) return;
      const { default: QRCodeStyling } = await import("qr-code-styling");
      if (cancelled || !previewRef.current) return;

      // Preview always renders at a fixed pixel size — `style.size` controls the
      // exported PNG/SVG, not the on-screen preview.
      const PREVIEW_SIZE = 256;
      // Pre-flight the logo: if the data URL doesn't decode within a budget,
      // drop it for this render so the QR pattern still draws. Saves us from
      // qr-code-styling's hanging-on-bad-image behavior.
      const usableLogo = await preflightLogo(style.logoUrl ?? null, 1500);
      if (cancelled || !previewRef.current) return;

      const options = {
        width: PREVIEW_SIZE,
        height: PREVIEW_SIZE,
        type: "canvas" as const,
        data: url || "https://go2.gg",
        margin: 8,
        qrOptions: { errorCorrectionLevel: style.errorCorrection },
        dotsOptions: {
          type: (style.dotType ?? "rounded") as DotType,
          color: style.foregroundColor,
        },
        backgroundOptions: { color: style.backgroundColor },
        cornersSquareOptions: {
          type: (style.cornerSquareType ?? "extra-rounded") as CornerSquareType,
          color: style.foregroundColor,
        },
        cornersDotOptions: { type: "dot" as const, color: style.foregroundColor },
        image: usableLogo ?? undefined,
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: style.logoSize,
          margin: 4,
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = new (QRCodeStyling as unknown as new (o: unknown) => any)(
        options,
      );
      previewRef.current.innerHTML = "";
      instance.append(previewRef.current);
      qrInstanceRef.current = instance;
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url, style]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const original = e.target?.result as string;
      // Cap at ~512px JPEG so large uploads don't blow up the SVG/D1 row.
      const compressed = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const max = 512;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(original);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => resolve(original);
        img.src = original;
      });
      setStyle((prev) => ({ ...prev, logoUrl: compressed, errorCorrection: "H" }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setStyle((prev) => ({ ...prev, logoUrl: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Editor Controls */}
      <div className="space-y-6">
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="logo">Logo & Frame</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="mt-4 space-y-6">
            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Foreground</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={style.foregroundColor}
                    onChange={(e) => setStyle({ ...style, foregroundColor: e.target.value })}
                    className="h-10 w-12 cursor-pointer p-1"
                  />
                  <Input
                    value={style.foregroundColor}
                    onChange={(e) => setStyle({ ...style, foregroundColor: e.target.value })}
                    className="flex-1 font-mono uppercase"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Background</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={style.backgroundColor}
                    onChange={(e) => setStyle({ ...style, backgroundColor: e.target.value })}
                    className="h-10 w-12 cursor-pointer p-1"
                  />
                  <Input
                    value={style.backgroundColor}
                    onChange={(e) => setStyle({ ...style, backgroundColor: e.target.value })}
                    className="flex-1 font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Size */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Size (px)</Label>
                <span className="text-muted-foreground text-sm">{style.size}px</span>
              </div>
              <Slider
                value={[style.size]}
                min={128}
                max={2048}
                step={32}
                onValueChange={([val]) => setStyle({ ...style, size: val })}
              />
            </div>

            {/* Error Correction */}
            <div className="space-y-2">
              <Label>Error Correction</Label>
              <Select
                value={style.errorCorrection}
                onValueChange={(val: "L" | "M" | "Q" | "H") =>
                  setStyle({ ...style, errorCorrection: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Low (7%)</SelectItem>
                  <SelectItem value="M">Medium (15%)</SelectItem>
                  <SelectItem value="Q">Quartile (25%)</SelectItem>
                  <SelectItem value="H">High (30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dot Style */}
            <div className="space-y-2">
              <Label>Dot style</Label>
              <Select
                value={style.dotType ?? "rounded"}
                onValueChange={(val) =>
                  setStyle({ ...style, dotType: val as DotType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="rounded">Rounded</SelectItem>
                  <SelectItem value="dots">Dots</SelectItem>
                  <SelectItem value="classy">Classy</SelectItem>
                  <SelectItem value="classy-rounded">Classy rounded</SelectItem>
                  <SelectItem value="extra-rounded">Extra rounded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Corner Squares Style */}
            <div className="space-y-2">
              <Label>Corner squares</Label>
              <Select
                value={style.cornerSquareType ?? "extra-rounded"}
                onValueChange={(val) =>
                  setStyle({ ...style, cornerSquareType: val as CornerSquareType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="dot">Dot</SelectItem>
                  <SelectItem value="extra-rounded">Extra rounded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="logo" className="mt-4 space-y-6">
            {/* Logo Upload */}
            <div className="space-y-4">
              <Label>Logo</Label>
              {style.logoUrl ? (
                <div className="relative inline-block">
                  <img
                    src={style.logoUrl}
                    alt="Logo preview"
                    className="h-20 w-20 rounded-lg border bg-muted/20 object-contain"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="-right-2 -top-2 absolute h-6 w-6 rounded-full"
                    onClick={removeLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
                  <div className="text-center">
                    <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <p className="mt-2 text-muted-foreground text-xs">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Logo Size */}
            {style.logoUrl && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Logo Size</Label>
                  <span className="text-muted-foreground text-sm">
                    {Math.round(style.logoSize * 100)}%
                  </span>
                </div>
                <Slider
                  value={[style.logoSize * 100]}
                  min={10}
                  max={25}
                  step={5}
                  onValueChange={([val]) => setStyle({ ...style, logoSize: val / 100 })}
                />
              </div>
            )}

            {/* Template / Frame (Mock functionality for now) */}
            <div className="space-y-2">
              <Label>Frame Style</Label>
              <div className="grid grid-cols-3 gap-2">
                {["none", "simple", "branded"].map((frame) => (
                  <button
                    key={frame}
                    type="button"
                    onClick={() => setStyle({ ...style, frame: frame as any })}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-md border p-2 text-sm capitalize",
                      style.frame === frame
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-muted hover:bg-muted/50"
                    )}
                  >
                    {frame}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Panel */}
      <div className="flex flex-col items-center justify-center overflow-hidden rounded-xl border bg-muted/20 p-8">
        <div className="relative w-full max-w-[256px] rounded-lg border bg-white p-4 shadow-sm">
          <div
            ref={previewRef}
            className="[&>svg]:!h-full [&>svg]:!w-full aspect-square w-full [&>svg]:block"
          />
        </div>
        <p className="mt-6 text-center text-muted-foreground text-sm">Live preview</p>
      </div>
    </div>
  );
}
