"use client";

import { motion } from "framer-motion";
import { BarChart3, Users, Globe, Zap, Download, Calendar } from "lucide-react";

export function ProductShowcase() {
  return (
    <section className="relative overflow-hidden bg-[var(--marketing-bg)] py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left Content - Stats */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 font-semibold text-[var(--marketing-accent)] text-sm">
                <BarChart3 className="h-4 w-4" />
                <span>Deep Analytics</span>
              </div>

              <h2 className="font-bold text-4xl text-[var(--marketing-text)] leading-tight md:text-5xl">
                Turn clicks into{" "}
                <span className="text-gradient-warm">actionable insights</span>.
              </h2>

              <p className="text-[var(--marketing-text-muted)] text-lg leading-relaxed">
                Track every interaction in real-time. Understand your audience
                with detailed breakdowns by location, device, and referral
                source.
              </p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
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
                    className="flex gap-4 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4 transition-colors hover:border-[var(--marketing-accent)]/30"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-2xl text-[var(--marketing-text)]">
                        {stat.value}
                      </div>
                      <div className="text-[var(--marketing-text-muted)] text-sm">
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
              className="relative overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] shadow-2xl shadow-[var(--marketing-accent)]/10"
            >
              {/* Fake Browser Header */}
              <div className="flex items-center justify-between border-[var(--marketing-border)] border-b bg-[var(--marketing-bg)]/50 px-4 py-3">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/50" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                  <div className="h-3 w-3 rounded-full bg-green-500/50" />
                </div>
                <div className="flex gap-4">
                  <div className="h-2 w-20 rounded-full bg-[var(--marketing-border)]/50" />
                  <div className="h-2 w-32 rounded-full bg-[var(--marketing-border)]/50" />
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="space-y-6 bg-[var(--marketing-bg)] p-6">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[var(--marketing-text)] text-lg">
                      Campaign Performance
                    </h3>
                    <p className="text-[var(--marketing-text-muted)] text-sm">
                      Last 30 days
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      aria-label="Select date range"
                      className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-2 text-[var(--marketing-text-muted)]"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Download report"
                      className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-2 text-[var(--marketing-text-muted)]"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Main Chart Area - Line Chart with Key Events */}
                <div className="relative h-64 overflow-hidden rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4">
                  {/* Y-axis labels */}
                  <div className="absolute top-4 bottom-12 left-4 flex flex-col justify-between text-[var(--marketing-text-muted)] text-xs">
                    <span>2.5k</span>
                    <span>1.5k</span>
                    <span>500</span>
                  </div>

                  {/* Chart area */}
                  <div className="absolute inset-0 top-4 right-4 bottom-12 left-12">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="border-[var(--marketing-border)]/50 border-b border-dashed"
                        />
                      ))}
                    </div>

                    {/* SVG Line Chart */}
                    <svg
                      className="absolute inset-0 h-full w-full"
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
                      className="group absolute top-[55%] left-[20%] cursor-pointer"
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8 }}
                    >
                      <div className="h-4 w-4 rounded-full border-2 border-white bg-[var(--marketing-accent)] shadow-lg" />
                      <div className="-top-12 -translate-x-1/2 absolute left-1/2 z-10 whitespace-nowrap rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] px-3 py-2 text-[var(--marketing-text)] text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        <div className="font-semibold">Campaign Launch</div>
                        <div className="text-[var(--marketing-text-muted)]">
                          +847 clicks
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="group absolute top-[30%] left-[55%] cursor-pointer"
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.0 }}
                    >
                      <div className="h-4 w-4 rounded-full border-2 border-white bg-green-500 shadow-lg" />
                      <div className="-top-12 -translate-x-1/2 absolute left-1/2 z-10 whitespace-nowrap rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] px-3 py-2 text-[var(--marketing-text)] text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        <div className="font-semibold">Viral Moment</div>
                        <div className="text-[var(--marketing-text-muted)]">
                          +2,340 clicks
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="group absolute top-[10%] left-[85%] cursor-pointer"
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.2 }}
                    >
                      <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-lg" />
                      <div className="-top-12 -translate-x-1/2 absolute left-1/2 z-10 whitespace-nowrap rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] px-3 py-2 text-[var(--marketing-text)] text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                        <div className="font-semibold">Newsletter Send</div>
                        <div className="text-[var(--marketing-text-muted)]">
                          +1,892 clicks
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* X-axis labels */}
                  <div className="absolute right-4 bottom-2 left-12 flex justify-between text-[var(--marketing-text-muted)] text-xs">
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>Week 4</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                  {[
                    { label: "Total Clicks", value: "24.5k", change: "+12%" },
                    { label: "Unique Visitors", value: "18.2k", change: "+8%" },
                    { label: "Avg. Time", value: "1m 42s", change: "+5%" },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-3 sm:p-4"
                    >
                      <p className="text-[var(--marketing-text-muted)] text-xs sm:text-sm">
                        {stat.label}
                      </p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <p className="font-bold text-[var(--marketing-text)] text-lg sm:text-xl">
                          {stat.value}
                        </p>
                        <p className="font-medium text-green-500 text-xs">
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
