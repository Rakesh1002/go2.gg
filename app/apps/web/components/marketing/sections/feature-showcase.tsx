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
      <div className="w-full h-full p-6 flex flex-col gap-3">
        <div className="flex items-center gap-3 p-3 bg-[var(--marketing-bg)] rounded-xl border border-[var(--marketing-border)] shadow-sm">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Globe className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate text-[var(--marketing-text)]">
              /summer-sale
            </div>
            <div className="text-xs text-[var(--marketing-text-muted)] truncate">
              go2.gg/summer-sale
            </div>
          </div>
          <Copy className="h-4 w-4 text-[var(--marketing-text-muted)]" />
        </div>
        <div className="flex items-center gap-3 p-3 bg-[var(--marketing-bg)] rounded-xl border border-[var(--marketing-border)] shadow-sm opacity-80">
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
            <Globe className="h-4 w-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate text-[var(--marketing-text)]">
              /social-bio
            </div>
            <div className="text-xs text-[var(--marketing-text-muted)] truncate">
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
      <div className="h-full w-full p-6 relative">
        <svg
          className="w-full h-full"
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
      <div className="h-full w-full flex items-center justify-center p-6">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative w-32 h-32 bg-white rounded-xl p-2 shadow-lg overflow-hidden">
            {/* QR Code SVG Pattern */}
            <svg
              viewBox="0 0 21 21"
              className="w-full h-full"
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
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
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
    <section className="py-24 bg-[var(--marketing-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--marketing-text)] mb-4">
            Everything you need to grow
          </h2>
          <p className="text-lg text-[var(--marketing-text-muted)]">
            Ship links faster, measure impact, and scale with confidence.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] overflow-hidden hover:border-[var(--marketing-accent)]/30 transition-colors shadow-sm hover:shadow-md"
            >
              <div className="p-8">
                <div
                  className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-[var(--marketing-text)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[var(--marketing-text-muted)]">
                  {feature.description}
                </p>
              </div>

              <div className="h-48 mt-4 bg-[var(--marketing-bg-elevated)]/50 border-t border-[var(--marketing-border)] relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                {feature.preview}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
