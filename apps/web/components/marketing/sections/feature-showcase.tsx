"use client";

import { motion } from "framer-motion";
import { Link2, BarChart3, QrCode, Globe, Zap, Copy } from "lucide-react";

const features = [
  {
    title: "Smart Link Management",
    description:
      "Create, edit, and organize links with tags and custom aliases.",
    icon: Link2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    preview: (
      <div className="flex h-full w-full flex-col gap-3 p-6">
        <div className="flex items-center gap-3 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-3 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Globe className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-[var(--marketing-text)] text-sm">
              /summer-sale
            </div>
            <div className="truncate text-[var(--marketing-text-muted)] text-xs">
              go2.gg/summer-sale
            </div>
          </div>
          <Copy className="h-4 w-4 text-[var(--marketing-text-muted)]" />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-3 opacity-80 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100">
            <Globe className="h-4 w-4 text-purple-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-[var(--marketing-text)] text-sm">
              /social-bio
            </div>
            <div className="truncate text-[var(--marketing-text-muted)] text-xs">
              go2.gg/social-bio
            </div>
          </div>
          <Copy className="h-4 w-4 text-[var(--marketing-text-muted)]" />
        </div>
      </div>
    ),
  },
  {
    title: "Real-time Analytics",
    description: "Track clicks, referrers, and locations as they happen.",
    icon: BarChart3,
    color: "text-green-500",
    bg: "bg-green-500/10",
    preview: (
      <div className="relative h-full w-full p-6">
        <svg
          className="h-full w-full"
          viewBox="0 0 200 100"
          preserveAspectRatio="none"
          aria-label="Analytics line chart"
        >
          <defs>
            <linearGradient
              id="analyticsGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="rgb(34, 197, 94)"
                stopOpacity="0.3"
              />
              <stop
                offset="100%"
                stopColor="rgb(34, 197, 94)"
                stopOpacity="0.02"
              />
            </linearGradient>
          </defs>
          {/* Area fill */}
          <motion.path
            d="M0,80 L30,60 L60,70 L90,40 L120,50 L150,25 L180,30 L200,15 L200,100 L0,100 Z"
            fill="url(#analyticsGradient)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          />
          {/* Main line */}
          <motion.path
            d="M0,80 L30,60 L60,70 L90,40 L120,50 L150,25 L180,30 L200,15"
            fill="none"
            stroke="rgb(34, 197, 94)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          {/* Data points */}
          {[
            [0, 80],
            [30, 60],
            [60, 70],
            [90, 40],
            [120, 50],
            [150, 25],
            [180, 30],
            [200, 15],
          ].map(([x, y], i) => (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="rgb(34, 197, 94)"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i + 0.5, duration: 0.3 }}
            />
          ))}
        </svg>
      </div>
    ),
  },
  {
    title: "Dynamic QR Codes",
    description: "Generate and customize QR codes that match your brand.",
    icon: QrCode,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    preview: (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="group relative">
          <div className="-inset-1 absolute rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 opacity-25 blur transition duration-1000 group-hover:opacity-50" />
          <div className="relative h-32 w-32 overflow-hidden rounded-xl bg-white p-2 shadow-lg">
            {/* QR Code SVG Pattern */}
            <svg
              viewBox="0 0 21 21"
              className="h-full w-full"
              aria-label="Sample QR code"
            >
              {/* Position detection patterns - top left */}
              <rect x="0" y="0" width="7" height="7" fill="#1a1a1a" />
              <rect x="1" y="1" width="5" height="5" fill="white" />
              <rect x="2" y="2" width="3" height="3" fill="#1a1a1a" />

              {/* Position detection patterns - top right */}
              <rect x="14" y="0" width="7" height="7" fill="#1a1a1a" />
              <rect x="15" y="1" width="5" height="5" fill="white" />
              <rect x="16" y="2" width="3" height="3" fill="#1a1a1a" />

              {/* Position detection patterns - bottom left */}
              <rect x="0" y="14" width="7" height="7" fill="#1a1a1a" />
              <rect x="1" y="15" width="5" height="5" fill="white" />
              <rect x="2" y="16" width="3" height="3" fill="#1a1a1a" />

              {/* Timing patterns */}
              <rect x="8" y="6" width="1" height="1" fill="#1a1a1a" />
              <rect x="10" y="6" width="1" height="1" fill="#1a1a1a" />
              <rect x="12" y="6" width="1" height="1" fill="#1a1a1a" />
              <rect x="6" y="8" width="1" height="1" fill="#1a1a1a" />
              <rect x="6" y="10" width="1" height="1" fill="#1a1a1a" />
              <rect x="6" y="12" width="1" height="1" fill="#1a1a1a" />

              {/* Data modules - scattered pattern */}
              <rect x="8" y="0" width="1" height="1" fill="#1a1a1a" />
              <rect x="10" y="1" width="1" height="1" fill="#1a1a1a" />
              <rect x="9" y="2" width="1" height="1" fill="#1a1a1a" />
              <rect x="11" y="3" width="1" height="1" fill="#1a1a1a" />
              <rect x="8" y="4" width="1" height="1" fill="#1a1a1a" />
              <rect x="12" y="5" width="1" height="1" fill="#1a1a1a" />

              <rect x="0" y="8" width="1" height="1" fill="#1a1a1a" />
              <rect x="2" y="9" width="1" height="1" fill="#1a1a1a" />
              <rect x="4" y="8" width="1" height="1" fill="#1a1a1a" />
              <rect x="3" y="10" width="1" height="1" fill="#1a1a1a" />
              <rect x="1" y="11" width="1" height="1" fill="#1a1a1a" />
              <rect x="5" y="12" width="1" height="1" fill="#1a1a1a" />

              <rect x="8" y="8" width="1" height="1" fill="#1a1a1a" />
              <rect x="10" y="9" width="1" height="1" fill="#1a1a1a" />
              <rect x="12" y="8" width="1" height="1" fill="#1a1a1a" />
              <rect x="9" y="11" width="1" height="1" fill="#1a1a1a" />
              <rect x="11" y="10" width="1" height="1" fill="#1a1a1a" />
              <rect x="13" y="12" width="1" height="1" fill="#1a1a1a" />

              <rect x="14" y="8" width="1" height="1" fill="#1a1a1a" />
              <rect x="16" y="9" width="1" height="1" fill="#1a1a1a" />
              <rect x="18" y="8" width="1" height="1" fill="#1a1a1a" />
              <rect x="15" y="10" width="1" height="1" fill="#1a1a1a" />
              <rect x="17" y="11" width="1" height="1" fill="#1a1a1a" />
              <rect x="19" y="12" width="1" height="1" fill="#1a1a1a" />
              <rect x="20" y="9" width="1" height="1" fill="#1a1a1a" />

              <rect x="8" y="14" width="1" height="1" fill="#1a1a1a" />
              <rect x="10" y="15" width="1" height="1" fill="#1a1a1a" />
              <rect x="12" y="14" width="1" height="1" fill="#1a1a1a" />
              <rect x="9" y="17" width="1" height="1" fill="#1a1a1a" />
              <rect x="11" y="16" width="1" height="1" fill="#1a1a1a" />
              <rect x="13" y="18" width="1" height="1" fill="#1a1a1a" />
              <rect x="8" y="19" width="1" height="1" fill="#1a1a1a" />
              <rect x="10" y="20" width="1" height="1" fill="#1a1a1a" />
              <rect x="12" y="19" width="1" height="1" fill="#1a1a1a" />

              <rect x="14" y="14" width="1" height="1" fill="#1a1a1a" />
              <rect x="16" y="15" width="1" height="1" fill="#1a1a1a" />
              <rect x="18" y="14" width="1" height="1" fill="#1a1a1a" />
              <rect x="15" y="17" width="1" height="1" fill="#1a1a1a" />
              <rect x="17" y="16" width="1" height="1" fill="#1a1a1a" />
              <rect x="19" y="18" width="1" height="1" fill="#1a1a1a" />
              <rect x="20" y="15" width="1" height="1" fill="#1a1a1a" />
              <rect x="14" y="20" width="1" height="1" fill="#1a1a1a" />
              <rect x="18" y="19" width="1" height="1" fill="#1a1a1a" />
              <rect x="20" y="20" width="1" height="1" fill="#1a1a1a" />
            </svg>
            {/* Center Logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
                <Zap className="h-4 w-4 text-[var(--marketing-accent)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export function FeatureShowcase() {
  return (
    <section className="bg-[var(--marketing-bg)] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 font-bold text-3xl text-[var(--marketing-text)] md:text-4xl">
            Everything you need to grow
          </h2>
          <p className="text-[var(--marketing-text-muted)] text-lg">
            Ship links faster, measure impact, and scale with confidence.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] shadow-sm transition-colors hover:border-[var(--marketing-accent)]/30 hover:shadow-md"
            >
              <div className="p-8">
                <div
                  className={`h-12 w-12 rounded-xl ${feature.bg} mb-6 flex items-center justify-center`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="mb-2 font-bold text-[var(--marketing-text)] text-xl">
                  {feature.title}
                </h3>
                <p className="text-[var(--marketing-text-muted)]">
                  {feature.description}
                </p>
              </div>

              <div className="relative mt-4 h-48 overflow-hidden border-[var(--marketing-border)] border-t bg-[var(--marketing-bg-elevated)]/50 transition-transform duration-500 group-hover:scale-105">
                {feature.preview}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
