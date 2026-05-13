import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata } from "@repo/config";
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
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        <GeometricShapes position="hero-right" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="mb-8 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 font-semibold text-[var(--marketing-accent)] text-sm">
            Free Utilities
          </div>
          <h1 className="mx-auto max-w-4xl animate-fade-in-up font-extrabold text-4xl text-[var(--marketing-text)] tracking-tight sm:text-5xl md:text-6xl">
            Free tools for{" "}
            <span className="text-[var(--marketing-accent)] text-gradient-warm">everyone</span>
          </h1>
          <p className="stagger-1 mx-auto mt-8 max-w-2xl animate-fade-in-up text-[var(--marketing-text-muted)] text-lg leading-relaxed sm:text-xl">
            Powerful utilities to help you manage links, ensure safety, and connect with your
            audience. No account required.
          </p>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {tools.map((tool, _index) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group hover:-translate-y-1 relative flex flex-col gap-6 rounded-[2rem] border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8 shadow-sm transition-all hover:border-[var(--marketing-accent)]/30 hover:shadow-md"
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${tool.bg} ${tool.color} transition-transform group-hover:scale-110`}
              >
                <tool.icon className="h-7 w-7" />
              </div>
              <div>
                <h3 className="mb-3 font-bold text-2xl text-[var(--marketing-text)]">
                  {tool.title}
                </h3>
                <p className="text-[var(--marketing-text-muted)] text-lg leading-relaxed">
                  {tool.description}
                </p>
              </div>
              <div className="-translate-x-2 mt-auto flex items-center gap-2 pt-4 font-semibold text-[var(--marketing-accent)] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
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
