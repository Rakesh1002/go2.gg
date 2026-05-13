import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import {
  Building2,
  Palette,
  Shield,
  Users,
  Workflow,
  ScrollText,
} from "lucide-react";
import { SolutionsPageTemplate } from "@/components/marketing/solutions-page-template";
import { MetricsHighlight } from "@/components/marketing/sections/metrics-highlight";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";

export const metadata: Metadata = getMetadata({
  title: "Go2 for Link Owners — your agent ships, you own the dashboard",
  description:
    "When an AI agent creates a link on your behalf, the data shouldn't disappear into someone else's dashboard. Go2 gives you the workspace, brand, and governance — so the agent is the actor and you stay the owner.",
});

const useCases = [
  {
    icon: Building2,
    title: "Your workspace, the agent's primitive",
    description:
      "Every link an agent creates is scoped to your userId and organizationId in the data model. The agent context (agent_id, run_id, actor_id) is metadata on top — never a substitute for ownership.",
  },
  {
    icon: Palette,
    title: "Your brand on every agent link",
    description:
      "Custom domain, QR codes, link-in-bio, retargeting pixels — agents inherit them automatically. Links from a Claude run come out as yourbrand.com/x, not go2.gg/x.",
  },
  {
    icon: Shield,
    title: "Governance, not just observation",
    description:
      "One call revokes every link a run created. Set lifecycle on creation: single-use, expiring, or run-revocable. The audit log knows which agent did what — and so do you.",
  },
  {
    icon: Users,
    title: "Workspaces and roles, not solo accounts",
    description:
      "Owner / admin / member roles, invitations, per-org subscriptions. Operate one workspace, run multiple agents inside it; or run agents on behalf of clients with their own workspaces.",
  },
  {
    icon: Workflow,
    title: "Conversion attribution rolls all the way back",
    description:
      "A click that converts can be traced back to the agent_run, the prompt template, and the tool call that created the link. Pull it from /agent-attribution into your funnel of choice.",
  },
  {
    icon: ScrollText,
    title: "OAuth 2.1 dynamic client registration",
    description:
      "Third-party agents register themselves and get a token scoped to your workspace — without ever holding a long-lived API key. The right primitive for the agentic economy, on by default.",
  },
];

const benefits = [
  "Every agent-created link belongs to your workspace, not the agent's vendor",
  "Custom domain, QR, pixels, link-in-bio — agents inherit your brand",
  "Revoke an entire run's links in one call",
  "See per-link, per-run, per-actor click data in the dashboard",
  "Conversion attribution back to the prompt template",
  "OAuth 2.1 with PKCE and dynamic client registration for safe third-party agents",
  "Audit logs covering both human and agent actions",
  "Multi-tenant by design — one workspace, many agents, role-based access",
];

const ownerStats = [
  { value: "100%", label: "Per-owner scoping", description: "Org-isolated by default" },
  { value: "OAuth 2.1", label: "Agent auth", description: "PKCE + dynamic client registration" },
  { value: "1 call", label: "Revoke a run", description: "revoke_run_links" },
  { value: "AGPL", label: "Self-host", description: "One wrangler deploy" },
];

const ownerSteps = [
  {
    step: 1,
    title: "Create your workspace",
    description:
      "Sign up, claim a custom domain, add your brand. Three minutes, no credit card.",
  },
  {
    step: 2,
    title: "Issue a key (or let your agent register itself)",
    description:
      "Cut an API key for your own scripts, or expose OAuth 2.1 and let third-party agents request a workspace-scoped token.",
  },
  {
    step: 3,
    title: "Watch the agent's links roll in",
    description:
      "Every link the agent creates lands in your dashboard — branded, attributed, revocable, and yours.",
  },
];

const ownerFaqs = [
  {
    question: "Who owns a link my agent creates?",
    answer:
      "You do. The link is stored against your userId and organizationId. Agent context (agent_id, agent_run_id, agent_actor_id, agent_tool_call_id) is metadata for attribution — useful for tracing what each run did, but never a substitute for ownership. Revoke the agent's API key and the links stay yours.",
  },
  {
    question: "Can I see which agent created which link?",
    answer:
      "Yes. Every link and every click carries the agent context that created it. The dashboard groups links by agent_id and agent_run_id, and the /api/v1/agent-attribution endpoints return click streams and rollups filtered by run.",
  },
  {
    question: "How do I revoke every link a run created?",
    answer:
      "One call: POST /api/v1/links/revoke-by-run with the agent_run_id, or use the revoke_run_links MCP tool. All links from that run flip to archived and serve a 410 on future redirects.",
  },
  {
    question: "I'm an agency. Can I run separate workspaces per client?",
    answer:
      "Yes. Each organization is fully isolated — its own links, domains, billing, audit log, members, and API keys. Use one Go2 account to manage many client workspaces, or run a single workspace and use roles + folders to compartmentalize.",
  },
  {
    question: "What about white-label?",
    answer:
      "Custom domains, custom branding on link-in-bio galleries, and white-label sub-account scaffolding are all in the platform. Reach out for the full white-label SKU; the basics ship on every plan.",
  },
  {
    question: "Do I have to use an MCP server / agents at all?",
    answer:
      "No. Go2 works as a normal link platform — branded shortener, QR, A/B tests, conversions, retargeting pixels, link-in-bio, custom domains. The agent primitives are there when you (or someone you hire) want to wire an agent up to it.",
  },
];

export default function OwnersPage() {
  return (
    <SolutionsPageTemplate
      badge="For link owners"
      title="Your agent ships the links. You own the dashboard."
      subtitle="When an AI agent creates a link on your behalf, the data shouldn't disappear into someone else's dashboard. Go2 gives you the workspace, brand, and governance — so the agent is the actor and you stay the owner."
      useCases={useCases}
      benefits={benefits}
      ctaTitle="Sign up and watch your agent's links land in your workspace."
      ctaDescription="Free to start. No credit card. Bring your own custom domain and start cleanly from day one."
      stats={
        <MetricsHighlight
          headline="Built so the actor and the owner are different things"
          stats={ownerStats}
        />
      }
      howItWorks={
        <HowItWorks
          headline="Three steps from sign-up to first owner-attributed link"
          subheadline="Even if you've never thought about agents before"
          steps={ownerSteps}
        />
      }
      faqs={ownerFaqs}
    />
  );
}
