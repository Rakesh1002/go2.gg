"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Play, Copy, Key, Clock, CheckCircle2, XCircle } from "lucide-react";

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  body?: object;
  pathParams?: string[];
}

const ENDPOINTS: Record<string, Endpoint[]> = {
  Links: [
    {
      method: "POST",
      path: "/links",
      description: "Create a new short link",
      body: { destinationUrl: "https://example.com", slug: "my-link" },
    },
    {
      method: "GET",
      path: "/links",
      description: "List all links",
    },
    {
      method: "GET",
      path: "/links/:id",
      description: "Get a specific link",
      pathParams: ["id"],
    },
    {
      method: "PATCH",
      path: "/links/:id",
      description: "Update a link",
      pathParams: ["id"],
      body: { title: "Updated Title" },
    },
    {
      method: "DELETE",
      path: "/links/:id",
      description: "Delete a link",
      pathParams: ["id"],
    },
    {
      method: "GET",
      path: "/links/:id/stats",
      description: "Get link analytics",
      pathParams: ["id"],
    },
  ],
  QR: [
    {
      method: "POST",
      path: "/qr/generate",
      description: "Generate a QR code",
      body: { url: "https://example.com", size: 256 },
    },
    {
      method: "POST",
      path: "/qr",
      description: "Save a QR code",
      body: { name: "My QR", url: "https://example.com" },
    },
    {
      method: "GET",
      path: "/qr",
      description: "List saved QR codes",
    },
  ],
  Domains: [
    {
      method: "GET",
      path: "/domains",
      description: "List custom domains",
    },
    {
      method: "POST",
      path: "/domains",
      description: "Add a custom domain",
      body: { domain: "links.mycompany.com" },
    },
    {
      method: "POST",
      path: "/domains/:id/verify",
      description: "Verify domain ownership",
      pathParams: ["id"],
    },
  ],
  Webhooks: [
    {
      method: "GET",
      path: "/webhooks",
      description: "List webhooks",
    },
    {
      method: "POST",
      path: "/webhooks",
      description: "Create a webhook",
      body: { name: "My Webhook", url: "https://my-app.com/webhook", events: ["click"] },
    },
    {
      method: "POST",
      path: "/webhooks/:id/test",
      description: "Send test webhook",
      pathParams: ["id"],
    },
  ],
  Galleries: [
    {
      method: "GET",
      path: "/galleries",
      description: "List bio pages",
    },
    {
      method: "POST",
      path: "/galleries",
      description: "Create a bio page",
      body: { slug: "myprofile", title: "My Name" },
    },
  ],
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export function APIExplorerClient() {
  const [apiKey, setApiKey] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Links");
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS.Links[0]);
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState(
    selectedEndpoint.body ? JSON.stringify(selectedEndpoint.body, null, 2) : ""
  );
  const [response, setResponse] = useState<{
    status: number;
    data: unknown;
    duration: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  function selectEndpoint(endpoint: Endpoint) {
    setSelectedEndpoint(endpoint);
    setRequestBody(endpoint.body ? JSON.stringify(endpoint.body, null, 2) : "");
    setPathParams({});
    setResponse(null);
  }

  async function sendRequest() {
    if (!apiKey) {
      toast.error("Please enter your API key");
      return;
    }

    setLoading(true);
    setResponse(null);

    const startTime = Date.now();

    try {
      // Build path with params
      let path = selectedEndpoint.path;
      for (const param of selectedEndpoint.pathParams ?? []) {
        const value = pathParams[param];
        if (!value) {
          toast.error(`Please enter a value for :${param}`);
          setLoading(false);
          return;
        }
        path = path.replace(`:${param}`, value);
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      };

      if (
        selectedEndpoint.method !== "GET" &&
        selectedEndpoint.method !== "DELETE" &&
        requestBody
      ) {
        try {
          options.body = requestBody;
          JSON.parse(requestBody); // Validate JSON
        } catch {
          toast.error("Invalid JSON in request body");
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`${API_URL}/api/v1${path}`, options);
      const data = await res.json();
      const duration = Date.now() - startTime;

      setResponse({
        status: res.status,
        data,
        duration,
      });
    } catch (error) {
      toast.error("Request failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  function copyResponse() {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      toast.success("Copied to clipboard");
    }
  }

  function copyCurl() {
    let path = selectedEndpoint.path;
    for (const param of selectedEndpoint.pathParams ?? []) {
      path = path.replace(`:${param}`, pathParams[param] || `<${param}>`);
    }

    let curl = `curl -X ${selectedEndpoint.method} "${API_URL}/api/v1${path}" \\\n  -H "Authorization: Bearer ${apiKey || "<your-api-key>"}"`;

    if (selectedEndpoint.method !== "GET" && selectedEndpoint.method !== "DELETE" && requestBody) {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBody.replace(/\n/g, "").replace(/\s+/g, " ")}'`;
    }

    navigator.clipboard.writeText(curl);
    toast.success("cURL command copied");
  }

  const methodColors: Record<string, string> = {
    GET: "bg-success/10 text-success",
    POST: "bg-info/10 text-info",
    PATCH: "bg-warning/10 text-warning",
    DELETE: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Request Panel */}
      <div className="space-y-6">
        {/* API Key */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-5 w-5" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter your API key (go2_xxx)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              {apiKey && (
                <Badge variant="secondary" className="shrink-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Set
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Get your API key from{" "}
              <a href="/dashboard/api-keys" className="underline">
                Dashboard → API Keys
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Endpoint Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-5">
                {Object.keys(ENDPOINTS).map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(ENDPOINTS).map(([category, endpoints]) => (
                <TabsContent key={category} value={category} className="mt-4">
                  <div className="space-y-2">
                    {endpoints.map((endpoint, i) => (
                      <button
                        key={i}
                        onClick={() => selectEndpoint(endpoint)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                          selectedEndpoint.path === endpoint.path &&
                          selectedEndpoint.method === endpoint.method
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted"
                        }`}
                      >
                        <span
                          className={`text-xs font-mono font-bold px-2 py-1 rounded ${methodColors[endpoint.method]}`}
                        >
                          {endpoint.method}
                        </span>
                        <span className="font-mono text-sm flex-1">{endpoint.path}</span>
                      </button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Path Parameters */}
        {selectedEndpoint.pathParams && selectedEndpoint.pathParams.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Path Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedEndpoint.pathParams.map((param) => (
                <div key={param}>
                  <Label htmlFor={param}>{param}</Label>
                  <Input
                    id={param}
                    placeholder={`Enter ${param}`}
                    value={pathParams[param] || ""}
                    onChange={(e) => setPathParams({ ...pathParams, [param]: e.target.value })}
                    className="mt-2 font-mono"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Request Body */}
        {selectedEndpoint.body && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Request Body</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="font-mono text-sm min-h-[200px]"
                placeholder="Enter JSON body"
              />
            </CardContent>
          </Card>
        )}

        {/* Send Button */}
        <div className="flex gap-2">
          <Button onClick={sendRequest} disabled={loading} className="flex-1">
            {loading ? (
              <span className="animate-spin mr-2">⟳</span>
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Send Request
          </Button>
          <Button variant="outline" onClick={copyCurl}>
            <Copy className="h-4 w-4 mr-2" />
            Copy cURL
          </Button>
        </div>
      </div>

      {/* Response Panel */}
      <div>
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Response</CardTitle>
              {response && (
                <div className="flex items-center gap-3">
                  <Badge
                    variant={response.status < 400 ? "default" : "destructive"}
                    className="gap-1"
                  >
                    {response.status < 400 ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {response.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {response.duration}ms
                  </span>
                  <Button variant="ghost" size="icon" onClick={copyResponse}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : response ? (
              <pre className="bg-muted rounded-lg p-4 text-sm overflow-auto max-h-[600px] font-mono">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <p>No response yet</p>
                <p className="text-sm mt-2">Send a request to see the response here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
