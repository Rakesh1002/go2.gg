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
import { Card } from "@/components/ui/card";
import { Upload, X, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

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
};

export function QRCustomizer({ url, initialStyle, onStyleChange }: QRCustomizerProps) {
  const [style, setStyle] = useState<QRStyle>(initialStyle || DEFAULT_STYLE);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Propagate changes to parent
  useEffect(() => {
    onStyleChange(style);
  }, [style, onStyleChange]);

  // Generate QR Preview
  useEffect(() => {
    // Debounce generation to avoid excessive API calls/renders
    const timer = setTimeout(() => {
      generatePreview();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, style]);

  const generatePreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Using QR Server API for base generation (simplest for now)
    // In a real app, we might use a JS library like 'qrcode' to render locally for speed
    // But since we want to handle corner radius etc, we might need a more custom canvas drawing approach
    // For this mock, we will use the API to get the base QR and then draw over it

    const fg = style.foregroundColor.replace("#", "");
    const bg = style.backgroundColor.replace("#", "");
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${style.size}x${style.size}&data=${encodeURIComponent(
      url || "https://go2.gg"
    )}&color=${fg}&bgcolor=${bg}&qzone=1&ecc=${style.errorCorrection}`;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Set canvas size
      canvas.width = style.size;
      canvas.height = style.size;

      // Draw Base QR
      ctx.drawImage(img, 0, 0, style.size, style.size);

      // Apply Logo if exists
      if (style.logoUrl) {
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.onload = () => {
          const logoSizePx = style.size * style.logoSize;
          const x = (style.size - logoSizePx) / 2;
          const y = (style.size - logoSizePx) / 2;

          // Draw white background for logo
          ctx.fillStyle = style.backgroundColor;
          ctx.fillRect(x, y, logoSizePx, logoSizePx);

          // Draw logo
          ctx.drawImage(logo, x + 2, y + 2, logoSizePx - 4, logoSizePx - 4);
        };
        logo.src = style.logoUrl;
      }
    };
    img.src = qrUrl;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setStyle((prev) => ({ ...prev, logoUrl: result, errorCorrection: "H" })); // Boost ECC when adding logo
      };
      reader.readAsDataURL(file);
    }
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

          <TabsContent value="appearance" className="space-y-6 mt-4">
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
                <span className="text-sm text-muted-foreground">{style.size}px</span>
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
          </TabsContent>

          <TabsContent value="logo" className="space-y-6 mt-4">
            {/* Logo Upload */}
            <div className="space-y-4">
              <Label>Logo</Label>
              {style.logoUrl ? (
                <div className="relative inline-block">
                  <img
                    src={style.logoUrl}
                    alt="Logo preview"
                    className="h-20 w-20 rounded-lg border object-contain bg-muted/20"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
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
                    <p className="mt-2 text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Logo Size */}
            {style.logoUrl && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Logo Size</Label>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(style.logoSize * 100)}%
                  </span>
                </div>
                <Slider
                  value={[style.logoSize * 100]}
                  min={10}
                  max={40}
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
                      "flex flex-col items-center justify-center p-2 rounded-md border text-sm capitalize",
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
      <div className="flex flex-col items-center justify-center rounded-xl border bg-muted/20 p-8">
        <div className="relative rounded-lg bg-white p-4 shadow-sm border">
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto"
            style={{ width: "256px", height: "256px" }}
          />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">Live Preview (Canvas)</p>
      </div>
    </div>
  );
}
