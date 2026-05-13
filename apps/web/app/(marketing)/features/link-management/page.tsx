import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import { FolderOpen, Tag, Clock, Lock, MousePointerClick, Edit } from "lucide-react";
import { FeaturePageTemplate } from "@/components/marketing/feature-page-template";

export const metadata: Metadata = getMetadata({
  title: "Link Management - Organize Your Links",
  description:
    "Tags, folders, expiration dates, password protection, and click limits. Complete control over your short links.",
});

const features = [
  {
    icon: FolderOpen,
    title: "Organize with Folders",
    description:
      "Group links by campaign, client, or project. Keep everything organized as your link library grows.",
  },
  {
    icon: Tag,
    title: "Flexible Tagging",
    description:
      "Add multiple tags to any link for easy filtering and searching. Find the right link instantly.",
  },
  {
    icon: Clock,
    title: "Expiration Dates",
    description:
      "Set links to expire after a specific date or time. Perfect for limited-time offers and promotions.",
  },
  {
    icon: Lock,
    title: "Password Protection",
    description:
      "Require a password to access sensitive content. Control who can view your destination pages.",
  },
  {
    icon: MousePointerClick,
    title: "Click Limits",
    description:
      "Automatically disable links after a certain number of clicks. Great for exclusive content and giveaways.",
  },
  {
    icon: Edit,
    title: "Edit Anytime",
    description:
      "Change destinations, update metadata, or modify settings without breaking your existing links.",
  },
];

const benefits = [
  "Never lose track of important links",
  "Quick search across all your links",
  "Bulk operations for efficiency",
  "Automatic cleanup of expired links",
  "Access control for sensitive content",
  "Edit destinations without new URLs",
];

const faqs = [
  {
    question: "Can I organize links into subfolders?",
    answer:
      "Yes! You can create nested folder structures to organize links however you prefer, perfect for agencies managing multiple clients.",
  },
  {
    question: "What happens when a link expires?",
    answer:
      "Expired links can redirect to a custom page you specify, or show a default expiration message. You can also reactivate them anytime.",
  },
  {
    question: "Is there a limit to how many tags I can add?",
    answer:
      "No limits! Add as many tags as you need to keep your links organized and easily searchable.",
  },
  {
    question: "Can I bulk edit multiple links?",
    answer:
      "Yes, you can select multiple links and apply tags, move to folders, or change settings in bulk.",
  },
];

// Link Management Demo
function LinkManagementDemo() {
  return (
    <div className="p-6 md:p-8">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-2 rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-3">
          <div className="text-[var(--marketing-text-muted)]">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <span className="text-[var(--marketing-text-muted)] text-sm">
            Search links, tags, or folders...
          </span>
        </div>

        {/* Link Items */}
        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4 transition-colors hover:border-[var(--marketing-accent)]/30">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium font-mono text-[var(--marketing-accent)] text-sm">
                    go2.gg/summer
                  </span>
                  <span className="rounded-full bg-[var(--marketing-accent)]/10 px-2 py-0.5 text-[var(--marketing-accent)] text-xs">
                    Q3 Campaign
                  </span>
                </div>
                <p className="truncate text-[var(--marketing-text-muted)] text-sm">
                  example.com/summer-sale-2024
                </p>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold text-[var(--marketing-text)]">2,456</div>
                <div className="text-[var(--marketing-text-muted)] text-xs">clicks</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium font-mono text-[var(--marketing-accent)] text-sm">
                    go2.gg/docs
                  </span>
                  <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-purple-500 text-xs">
                    Documentation
                  </span>
                  <Lock className="h-3 w-3 text-[var(--marketing-text-muted)]" />
                </div>
                <p className="truncate text-[var(--marketing-text-muted)] text-sm">
                  internal.example.com/docs
                </p>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold text-[var(--marketing-text)]">892</div>
                <div className="text-[var(--marketing-text-muted)] text-xs">clicks</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-4 opacity-60">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium font-mono text-[var(--marketing-text-muted)] text-sm">
                    go2.gg/flash
                  </span>
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-red-500 text-xs">
                    Expired
                  </span>
                </div>
                <p className="truncate text-[var(--marketing-text-muted)] text-sm">
                  example.com/flash-sale
                </p>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold text-[var(--marketing-text-muted)]">5,000</div>
                <div className="text-[var(--marketing-text-muted)] text-xs">limit reached</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LinkManagementPage() {
  return (
    <FeaturePageTemplate
      badge="Stay Organized"
      title="Master Your Links"
      subtitle="Tags, folders, expiration dates, and more. Everything you need to keep your links organized and under control."
      features={features}
      benefits={benefits}
      faqs={faqs}
      demo={<LinkManagementDemo />}
      ctaTitle="Get organized"
      ctaDescription="Start managing your links like a pro."
      agentCallout={{
        title: "Lifecycle is a parameter, not a cron job.",
        body:
          "On creation, set 'expiresAt' to auto-archive after a date, 'singleUse: true' to 410 after the first click, or 'revocableByRun: true' to make a single revoke call wipe every link from a run. Folders, tags, and the dashboard treat agent-created links like any other — so the human's organizational scheme keeps working when the agent shows up.",
        primitive: "expiresAt · singleUse · revocableByRun · revoke_run_links",
      }}
    />
  );
}
