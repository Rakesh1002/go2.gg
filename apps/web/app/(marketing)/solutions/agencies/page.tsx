import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { Building2, Users, Globe, Palette, BarChart3, Zap } from "lucide-react";
import { SolutionsPageTemplate } from "@/components/marketing/solutions-page-template";
import { MetricsHighlight } from "@/components/marketing/sections/metrics-highlight";
import { HowItWorks } from "@/components/marketing/sections/how-it-works";

export const metadata: Metadata = getMetadata({
  title: "Go2 for Agencies - Manage All Your Clients in One Place",
  description:
    "White-label link management for agencies. Separate client workspaces, custom domains, team collaboration, and reseller margins of 30-40%.",
});

const useCases = [
  {
    icon: Building2,
    title: "Client Workspaces",
    description:
      "Dedicated workspace per client with isolated links, domains, and analytics. Switch between clients in one click.",
  },
  {
    icon: Palette,
    title: "White-Label Ready",
    description:
      "Remove all Go2 branding. Present link management as your own service. Your brand, your client relationship.",
  },
  {
    icon: Users,
    title: "Team Permissions",
    description:
      "Granular role-based access. Give clients view-only analytics. Let team members manage without admin access.",
  },
  {
    icon: Globe,
    title: "Unlimited Branded Domains",
    description:
      "Each client gets their own custom domain at no extra cost. Competitors charge $29/mo per domain.",
  },
  {
    icon: BarChart3,
    title: "Client-Ready Reports",
    description:
      "Export beautiful analytics reports. Show clients exactly where their clicks come from and how campaigns perform.",
  },
  {
    icon: Zap,
    title: "Reseller Program",
    description:
      "Earn 30-40% margin reselling Go2 to your clients. We handle the infrastructure, you keep the relationship.",
  },
];

const benefits = [
  "One dashboard for all clients — no more juggling logins",
  "Bulk operations: Create 1000s of links via CSV or API",
  "White-label: Your brand, not ours",
  "Free custom domains for every client (Bitly charges $29/mo each)",
  "Sub-10ms redirects globally — impress clients with speed",
  "Priority support with dedicated account manager",
  "Reseller margins: 30-40% on all client plans",
  "No per-seat pricing — invite unlimited team members",
];

const agencyStats = [
  { value: "∞", label: "Client Workspaces", description: "No limits" },
  { value: "30-40%", label: "Reseller Margin", description: "Keep the profit" },
  { value: "$0", label: "Per Seat", description: "Unlimited team" },
  { value: "Free", label: "Custom Domains", description: "Per client" },
];

const agencySteps = [
  {
    step: 1,
    title: "Create client workspaces",
    description:
      "Set up isolated workspaces for each client. They get their own links, domains, and analytics.",
  },
  {
    step: 2,
    title: "Invite your team",
    description:
      "Add team members with role-based permissions. Give clients view-only access to their data.",
  },
  {
    step: 3,
    title: "White-label & bill",
    description:
      "Remove Go2 branding if desired. Use our reseller program to bill clients and keep 30-40% margin.",
  },
];

const agencyFaqs = [
  {
    question: "How does the reseller program work?",
    answer:
      "You purchase Go2 at a discounted rate (30-40% off) and resell to your clients at full price. We handle infrastructure, you keep the margin and client relationship.",
  },
  {
    question: "Can clients see Go2 branding?",
    answer:
      "On our white-label plans, no. You can remove all Go2 branding and present the service as your own.",
  },
  {
    question: "Is there a per-seat fee for team members?",
    answer: "No. Invite unlimited team members to any workspace. We don't charge per seat.",
  },
  {
    question: "Do clients get their own custom domains?",
    answer:
      "Yes. Each client workspace can have unlimited custom domains at no extra cost. Bitly charges $29/mo per domain.",
  },
];

export default function AgenciesPage() {
  return (
    <SolutionsPageTemplate
      badge="Built for Agencies"
      title="One Dashboard, Unlimited Clients"
      subtitle="Stop juggling multiple accounts. Manage all your clients' links, domains, and analytics from a single dashboard. White-label ready with reseller margins."
      useCases={useCases}
      benefits={benefits}
      ctaTitle="Start your agency partnership"
      ctaDescription="14-day trial with full agency features. Reseller discounts available."
      stats={<MetricsHighlight headline="Built for scale" stats={agencyStats} />}
      howItWorks={
        <HowItWorks
          headline="Onboard clients in minutes"
          subheadline="From signup to managing clients in three easy steps"
          steps={agencySteps}
        />
      }
      faqs={agencyFaqs}
    />
  );
}
