"use client";

import { useEffect, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, ExternalLink, Sparkles } from "lucide-react";
import { normalizeDestinationUrl } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.go2.gg";

interface GuestLink {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  slug: string;
  domain: string;
  expiresAt: string;
}

interface GuestStats {
  id: string;
  shortUrl: string;
  totalClicks: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksByDate: { date: string; clicks: number }[];
  topCountries: { country: string; clicks: number }[];
}

export function PlaygroundClient() {
  const [destinationUrl, setDestinationUrl] = useState(
    "https://go2.gg/docs/guides/plans-and-limits",
  );
  const [link, setLink] = useState<GuestLink | null>(null);
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [creating, setCreating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll public stats while a link is in play.
  useEffect(() => {
    if (!link) return;
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(
          `${API_URL}/api/v1/public/links/${link!.id}/stats`,
        );
        if (!res.ok) return;
        const json = (await res.json()) as { data: GuestStats };
        if (!cancelled) setStats(json.data);
      } catch {
        // Silent — poll keeps going
      }
    }
    poll(); // immediate
    pollRef.current = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [link]);

  async function mintLink(e: React.FormEvent) {
    e.preventDefault();
    const dest = normalizeDestinationUrl(destinationUrl);
    if (!dest) {
      toast.error("Enter a valid URL");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/public/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationUrl: dest }),
      });
      const json = (await res.json()) as
        | { success: true; data: GuestLink }
        | { success: false; error: { message: string } };
      if (!res.ok || !("data" in json)) {
        const msg =
          "error" in json && json.error?.message
            ? json.error.message
            : "Couldn't mint a link — try again.";
        throw new Error(msg);
      }
      setLink(json.data);
      setStats(null);
      toast.success("Link minted. Share it to start collecting clicks.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mint failed");
    } finally {
      setCreating(false);
    }
  }

  function copy(value: string, label = "Copied") {
    navigator.clipboard.writeText(value);
    toast.success(label);
  }

  function reset() {
    setLink(null);
    setStats(null);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  // ---------------------------------------------------------------------------
  // Step 1 — mint
  // ---------------------------------------------------------------------------

  if (!link) {
    return (
      <Card className="border-[var(--marketing-border)]">
        <CardHeader>
          <CardTitle className="text-xl">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--marketing-accent)] font-bold text-white text-xs">
              1
            </span>
            Mint a tracked short URL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={mintLink} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="dest"
                className="font-medium text-[var(--marketing-text)] text-sm"
              >
                Destination URL
              </label>
              <Input
                id="dest"
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="example.com/long-article"
                disabled={creating}
                className="h-11"
                required
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[var(--marketing-text-muted)] text-xs">
                Guest links live for 24 hours and have full attribution.
                Sign up to keep them forever.
              </p>
              <Button type="submit" disabled={creating} className="h-11">
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting…
                  </>
                ) : (
                  <>
                    Mint a link
                    <Sparkles className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Step 2 — share + Step 3 — chart (live)
  // ---------------------------------------------------------------------------

  const mcpInstall = "claude mcp add go2 -- npx -y go2-mcp-server@latest";

  const promptText = `Get analytics for ${link.shortUrl} using the Go2 MCP server. Show me clicks today and the top 3 countries.`;

  const restCurl = `curl -s "${API_URL}/api/v1/public/links/${link.id}/stats" | jq '.'`;

  return (
    <div className="space-y-6">
      {/* Live link card */}
      <Card className="border-[var(--marketing-accent)]/50 bg-[var(--marketing-accent)]/[0.04]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-xl">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--marketing-accent)] font-bold text-white text-xs">
                2
              </span>
              Your tracked link
            </CardTitle>
            <Badge variant="secondary">Expires in 24h</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={link.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[var(--marketing-accent)] text-lg hover:underline"
            >
              {link.shortUrl}
            </a>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(link.shortUrl, "Short URL copied")}
            >
              <Copy className="mr-2 h-3 w-3" />
              Copy URL
            </Button>
            <Button size="sm" variant="ghost" onClick={reset}>
              Mint another
            </Button>
          </div>
          <p className="break-all text-[var(--marketing-text-muted)] text-sm">
            <ExternalLink className="mr-1 inline h-3 w-3" />
            redirects to {link.destinationUrl}
          </p>
        </CardContent>
      </Card>

      {/* Live chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--marketing-accent)] font-bold text-white text-xs">
              3
            </span>
            Watch it live
          </CardTitle>
          <p className="text-[var(--marketing-text-muted)] text-sm">
            Click the link in another tab. The chart updates every 5 seconds.
          </p>
        </CardHeader>
        <CardContent>
          {!stats ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <>
              <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                <Stat label="Total clicks" value={stats.totalClicks} />
                <Stat label="Today" value={stats.clicksToday} />
                <Stat label="This week" value={stats.clicksThisWeek} />
              </div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.clicksByDate}>
                    <defs>
                      <linearGradient
                        id="clickFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--marketing-accent)"
                          stopOpacity={0.6}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--marketing-accent)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d: string) => d.slice(5)}
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      strokeOpacity={0.4}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="currentColor"
                      strokeOpacity={0.4}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--background)",
                        border: "1px solid var(--marketing-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="var(--marketing-accent)"
                      strokeWidth={2}
                      fill="url(#clickFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {stats.topCountries.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {stats.topCountries.map((c) => (
                    <Badge key={c.country} variant="outline">
                      {c.country}: {c.clicks}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Ask your agent */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Ask your agent</CardTitle>
          <p className="text-[var(--marketing-text-muted)] text-sm">
            One line to install the MCP server, then drop the prompt into Claude
            Code, Cursor, or your own integration. Every link your agent mints
            this way is attributed to the run that made it.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Snippet
            label="Install MCP (one line)"
            language="bash"
            value={mcpInstall}
            onCopy={() => copy(mcpInstall, "Install command copied")}
          />
          <Snippet
            label="MCP prompt"
            value={promptText}
            onCopy={() => copy(promptText, "Prompt copied")}
          />
          <Snippet
            label="REST"
            language="bash"
            value={restCurl}
            onCopy={() => copy(restCurl, "Curl copied")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-3">
      <p className="text-[var(--marketing-text-muted)] text-xs">{label}</p>
      <p className="font-bold text-2xl text-[var(--marketing-text)] tabular-nums">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Snippet({
  label,
  value,
  language,
  onCopy,
}: {
  label: string;
  value: string;
  language?: string;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-[var(--marketing-text)] text-xs uppercase tracking-wider">
          {label}
        </span>
        <Button size="sm" variant="ghost" onClick={onCopy}>
          <Copy className="mr-2 h-3 w-3" /> Copy
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-3 font-mono text-xs">
        <code className={language ? `language-${language}` : undefined}>
          {value}
        </code>
      </pre>
    </div>
  );
}
