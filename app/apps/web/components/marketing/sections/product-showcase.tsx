"use client";

import { motion } from "framer-motion";
import { BarChart3, Users, Globe, Zap, Download, Calendar } from "lucide-react";

export function ProductShowcase() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-[var(--marketing-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content - Stats */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)]">
                <BarChart3 className="h-4 w-4" />
                <span>Deep Analytics</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-[var(--marketing-text)] leading-tight">
                Turn clicks into{" "}
                <span className="text-gradient-warm">actionable insights</span>.
              </h2>

              <p className="text-lg text-[var(--marketing-text-muted)] leading-relaxed">
                Track every interaction in real-time. Understand your audience
                with detailed breakdowns by location, device, and referral
                source.
              </p>

              <div className="grid sm:grid-cols-2 gap-6 mt-8">
                {[
                  {
                    label: "Real-time tracking",
                    value: "Instant",
                    icon: Zap,
                    description: "See clicks as they happen",
                  },
                  {
                    label: "Geographic insights",
                    value: "195+",
                    icon: Globe,
                    description: "Countries tracked",
                  },
                  {
                    label: "Data retention",
                    value: "2 years",
                    icon: BarChart3,
                    description: "Full analytics history",
                  },
                  {
                    label: "Bot filtering",
                    value: "99.9%",
                    icon: Users,
                    description: "Accurate human clicks",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-4 rounded-xl bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)] hover:border-[var(--marketing-accent)]/30 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-[var(--marketing-accent)]/10 flex items-center justify-center text-[var(--marketing-accent)]">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[var(--marketing-text)]">
                        {stat.value}
                      </div>
                      <div className="text-sm text-[var(--marketing-text-muted)]">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Content - Mockup */}
          <div className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] shadow-2xl shadow-[var(--marketing-accent)]/10 overflow-hidden"
            >
              {/* Fake Browser Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--marketing-border)] bg-[var(--marketing-bg)]/50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex gap-4">
                  <div className="h-2 w-20 rounded-full bg-[var(--marketing-border)]/50" />
                  <div className="h-2 w-32 rounded-full bg-[var(--marketing-border)]/50" />
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 space-y-6 bg-[var(--marketing-bg)]">
                {/* Header Row */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--marketing-text)]">
                      Campaign Performance
                    </h3>
                    <p className="text-sm text-[var(--marketing-text-muted)]">
                      Last 30 days
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label="Select date range"
                      className="p-2 rounded-lg bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)] text-[var(--marketing-text-muted)]"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Download report"
                      className="p-2 rounded-lg bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)] text-[var(--marketing-text-muted)]"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Main Chart Area - Line Chart with Key Events */}
                <div className="h-64 rounded-xl bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)] p-4 relative overflow-hidden">
                  {/* Y-axis labels */}
                  <div className="absolute left-4 top-4 bottom-12 flex flex-col justify-between text-xs text-[var(--marketing-text-muted)]">
                    <span>2.5k</span>
                    <span>1.5k</span>
                    <span>500</span>
                  </div>

                  {/* Chart area */}
                  <div className="absolute inset-0 left-12 right-4 top-4 bottom-12">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="border-b border-[var(--marketing-border)]/50 border-dashed"
                        />
                      ))}
                    </div>

                    {/* SVG Line Chart */}
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 400 150"
                      preserveAspectRatio="none"
                      aria-label="Campaign performance chart"
                    >
                      {/* Gradient fill under line */}
                      <defs>
                        <linearGradient
                          id="chartGradient"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="var(--marketing-accent)"
                            stopOpacity="0.3"
                          />
                          <stop
                            offset="100%"
                            stopColor="var(--marketing-accent)"
                            stopOpacity="0.02"
                          />
                        </linearGradient>
                      </defs>

                      {/* Area fill */}
                      <motion.path
                        d="M0,120 C30,110 50,100 80,85 C110,70 130,90 160,75 C190,60 210,40 240,50 C270,60 290,35 320,25 C350,15 380,20 400,10 L400,150 L0,150 Z"
                        fill="url(#chartGradient)"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                      />

                      {/* Main line */}
                      <motion.path
                        d="M0,120 C30,110 50,100 80,85 C110,70 130,90 160,75 C190,60 210,40 240,50 C270,60 290,35 320,25 C350,15 380,20 400,10"
                        fill="none"
                        stroke="var(--marketing-accent)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                    </svg>

                    {/* Key Event Markers */}
                    <motion.div
                      className="absolute left-[20%] top-[55%] group cursor-pointer"
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8 }}
                    >
                      <div className="w-4 h-4 rounded-full bg-[var(--marketing-accent)] border-2 border-white shadow-lg" />
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-[var(--marketing-bg)] text-[var(--marketing-text)] text-xs px-3 py-2 rounded-lg border border-[var(--marketing-border)] shadow-lg transition-opacity z-10 whitespace-nowrap">
                        <div className="font-semibold">Campaign Launch</div>
                        <div className="text-[var(--marketing-text-muted)]">
                          +847 clicks
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="absolute left-[55%] top-[30%] group cursor-pointer"
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.0 }}
                    >
                      <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-lg" />
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-[var(--marketing-bg)] text-[var(--marketing-text)] text-xs px-3 py-2 rounded-lg border border-[var(--marketing-border)] shadow-lg transition-opacity z-10 whitespace-nowrap">
                        <div className="font-semibold">Viral Moment</div>
                        <div className="text-[var(--marketing-text-muted)]">
                          +2,340 clicks
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="absolute left-[85%] top-[10%] group cursor-pointer"
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.2 }}
                    >
                      <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-[var(--marketing-bg)] text-[var(--marketing-text)] text-xs px-3 py-2 rounded-lg border border-[var(--marketing-border)] shadow-lg transition-opacity z-10 whitespace-nowrap">
                        <div className="font-semibold">Newsletter Send</div>
                        <div className="text-[var(--marketing-text-muted)]">
                          +1,892 clicks
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* X-axis labels */}
                  <div className="absolute left-12 right-4 bottom-2 flex justify-between text-xs text-[var(--marketing-text-muted)]">
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>Week 4</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { label: "Total Clicks", value: "24.5k", change: "+12%" },
                    { label: "Unique Visitors", value: "18.2k", change: "+8%" },
                    { label: "Avg. Time", value: "1m 42s", change: "+5%" },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="p-3 sm:p-4 rounded-xl bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)]"
                    >
                      <p className="text-xs sm:text-sm text-[var(--marketing-text-muted)]">
                        {stat.label}
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-lg sm:text-xl font-bold text-[var(--marketing-text)]">
                          {stat.value}
                        </p>
                        <p className="text-xs font-medium text-green-500">
                          {stat.change}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
