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
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold text-[var(--marketing-text)] mb-2">Team Management</h3>
        <p className="text-sm text-[var(--marketing-text-muted)]">Collaborate with your team</p>
      </div>

      <div className="max-w-lg mx-auto space-y-4">
        {/* Team Members */}
        <div className="p-4 rounded-xl bg-[var(--marketing-bg)] border border-[var(--marketing-border)]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-[var(--marketing-text)]">Team Members</div>
            <button
              type="button"
              className="text-xs text-[var(--marketing-accent)] hover:underline"
            >
              + Invite
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--marketing-bg-elevated)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--marketing-accent)] flex items-center justify-center text-white text-sm font-semibold">
                  JD
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--marketing-text)]">Jane Doe</div>
                  <div className="text-xs text-[var(--marketing-text-muted)]">jane@company.com</div>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
                Admin
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--marketing-bg-elevated)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                  MS
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--marketing-text)]">Mike Smith</div>
                  <div className="text-xs text-[var(--marketing-text-muted)]">mike@company.com</div>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                Editor
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--marketing-bg-elevated)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-semibold">
                  SJ
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--marketing-text)]">
                    Sarah Johnson
                  </div>
                  <div className="text-xs text-[var(--marketing-text-muted)]">
                    sarah@company.com
                  </div>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                Editor
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--marketing-bg-elevated)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-semibold">
                  TC
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--marketing-text)]">Tom Chen</div>
                  <div className="text-xs text-[var(--marketing-text-muted)]">tom@company.com</div>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-500/10 text-gray-500">
                Viewer
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-4 rounded-xl bg-[var(--marketing-bg)] border border-[var(--marketing-border)]">
          <div className="text-sm font-medium text-[var(--marketing-text)] mb-4">
            Recent Activity
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--marketing-accent)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="h-3 w-3 text-[var(--marketing-accent)]" />
              </div>
              <div>
                <span className="text-[var(--marketing-text)]">Jane created</span>
                <span className="font-mono text-[var(--marketing-accent)]"> go2.gg/launch</span>
                <div className="text-xs text-[var(--marketing-text-muted)]">2 minutes ago</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Settings className="h-3 w-3 text-blue-500" />
              </div>
              <div>
                <span className="text-[var(--marketing-text)]">Mike updated domain settings</span>
                <div className="text-xs text-[var(--marketing-text-muted)]">15 minutes ago</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <UserPlus className="h-3 w-3 text-green-500" />
              </div>
              <div>
                <span className="text-[var(--marketing-text)]">Tom joined the team</span>
                <div className="text-xs text-[var(--marketing-text-muted)]">1 hour ago</div>
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
