"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

const SCALAR_SCRIPT = "https://cdn.jsdelivr.net/npm/@scalar/api-reference";

export function OpenApiClient() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (document.querySelector(`script[src="${SCALAR_SCRIPT}"]`)) return;
    const s = document.createElement("script");
    s.src = SCALAR_SCRIPT;
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-[10px]">
              OpenAPI 3.1
            </Badge>
            <CardTitle className="text-base">REST reference</CardTitle>
          </div>
          <CardDescription>
            Powered by Scalar. The same spec served at <code>/openapi.json</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href="/openapi.json" target="_blank" rel="noreferrer">
              Raw spec
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href="/docs/api-reference" target="_blank" rel="noreferrer">
              Full-page Scalar viewer
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <div ref={ref} className="overflow-hidden rounded-lg border bg-card">
        <script
          id="api-reference"
          data-url="/openapi.json"
          data-configuration={JSON.stringify({
            theme: "default",
            layout: "modern",
            hideDownloadButton: false,
          })}
        />
      </div>
    </div>
  );
}
