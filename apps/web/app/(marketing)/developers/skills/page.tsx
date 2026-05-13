import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { Download, ExternalLink, FileText } from "lucide-react";
import { agenticManifest } from "@/lib/agentic/manifest";
import { getMetadata } from "@repo/config";

const m = agenticManifest;

export const metadata: Metadata = getMetadata({
  title: "Skills + AGENTS.md — drop Go2 into any agent runtime",
  description: "Claude Skill, Cursor rules, Codex AGENTS.md. Generated from one capability manifest.",
});

const skillInstall = `curl -fsSL ${m.product.siteUrl}/skills/go2.tar.gz | tar -xz -C ~/.claude/skills/`;

export default function SkillsPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="space-y-2">
          <Badge variant="secondary" className="font-mono text-[10px]">
            SKILL.md / AGENTS.md
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">
            Drop-in skills for every agent runtime.
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            One manifest. Three export formats. Pick whichever your agent runtime understands and we keep
            them in sync with the live API.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Claude Skill</CardTitle>
            </div>
            <CardDescription>
              SKILL.md plus helpers. Teaches Claude when and how to call Go2.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <Button asChild className="w-full">
              <a href="/skills/go2.tar.gz" download>
                <Download className="mr-1 h-3.5 w-3.5" />
                Download tarball
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/skills/go2/SKILL.md" target="_blank" rel="noreferrer">
                View SKILL.md
              </a>
            </Button>
            <div className="rounded-md border bg-muted/30 p-2 font-mono text-[11px]">
              <div className="flex items-start justify-between gap-2">
                <pre className="overflow-x-auto whitespace-pre-wrap break-all">{skillInstall}</pre>
                <CopyButton value={skillInstall} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">AGENTS.md</CardTitle>
            </div>
            <CardDescription>
              Open spec used by Cursor, Codex, and AGENTS.md-aware agents.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <Button asChild className="w-full">
              <a href="/AGENTS.md" target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                View AGENTS.md
              </a>
            </Button>
            <p className="text-muted-foreground text-xs">
              Reference it from your project root via{" "}
              <code>@{m.product.siteUrl}/AGENTS.md</code> or copy verbatim.
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">llms.txt</CardTitle>
            </div>
            <CardDescription>Capability index any LLM tooling can ingest.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <Button asChild className="w-full">
              <a href="/llms.txt" target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                View llms.txt
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/llms-full.txt" target="_blank" rel="noreferrer">
                Full corpus
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border bg-muted/20 p-6">
        <h3 className="font-semibold text-base">Why three formats?</h3>
        <p className="mt-1 max-w-3xl text-muted-foreground text-sm">
          Claude reads SKILL.md when present in <code>~/.claude/skills/</code>. Cursor and Codex look for
          AGENTS.md at the project root. Generic tooling indexes <code>llms.txt</code>. We generate all
          three from one source so they never drift.
        </p>
      </section>
    </div>
  );
}
