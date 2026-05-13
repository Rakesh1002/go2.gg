/**
 * Status checking utilities for service health
 */

export type ServiceStatus = "operational" | "degraded" | "outage";

export interface ServiceHealth {
  name: string;
  description: string;
  status: ServiceStatus;
  latency?: number;
  lastChecked: string;
  icon: "zap" | "globe" | "server" | "activity";
}

export interface HealthCheckResult {
  services: ServiceHealth[];
  overall: ServiceStatus;
  lastChecked: string;
}

interface ApiHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks?: Record<string, { status: string; latency?: number }>;
}

/**
 * Get the API URL from environment
 */
function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "https://api.go2.gg";
}

/**
 * Get the web app URL from environment
 */
function getWebUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://go2.gg";
}

/**
 * Check health of a single endpoint
 */
async function checkEndpoint(
  url: string,
  timeout = 5000
): Promise<{ ok: boolean; latency: number; data?: ApiHealthResponse }> {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - start;

    if (!response.ok) {
      return { ok: false, latency };
    }

    try {
      const data = await response.json();
      return { ok: true, latency, data };
    } catch {
      // Response was OK but not JSON (still consider it healthy)
      return { ok: true, latency };
    }
  } catch {
    clearTimeout(timeoutId);
    return { ok: false, latency: Date.now() - start };
  }
}

/**
 * Fetch real-time service health status
 */
export async function fetchServiceHealth(): Promise<HealthCheckResult> {
  const apiUrl = getApiUrl();
  const webUrl = getWebUrl();
  const now = new Date().toISOString();

  // Run health checks in parallel
  const [apiBasic, apiReady, webHealth] = await Promise.all([
    checkEndpoint(`${apiUrl}/health`),
    checkEndpoint(`${apiUrl}/health/ready`),
    checkEndpoint(webUrl, 10000), // Web app may be slower
  ]);

  // Determine API status based on both health checks
  let apiStatus: ServiceStatus = "operational";
  if (!apiBasic.ok && !apiReady.ok) {
    apiStatus = "outage";
  } else if (!apiReady.ok || apiReady.data?.status === "degraded") {
    apiStatus = "degraded";
  }

  // Determine database status from ready check
  let dbStatus: ServiceStatus = "operational";
  if (apiReady.data?.checks?.database?.status === "unhealthy") {
    dbStatus = "outage";
  } else if (!apiReady.ok) {
    dbStatus = "degraded";
  }

  const services: ServiceHealth[] = [
    {
      name: "Link Redirects",
      description: "Edge redirect service (Cloudflare Workers)",
      status: apiStatus,
      latency: apiBasic.latency,
      lastChecked: now,
      icon: "zap",
    },
    {
      name: "Dashboard",
      description: "Web application and user interface",
      status: webHealth.ok ? "operational" : "degraded",
      latency: webHealth.latency,
      lastChecked: now,
      icon: "globe",
    },
    {
      name: "API",
      description: "REST API for link management",
      status: apiStatus,
      latency: apiReady.latency ?? apiBasic.latency,
      lastChecked: now,
      icon: "server",
    },
    {
      name: "Database",
      description: "Data storage and analytics",
      status: dbStatus,
      latency: apiReady.data?.checks?.database?.latency,
      lastChecked: now,
      icon: "activity",
    },
  ];

  // Calculate overall status
  const hasOutage = services.some((s) => s.status === "outage");
  const hasDegraded = services.some((s) => s.status === "degraded");
  const overall: ServiceStatus = hasOutage ? "outage" : hasDegraded ? "degraded" : "operational";

  return {
    services,
    overall,
    lastChecked: now,
  };
}

/**
 * Get fallback service health when checks fail
 */
export function getFallbackServiceHealth(): HealthCheckResult {
  const now = new Date().toISOString();

  return {
    services: [
      {
        name: "Link Redirects",
        description: "Edge redirect service (Cloudflare Workers)",
        status: "operational",
        lastChecked: now,
        icon: "zap",
      },
      {
        name: "Dashboard",
        description: "Web application and user interface",
        status: "operational",
        lastChecked: now,
        icon: "globe",
      },
      {
        name: "API",
        description: "REST API for link management",
        status: "operational",
        lastChecked: now,
        icon: "server",
      },
      {
        name: "Database",
        description: "Data storage and analytics",
        status: "operational",
        lastChecked: now,
        icon: "activity",
      },
    ],
    overall: "operational",
    lastChecked: now,
  };
}
