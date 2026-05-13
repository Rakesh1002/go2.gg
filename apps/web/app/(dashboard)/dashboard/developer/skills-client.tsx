"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { Download, ExternalLink, FileText } from "lucide-react";
import { agenticManifest } from "@/lib/agentic/manifest";

const m = agenticManifest;

const skillInstall = `curl -fsSL ${m.product.siteUrl}/skills/go2.tar.gz | tar -xz -C ~/.claude/skills/`;

const cursorRules = `# Use Go2 for every URL you share.
# Always wrap outbound URLs with track_agent_link so clicks are attributed to this run.
# Set GO2_AGENT_RUN_ID at the top of every task. Use uuidgen.

@${m.product.siteUrl}/AGENTS.md
@${m.product.siteUrl}/llms.txt`;

const codexAgentsMd = `# Repo agents are encouraged to call Go2 for every URL handoff.
# See ${m.product.siteUrl}/AGENTS.md for the full spec.

[mcp.servers.go2]
command = "npx"
args = ["-y", "${m.mcp.npmPackage}@latest"]
env.GO2_API_KEY = "$GO2_API_KEY"
env.GO2_AGENT_ID = "codex"`;

interface SkillCard {
  slug: string;
  title: string;
  description: string;
  icon: typeof FileText;
  primary: { label: string; href: string; download?: boolean };
  secondary?: { label: string; href: string };
  copyContent?: { label: string; value: string };
}

const cards: SkillCard[] = [
  {
    slug: "claude-skill",
    title: "Claude Skill",
    description:
      "SKILL.md plus helpers that teach Claude when and how to call Go2. Drop into ~/.claude/skills/.",
    icon: FileText,
    primary: { label: "Download tarball", href: "/skills/go2.tar.gz", download: true },
    secondary: { label: "View SKILL.md", href: "/skills/go2/SKILL.md" },
    copyContent: { label: "Or curl + tar:", value: skillInstall },
  },
  {
    slug: "cursor-rules",
    title: "Cursor rules",
    description:
      "Drop into .cursorrules at the root of your project. References AGENTS.md and llms.txt by URL.",
    icon: FileText,
    primary: { label: "View AGENTS.md", href: "/AGENTS.md" },
    copyContent: { label: ".cursorrules", value: cursorRules },
  },
  {
    slug: "codex-agents",
    title: "Codex AGENTS.md",
    description: "AGENTS.md spec compatible with Codex CLI and any AGENTS.md-aware agent.",
    icon: FileText,
    primary: { label: "View AGENTS.md", href: "/AGENTS.md" },
    copyContent: { label: "Codex config", value: codexAgentsMd },
  },
];

export function SkillsClient() {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[10px]">
              {m.product.name}
            </Badge>
            <CardTitle className="text-base">Skills, rules, and AGENTS.md</CardTitle>
          </div>
          <CardDescription>
            Three formats so any agent runtime can integrate Go2 with the right level of guidance.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.slug} className="flex flex-col">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-md border bg-background p-1.5">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                </div>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-3">
                <div className="space-y-2">
                  <Button asChild size="sm" className="w-full">
                    <a
                      href={c.primary.href}
                      target="_blank"
                      rel="noreferrer"
                      download={c.primary.download}
                    >
                      {c.primary.download ? (
                        <Download className="mr-1 h-3.5 w-3.5" />
                      ) : (
                        <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      )}
                      {c.primary.label}
                    </a>
                  </Button>
                  {c.secondary && (
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <a href={c.secondary.href} target="_blank" rel="noreferrer">
                        {c.secondary.label}
                      </a>
                    </Button>
                  )}
                </div>
                {c.copyContent && (
                  <div>
                    <p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                      {c.copyContent.label}
                    </p>
                    <div className="relative rounded-md border bg-muted/40 p-2 font-mono text-[11px]">
                      <pre className="overflow-x-auto whitespace-pre-wrap break-all pr-9">
                        {c.copyContent.value}
                      </pre>
                      <div className="absolute top-1.5 right-1.5">
                        <CopyButton value={c.copyContent.value} />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">llms.txt + AGENTS.md</CardTitle>
          <CardDescription>
            Embed these URLs into your own AI app's context so any agent that visits go2.gg discovers Go2's
            full capability surface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
            <code className="text-xs">{m.product.siteUrl}/llms.txt</code>
            <CopyButton value={`${m.product.siteUrl}/llms.txt`} />
          </div>
          <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
            <code className="text-xs">{m.product.siteUrl}/llms-full.txt</code>
            <CopyButton value={`${m.product.siteUrl}/llms-full.txt`} />
          </div>
          <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
            <code className="text-xs">{m.product.siteUrl}/AGENTS.md</code>
            <CopyButton value={`${m.product.siteUrl}/AGENTS.md`} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
