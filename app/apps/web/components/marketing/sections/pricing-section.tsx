"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

import {
  pricingConfig,
  pricingPlans,
  comparisonTable,
  type ComparisonCategory,
} from "@repo/config";
import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface PricingSectionProps {
  headline?: string;
  subheadline?: string;
}

export function PricingSection({
  headline = pricingConfig.headline,
  subheadline = pricingConfig.subheadline,
}: PricingSectionProps) {
  const [annual, setAnnual] = useState(true);

  return (
    <section
      className="relative overflow-hidden -mt-16 pt-32 pb-20 md:pt-40 md:pb-28 bg-[var(--marketing-bg)]"
      id="pricing"
    >
      {/* Background decoration - extends behind fixed header */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--marketing-accent)]/8 via-[var(--marketing-bg)] to-[var(--marketing-bg)]" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-[var(--marketing-text)] md:text-4xl lg:text-5xl">
            {headline}
          </h2>
          <p className="mt-4 text-lg text-[var(--marketing-text-muted)]">{subheadline}</p>

          {pricingConfig.showAnnualToggle && (
            <div className="mt-8 inline-flex items-center gap-4 rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] px-6 py-3 shadow-sm">
              <span
                className={cn(
                  "text-sm transition-colors",
                  !annual
                    ? "font-semibold text-[var(--marketing-text)]"
                    : "text-[var(--marketing-text-muted)]"
                )}
              >
                Monthly
              </span>
              <Switch
                checked={annual}
                onCheckedChange={setAnnual}
                className="data-[state=checked]:bg-[var(--marketing-accent)]"
              />
              <span
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors",
                  annual
                    ? "font-semibold text-[var(--marketing-text)]"
                    : "text-[var(--marketing-text-muted)]"
                )}
              >
                Annual
                <span className="rounded-full bg-[var(--marketing-accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--marketing-accent)]">
                  Save {pricingConfig.annualDiscount}%
                </span>
              </span>
            </div>
          )}
        </motion.div>

        {/* Pricing Cards */}
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:gap-8 md:grid-cols-3 px-4">
          {pricingPlans.map((plan, index) => {
            const price = annual ? plan.priceAnnual : plan.priceMonthly;
            const priceId = annual ? plan.stripePriceIdAnnual : plan.stripePriceIdMonthly;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-2xl border bg-[var(--marketing-bg-elevated)] transition-all duration-300 hover:shadow-xl",
                  plan.recommended
                    ? "border-[var(--marketing-accent)] shadow-lg shadow-[var(--marketing-accent)]/10 ring-1 ring-[var(--marketing-accent)]/20"
                    : "border-[var(--marketing-border)] hover:border-[var(--marketing-accent)]/50"
                )}
              >
                {plan.recommended && (
                  <div className="absolute -right-12 top-6 rotate-45 bg-gradient-to-r from-[var(--marketing-accent)] to-[var(--marketing-accent-light)] px-12 py-1 text-xs font-semibold text-[var(--marketing-bg)] shadow-lg">
                    Popular
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-[var(--marketing-text)]">
                    {plan.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 min-h-[40px] text-sm text-[var(--marketing-text-muted)]">
                    {plan.description}
                  </p>

                  <div className="mt-6">
                    {price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold tracking-tight text-[var(--marketing-text)]">
                          {pricingConfig.currency}
                          {annual ? Math.round(price / 12) : price}
                        </span>
                        <span className="text-sm text-[var(--marketing-text-muted)]">/month</span>
                      </div>
                    ) : (
                      <span className="text-4xl font-bold tracking-tight text-[var(--marketing-text)]">
                        Custom
                      </span>
                    )}
                    {annual && price !== null && price > 0 && (
                      <p className="mt-1 text-sm text-[var(--marketing-text-muted)]">
                        Billed annually ({pricingConfig.currency}
                        {price}/year)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-1 border-t border-[var(--marketing-border)] p-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-start gap-3 text-sm">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--marketing-accent)]/10">
                          <Check className="h-3 w-3 text-[var(--marketing-accent)]" />
                        </div>
                        <span className="leading-relaxed text-[var(--marketing-text-muted)]">
                          {feature.name}
                          {feature.limit && (
                            <span className="ml-1 font-medium text-[var(--marketing-text)]">
                              ({feature.limit})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    href={
                      plan.ctaLink ??
                      (priceId ? `/register?plan=${plan.id}&annual=${annual}` : "/register")
                    }
                    className="block"
                  >
                    <Button
                      className={cn(
                        "w-full font-semibold rounded-xl h-12",
                        plan.recommended
                          ? "bg-[var(--marketing-accent)] text-[var(--marketing-bg)] hover:bg-[var(--marketing-accent-light)] shadow-lg shadow-[var(--marketing-accent)]/20"
                          : "bg-transparent border border-[var(--marketing-border)] text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-accent)] hover:border-[var(--marketing-accent)]"
                      )}
                      variant={plan.recommended ? "default" : "outline"}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-center text-sm text-[var(--marketing-text-muted)]"
        >
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[var(--marketing-accent)]" />
            <span>14-day Pro trial included</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[var(--marketing-accent)]" />
            <span>No credit card to start</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-[var(--marketing-accent)]" />
            <span>Cancel anytime</span>
          </div>
        </motion.div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-sm text-[var(--marketing-text-muted)]"
        >
          <span>Need more? </span>
          <Link
            href="/contact"
            className="text-[var(--marketing-accent)] hover:underline font-medium"
          >
            Contact sales
          </Link>
          <span> for custom enterprise plans.</span>
        </motion.div>

        {/* Detailed Feature Comparison */}
        <ComparisonTable />
      </div>
    </section>
  );
}

function ComparisonTable() {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!tableContainerRef.current || !tableHeaderRef.current) return;

      const containerRect = tableContainerRef.current.getBoundingClientRect();
      const headerRect = tableHeaderRef.current.getBoundingClientRect();
      const siteHeaderHeight = 64; // Height of the fixed site header

      // Show sticky header when:
      // 1. The original table header has scrolled above the site header
      // 2. The table container bottom is still visible (with some buffer for the sticky header)
      const headerScrolledOut = headerRect.bottom < siteHeaderHeight;
      const tableStillVisible = containerRect.bottom > siteHeaderHeight + 80;

      setShowStickyHeader(headerScrolledOut && tableStillVisible);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 }}
      className="mt-24"
    >
      <div className="text-center mb-12">
        <h3 className="text-2xl font-bold text-[var(--marketing-text)] md:text-3xl">
          Compare plans & features
        </h3>
        <p className="mt-3 text-[var(--marketing-text-muted)]">
          Everything you need to know about Go2&apos;s capabilities.
        </p>
      </div>

      {/* Sticky Header - appears when scrolling */}
      <div
        className={cn(
          "fixed top-16 left-0 right-0 z-40 transition-all duration-200 pointer-events-none",
          showStickyHeader
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="bg-[var(--marketing-bg)]/95 backdrop-blur-md border border-[var(--marketing-border)] shadow-md rounded-lg pointer-events-auto overflow-hidden">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="bg-[var(--marketing-bg-elevated)]">
                    <th className="text-left py-3 px-4 sm:px-6 text-sm font-medium text-[var(--marketing-text-muted)] w-[40%]">
                      Feature
                    </th>
                    <th className="text-center py-3 px-2 sm:px-4 w-[20%]">
                      <span className="text-sm font-semibold text-[var(--marketing-text)]">Free</span>
                      <span className="hidden sm:block text-xs text-[var(--marketing-text-muted)] mt-0.5">$0/mo</span>
                    </th>
                    <th className="text-center py-3 px-2 sm:px-4 w-[20%] bg-[var(--marketing-accent)]/5">
                      <span className="text-sm font-semibold text-[var(--marketing-accent)]">Pro</span>
                      <span className="hidden sm:block text-xs text-[var(--marketing-text-muted)] mt-0.5">$9/mo</span>
                    </th>
                    <th className="text-center py-3 px-2 sm:px-4 w-[20%]">
                      <span className="text-sm font-semibold text-[var(--marketing-text)]">Business</span>
                      <span className="hidden sm:block text-xs text-[var(--marketing-text-muted)] mt-0.5">$49/mo</span>
                    </th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container - constrained width for better centering */}
      <div
        ref={tableContainerRef}
        className="mx-auto max-w-5xl rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/50 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            {/* Header */}
            <thead ref={tableHeaderRef}>
              <tr className="border-b border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
                <th className="text-left py-4 px-4 sm:px-6 text-sm font-medium text-[var(--marketing-text-muted)] w-[40%]">
                  Feature
                </th>
                <th className="text-center py-4 px-2 sm:px-4 w-[20%]">
                  <span className="text-sm font-semibold text-[var(--marketing-text)]">Free</span>
                  <span className="hidden sm:block text-xs text-[var(--marketing-text-muted)] mt-0.5">$0/mo</span>
                </th>
                <th className="text-center py-4 px-2 sm:px-4 w-[20%] bg-[var(--marketing-accent)]/5">
                  <span className="text-sm font-semibold text-[var(--marketing-accent)]">Pro</span>
                  <span className="hidden sm:block text-xs text-[var(--marketing-text-muted)] mt-0.5">$9/mo</span>
                </th>
                <th className="text-center py-4 px-2 sm:px-4 w-[20%]">
                  <span className="text-sm font-semibold text-[var(--marketing-text)]">Business</span>
                  <span className="hidden sm:block text-xs text-[var(--marketing-text-muted)] mt-0.5">$49/mo</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonTable.map((category: ComparisonCategory) => (
                <CategoryRows key={category.name} category={category} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function CategoryRows({ category }: { category: ComparisonCategory }) {
  return (
    <>
      {/* Category Header */}
      <tr className="bg-[var(--marketing-bg)]">
        <td
          colSpan={4}
          className="py-3 px-4 sm:px-6 text-xs font-semibold uppercase tracking-wider text-[var(--marketing-text-muted)] border-t border-[var(--marketing-border)]"
        >
          {category.name}
        </td>
      </tr>
      {/* Features */}
      {category.features.map((feature: ComparisonCategory["features"][number], idx: number) => (
        <tr
          key={`${category.name}-${feature.name}`}
          className={cn(
            "border-b border-[var(--marketing-border)]/30 hover:bg-[var(--marketing-bg-elevated)]/80 transition-colors",
            idx % 2 === 0 ? "bg-transparent" : "bg-[var(--marketing-bg-elevated)]/30"
          )}
        >
          <td className="py-3 px-4 sm:px-6 text-sm text-[var(--marketing-text)] font-medium">
            {feature.name}
          </td>
          <td className="text-center py-3 px-2 sm:px-4">
            <FeatureValue value={feature.free} />
          </td>
          <td className="text-center py-3 px-2 sm:px-4 bg-[var(--marketing-accent)]/5">
            <FeatureValue value={feature.pro} highlight />
          </td>
          <td className="text-center py-3 px-2 sm:px-4">
            <FeatureValue value={feature.business} />
          </td>
        </tr>
      ))}
    </>
  );
}

function FeatureValue({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (typeof value === "boolean") {
    if (value) {
      return (
        <div className="inline-flex items-center justify-center">
          <Check
            className={cn(
              "h-5 w-5",
              highlight ? "text-[var(--marketing-accent)]" : "text-[var(--marketing-accent)]"
            )}
          />
        </div>
      );
    }
    return (
      <div className="inline-flex items-center justify-center">
        <Minus className="h-4 w-4 text-[var(--marketing-text-muted)]/40" />
      </div>
    );
  }

  return (
    <span
      className={cn(
        "text-sm font-medium",
        highlight ? "text-[var(--marketing-accent)]" : "text-[var(--marketing-text)]"
      )}
    >
      {value}
    </span>
  );
}
