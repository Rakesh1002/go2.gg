"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  Link2,
  RefreshCw,
  ArrowRight,
  Lightbulb,
} from "lucide-react";

interface SlugSuggestion {
  slug: string;
  reason: string;
}

export default function AIPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SlugSuggestion[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

  async function generateSuggestions() {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setSuggestions([]);

    try {
      const response = await fetch(`${apiUrl}/api/v1/slugs/suggest`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data;

        // Handle different response formats
        if (Array.isArray(data)) {
          setSuggestions(data);
        } else if (data?.suggestions) {
          setSuggestions(data.suggestions);
        } else if (data?.slug) {
          // Single suggestion format
          setSuggestions([
            { slug: data.slug, reason: data.reasoning || "AI-generated suggestion" },
          ]);
        } else {
          // Fallback - generate some basic suggestions
          const hostname = new URL(url).hostname.replace("www.", "");
          const pathParts = new URL(url).pathname.split("/").filter(Boolean);
          setSuggestions([
            { slug: pathParts[0] || hostname.split(".")[0], reason: "Based on URL path" },
            { slug: `go-${Date.now().toString(36)}`, reason: "Short and unique" },
          ]);
        }
      } else {
        toast.error("Failed to generate suggestions");
      }
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      toast.error("Failed to generate suggestions");
    } finally {
      setLoading(false);
    }
  }

  function copySlug(slug: string, index: number) {
    navigator.clipboard.writeText(slug);
    setCopiedIndex(index);
    toast.success("Slug copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function useSlug(slug: string) {
    // Navigate to create link page with the slug pre-filled
    window.location.href = `/dashboard/links?slug=${encodeURIComponent(slug)}&url=${encodeURIComponent(url)}`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">AI Slug Generator</h2>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Beta
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Generate memorable, AI-powered short link slugs for your URLs.
        </p>
      </div>

      {/* Main Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Generate Slug Suggestions
          </CardTitle>
          <CardDescription>
            Enter a URL and our AI will suggest short, memorable slugs based on the content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/my-long-article-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateSuggestions()}
              className="flex-1"
            />
            <Button onClick={generateSuggestions} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-3 pt-4">
              {["sk1", "sk2", "sk3"].map((id) => (
                <div key={id} className="flex items-center gap-4 p-4 rounded-lg border">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {!loading && suggestions.length > 0 && (
            <div className="space-y-3 pt-4">
              <p className="text-sm font-medium text-muted-foreground">
                Suggestions ({suggestions.length})
              </p>
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.slug}-${index}`}
                  className="flex items-center justify-between gap-4 p-4 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Link2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono font-medium text-lg">/{suggestion.slug}</p>
                      <p className="text-sm text-muted-foreground truncate">{suggestion.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copySlug(suggestion.slug, index)}
                      className="gap-1"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button size="sm" onClick={() => useSlug(suggestion.slug)} className="gap-1">
                      Use
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && suggestions.length === 0 && (
            <div className="py-8 text-center border rounded-lg border-dashed">
              <Lightbulb className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Enter a URL to get started</p>
              <p className="text-sm text-muted-foreground mt-1">
                AI will analyze the page and suggest memorable slugs
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tips for Great Slugs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="font-medium text-sm">Keep it short</p>
              <p className="text-xs text-muted-foreground">
                Shorter slugs are easier to remember and share
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Make it memorable</p>
              <p className="text-xs text-muted-foreground">Use words that relate to your content</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Avoid special characters</p>
              <p className="text-xs text-muted-foreground">
                Stick to letters, numbers, and hyphens
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
