import type { Metadata } from "next";
import { getMetadata, siteConfig } from "@repo/config";

import { AgentHero } from "@/components/marketing/agents/agent-hero";
import { McpInstallSnippet } from "@/components/marketing/agents/mcp-install-snippet";
import { AgentUseCases } from "@/components/marketing/agents/agent-use-cases";
import { AttributionLoop } from "@/components/marketing/diagrams/attribution-loop";
import { PixelFanout } from "@/components/marketing/diagrams/pixel-fanout";
import { OwnerPillars } from "@/components/marketing/owners/owner-pillars";
import { OwnerPainGain } from "@/components/marketing/owners/owner-pain-gain";
import { OwnerUseCases } from "@/components/marketing/owners/owner-use-cases";
import { CTA } from "@/components/marketing/sections/cta";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";
import { PricingSection } from "@/components/marketing/sections/pricing-section";
import { TrustBadges } from "@/components/marketing/sections/trust-badges";

export const metadata: Metadata = getMetadata({
  title: siteConfig.tagline,
  description: siteConfig.description,
});

export default function HomePage() {
  return (
    <>
      <AgentHero variant="homepage" />
      <OwnerPillars />
      <HowItWorks
        headline="From paste to first click in three steps."
        subheadline="No code required. Bring your domain or use ours."
        steps={[
          {
            step: 1,
            title: "Add your domain (or use go2.gg)",
            description:
              "Point your custom domain at Go2 with a single DNS record. Want to skip it? Anonymous and account-bound go2.gg links work out of the box.",
          },
          {
            step: 2,
            title: "Create links — anywhere",
            description:
              "From the dashboard, the REST API, or your AI agent via MCP. Add custom slugs, QR codes, link-in-bio entries, and retargeting pixels per link.",
          },
          {
            step: 3,
            title: "See every click",
            description:
              "Real-time analytics: geo, device, browser, referrer, UTM. Export to CSV. Your data, your dashboard, no paywall.",
          },
        ]}
      />
      <OwnerPainGain />
      <PixelFanout />
      <OwnerUseCases />
      <AttributionLoop />
      <AgentUseCases />
      <McpInstallSnippet />
      <PricingSection
        headline="Free to ship. Pay when it works."
        subheadline="Free for 100 links a month. Pro and Business unlock custom domains, team seats, and longer retention."
        showComparisonTable={false}
      />
      <TrustBadges />

      <CTA
        headline="Short links for your team — and your AI."
        description="Custom domain, full analytics, and an MCP server your agent can install in five minutes. Free for 100 links a month — no credit card."
        primaryCTA={{ text: "Start free — no card", href: "/register" }}
        secondaryCTA={{ text: "Read the docs", href: "/docs" }}
      />
    </>
  );
}
