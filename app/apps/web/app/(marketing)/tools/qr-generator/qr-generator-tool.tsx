"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Copy, Link2, Mail, Phone, Wifi, MapPin } from "lucide-react";
import { toast } from "sonner";

type QRType = "url" | "text" | "email" | "phone" | "wifi" | "location";

interface WifiData {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
}

interface LocationData {
  latitude: string;
  longitude: string;
}

export function QRGeneratorTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrType, setQrType] = useState<QRType>("url");
  const [content, setContent] = useState("");
  const [size, setSize] = useState(256);
  const [foreground, setForeground] = useState("#000000");
  const [background, setBackground] = useState("#FFFFFF");
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M");
  const [loading, setLoading] = useState(false);

  // WiFi specific state
  const [wifi, setWifi] = useState<WifiData>({
    ssid: "",
    password: "",
    encryption: "WPA",
  });

  // Location specific state
  const [location, setLocation] = useState<LocationData>({
    latitude: "",
    longitude: "",
  });

  // Email specific state
  const [email, setEmail] = useState({ to: "", subject: "", body: "" });

  // Generate QR content based on type
  function getQRContent(): string {
    switch (qrType) {
      case "url":
      case "text":
        return content;
      case "email":
        let mailto = `mailto:${email.to}`;
        const params: string[] = [];
        if (email.subject) params.push(`subject=${encodeURIComponent(email.subject)}`);
        if (email.body) params.push(`body=${encodeURIComponent(email.body)}`);
        if (params.length) mailto += `?${params.join("&")}`;
        return mailto;
      case "phone":
        return `tel:${content}`;
      case "wifi":
        return `WIFI:T:${wifi.encryption};S:${wifi.ssid};P:${wifi.password};;`;
      case "location":
        return `geo:${location.latitude},${location.longitude}`;
      default:
        return content;
    }
  }

  useEffect(() => {
    const qrContent = getQRContent();
    if (qrContent) {
      generateQR(qrContent);
    }
  }, [content, size, foreground, background, errorCorrection, qrType, wifi, location, email]);

  async function generateQR(data: string) {
    if (!data) return;

    setLoading(true);
    try {
      const fg = foreground.replace("#", "");
      const bg = background.replace("#", "");
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=${fg}&bgcolor=${bg}&ecc=${errorCorrection}`;

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
      img.onerror = () => {
        setLoading(false);
      };
      img.src = qrUrl;
    } catch (error) {
      console.error("Error generating QR:", error);
      setLoading(false);
    }
  }

  function downloadQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `qr-code-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR code downloaded");
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

  const QR_TYPES = [
    { id: "url", name: "URL", icon: Link2, placeholder: "https://example.com" },
    { id: "text", name: "Text", icon: Link2, placeholder: "Enter your text" },
    { id: "email", name: "Email", icon: Mail, placeholder: "" },
    { id: "phone", name: "Phone", icon: Phone, placeholder: "+1234567890" },
    { id: "wifi", name: "WiFi", icon: Wifi, placeholder: "" },
    { id: "location", name: "Location", icon: MapPin, placeholder: "" },
  ] as const;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Input Panel */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* QR Type Selector */}
          <div>
            <Label className="mb-3 block">QR Code Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {QR_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setQrType(type.id);
                    setContent("");
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                    qrType === type.id
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  }`}
                >
                  <type.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{type.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Input (varies by type) */}
          {qrType === "url" && (
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          {qrType === "text" && (
            <div>
              <Label htmlFor="text">Text</Label>
              <Input
                id="text"
                placeholder="Enter your text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          {qrType === "phone" && (
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-2"
              />
            </div>
          )}

          {qrType === "email" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-to">To</Label>
                <Input
                  id="email-to"
                  type="email"
                  placeholder="email@example.com"
                  value={email.to}
                  onChange={(e) => setEmail({ ...email, to: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email-subject">Subject (optional)</Label>
                <Input
                  id="email-subject"
                  placeholder="Email subject"
                  value={email.subject}
                  onChange={(e) => setEmail({ ...email, subject: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email-body">Body (optional)</Label>
                <Input
                  id="email-body"
                  placeholder="Email body"
                  value={email.body}
                  onChange={(e) => setEmail({ ...email, body: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {qrType === "wifi" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="wifi-ssid">Network Name (SSID)</Label>
                <Input
                  id="wifi-ssid"
                  placeholder="My WiFi Network"
                  value={wifi.ssid}
                  onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="wifi-password">Password</Label>
                <Input
                  id="wifi-password"
                  type="password"
                  placeholder="Password"
                  value={wifi.password}
                  onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Encryption</Label>
                <Select
                  value={wifi.encryption}
                  onValueChange={(v) =>
                    setWifi({ ...wifi, encryption: v as "WPA" | "WEP" | "nopass" })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WPA">WPA/WPA2</SelectItem>
                    <SelectItem value="WEP">WEP</SelectItem>
                    <SelectItem value="nopass">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {qrType === "location" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  placeholder="40.7128"
                  value={location.latitude}
                  onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  placeholder="-74.0060"
                  value={location.longitude}
                  onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {/* Customization */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Customize</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Size</Label>
                <Select value={String(size)} onValueChange={(v) => setSize(Number(v))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="128">128x128</SelectItem>
                    <SelectItem value="256">256x256</SelectItem>
                    <SelectItem value="512">512x512</SelectItem>
                    <SelectItem value="1024">1024x1024</SelectItem>
                    <SelectItem value="2048">2048x2048</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Error Correction</Label>
                <Select
                  value={errorCorrection}
                  onValueChange={(v) => setErrorCorrection(v as "L" | "M" | "Q" | "H")}
                >
                  <SelectTrigger className="mt-2">
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
              <div>
                <Label>Foreground</Label>
                <div className="flex gap-2 mt-2">
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
              <div>
                <Label>Background</Label>
                <div className="flex gap-2 mt-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center">
            <div className="relative rounded-lg border p-4 bg-white">
              <canvas
                ref={canvasRef}
                className={`rounded ${loading ? "opacity-50" : ""}`}
                style={{ maxWidth: "100%", height: "auto" }}
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={downloadQR} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download PNG
              </Button>
              <Button variant="outline" onClick={copyQR}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              {size}x{size} pixels • Error correction: {errorCorrection}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
