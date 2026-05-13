import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { Users, Shield, FolderOpen, UserPlus, Settings, BarChart3 } from "lucide-react";
import { FeaturePageTemplate } from "@/components/marketing/feature-page-template";

export const metadata: Metadata = getMetadata({
  title: "Team Collaboration - Built for Teams",
  description:
    "Invite teammates with role-based permissions. Workspaces, audit logs, and access controls for growing teams.",
});

const features = [
  {
    icon: Users,
    title: "Unlimited Team Members",
    description:
      "Invite your entire team at no extra cost. Everyone gets access to create and manage links.",
  },
  {
    icon: Shield,
    title: "Role-Based Permissions",
    description:
      "Admin, Editor, or Viewer roles. Control who can create links, edit settings, or just view analytics.",
  },
  {
    icon: FolderOpen,
    title: "Team Workspaces",
    description:
      "Organize links by team, project, or client. Each workspace has its own links, domains, and settings.",
  },
  {
    icon: UserPlus,
    title: "Easy Onboarding",
    description:
      "Invite by email or share a link. New members get access instantly with the right permissions.",
  },
  {
    icon: Settings,
    title: "Team Settings",
    description:
      "Set default domains, link settings, and branding for your entire team. Keep everything consistent.",
  },
  {
    icon: BarChart3,
    title: "Activity Feed",
    description:
      "See who created what and when. Full audit log for compliance and team visibility.",
  },
];

const benefits = [
  "Everyone on the same page",
  "No per-seat pricing surprises",
  "Secure access controls",
  "Complete audit trail",
  "Seamless collaboration",
  "Scale without limits",
];

const faqs = [
  {
    question: "How many team members can I add?",
    answer:
      "All paid plans include unlimited team members. Add your entire team at no additional cost.",
  },
  {
    question: "What permission levels are available?",
    answer:
      "Admin (full access), Editor (create and edit links), and Viewer (view analytics only). You can customize these for each workspace.",
  },
  {
    question: "Can I have multiple workspaces?",
    answer:
      "Yes! Create separate workspaces for different teams, clients, or projects. Each workspace is completely isolated.",
  },
  {
    question: "Is there an audit log?",
    answer:
      "Yes, every action is logged with timestamps and user information. Essential for compliance and team management.",
  },
];

// Team Demo
function TeamDemo() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 text-center">
        <h3 className="mb-2 font-semibold text-[var(--marketing-text)] text-lg">Team Management</h3>
        <p className="text-[var(--marketing-text-muted)] text-sm">Collaborate with your team</p>
      </div>

      <div className="mx-auto max-w-lg space-y-4">
        {/* Team Members */}
        <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="font-medium text-[var(--marketing-text)] text-sm">Team Members</div>
            <button
              type="button"
              className="text-[var(--marketing-accent)] text-xs hover:underline"
            >
              + Invite
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-[var(--marketing-bg-elevated)] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--marketing-accent)] font-semibold text-sm text-white">
                  JD
                </div>
                <div>
                  <div className="font-medium text-[var(--marketing-text)] text-sm">Jane Doe</div>
                  <div className="text-[var(--marketing-text-muted)] text-xs">jane@company.com</div>
                </div>
              </div>
              <span className="rounded-full bg-[var(--marketing-accent)]/10 px-2 py-1 text-[var(--marketing-accent)] text-xs">
                Admin
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[var(--marketing-bg-elevated)] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 font-semibold text-sm text-white">
                  MS
                </div>
                <div>
                  <div className="font-medium text-[var(--marketing-text)] text-sm">Mike Smith</div>
                  <div className="text-[var(--marketing-text-muted)] text-xs">mike@company.com</div>
                </div>
              </div>
              <span className="rounded-full bg-blue-500/10 px-2 py-1 text-blue-500 text-xs">
                Editor
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[var(--marketing-bg-elevated)] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 font-semibold text-sm text-white">
                  SJ
                </div>
                <div>
                  <div className="font-medium text-[var(--marketing-text)] text-sm">
                    Sarah Johnson
                  </div>
                  <div className="text-[var(--marketing-text-muted)] text-xs">
                    sarah@company.com
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-green-500/10 px-2 py-1 text-green-500 text-xs">
                Editor
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[var(--marketing-bg-elevated)] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 font-semibold text-sm text-white">
                  TC
                </div>
                <div>
                  <div className="font-medium text-[var(--marketing-text)] text-sm">Tom Chen</div>
                  <div className="text-[var(--marketing-text-muted)] text-xs">tom@company.com</div>
                </div>
              </div>
              <span className="rounded-full bg-gray-500/10 px-2 py-1 text-gray-500 text-xs">
                Viewer
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4">
          <div className="mb-4 font-medium text-[var(--marketing-text)] text-sm">
            Recent Activity
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--marketing-accent)]/10">
                <Users className="h-3 w-3 text-[var(--marketing-accent)]" />
              </div>
              <div>
                <span className="text-[var(--marketing-text)]">Jane created</span>
                <span className="font-mono text-[var(--marketing-accent)]"> go2.gg/launch</span>
                <div className="text-[var(--marketing-text-muted)] text-xs">2 minutes ago</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                <Settings className="h-3 w-3 text-blue-500" />
              </div>
              <div>
                <span className="text-[var(--marketing-text)]">Mike updated domain settings</span>
                <div className="text-[var(--marketing-text-muted)] text-xs">15 minutes ago</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/10">
                <UserPlus className="h-3 w-3 text-green-500" />
              </div>
              <div>
                <span className="text-[var(--marketing-text)]">Tom joined the team</span>
                <div className="text-[var(--marketing-text-muted)] text-xs">1 hour ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <FeaturePageTemplate
      badge="Collaboration"
      title="Built for Teams"
      subtitle="Invite your team with the right permissions. Everyone stays organized, and you keep control of who can do what."
      features={features}
      benefits={benefits}
      faqs={faqs}
      demo={<TeamDemo />}
      ctaTitle="Start collaborating"
      ctaDescription="Invite your team and start building together."
    />
  );
}
