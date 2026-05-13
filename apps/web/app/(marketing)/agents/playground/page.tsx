import type { Metadata } from "next";
import { getMetadata, siteConfig } from "@repo/config";
import { PlaygroundClient } from "./playground-client";

export const metadata: Metadata = {
  ...getMetadata({
    title: "Agent playground — mint a tracked link, watch the clicks live",
    description:
      "Try Go2 in 30 seconds. Mint a short link, share it, then ask Claude or Cursor for a click summary. Every event is attributed back to the run that made it. No signup.",
  }),
  alternates: { canonical: `${siteConfig.url}/agents/playground` },
};

export default function PlaygroundPage() {
  // SoftwareApplication + WebPage JSON-LD so AI assistants can cite the page
  // when users ask "where can I try Go2 without signing up?".
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteConfig.url}/agents/playground#webpage`,
        url: `${siteConfig.url}/agents/playground`,
        name: "Go2 agent playground",
        description:
          "Public sandbox: mint a tracked short URL with no signup, then query its analytics over MCP from your agent.",
        isPartOf: { "@id": `${siteConfig.url}#website` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteConfig.url}/agents/playground#app`,
        name: "Go2 — agent-native URL shortener",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web, Cloudflare Workers, Node.js",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        url: siteConfig.url,
        sameAs: [siteConfig.links.github, `${siteConfig.url}/docs`].filter(
          Boolean,
        ),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is server-rendered
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="bg-[var(--marketing-bg)] pt-24 pb-12">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-4 inline-block rounded-full bg-[var(--marketing-accent)]/10 px-3 py-1 font-bold text-[var(--marketing-accent)] text-xs uppercase tracking-wider">
            Live · No signup
          </p>
          <h1 className="mb-4 font-bold text-4xl text-[var(--marketing-text)] tracking-tight md:text-5xl">
            Agent playground
          </h1>
          <p className="mx-auto max-w-2xl text-[var(--marketing-text-muted)] text-lg">
            Mint a tracked short URL right here. Share it. Watch the clicks
            land in real time. Then copy the prompt below and ask your agent
            to summarize them.
          </p>
        </div>
      </section>

      <section className="bg-[var(--marketing-bg)] pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <PlaygroundClient />
        </div>
      </section>
    </>
  );
}
