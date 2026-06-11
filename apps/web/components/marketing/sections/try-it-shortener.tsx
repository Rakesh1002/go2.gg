"use client";

import { Turnstile } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import { normalizeDestinationUrl } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, Copy, Link2, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface CreatedLink {
  id: string;
  shortUrl: string;
  destinationUrl: string;
  slug: string;
  expiresAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
const CLAIM_TOKEN_KEY = "go2:guest-claim-token";

function getOrCreateClaimToken(): string {
  if (typeof window === "undefined") return "";
  try {
    let token = localStorage.getItem(CLAIM_TOKEN_KEY);
    if (!token) {
      token = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem(CLAIM_TOKEN_KEY, token);
    }
    return token;
  } catch {
    // private mode — fall back to a per-call ephemeral token
    return crypto.randomUUID().replace(/-/g, "");
  }
}

export function TryItShortener() {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreatedLink | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    const destinationUrl = normalizeDestinationUrl(url);
    if (!destinationUrl) {
      toast.error("Enter a valid URL");
      return;
    }
    try {
      setSubmitting(true);
      setResult(null);
      const claimToken = getOrCreateClaimToken();
      const res = await fetch(`${API_URL}/api/v1/public/links`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(turnstileToken ? { "cf-turnstile-response": turnstileToken } : {}),
        },
        body: JSON.stringify({ destinationUrl, claimToken }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
          message?: string;
        };
        throw new Error(j.error?.message ?? j.message ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { data: CreatedLink };
      setResult(json.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't shorten that URL";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result.shortUrl);
    toast.success("Copied to clipboard");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mt-8 w-full max-w-2xl"
    >
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-2 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/60 p-2 shadow-lg backdrop-blur-md sm:flex-row sm:items-center"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
          <Link2 className="h-4 w-4 shrink-0 text-[var(--marketing-text-muted)]" />
          <input
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="audiopod.ai or https://your-long-url.com/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-10 w-full min-w-0 flex-1 border-0 bg-transparent text-[var(--marketing-text)] text-base outline-none placeholder:text-[var(--marketing-text-muted)] focus:outline-none focus:ring-0"
            required
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting || !url.trim()}
          className="gap-2 bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Shorten
        </Button>
      </form>

      {/* Invisible (interaction-only) — issues a token without user friction;
          the API requires it on anonymous link creation. */}
      <Turnstile onVerify={setTurnstileToken} />

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex flex-col items-stretch gap-3 rounded-2xl border border-[var(--marketing-accent)]/30 bg-[var(--marketing-accent)]/5 p-4 sm:flex-row sm:items-center"
        >
          <div className="flex-1">
            <a
              href={result.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono font-semibold text-[var(--marketing-accent)] text-lg hover:underline"
            >
              {result.shortUrl}
            </a>
            <p className="mt-1 text-[var(--marketing-text-muted)] text-xs">
              Expires {new Date(result.expiresAt).toLocaleString()} unless claimed
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyResult}
              className="gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
            <Link
              href="/register?claim=guest"
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--marketing-accent)] px-3 py-1.5 font-medium text-sm text-white transition hover:bg-[var(--marketing-accent-light)]"
            >
              Claim &amp; track it
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      )}

      <p className="mt-3 text-center text-[var(--marketing-text-muted)] text-xs">
        Anonymous links expire in 24 hours. Sign up free to keep them and unlock analytics.
      </p>
    </motion.div>
  );
}
