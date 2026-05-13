import type { Metadata } from "next";
import { getMetadata } from "@repo/config";
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Zap,
  Globe,
  Server,
  Activity,
  RefreshCw,
} from "lucide-react";
import { GeometricShapes } from "@/components/marketing/decorative/geometric-shapes";
import { fetchServiceHealth, type ServiceHealth, type ServiceStatus } from "@/lib/status";

export const metadata: Metadata = getMetadata({
  title: "System Status",
  description:
    "Current operational status of Go2 services. Check uptime and service health in real-time.",
});

// Don't cache - always show fresh status
export const dynamic = "force-dynamic";

function getServiceIcon(icon: ServiceHealth["icon"]) {
  switch (icon) {
    case "zap":
      return Zap;
    case "globe":
      return Globe;
    case "server":
      return Server;
    case "activity":
      return Activity;
  }
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  if (status === "operational") {
    return (
      <span className="flex items-center gap-2 font-medium text-green-500 text-sm">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        Operational
      </span>
    );
  }
  if (status === "degraded") {
    return (
      <span className="flex items-center gap-2 font-medium text-sm text-yellow-500">
        <AlertCircle className="h-4 w-4" />
        Degraded
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 font-medium text-red-500 text-sm">
      <XCircle className="h-4 w-4" />
      Outage
    </span>
  );
}

function OverallStatusBanner({ status }: { status: ServiceStatus }) {
  if (status === "operational") {
    return (
      <div className="mb-8 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-4 py-1.5 font-semibold text-green-500 text-sm">
        <CheckCircle className="h-4 w-4" />
        All Systems Operational
      </div>
    );
  }
  if (status === "degraded") {
    return (
      <div className="mb-8 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/5 px-4 py-1.5 font-semibold text-sm text-yellow-500">
        <AlertCircle className="h-4 w-4" />
        Some Systems Degraded
      </div>
    );
  }
  return (
    <div className="mb-8 inline-flex animate-fade-in-down items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-1.5 font-semibold text-red-500 text-sm">
      <XCircle className="h-4 w-4" />
      Service Disruption
    </div>
  );
}

function formatLatency(latency?: number): string {
  if (!latency) return "—";
  if (latency < 1000) return `${latency}ms`;
  return `${(latency / 1000).toFixed(1)}s`;
}

function formatLastChecked(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export default async function StatusPage() {
  const healthData = await fetchServiceHealth();

  return (
    <div className="relative overflow-hidden bg-[var(--marketing-bg)]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        <GeometricShapes position="hero-right" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <OverallStatusBanner status={healthData.overall} />
          <h1 className="mx-auto max-w-4xl animate-fade-in-up font-extrabold text-4xl text-[var(--marketing-text)] tracking-tight sm:text-5xl md:text-6xl">
            System <span className="text-[var(--marketing-accent)] text-gradient-warm">Status</span>
          </h1>
          <p className="stagger-1 mx-auto mt-8 max-w-2xl animate-fade-in-up text-[var(--marketing-text-muted)] text-lg leading-relaxed sm:text-xl">
            Real-time status of Go2 services. This page automatically refreshes with live health
            checks.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-[var(--marketing-text-muted)] text-sm">
            <RefreshCw className="h-4 w-4" />
            <span>Last checked: {formatLastChecked(healthData.lastChecked)}</span>
          </div>
        </div>
      </section>

      {/* Current Status */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 font-bold text-2xl text-[var(--marketing-text)]">Current Status</h2>

          <div className="space-y-4">
            {healthData.services.map((service) => {
              const IconComponent = getServiceIcon(service.icon);
              return (
                <div
                  key={service.name}
                  className="flex items-center justify-between rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--marketing-text)]">{service.name}</h3>
                      <p className="text-[var(--marketing-text-muted)] text-sm">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={service.status} />
                    {service.latency && (
                      <p className="mt-1 text-[var(--marketing-text-muted)] text-xs">
                        Response: {formatLatency(service.latency)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Response Time Summary */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 font-bold text-2xl text-[var(--marketing-text)]">Response Times</h2>

          <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {healthData.services.map((service) => (
                <div key={service.name} className="text-center">
                  <p className="font-bold text-2xl text-[var(--marketing-text)]">
                    {formatLatency(service.latency)}
                  </p>
                  <p className="text-[var(--marketing-text-muted)] text-sm">{service.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Status Legend */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 font-bold text-2xl text-[var(--marketing-text)]">
            Status Indicators
          </h2>

          <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                </span>
                <div>
                  <p className="font-medium text-[var(--marketing-text)]">Operational</p>
                  <p className="text-[var(--marketing-text-muted)] text-xs">
                    Service is working normally
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 rounded-full bg-yellow-500" />
                <div>
                  <p className="font-medium text-[var(--marketing-text)]">Degraded</p>
                  <p className="text-[var(--marketing-text-muted)] text-xs">
                    Service is slow or partially affected
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 rounded-full bg-red-500" />
                <div>
                  <p className="font-medium text-[var(--marketing-text)]">Outage</p>
                  <p className="text-[var(--marketing-text-muted)] text-xs">
                    Service is unavailable
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="mx-auto max-w-7xl px-4 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-6 text-center">
            <h3 className="mb-2 font-semibold text-[var(--marketing-text)]">Need Help?</h3>
            <p className="mb-4 text-[var(--marketing-text-muted)] text-sm">
              If you're experiencing issues not reflected here, please contact our support team.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="mailto:support@go2.gg"
                className="font-medium text-[var(--marketing-accent)] hover:underline"
              >
                Contact Support →
              </a>
              <span className="hidden text-[var(--marketing-text-muted)] sm:inline">•</span>
              <a
                href="https://x.com/BuildWithRakesh"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--marketing-accent)] hover:underline"
              >
                Follow for updates
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
