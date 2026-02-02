import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { QrCode, Palette, Download, BarChart3, Smartphone, Sparkles } from "lucide-react";
import { FeaturePageTemplate } from "@/components/marketing/feature-page-template";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";
import { IntegrationLogos } from "@/components/marketing/sections/integration-logos";
import { MetricsHighlight } from "@/components/marketing/sections/metrics-highlight";

export const metadata: Metadata = getMetadata({
  title: "QR Code Generator - Custom QR Codes with Tracking",
  description:
    "Create beautiful, customizable QR codes with built-in analytics. Change colors, add logos, and track every scan.",
});

const features = [
  {
    icon: Palette,
    title: "Full Customization",
    description:
      "Choose colors, add your logo, and customize corner styles to match your brand perfectly.",
  },
  {
    icon: BarChart3,
    title: "Scan Analytics",
    description:
      "See when and where your QR codes are scanned with real-time tracking and geographic data.",
  },
  {
    icon: Download,
    title: "Multiple Formats",
    description:
      "Download in PNG, SVG, or PDF at any resolution up to 4K. Perfect for print or digital.",
  },
  {
    icon: Smartphone,
    title: "Dynamic QR Codes",
    description:
      "Update the destination URL anytime without reprinting the QR code. No broken campaigns.",
  },
  {
    icon: Sparkles,
    title: "AI-Generated Designs",
    description:
      "Create artistic QR codes that blend with your brand imagery. AI-powered aesthetics.",
  },
  {
    icon: QrCode,
    title: "Bulk Generation",
    description:
      "Generate hundreds of QR codes at once via CSV upload or API. Perfect for product packaging.",
  },
];

const benefits = [
  "Free QR codes with unlimited scans",
  "Dynamic QR codes — update URLs anytime",
  "Full analytics on every scan",
  "Custom colors, logos, and styles",
  "Download in PNG, SVG, or PDF",
  "Bulk generation via CSV or API",
  "AI-powered artistic QR codes",
  "No watermarks on any plan",
];

const faqs = [
  {
    question: "Are the QR codes free?",
    answer:
      "Yes. You can create unlimited static QR codes for free. Dynamic QR codes (where you can change the URL) and advanced analytics require a paid plan.",
  },
  {
    question: "What's the difference between static and dynamic QR codes?",
    answer:
      "Static QR codes encode the URL directly — they work forever but can't be changed. Dynamic QR codes go through Go2, so you can update the destination URL anytime and track scans.",
  },
  {
    question: "Can I add my logo to the QR code?",
    answer:
      "Yes! You can add a logo to the center of your QR code. We automatically ensure it stays scannable.",
  },
  {
    question: "What formats can I download?",
    answer:
      "PNG, SVG, and PDF. All formats support up to 4K resolution for high-quality print materials.",
  },
];

// QR Preview Demo
function QRPreviewDemo() {
  return (
    <div className="flex flex-wrap justify-center gap-8 p-8">
      {[
        { fg: "#000000", bg: "#FFFFFF", label: "Classic" },
        { fg: "#6366F1", bg: "#FFFFFF", label: "Brand Purple" },
        { fg: "#EC4899", bg: "#FFFFFF", label: "Brand Pink" },
        { fg: "#FFFFFF", bg: "#000000", label: "Dark Mode" },
      ].map((colors, i) => (
        <div key={i} className="text-center">
          <div
            className="rounded-xl border border-[var(--marketing-border)] p-4 bg-[var(--marketing-bg-elevated)] shadow-lg"
            style={{ backgroundColor: colors.bg }}
          >
            <div
              className="w-28 h-28 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: colors.bg }}
            >
              <QrCode className="h-20 w-20" style={{ color: colors.fg }} />
            </div>
          </div>
          <p className="text-sm text-[var(--marketing-text-muted)] mt-2">{colors.label}</p>
        </div>
      ))}
    </div>
  );
}

const qrStats = [
  { value: "∞", label: "Free Scans", description: "No limits" },
  { value: "4K", label: "Resolution", description: "Print quality" },
  { value: "<1s", label: "Generation", description: "Instant creation" },
  { value: "100%", label: "Scannable", description: "Guaranteed" },
];

const qrSteps = [
  {
    step: 1,
    title: "Enter your URL",
    description: "Paste any URL or create a new Go2 short link. Works with any destination.",
  },
  {
    step: 2,
    title: "Customize design",
    description: "Choose colors, add your logo, adjust corner styles. Preview in real-time.",
  },
  {
    step: 3,
    title: "Download & deploy",
    description:
      "Export in PNG, SVG, or PDF. Use on print materials, packaging, or digital campaigns.",
  },
];

const qrIntegrations = [
  { name: "Canva" },
  { name: "Figma" },
  { name: "Adobe CC" },
  { name: "Shopify" },
  { name: "WooCommerce" },
  { name: "Printful" },
];

export default function QRCodesPage() {
  return (
    <FeaturePageTemplate
      badge="QR Codes"
      title="QR Codes That Stand Out & Track"
      subtitle="Create beautiful, branded QR codes with full customization and built-in analytics. Know when and where every scan happens. Free to start."
      features={features}
      benefits={benefits}
      faqs={faqs}
      demo={<QRPreviewDemo />}
      ctaTitle="Create your first QR code"
      ctaDescription="Free forever for basic QR codes. No account required."
      metricsHighlight={<MetricsHighlight headline="QR codes that perform" stats={qrStats} />}
      howItWorks={
        <HowItWorks
          headline="Create QR codes in seconds"
          subheadline="From URL to printable QR in three easy steps"
          steps={qrSteps}
        />
      }
      integrations={
        <IntegrationLogos
          headline="Works with your design tools"
          subheadline="Export and use anywhere"
          integrations={qrIntegrations}
        />
      }
    />
  );
}
