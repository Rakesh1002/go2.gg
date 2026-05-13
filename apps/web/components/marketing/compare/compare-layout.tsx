/**
 * Shared layout for /compare/<competitor> pages.
 *
 * Each page passes its own copy + comparison rows; the layout owns the page
 * shell, the cross-link footer to other compare pages, the JSON-LD wrapper,
 * and the CTA. Keeps the per-page files focused on what's actually
 * different — the verdict and the table data.
 */

import Link from "next/link";
import { ArrowRight, Check, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CTA } from "@/components/marketing/sections/cta";
import { siteConfig } from "@repo/config";

export interface CompareRow {
  feature: string;
  /** Either a short string (rendered as text) or boolean (renders ✓/—). */
  go2: string | boolean;
  competitor: string | boolean;
  /** Optional emphasis on the Go2 cell to call out a clear win. */
  highlight?: boolean;
}

export interface CompareCategory {
  title: string;
  rows: CompareRow[];
}

export interface CompareFAQ {
  q: string;
  a: string;
}

export interface CompareLayoutProps {
  competitor: {
    name: string;
    /** External URL of competitor (footer link) */
    url: string;
    /** One-paragraph honest framing of who they are. */
    summary: string;
  };
  /** URL slug under /compare. Used for self-linking + JSON-LD. */
  slug: string;
  hero: {
    badge?: string;
    headline: React.ReactNode;
    sub: string;
  };
  pickThem: string[];
  pickGo2: string[];
  /** Tagline below the verdict — one line, often a contrast. */
  verdict: React.ReactNode;
  categories: CompareCategory[];
  faqs: CompareFAQ[];
  /** Slugs of sibling compare pages to link in the footer. */
  otherCompares: { slug: string; label: string }[];
}

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center text-[var(--marketing-accent)]">
        <Check className="h-4 w-4" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center text-[var(--marketing-text-muted)]">
        <X className="h-4 w-4" />
      </span>
    );
  }
  if (value === "—" || value === "-") {
    return (
      <span className="inline-flex items-center justify-center text-[var(--marketing-text-muted)]">
        <Minus className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="text-[var(--marketing-text)] text-sm">{value}</span>
  );
}

export function CompareLayout({
  competitor,
  slug,
  hero,
  pickThem,
  pickGo2,
  verdict,
  categories,
  faqs,
  otherCompares,
}: CompareLayoutProps) {
  const pageUrl = `${siteConfig.url}/compare/${slug}`;

  // FAQPage + Product schemas help AI assistants and Google answer
  // "<competitor> alternative" queries with our content.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "Product",
        "@id": `${pageUrl}#go2-product`,
        name: "Go2",
        url: siteConfig.url,
        description: siteConfig.description,
        brand: { "@type": "Brand", name: "Go2" },
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: "0",
          highPrice: "49",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Compare",
            item: `${siteConfig.url}/compare/dub-vs-go2-for-agents`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: `vs ${competitor.name}`,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered JSON-LD
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative bg-[var(--marketing-bg)] pt-24 pb-16 md:pt-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Badge
            variant="outline"
            className="mb-6 border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/5 font-mono text-[10px] text-[var(--marketing-accent)] uppercase tracking-wider"
          >
            {hero.badge ?? "Comparison · Updated 2026"}
          </Badge>
          <h1 className="font-bold text-4xl text-[var(--marketing-text)] leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
            {hero.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-[var(--marketing-text-muted)] text-lg leading-relaxed">
            {hero.sub}
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-[var(--marketing-bg)] py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="mb-6 text-[var(--marketing-text-muted)] text-sm leading-relaxed">
            {competitor.summary}
          </p>
          <div className="overflow-hidden rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
            <table className="w-full">
              <thead className="bg-[var(--marketing-bg)]/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-[var(--marketing-accent)] text-xs uppercase tracking-wider">
                    Go2
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
                    {competitor.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, ci) => (
                  <>
                    <tr
                      key={`cat-${ci}`}
                      className="border-[var(--marketing-border)] border-t bg-[var(--marketing-bg)]/30"
                    >
                      <td
                        colSpan={3}
                        className="px-4 py-2 font-bold text-[var(--marketing-text)] text-xs uppercase tracking-wider"
                      >
                        {cat.title}
                      </td>
                    </tr>
                    {cat.rows.map((row, ri) => (
                      <tr
                        key={`row-${ci}-${ri}`}
                        className="border-[var(--marketing-border)] border-t"
                      >
                        <td className="px-4 py-3 text-[var(--marketing-text)] text-sm">
                          {row.feature}
                        </td>
                        <td
                          className={
                            `px-4 py-3 text-center${row.highlight
                              ? " bg-[var(--marketing-accent)]/[0.04]"
                              : ""}`
                          }
                        >
                          <Cell value={row.go2} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Cell value={row.competitor} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Verdict */}
      <section className="bg-[var(--marketing-bg)] py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-8">
              <p className="mb-3 font-bold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
                Pick {competitor.name} if
              </p>
              <ul className="space-y-3 text-[var(--marketing-text-muted)] leading-relaxed">
                {pickThem.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-[var(--marketing-accent)] bg-[var(--marketing-bg-elevated)] p-8 shadow-[var(--marketing-accent)]/10 shadow-lg">
              <p className="mb-3 font-bold text-[var(--marketing-accent)] text-xs uppercase tracking-wider">
                Pick Go2 if
              </p>
              <ul className="space-y-3 text-[var(--marketing-text)] leading-relaxed">
                {pickGo2.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/40 p-8 text-center">
            <div className="mx-auto max-w-2xl text-[var(--marketing-text)] text-base leading-relaxed md:text-lg">
              {verdict}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/agents/quickstart">
                <Button
                  size="lg"
                  className="rounded-full bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]"
                >
                  Try Go2 — 5-min quickstart
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/agents/playground">
                <Button size="lg" variant="outline" className="rounded-full">
                  Try the playground
                </Button>
              </Link>
              <a
                href={competitor.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="ghost" className="rounded-full">
                  Visit {competitor.name}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs (rendered as DOM so they're crawlable + match the JSON-LD) */}
      <section className="bg-[var(--marketing-bg)] py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 font-bold text-3xl text-[var(--marketing-text)] tracking-tight">
            Common questions
          </h2>
          <div className="space-y-6">
            {faqs.map((f, i) => (
              <div key={i}>
                <h3 className="font-semibold text-[var(--marketing-text)] text-lg">
                  {f.q}
                </h3>
                <p className="mt-2 text-[var(--marketing-text-muted)] leading-relaxed">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross-links to siblings */}
      {otherCompares.length > 0 && (
        <section className="border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/40 py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <p className="mb-4 font-bold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
              Other comparisons
            </p>
            <div className="flex flex-wrap gap-3">
              {otherCompares.map((c) => (
                <Link
                  key={c.slug}
                  href={`/compare/${c.slug}`}
                  className="rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-bg)] px-4 py-2 text-[var(--marketing-text)] text-sm transition-colors hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-accent)]"
                >
                  {c.label}
                  <ArrowRight className="ml-2 inline h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTA
        headline="Wire Go2 into your agent this afternoon."
        description="One MCP install. Your agent gets the full link toolkit. First tracked link in under five minutes."
        primaryCTA={{ text: "Read the quickstart", href: "/agents/quickstart" }}
        secondaryCTA={{ text: "Try the playground", href: "/agents/playground" }}
      />
    </>
  );
}
