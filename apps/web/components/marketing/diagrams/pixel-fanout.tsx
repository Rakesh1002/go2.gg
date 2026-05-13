"use client";

import { motion } from "framer-motion";
import { MousePointerClick, Target } from "lucide-react";

const platforms = [
  { name: "Meta", short: "M", note: "ViewContent" },
  { name: "Google Ads", short: "G", note: "Conversion" },
  { name: "TikTok", short: "T", note: "ClickButton" },
  { name: "LinkedIn", short: "in", note: "Insight tag" },
  { name: "Twitter / X", short: "𝕏", note: "Tweet" },
  { name: "Pinterest", short: "P", note: "PageVisit" },
  { name: "Reddit", short: "R", note: "Custom" },
  { name: "Snap", short: "S", note: "PAGE_VIEW" },
];

export function PixelFanout() {
  return (
    <section className="relative overflow-hidden border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/40 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/5 px-3 py-1 font-medium text-[var(--marketing-accent)] text-xs uppercase tracking-wider">
            One click. Every audience.
          </p>
          <h2 className="break-words font-bold text-3xl text-[var(--marketing-text)] tracking-tight md:text-4xl lg:text-5xl">
            Server-side pixels for 8 ad platforms.
          </h2>
          <p className="mt-4 text-[var(--marketing-text-muted)] text-base sm:text-lg">
            A click on your Go2 link fires every attached pixel before the redirect — iOS 14 ATT
            users count, ad-blockers don't gut the audience, and the user's browser doesn't have
            to load anything extra.
          </p>
        </motion.div>

        {/* The diagram itself — center hub + 8 platform tiles in a grid around it */}
        <div className="relative mx-auto grid max-w-4xl grid-cols-2 items-stretch gap-4 sm:gap-5 md:grid-cols-3">
          {/* Top row platforms */}
          <PlatformTile platform={platforms[0]} delay={0} />
          <div className="hidden md:block" />
          <PlatformTile platform={platforms[1]} delay={0.05} />

          {/* Left column + center hub + right column */}
          <PlatformTile platform={platforms[2]} delay={0.1} />
          <CenterHub />
          <PlatformTile platform={platforms[3]} delay={0.15} />

          {/* Middle row */}
          <PlatformTile platform={platforms[4]} delay={0.2} />
          <div className="hidden md:block" />
          <PlatformTile platform={platforms[5]} delay={0.25} />

          {/* Bottom row */}
          <PlatformTile platform={platforms[6]} delay={0.3} />
          <div className="hidden md:block" />
          <PlatformTile platform={platforms[7]} delay={0.35} />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mx-auto mt-12 max-w-3xl text-center text-[var(--marketing-text-muted)] text-sm"
        >
          Pixels fire in parallel via <code className="rounded bg-[var(--marketing-bg)] px-1.5 py-0.5 font-mono text-[var(--marketing-text)] text-xs">Promise.allSettled</code>{" "}
          — a single platform outage doesn't take down the rest of the fan-out.
        </motion.div>
      </div>
    </section>
  );
}

function CenterHub() {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="relative flex min-h-[140px] items-center justify-center rounded-2xl border-2 border-[var(--marketing-accent)] bg-[var(--marketing-bg)] p-5 shadow-[var(--marketing-accent)]/20 shadow-lg sm:min-h-[160px]"
    >
      <div className="-top-3 absolute left-1/2 -translate-x-1/2 rounded-full bg-[var(--marketing-accent)] px-3 py-0.5 font-mono text-[10px] text-white uppercase tracking-wider">
        ~8ms
      </div>
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--marketing-accent)]/15">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--marketing-accent)] opacity-75" />
            <MousePointerClick className="relative h-5 w-5 text-[var(--marketing-accent)]" />
          </span>
        </div>
        <p className="font-semibold text-[var(--marketing-text)] text-sm">
          Click on go2.gg/launch
        </p>
        <p className="mt-1 font-mono text-[10px] text-[var(--marketing-text-muted)]">
          edge handler
        </p>
      </div>
    </motion.div>
  );
}

function PlatformTile({
  platform,
  delay,
}: {
  platform: (typeof platforms)[number];
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className="group relative flex items-center gap-3 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4 transition-colors hover:border-[var(--marketing-accent)]/40"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10 font-bold text-[var(--marketing-accent)] text-sm">
        {platform.short}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-[var(--marketing-text)] text-sm">
          {platform.name}
        </p>
        <p className="truncate font-mono text-[10px] text-[var(--marketing-text-muted)]">
          {platform.note}
        </p>
      </div>
      <Target className="h-4 w-4 shrink-0 text-[var(--marketing-text-muted)]/40 transition-colors group-hover:text-[var(--marketing-accent)]" />
    </motion.div>
  );
}
