import type { Metadata } from "next";
import { getMetadata, siteConfig } from "@repo/config";
import { Badge } from "@/components/ui/badge";
import { Rocket, Sparkles, Bug, Wrench, AlertTriangle, ExternalLink } from "lucide-react";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";
import { fetchGitHubReleases, getFallbackChangelog, type ChangelogEntry } from "@/lib/github";

export const metadata: Metadata = getMetadata({
  title: "Changelog - Product Updates",
  description: "See what's new in Go2. Product updates, new features, improvements, and bug fixes.",
});

// Revalidate every hour
export const revalidate = 3600;

function getChangeIcon(type: string) {
  switch (type) {
    case "feature":
      return <Sparkles className="h-4 w-4 text-purple-500" />;
    case "improvement":
      return <Rocket className="h-4 w-4 text-blue-500" />;
    case "fix":
      return <Bug className="h-4 w-4 text-orange-500" />;
    case "breaking":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Wrench className="h-4 w-4 text-gray-500" />;
  }
}

function getChangeBadge(type: string) {
  switch (type) {
    case "feature":
      return (
        <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-none">
          New
        </Badge>
      );
    case "improvement":
      return (
        <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-none">
          Improved
        </Badge>
      );
    case "fix":
      return (
        <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-none">
          Fixed
        </Badge>
      );
    case "breaking":
      return (
        <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-none">
          Breaking
        </Badge>
      );
    default:
      return null;
  }
}

export default async function ChangelogPage() {
  // Fetch real releases from GitHub
  let changelogEntries: ChangelogEntry[] = await fetchGitHubReleases(15);

  // Fall back to static data if no releases found
  if (changelogEntries.length === 0) {
    changelogEntries = getFallbackChangelog();
  }

  const githubUrl = siteConfig.links.github ?? "https://github.com/rakesh1002/go2.gg";

  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <GeometricShapes position="hero-right" />
        <div className="max-w-7xl relative mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--marketing-accent)]/20 bg-[var(--marketing-accent)]/5 px-4 py-1.5 text-sm font-semibold text-[var(--marketing-accent)] mb-8 animate-fade-in-down">
            <Sparkles className="h-4 w-4" />
            Product Updates
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl animate-fade-in-up">
            What's <span className="text-[var(--marketing-accent)] text-gradient-warm">new</span> in
            Go2
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl leading-relaxed animate-fade-in-up stagger-1">
            Stay up to date with the latest features, improvements, and fixes. We ship fast and
            often.
          </p>
        </div>
      </section>

      {/* Changelog Entries */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-[var(--marketing-border)] hidden md:block" />

            {/* Entries */}
            <div className="space-y-12">
              {changelogEntries.map((entry) => (
                <div key={entry.version} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute left-6 w-4 h-4 rounded-full bg-[var(--marketing-accent)] border-4 border-[var(--marketing-bg)] hidden md:block" />

                  <div className="md:ml-16">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="text-2xl font-bold text-[var(--marketing-text)]">
                        v{entry.version}
                      </span>
                      <span className="text-sm text-[var(--marketing-text-muted)]">
                        {entry.date}
                      </span>
                      {entry.url && (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--marketing-accent)] hover:underline text-sm flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on GitHub
                        </a>
                      )}
                    </div>

                    <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6">
                      <ul className="space-y-4">
                        {entry.changes.map((change) => (
                          <li
                            key={`${change.type}-${change.text.slice(0, 20)}`}
                            className="flex items-start gap-3"
                          >
                            <span className="mt-0.5">{getChangeIcon(change.type)}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {getChangeBadge(change.type)}
                                <span className="text-[var(--marketing-text)]">{change.text}</span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* More Updates CTA */}
          <div className="mt-16 text-center">
            <p className="text-[var(--marketing-text-muted)] mb-4">
              Want to see what's coming next?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`${githubUrl}/releases`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--marketing-accent)] hover:underline font-medium"
              >
                View all releases on GitHub →
              </a>
              <span className="text-[var(--marketing-text-muted)] hidden sm:inline">•</span>
              <a
                href={`${githubUrl}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--marketing-accent)] hover:underline font-medium"
              >
                View our roadmap →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
