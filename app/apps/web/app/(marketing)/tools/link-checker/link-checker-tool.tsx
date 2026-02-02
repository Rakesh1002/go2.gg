"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Link2,
  ExternalLink,
  Loader2,
  ArrowRight,
  Lock,
  Globe,
} from "lucide-react";

interface CheckResult {
  url: string;
  isSafe: boolean;
  hasSSL: boolean;
  redirectChain: string[];
  finalUrl: string;
  warnings: string[];
  details: {
    malware: boolean;
    phishing: boolean;
    unwantedSoftware: boolean;
    domain: string;
    statusCode?: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export function LinkCheckerTool() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkLink() {
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Validate URL format
      let urlToCheck = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        urlToCheck = "https://" + url;
      }

      new URL(urlToCheck); // Validate URL

      const response = await fetch(`${API_URL}/api/public/link-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToCheck }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a minute.");
        }
        throw new Error("Failed to check link. Please try again.");
      }

      const data = await response.json();
      setResult(data.data);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("URL")) {
        setError("Please enter a valid URL");
      } else {
        setError(err instanceof Error ? err.message : "Failed to check link");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    checkLink();
  }

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter URL to check (e.g., example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading || !url}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Check
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <XCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Safety Status */}
          <Card className={result.isSafe ? "border-green-500" : "border-red-500"}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                {result.isSafe ? (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">
                    {result.isSafe ? "Link is Safe" : "Potential Threat Detected"}
                  </h3>
                  <p className="text-muted-foreground">{result.details.domain}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.warnings.map((warning, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Security Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Lock
                    className={`h-5 w-5 ${result.hasSSL ? "text-green-500" : "text-red-500"}`}
                  />
                  <div>
                    <p className="font-medium">SSL Certificate</p>
                    <p className="text-sm text-muted-foreground">
                      {result.hasSSL ? "Valid HTTPS connection" : "No SSL (insecure)"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield
                    className={`h-5 w-5 ${!result.details.malware ? "text-green-500" : "text-red-500"}`}
                  />
                  <div>
                    <p className="font-medium">Malware</p>
                    <p className="text-sm text-muted-foreground">
                      {result.details.malware ? "Threat detected" : "No threats found"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield
                    className={`h-5 w-5 ${!result.details.phishing ? "text-green-500" : "text-red-500"}`}
                  />
                  <div>
                    <p className="font-medium">Phishing</p>
                    <p className="text-sm text-muted-foreground">
                      {result.details.phishing ? "Suspected phishing" : "No phishing detected"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Final Destination</p>
                    <a
                      href={result.finalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
                    >
                      {new URL(result.finalUrl).hostname}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Redirect Chain */}
              {result.redirectChain.length > 1 && (
                <div className="pt-4 border-t">
                  <p className="font-medium mb-3">Redirect Chain</p>
                  <div className="space-y-2">
                    {result.redirectChain.map((url, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="shrink-0">
                          {i + 1}
                        </Badge>
                        <span className="truncate text-muted-foreground">{url}</span>
                        {i < result.redirectChain.length - 1 && (
                          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Uses Go2 */}
          {result.finalUrl.includes("go2.gg") && (
            <Card className="border-primary bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <p className="font-medium">This link is powered by Go2!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
