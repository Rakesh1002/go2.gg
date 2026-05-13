"use client";

import {
  Globe,
  Zap,
  Link as LinkIcon,
  MapPin,
  Target,
  TrendingUp,
  Users,
  Shield,
  Webhook,
  ArrowRightLeft,
  Check,
  Lock,
  Smartphone,
  Laptop,
  QrCode,
} from "lucide-react";
import type { ReactNode } from "react";

const PreviewContainer = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`flex h-full min-h-[160px] w-full items-center justify-center p-4 ${className}`}
  >
    {children}
  </div>
);

// Edge Redirects Preview - Static
const EdgeRedirectsPreview = () => (
  <PreviewContainer>
    <div className="relative flex h-40 w-full items-center justify-center">
      {/* Glowing nodes */}
      <div className="absolute h-3 w-3 animate-pulse rounded-full bg-[var(--marketing-accent)] opacity-60" style={{ left: "20%", top: "30%" }} />
      <div className="absolute h-2 w-2 animate-pulse rounded-full bg-[var(--marketing-accent)] opacity-40" style={{ left: "50%", top: "40%", animationDelay: "0.2s" }} />
      <div className="absolute h-3 w-3 animate-pulse rounded-full bg-[var(--marketing-accent)] opacity-60" style={{ left: "80%", top: "25%", animationDelay: "0.4s" }} />
      <div className="absolute h-2 w-2 animate-pulse rounded-full bg-[var(--marketing-accent)] opacity-40" style={{ left: "30%", top: "60%", animationDelay: "0.1s" }} />
      <div className="absolute h-3 w-3 animate-pulse rounded-full bg-[var(--marketing-accent)] opacity-60" style={{ left: "70%", top: "55%", animationDelay: "0.3s" }} />
      
      {/* Speed badge */}
      <div className="z-10 flex items-center gap-2 rounded-full border-2 border-[var(--marketing-accent)] bg-[var(--marketing-bg)] px-4 py-2 text-[var(--marketing-accent)] shadow-lg">
        <Zap className="h-5 w-5 fill-current" />
        <span className="font-bold text-lg">10ms</span>
      </div>
    </div>
  </PreviewContainer>
);

// Custom Domains Preview - Static
const CustomDomainsPreview = () => (
  <PreviewContainer>
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-center gap-3 rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-3 opacity-40">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
          <LinkIcon className="h-4 w-4 text-gray-400" />
        </div>
        <div className="text-[var(--marketing-text-muted)] text-sm line-through">
          bit.ly/3x8f9a
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border-2 border-[var(--marketing-accent)] bg-[var(--marketing-bg)] p-3 shadow-md">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--marketing-accent)]/10">
          <Globe className="h-5 w-5 text-[var(--marketing-accent)]" />
        </div>
        <div className="flex flex-col">
          <div className="font-bold text-[var(--marketing-text)] text-sm">
            links.brand.com/launch
          </div>
          <div className="flex items-center gap-1 text-[var(--marketing-accent)] text-xs">
            <Check className="h-3 w-3" /> Verified Domain
          </div>
        </div>
      </div>
    </div>
  </PreviewContainer>
);

// Analytics Preview - Static
const AnalyticsPreview = () => (
  <PreviewContainer>
    <div className="relative flex h-full w-full flex-col justify-end">
      {/* Static chart */}
      <svg className="h-24 w-full" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--marketing-accent)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--marketing-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,50 L10,35 L20,40 L30,25 L40,30 L50,15 L60,20 L70,10 L80,15 L90,5 L100,0 L100,50 Z"
          fill="url(#chartFill)"
        />
        <path
          d="M0,50 L10,35 L20,40 L30,25 L40,30 L50,15 L60,20 L70,10 L80,15 L90,5 L100,0"
          fill="none"
          stroke="var(--marketing-accent)"
          strokeWidth="2"
        />
      </svg>

      {/* Stats badge */}
      <div className="absolute top-2 right-2 rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-2 shadow-sm">
        <div className="text-[var(--marketing-text-muted)] text-xs">Clicks</div>
        <div className="font-bold text-[var(--marketing-text)] text-lg">24.5k</div>
        <div className="flex items-center text-green-500 text-xs">
          <TrendingUp className="mr-1 h-3 w-3" /> +12%
        </div>
      </div>
    </div>
  </PreviewContainer>
);

