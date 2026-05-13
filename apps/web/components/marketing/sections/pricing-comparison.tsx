"use client";

import React, { useRef, useEffect, useState } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    category: "Links & Redirects",
    items: [
      { name: "Short Links", free: "50", pro: "2,000/mo", business: "20,000/mo" },
      { name: "Click Tracking", free: "2,000/mo", pro: "100,000/mo", business: "500,000/mo" },
      { name: "Edge Runtime", free: true, pro: true, business: true },
      { name: "Automatic SSL", free: true, pro: true, business: true },
      { name: "Link Expiration", free: false, pro: true, business: true },
      { name: "Password Protection", free: false, pro: true, business: true },
      { name: "Click Limits", free: false, pro: true, business: true },
    ],
  },
  {
    category: "Analytics & Insights",
    items: [
      { name: "Basic Analytics", free: true, pro: true, business: true },
      { name: "Device & Geo Data", free: false, pro: true, business: true },
      { name: "Referrer Tracking", free: false, pro: true, business: true },
      { name: "Export Data (CSV)", free: false, pro: true, business: true },
      { name: "Real-time Dashboard", free: true, pro: true, business: true },
      { name: "A/B Testing", free: false, pro: false, business: true },
      { name: "Conversion Tracking", free: false, pro: false, business: true },
      { name: "Retention", free: "30 days", pro: "1 year", business: "2 years" },
    ],
  },
  {
    category: "Branding & Domains",
    items: [
      { name: "Custom Domains", free: "1", pro: "5", business: "25" },
      { name: "QR Codes", free: true, pro: true, business: true },
      { name: "AI-Styled QR Codes", free: false, pro: true, business: true },
      { name: "Custom Slugs", free: true, pro: true, business: true },
      { name: "Link-in-Bio Pages", free: false, pro: "1", business: "10" },
      { name: "OG Customization", free: false, pro: true, business: true },
    ],
  },
  {
    category: "Targeting & Routing",
    items: [
      { name: "Geo Targeting", free: false, pro: true, business: true },
      { name: "Device Targeting", free: false, pro: true, business: true },
      { name: "Deep Links (iOS/Android)", free: false, pro: true, business: true },
      { name: "UTM Builder", free: true, pro: true, business: true },
    ],
  },
  {
    category: "Team & API",
    items: [
      { name: "Team Members", free: "1", pro: "1", business: "10" },
      { name: "API Access", free: "100 req/min", pro: "1,000 req/min", business: "3,000 req/min" },
      { name: "Webhooks", free: false, pro: true, business: true },
      { name: "Tags", free: "5", pro: "25", business: "Unlimited" },
      { name: "Folders", free: false, pro: "5", business: "25" },
    ],
  },
  {
    category: "Support & Compliance",
    items: [
      { name: "Community Support", free: true, pro: true, business: true },
      { name: "Priority Email Support", free: false, pro: true, business: true },
      { name: "SLA (99.99%)", free: false, pro: false, business: true },
      { name: "GDPR Compliant", free: true, pro: true, business: true },
      { name: "SSO/SAML", free: false, pro: false, business: true },
    ],
  },
];

export function PricingComparison() {
  const tableRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!tableRef.current || !stickyHeaderRef.current) return;

      const tableRect = tableRef.current.getBoundingClientRect();
      const headerHeight = 80; // Account for site header

      // Show sticky header when table header scrolls out of view
      // Hide when table bottom is near the viewport top
      const shouldShow =
        tableRect.top < headerHeight && tableRect.bottom > headerHeight + 100;

      setShowStickyHeader(shouldShow);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
            Compare plans & features
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about Go2&apos;s capabilities.
          </p>
        </div>

        {/* Sticky Header - Fixed at top when scrolling */}
        <div
          ref={stickyHeaderRef}
          className={cn(
            "fixed top-16 right-0 left-0 z-50 border-border border-b bg-background/95 shadow-sm backdrop-blur-sm transition-all duration-200",
            showStickyHeader
              ? "translate-y-0 opacity-100"
              : "-translate-y-4 pointer-events-none opacity-0"
          )}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-4">
              <div className="w-2/5 px-6 font-semibold text-foreground text-sm">Feature</div>
              <div className="w-1/5 px-4 text-center">
                <span className="font-semibold text-foreground text-sm">Free</span>
                <span className="block text-muted-foreground text-xs">$0/mo</span>
              </div>
              <div className="w-1/5 px-4 text-center">
                <span className="font-bold text-primary text-sm">Pro</span>
                <span className="block text-muted-foreground text-xs">$9/mo</span>
              </div>
              <div className="w-1/5 px-4 text-center">
                <span className="font-semibold text-foreground text-sm">Business</span>
                <span className="block text-muted-foreground text-xs">$49/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div ref={tableRef} className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-border border-b bg-muted/30">
                <th className="w-2/5 px-6 py-5 font-semibold text-foreground text-sm">
                  Feature
                </th>
                <th className="w-1/5 px-4 py-5 text-center">
                  <span className="font-semibold text-foreground text-sm">Free</span>
                  <span className="mt-1 block text-muted-foreground text-xs">$0/mo</span>
                </th>
                <th className="w-1/5 bg-primary/5 px-4 py-5 text-center">
                  <span className="font-bold text-primary text-sm">Pro</span>
                  <span className="mt-1 block text-muted-foreground text-xs">$9/mo</span>
                </th>
                <th className="w-1/5 px-4 py-5 text-center">
                  <span className="font-semibold text-foreground text-sm">Business</span>
                  <span className="mt-1 block text-muted-foreground text-xs">$49/mo</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((category) => (
                <React.Fragment key={category.category}>
                  <tr className="bg-muted/50">
                    <td
                      colSpan={4}
                      className="px-6 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider"
                    >
                      {category.category}
                    </td>
                  </tr>
                  {category.items.map((item, idx) => (
                    <tr
                      key={item.name}
                      className={cn(
                        "border-border/50 border-b transition-colors hover:bg-muted/10",
                        idx === category.items.length - 1 && "border-b-0"
                      )}
                    >
                      <td className="px-6 py-4 font-medium text-foreground text-sm">
                        {item.name}
                      </td>
                      <td className="px-4 py-4 text-center text-sm">
                        {renderValue(item.free)}
                      </td>
                      <td className="bg-primary/5 px-4 py-4 text-center text-sm">
                        {renderValue(item.pro)}
                      </td>
                      <td className="px-4 py-4 text-center text-sm">
                        {renderValue(item.business)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function renderValue(value: string | boolean) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-5 w-5 text-primary" />
    ) : (
      <Minus className="mx-auto h-5 w-5 text-muted-foreground/30" />
    );
  }
  return <span className="font-medium text-foreground/80">{value}</span>;
}
