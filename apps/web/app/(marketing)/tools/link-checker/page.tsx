import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { LinkCheckerTool } from "./link-checker-tool";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";

export const metadata: Metadata = getMetadata({
  title: "Free Link Checker - Verify URL Safety",
  description:
    "Check any URL for malware, phishing, and redirect chains. Free online tool to verify link safety before clicking.",
});

export default function LinkCheckerPage() {
  return (
    <div className="bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        <GeometricShapes position="hero-right" />

        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="mb-8 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/10 px-4 py-1.5 font-semibold text-[var(--marketing-accent)] text-sm">
            Free Tool
          </div>
          <h1 className="mx-auto max-w-4xl animate-fade-in-up font-extrabold text-4xl text-[var(--marketing-text)] tracking-tight sm:text-5xl md:text-6xl">
            Link Safety Checker
          </h1>
          <p className="stagger-1 mx-auto mt-8 max-w-2xl animate-fade-in-up text-[var(--marketing-text-muted)] text-lg leading-relaxed sm:text-xl">
            Verify any URL is safe before clicking. Check for malware, phishing, SSL status, and
            view the full redirect chain.
          </p>
        </div>
      </section>

      {/* Tool */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-16">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 shadow-2xl shadow-[var(--marketing-accent)]/5">
          <LinkCheckerTool />
        </div>
      </section>

      {/* Features */}
      <section className="border-[var(--marketing-border)] border-t bg-[var(--marketing-bg-elevated)]/30">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <h2 className="mb-12 text-center font-bold text-2xl text-[var(--marketing-text)] ">
            What We Check
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 transition-colors hover:border-red-500/30">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10">
                <svg
                  className="h-6 w-6 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-[var(--marketing-text)]">Malware Detection</h3>
              <p className="text-[var(--marketing-text-muted)] text-sm">
                Check URLs against Google Safe Browsing database for known malware and threats.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 transition-colors hover:border-yellow-500/30">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                <svg
                  className="h-6 w-6 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-[var(--marketing-text)]">
                Phishing Detection
              </h3>
              <p className="text-[var(--marketing-text-muted)] text-sm">
                Identify deceptive websites designed to steal your personal information.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 transition-colors hover:border-green-500/30">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <svg
                  className="h-6 w-6 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-[var(--marketing-text)]">SSL Verification</h3>
              <p className="text-[var(--marketing-text-muted)] text-sm">
                Verify the site has a valid SSL certificate for secure connections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="mb-4 font-bold text-2xl text-[var(--marketing-text)] ">
          Want to create safe, trackable short links?
        </h2>
        <p className="mb-6 text-[var(--marketing-text-muted)]">
          Go2 provides fast, secure URL shortening with built-in analytics.
        </p>
        <a
          href="/register"
          className="inline-flex items-center justify-center rounded-full bg-[var(--marketing-accent)] px-8 py-3 font-bold text-[var(--marketing-bg)] shadow-[var(--marketing-accent)]/20 shadow-lg transition-colors hover:bg-[var(--marketing-accent-light)]"
        >
          Start free
        </a>
      </section>
    </div>
  );
}
