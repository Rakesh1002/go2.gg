"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Copy } from "lucide-react";
import { toast } from "sonner";

interface QRCodeGeneratorProps {
  url: string;
  title?: string;
}

export function QRCodeGenerator({ url, title }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(256);
  const [foreground, setForeground] = useState("#000000");
  const [background, setBackground] = useState("#ffffff");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateQR();
  }, [url, size, foreground, background]);

  async function generateQR() {
    setLoading(true);
    try {
      // Using QR Server API for generation
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=${foreground.replace("#", "")}&bgcolor=${background.replace("#", "")}`;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, size, size);
        setLoading(false);
      };
      img.src = qrUrl;
    } catch (error) {
      console.error("Error generating QR:", error);
      toast.error("Failed to generate QR code");
      setLoading(false);
    }
  }

  function downloadQR(format: "png" | "svg") {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (format === "png") {
      const link = document.createElement("a");
      link.download = `qr-${title ?? "code"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("QR code downloaded");
    } else {
      // For SVG, we'll use a different approach
      toast.info("SVG download coming soon");
    }
  }

  async function copyQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        toast.success("QR code copied to clipboard");
      });
    } catch (error) {
      console.error("Error copying QR:", error);
      toast.error("Failed to copy QR code");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <canvas
              ref={canvasRef}
              className={`rounded-lg border ${loading ? "opacity-50" : ""}`}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Size</Label>
            <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="128">128x128</SelectItem>
                <SelectItem value="256">256x256</SelectItem>
                <SelectItem value="512">512x512</SelectItem>
                <SelectItem value="1024">1024x1024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Foreground</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Background</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => downloadQR("png")} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download PNG
          </Button>
          <Button variant="outline" onClick={copyQR}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-center text-muted-foreground">{url}</p>
      </CardContent>
    </Card>
  );
}