// QR Codes Preview - Static
const QrCodesPreview = () => (
  <PreviewContainer>
    <div className="relative flex items-center justify-center">
      <div className="relative h-28 w-28 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
        {/* QR grid */}
        <div className="grid h-full w-full grid-cols-5 gap-0.5">
          {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].map((i) => (
            <div
              key={`qr-${i}`}
              className={`rounded-sm ${
                [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].includes(i)
                  ? "bg-[var(--marketing-accent)]"
                  : "bg-gray-800"
              }`}
            />
          ))}
        </div>
        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white shadow-sm">
            <Zap className="h-4 w-4 text-[var(--marketing-accent)]" />
          </div>
        </div>
      </div>

      {/* Color palette */}
      <div className="-bottom-3 -right-3 absolute flex gap-1.5 rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-1.5 shadow-md">
        <div className="h-5 w-5 rounded bg-black" />
        <div className="h-5 w-5 rounded bg-[var(--marketing-accent)]" />
        <div className="h-5 w-5 rounded bg-purple-500" />
      </div>
    </div>
  </PreviewContainer>
);

// Link Management Preview - Static
const LinkManagementPreview = () => (
  <PreviewContainer>
    <div className="flex w-full max-w-xs flex-col gap-2">
      {[
        { icon: Globe, color: "bg-blue-100 text-blue-600" },
        { icon: LinkIcon, color: "bg-purple-100 text-purple-600" },
        { icon: QrCode, color: "bg-orange-100 text-orange-600" },
      ].map((item, i) => (
        <div
          key={`link-${i}`}
          className="flex items-center gap-3 rounded-lg border border-[var(--marketing-border)] bg-[var(--marketing-bg)] p-2.5"
        >
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.color}`}>
            <item.icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 h-2 w-20 rounded bg-[var(--marketing-text)]/10" />
            <div className="h-2 w-14 rounded bg-[var(--marketing-text)]/5" />
          </div>
          <div className="h-2 w-2 rounded-full bg-green-500" />
        </div>
      ))}
    </div>
  </PreviewContainer>
);

// Geo Targeting Preview - Static
const GeoTargetingPreview = () => (
  <PreviewContainer>
    <div className="relative flex h-36 w-full items-center justify-center">
      <div className="flex gap-12">
        <div className="flex flex-col items-center gap-2">
          <Smartphone className="h-8 w-8 text-[var(--marketing-text)]" />
          <div className="rounded bg-gray-100 px-2 py-0.5 font-medium text-xs">iOS</div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Laptop className="h-8 w-8 text-[var(--marketing-text)]" />
          <div className="rounded bg-gray-100 px-2 py-0.5 font-medium text-xs">Windows</div>
        </div>
      </div>

      {/* Routing indicator */}
      <div className="-translate-x-1/2 absolute bottom-2 left-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--marketing-accent)] text-white shadow-lg">
        <MapPin className="h-5 w-5" />
      </div>
      
      {/* Connection lines */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30" aria-hidden="true">
        <line x1="30%" y1="30%" x2="50%" y2="80%" stroke="var(--marketing-accent)" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="70%" y1="30%" x2="50%" y2="80%" stroke="var(--marketing-accent)" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    </div>
  </PreviewContainer>
);

// Retargeting Preview - Static
const RetargetingPreview = () => (
  <PreviewContainer>
    <div className="flex flex-col items-center gap-4">
      {/* Animated bar */}
      <div className="relative h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-[var(--marketing-border)]">
        <div className="absolute top-0 left-0 h-full w-1/3 animate-[shimmer_2s_infinite] bg-[var(--marketing-accent)]" 
          style={{ animation: "shimmer 2s infinite linear" }} />
      </div>

      <div className="flex gap-3">
        {[
          { color: "text-blue-600", bg: "bg-blue-100" },
          { color: "text-red-500", bg: "bg-red-100" },
          { color: "text-black", bg: "bg-gray-100" },
          { color: "text-blue-500", bg: "bg-blue-50" },
        ].map((style, i) => (
          <div
            key={`target-${i}`}
            className={`h-9 w-9 rounded-lg ${style.bg} flex items-center justify-center shadow-sm`}
          >
            <Target className={`h-4 w-4 ${style.color}`} />
          </div>
        ))}
      </div>
      <div className="font-medium text-[var(--marketing-text)] text-xs">
        Capture Every Visitor
      </div>
    </div>
  </PreviewContainer>
);

// Conversions Preview - Static
const ConversionsPreview = () => (
  <PreviewContainer>
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--marketing-border)] border-dashed">
          <LinkIcon className="h-4 w-4 text-[var(--marketing-text-muted)]" />
        </div>
        <span className="text-[10px] text-[var(--marketing-text-muted)]">Click</span>
      </div>

      <div className="h-0.5 w-8 bg-[var(--marketing-accent)]" />

      <div className="flex flex-col items-center gap-1.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--marketing-accent)] bg-[var(--marketing-accent)]/10">
          <Check className="h-5 w-5 text-[var(--marketing-accent)]" />
        </div>
        <span className="font-bold text-[10px] text-[var(--marketing-text)]">Conversion</span>
      </div>
    </div>
  </PreviewContainer>
);

// Team Preview - Static
const TeamPreview = () => (
  <PreviewContainer>
    <div className="flex items-center justify-center">
      <div className="-space-x-2 flex">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`user-${i}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gray-200"
          >
            <Users className="h-4 w-4 text-gray-500" />
          </div>
        ))}
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[var(--marketing-accent)] font-bold text-white text-xs">
          +5
        </div>
      </div>
    </div>
  </PreviewContainer>
);

