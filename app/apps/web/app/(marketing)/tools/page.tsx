import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata } from "@repo/config";
import { Button } from "@/components/ui/button";
import { QrCode, ShieldCheck, ArrowRight } from "lucide-react";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";
import { CTA } from "@/components/marketing/sections";

export const metadata: Metadata = getMetadata({
  title: "Free Tools",
  description: "Free marketing tools to help you grow. QR Code Generator, Link Checker, and more.",
});

const tools = [
  {
    title: "QR Code Generator",
    description:
      "Create customizable QR codes for your links, wifi, text, and more. Download in high quality.",
    icon: QrCode,
    href: "/tools/qr-generator",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    title: "Link Safety Checker",
    description:
      "Verify if a URL is safe to click. Check for malware, phishing, and redirect chains.",
    icon: ShieldCheck,
    href: "/tools/link-checker",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
];

export default function ToolsPage() {
  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <GeometricShapes position="hero-right" />
        <div className="max-w-7xl relative mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8 animate-fade-in-down">
            Free Utilities
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl animate-fade-in-up">
            Free tools for{" "}
            <span className="text-[var(--marketing-accent)] text-gradient-warm">everyone</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl leading-relaxed animate-fade-in-up stagger-1">
            Powerful utilities to help you manage links, ensure safety, and connect with your
            audience. No account required.
          </p>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {tools.map((tool, index) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group relative flex flex-col gap-6 rounded-[2rem] border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 transition-all hover:border-[var(--marketing-accent)]/30 hover:-translate-y-1 shadow-sm hover:shadow-md"
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tool.bg} ${tool.color} transition-transform group-hover:scale-110`}
              >
                <tool.icon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[var(--marketing-text)] mb-3">
                  {tool.title}
                </h3>
                <p className="text-[var(--marketing-text-muted)] leading-relaxed text-lg">
                  {tool.description}
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center gap-2 text-[var(--marketing-accent)] font-semibold opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                Try it now <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CTA
        headline="Need more power?"
        description="Unlock advanced analytics, custom domains, and API access."
        primaryCTA={{ text: "Start free", href: "/register" }}
      />
    </div>
  );
}
