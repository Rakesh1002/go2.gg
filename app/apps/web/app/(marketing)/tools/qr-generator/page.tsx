import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { QRGeneratorTool } from "./qr-generator-tool";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";

export const metadata: Metadata = getMetadata({
  title: "Free QR Code Generator - Create Custom QR Codes",
  description:
    "Generate beautiful, customizable QR codes for free. Download in PNG or SVG. No signup required.",
});

export default function QRGeneratorPage() {
  return (
    <div className="bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        <GeometricShapes position="hero-right" />

        <div className="max-w-7xl relative mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8 animate-fade-in-down">
            Free Tool
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl animate-fade-in-up">
            Free QR Code Generator
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl leading-relaxed animate-fade-in-up stagger-1">
            Create beautiful, customizable QR codes instantly. Change colors, add your logo, and
            download in high resolution.
          </p>
        </div>
      </section>

      {/* Tool */}
      <section className="max-w-7xl relative mx-auto px-4 pb-16 z-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 shadow-2xl shadow-[var(--marketing-accent)]/5">
          <QRGeneratorTool />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/30">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <h2 className="text-2xl font-bold text-center mb-12 text-[var(--marketing-text)] ">
            Why Use Our QR Generator?
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 hover:border-[var(--marketing-accent)]/30 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-[var(--marketing-accent)]/10 flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-[var(--marketing-accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 text-[var(--marketing-text)]">100% Free</h3>
              <p className="text-sm text-[var(--marketing-text-muted)]">
                No watermarks, no limits, no hidden fees. Generate as many QR codes as you need.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 hover:border-[var(--marketing-accent)]/30 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-[var(--marketing-accent)]/10 flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-[var(--marketing-accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 text-[var(--marketing-text)]">
                Fully Customizable
              </h3>
              <p className="text-sm text-[var(--marketing-text-muted)]">
                Choose colors, size, and error correction level. Make your QR codes match your
                brand.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 hover:border-[var(--marketing-accent)]/30 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-[var(--marketing-accent)]/10 flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-[var(--marketing-accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2 text-[var(--marketing-text)]">
                High Quality Downloads
              </h3>
              <p className="text-sm text-[var(--marketing-text-muted)]">
                Download in PNG up to 2048x2048 pixels. Perfect for print or digital use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4 text-[var(--marketing-text)] ">
          Want trackable QR codes with analytics?
        </h2>
        <p className="text-[var(--marketing-text-muted)] mb-6">
          Create a free Go2 account to track scans, see locations, and manage your QR codes.
        </p>
        <a
          href="/register"
          className="inline-flex items-center justify-center rounded-full bg-[var(--marketing-accent)] px-8 py-3 font-bold text-[var(--marketing-bg)] hover:bg-[var(--marketing-accent-light)] transition-colors shadow-lg shadow-[var(--marketing-accent)]/20"
        >
          Start free
        </a>
      </section>
    </div>
  );
}