// Security Preview - Static
const SecurityPreview = () => (
  <PreviewContainer>
    <div className="relative flex items-center justify-center">
      <Shield className="h-16 w-16 text-[var(--marketing-accent)]/20" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Lock className="h-7 w-7 text-[var(--marketing-accent)]" />
      </div>
      <div className="-bottom-1 -right-1 absolute rounded-full border-2 border-white bg-green-500 px-1.5 py-0.5 font-medium text-[9px] text-white">
        SOC 2
      </div>
    </div>
  </PreviewContainer>
);

// Webhooks Preview - Static
const WebhooksPreview = () => (
  <PreviewContainer>
    <div className="relative flex h-28 w-full items-center justify-center">
      {/* Center hub */}
      <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-lg border-2 border-[var(--marketing-accent)] bg-[var(--marketing-bg)] shadow-lg">
        <Webhook className="h-5 w-5 text-[var(--marketing-accent)]" />
      </div>

      {/* Satellite nodes */}
      <div className="-translate-x-1/2 absolute top-2 left-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
        <div className="h-2 w-2 rounded-full bg-[var(--marketing-text-muted)]" />
      </div>
      <div className="-translate-x-1/2 absolute bottom-2 left-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
        <div className="h-2 w-2 rounded-full bg-[var(--marketing-text-muted)]" />
      </div>
      <div className="-translate-y-1/2 absolute top-1/2 left-4 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
        <div className="h-2 w-2 rounded-full bg-[var(--marketing-text-muted)]" />
      </div>
      <div className="-translate-y-1/2 absolute top-1/2 right-4 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]">
        <div className="h-2 w-2 rounded-full bg-[var(--marketing-text-muted)]" />
      </div>

      {/* Connection lines */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <line x1="50%" y1="20%" x2="50%" y2="40%" stroke="var(--marketing-accent)" strokeWidth="2" strokeOpacity="0.2" />
        <line x1="50%" y1="60%" x2="50%" y2="80%" stroke="var(--marketing-accent)" strokeWidth="2" strokeOpacity="0.2" />
        <line x1="20%" y1="50%" x2="40%" y2="50%" stroke="var(--marketing-accent)" strokeWidth="2" strokeOpacity="0.2" />
        <line x1="60%" y1="50%" x2="80%" y2="50%" stroke="var(--marketing-accent)" strokeWidth="2" strokeOpacity="0.2" />
      </svg>
    </div>
  </PreviewContainer>
);

// Migration Preview - Static
const MigrationPreview = () => (
  <PreviewContainer>
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 opacity-50">
        <LinkIcon className="h-4 w-4 text-gray-400" />
      </div>

      <ArrowRightLeft className="h-5 w-5 text-[var(--marketing-accent)]" />

      <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[var(--marketing-accent)] bg-[var(--marketing-accent)]/10 shadow-md">
        <Zap className="h-5 w-5 text-[var(--marketing-accent)]" />
      </div>
    </div>
  </PreviewContainer>
);

// Main FeaturePreview component
export function FeaturePreview({ name }: { name: string }) {
  switch (name) {
    case "edge-redirects":
      return <EdgeRedirectsPreview />;
    case "custom-domains":
      return <CustomDomainsPreview />;
    case "analytics":
      return <AnalyticsPreview />;
    case "qr-codes":
      return <QrCodesPreview />;
    case "link-management":
      return <LinkManagementPreview />;
    case "geo-targeting":
      return <GeoTargetingPreview />;
    case "retargeting":
      return <RetargetingPreview />;
    case "conversions":
      return <ConversionsPreview />;
    case "team":
      return <TeamPreview />;
    case "security":
      return <SecurityPreview />;
    case "webhooks":
      return <WebhooksPreview />;
    case "migration":
      return <MigrationPreview />;
    default:
      return null;
  }
}

// Legacy export for backward compatibility
export const featurePreviews: Record<string, ReactNode> = {
  "edge-redirects": <FeaturePreview name="edge-redirects" />,
  "custom-domains": <FeaturePreview name="custom-domains" />,
  analytics: <FeaturePreview name="analytics" />,
  "qr-codes": <FeaturePreview name="qr-codes" />,
  "link-management": <FeaturePreview name="link-management" />,
  "geo-targeting": <FeaturePreview name="geo-targeting" />,
  retargeting: <FeaturePreview name="retargeting" />,
  conversions: <FeaturePreview name="conversions" />,
  team: <FeaturePreview name="team" />,
  security: <FeaturePreview name="security" />,
  webhooks: <FeaturePreview name="webhooks" />,
  migration: <FeaturePreview name="migration" />,
};
