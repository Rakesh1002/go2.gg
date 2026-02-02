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
      <span className="flex items-center gap-2 text-sm font-medium text-green-500">
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
      <span className="flex items-center gap-2 text-sm font-medium text-yellow-500">
        <AlertCircle className="h-4 w-4" />
        Degraded
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-sm font-medium text-red-500">
      <XCircle className="h-4 w-4" />
      Outage
    </span>
  );
}

function OverallStatusBanner({ status }: { status: ServiceStatus }) {
  if (status === "operational") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-4 py-1.5 text-sm font-semibold text-green-500 mb-8 animate-fade-in-down">
        <CheckCircle className="h-4 w-4" />
        All Systems Operational
      </div>
    );
  }
  if (status === "degraded") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/5 px-4 py-1.5 text-sm font-semibold text-yellow-500 mb-8 animate-fade-in-down">
        <AlertCircle className="h-4 w-4" />
        Some Systems Degraded
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-1.5 text-sm font-semibold text-red-500 mb-8 animate-fade-in-down">
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
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <GeometricShapes position="hero-right" />
        <div className="max-w-7xl relative mx-auto px-4 text-center">
          <OverallStatusBanner status={healthData.overall} />
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--marketing-text)] sm:text-5xl md:text-6xl animate-fade-in-up">
            System <span className="text-[var(--marketing-accent)] text-gradient-warm">Status</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-[var(--marketing-text-muted)] sm:text-xl leading-relaxed animate-fade-in-up stagger-1">
            Real-time status of Go2 services. This page automatically refreshes with live health
            checks.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--marketing-text-muted)]">
            <RefreshCw className="h-4 w-4" />
            <span>Last checked: {formatLastChecked(healthData.lastChecked)}</span>
          </div>
        </div>
      </section>

      {/* Current Status */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-[var(--marketing-text)] mb-6">Current Status</h2>

          <div className="space-y-4">
            {healthData.services.map((service) => {
              const IconComponent = getServiceIcon(service.icon);
              return (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--marketing-text)]">{service.name}</h3>
                      <p className="text-sm text-[var(--marketing-text-muted)]">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={service.status} />
                    {service.latency && (
                      <p className="text-xs text-[var(--marketing-text-muted)] mt-1">
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
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-[var(--marketing-text)] mb-6">Response Times</h2>

          <div className="p-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {healthData.services.map((service) => (
                <div key={service.name} className="text-center">
                  <p className="text-2xl font-bold text-[var(--marketing-text)]">
                    {formatLatency(service.latency)}
                  </p>
                  <p className="text-sm text-[var(--marketing-text-muted)]">{service.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Status Legend */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-[var(--marketing-text)] mb-6">
            Status Indicators
          </h2>

          <div className="p-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
                </span>
                <div>
                  <p className="font-medium text-[var(--marketing-text)]">Operational</p>
                  <p className="text-xs text-[var(--marketing-text-muted)]">
                    Service is working normally
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 rounded-full bg-yellow-500" />
                <div>
                  <p className="font-medium text-[var(--marketing-text)]">Degraded</p>
                  <p className="text-xs text-[var(--marketing-text-muted)]">
                    Service is slow or partially affected
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 rounded-full bg-red-500" />
                <div>
                  <p className="font-medium text-[var(--marketing-text)]">Outage</p>
                  <p className="text-xs text-[var(--marketing-text-muted)]">
                    Service is unavailable
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div className="mx-auto max-w-3xl">
          <div className="p-6 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] text-center">
            <h3 className="font-semibold text-[var(--marketing-text)] mb-2">Need Help?</h3>
            <p className="text-sm text-[var(--marketing-text-muted)] mb-4">
              If you're experiencing issues not reflected here, please contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:support@go2.gg"
                className="text-[var(--marketing-accent)] hover:underline font-medium"
              >
                Contact Support →
              </a>
              <span className="text-[var(--marketing-text-muted)] hidden sm:inline">•</span>
              <a
                href="https://x.com/BuildWithRakesh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--marketing-accent)] hover:underline font-medium"
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
