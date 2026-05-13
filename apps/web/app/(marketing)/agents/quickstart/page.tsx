import type { Metadata } from "next";
import Link from "next/link";
import { getMetadata } from "@repo/config";
import { ArrowRight, BookOpen, Github, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickstartStepper } from "@/components/marketing/agents/quickstart-stepper";

export const metadata: Metadata = getMetadata({
  title: "Quickstart — wire your agent's link toolkit in 5 minutes",
  description:
    "Step-by-step quickstart for the Go2 MCP server. Install in Claude Code or Cursor, give your agent the link toolkit (create, track, attribute, revoke), and ship your first tracked link — in five minutes.",
});

export default function AgentsQuickstartPage() {
  return (
    <>
      <section className="relative bg-[var(--marketing-bg)] pt-24 pb-12 md:pt-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Badge
            variant="outline"
            className="mb-6 border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/5 font-mono text-[10px] text-[var(--marketing-accent)] uppercase tracking-wider"
          >
            5 minutes · Copy-pasteable
          </Badge>
          <h1 className="font-bold text-4xl text-[var(--marketing-text)] leading-[1.1] tracking-tight md:text-5xl">
            Wire your agent's link toolkit.
          </h1>
          <p className="mt-6 text-[var(--marketing-text-muted)] text-lg leading-relaxed">
            Five steps. Each one is a copy-paste away. By the end, your agent can create branded
            short URLs, track every click, and pull attribution back — all from any MCP client.
          </p>
        </div>
      </section>

      <QuickstartStepper />

      {/* Non-MCP alternative — SDK */}
      <section className="border-[var(--marketing-border)] border-y bg-[var(--marketing-bg-elevated)]/40 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-3 font-bold text-2xl text-[var(--marketing-text)] tracking-tight md:text-3xl">
            Not using MCP? Use the SDK directly.
          </h2>
          <p className="mb-6 text-[var(--marketing-text-muted)] leading-relaxed">
            Building your own agent runtime, or wiring Go2 into Mastra / Vercel AI SDK / LangChain
            tool calls? Skip the MCP server and use the typed TypeScript SDK.
          </p>
          <div className="overflow-hidden rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)]">
            <div className="border-[var(--marketing-border)] border-b bg-[var(--marketing-bg-elevated)]/40 px-4 py-2">
              <span className="font-mono text-[var(--marketing-text-muted)] text-xs">
                npm install go2-sdk
              </span>
            </div>
            <pre className="overflow-x-auto whitespace-pre p-4 font-mono text-[var(--marketing-text)] text-sm leading-relaxed">{`import { Go2 } from "go2-sdk";

const go2 = new Go2({ apiKey: process.env.GO2_API_KEY! });

// Same agent attribution shape as the MCP tools
const link = await go2.links.create({
  destinationUrl: "https://example.com/dashboard",
  agentId: "my-agent",
  agentRunId: "run_abc",
  agentActorId: "user_42",
});

// Pull the click stream for that run
const { data: clicks } = await go2.agentAttribution.list({
  agentRunId: "run_abc",
});`}</pre>
          </div>
          <p className="mt-4 text-[var(--marketing-text-muted)] text-sm">
            Fully typed. Works in Node 18+, Bun, Deno, Cloudflare Workers. Full reference at{" "}
            <a
              href="https://www.npmjs.com/package/go2-sdk"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--marketing-accent)] hover:underline"
            >
              npmjs.com/package/go2-sdk
            </a>
            .
          </p>
        </div>
      </section>

      {/* What's next */}
      <section className="border-[var(--marketing-border)] border-t bg-[var(--marketing-bg-elevated)]/40 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 font-bold text-2xl text-[var(--marketing-text)] tracking-tight md:text-3xl">
            Where to next
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <NextLink
              href="/developers/api"
              icon={BookOpen}
              title="API reference"
              body="Full schemas, scopes, and curl examples for every endpoint."
            />
            <NextLink
              href="/developers/mcp"
              icon={MessageSquare}
              title="MCP server docs"
              body="All tools, transports, OAuth flow, and per-client configs."
            />
            <NextLink
              href="/agents"
              icon={ArrowRight}
              title="The pitch"
              body="Why per-run attribution is the missing primitive — with use cases and the Dub comparison."
            />
            <NextLink
              href="https://github.com/rakesh1002/go2.gg"
              icon={Github}
              title="GitHub"
              body="Star, fork, file issues. The whole stack is AGPL."
              external
            />
          </div>

          <div className="mt-12 rounded-xl border border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/5 p-6 text-center">
            <p className="mb-4 text-[var(--marketing-text)] text-sm">
              Stuck on a step? Open an issue on GitHub or DM us. We're shipping in public.
            </p>
            <Link href="/contact">
              <Button className="rounded-full bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]">
                Talk to a human
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function NextLink({
  href,
  icon: Icon,
  title,
  body,
  external,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  external?: boolean;
}) {
  const className =
    "group flex items-start gap-4 rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-5 hover:border-[var(--marketing-accent)]/40 hover:bg-[var(--marketing-bg-elevated)] transition-colors";
  const inner = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10">
        <Icon className="h-5 w-5 text-[var(--marketing-accent)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[var(--marketing-text)] text-sm transition-colors group-hover:text-[var(--marketing-accent)]">
          {title}
        </p>
        <p className="mt-1 text-[var(--marketing-text-muted)] text-sm leading-relaxed">{body}</p>
      </div>
    </>
  );

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
