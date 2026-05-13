"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Sparkles, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";
import { TryItShortener } from "@/components/marketing/sections/try-it-shortener";

interface AgentHeroProps {
  variant?: "homepage" | "agents-page";
}

const installSnippet = `# Add Go2 to Claude Code, Cursor, or any MCP client
claude mcp add go2 -- npx -y go2-mcp-server@latest \\
  --api-key "$GO2_API_KEY"`;

interface HeroCta {
  text: string;
  href: string;
}

interface HeroCopy {
  badge: string;
  headline: React.ReactNode;
  sub: string;
  primaryCta: HeroCta;
  secondaryCta: HeroCta;
}

const COPY: Record<NonNullable<AgentHeroProps["variant"]>, HeroCopy> = {
  homepage: {
    badge: "Open source · Edge-native · Free to start",
    headline: (
      <>
        Short links for your team —{" "}
        <span className="text-gradient-warm">and your AI.</span>
      </>
    ),
    sub: "Branded URLs on your domain, with QR, link-in-bio, and retargeting pixels. With AI integration your agent can install in five minutes.",
    primaryCta: { text: "Start free — no card", href: "/register" },
    secondaryCta: { text: "See the API", href: "/developers/api" },
  },
  "agents-page": {
    badge: "MCP · REST · 16 tools · open source",
    headline: (
      <>
        Branded short links your{" "}
        <span className="text-gradient-warm">AI agent can ship.</span>
      </>
    ),
    sub: "One MCP install, every agent client. Track each link your agent creates back to the run, prompt, and tool call that produced it — same workspace, same domains, same analytics as the rest of your team.",
    primaryCta: { text: "5-min quickstart", href: "/agents/quickstart" },
    secondaryCta: { text: "See the API", href: "/developers/api" },
  },
};

export function AgentHero({ variant = "agents-page" }: AgentHeroProps) {
  const copy = COPY[variant];

  return (
    <section className="relative overflow-hidden bg-[var(--marketing-bg)] pt-20 pb-20 md:pt-32 md:pb-32 lg:pt-40">
      <GeometricShapes position="hero-right" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: copy + CTAs */}
          <div className="min-w-0 max-w-2xl">
            <Badge
              variant="outline"
              className="mb-8 border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/5 font-mono text-[10px] text-[var(--marketing-accent)] uppercase tracking-wider"
            >
              <Bot className="mr-1.5 h-3 w-3" />
              {copy.badge}
            </Badge>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="break-words font-bold text-4xl text-[var(--marketing-text)] leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              {copy.headline}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 max-w-xl text-[var(--marketing-text-muted)] text-lg leading-relaxed sm:text-xl"
            >
              {copy.sub}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Link href={copy.primaryCta.href}>
                <Button
                  size="lg"
                  className="hover-lift h-14 rounded-full bg-[var(--marketing-accent)] px-8 font-bold text-base text-white shadow-[var(--marketing-accent)]/20 shadow-lg hover:bg-[var(--marketing-accent-light)]"
                >
                  {copy.primaryCta.text}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={copy.secondaryCta.href}>
                <Button
                  size="lg"
                  variant="outline"
                  className="hover-lift h-14 rounded-full border-[var(--marketing-border)] bg-transparent px-8 font-bold text-[var(--marketing-text)] text-base hover:bg-[var(--marketing-accent)]/5 hover:text-[var(--marketing-accent)]"
                >
                  {copy.secondaryCta.text}
                </Button>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 text-[var(--marketing-text-muted)] text-sm"
            >
              Open source · Built on Cloudflare · No credit card to start
            </motion.p>
          </div>

          {/* Right: variant-specific call-to-action card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mt-8 min-w-0 lg:mt-0"
          >
            {variant === "homepage" ? (
              <div className="relative overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 shadow-2xl shadow-[var(--marketing-accent)]/5 sm:p-7 lg:rounded-[1.5rem]">
                <div className="-top-24 -right-24 pointer-events-none absolute h-56 w-56 rounded-full bg-[var(--marketing-accent)]/15 blur-3xl" />
                <div className="-bottom-16 -left-12 pointer-events-none absolute h-48 w-48 rounded-full bg-[var(--marketing-accent-light)]/10 blur-3xl" />
                <div className="relative">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[var(--marketing-accent)]" />
                    <span className="font-mono text-[10px] text-[var(--marketing-accent)] uppercase tracking-[0.18em]">
                      Try it free — no signup
                    </span>
                  </div>
                  <h3 className="font-bold text-[var(--marketing-text)] text-xl tracking-tight sm:text-2xl">
                    Paste a URL. Get a real go2.gg link.
                  </h3>
                  <p className="mt-2 text-[var(--marketing-text-muted)] text-sm">
                    Live demo. Real shortener. Sign up to keep the link, see clicks, and add your custom domain.
                  </p>
                  <TryItShortener />
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] shadow-2xl shadow-[var(--marketing-accent)]/5 lg:rounded-[1.5rem]">
                <div className="flex items-center justify-between gap-2 border-[var(--marketing-border)] border-b bg-[var(--marketing-bg)]/40 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Terminal className="h-4 w-4 shrink-0 text-[var(--marketing-accent)]" />
                    <span className="truncate font-mono text-[var(--marketing-text-muted)] text-xs">
                      Install in any MCP client
                    </span>
                  </div>
                  <CopyButton value={installSnippet} />
                </div>
                <pre className="overflow-x-auto whitespace-pre p-4 font-mono text-[var(--marketing-text)] text-xs leading-relaxed sm:p-5 sm:text-sm">
                  {installSnippet}
                </pre>
                <div className="break-words border-[var(--marketing-border)] border-t bg-[var(--marketing-bg)]/40 px-4 py-3 font-mono text-[var(--marketing-text-muted)] text-xs">
                  Works with Claude Code, Claude Desktop, Cursor, Windsurf, Codex.
                </div>
              </div>
            )}

            {/* Floating "tracked link" badge — agent-run-flavored, only show on agents-page */}
            {variant === "agents-page" && (
              <div className="-bottom-6 -left-6 absolute hidden animate-float items-center gap-3 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] px-4 py-3 shadow-xl lg:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--marketing-accent)] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--marketing-accent)]" />
                </span>
                <div>
                  <p className="font-semibold text-[10px] text-[var(--marketing-text-muted)] uppercase tracking-wider">
                    Link created → click tracked
                  </p>
                  <p className="mt-0.5 font-mono text-[var(--marketing-text)] text-xs">
                    go2.gg/launch · run_2026_04_27_a1b2
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
