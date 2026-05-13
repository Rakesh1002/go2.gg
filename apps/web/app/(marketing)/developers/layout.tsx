import type { ReactNode } from "react";
import Link from "next/link";
import { Bot, Code2, FileCode2, Globe, ScrollText, Sparkles } from "lucide-react";

const tabs = [
  { href: "/developers", label: "Overview", icon: Sparkles, exact: true },
  { href: "/developers/mcp", label: "MCP server", icon: Bot },
  { href: "/developers/api", label: "REST API", icon: Code2 },
  { href: "/developers/skills", label: "Skills", icon: ScrollText },
  { href: "/developers/llms", label: "llms.txt", icon: Globe },
] as const;

export default function DevelopersLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="mb-8 flex flex-wrap items-center gap-2 border-b pb-4 text-sm">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </Link>
          );
        })}
        <span className="ml-auto inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 font-mono text-[11px] text-muted-foreground">
          <FileCode2 className="h-3 w-3" />
          OpenAPI 3.1
        </span>
      </div>
      {children}
    </div>
  );
}
