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
    className={`w-full h-full min-h-[160px] flex items-center justify-center p-4 ${className}`}
  >
    {children}
  </div>
);

// Edge Redirects Preview - Static
const EdgeRedirectsPreview = () => (
  <PreviewContainer>
    <div className="relative w-full h-40 flex items-center justify-center">
      {/* Glowing nodes */}
      <div className="absolute w-3 h-3 rounded-full bg-[var(--marketing-accent)] opacity-60 animate-pulse" style={{ left: "20%", top: "30%" }} />
      <div className="absolute w-2 h-2 rounded-full bg-[var(--marketing-accent)] opacity-40 animate-pulse" style={{ left: "50%", top: "40%", animationDelay: "0.2s" }} />
      <div className="absolute w-3 h-3 rounded-full bg-[var(--marketing-accent)] opacity-60 animate-pulse" style={{ left: "80%", top: "25%", animationDelay: "0.4s" }} />
      <div className="absolute w-2 h-2 rounded-full bg-[var(--marketing-accent)] opacity-40 animate-pulse" style={{ left: "30%", top: "60%", animationDelay: "0.1s" }} />
      <div className="absolute w-3 h-3 rounded-full bg-[var(--marketing-accent)] opacity-60 animate-pulse" style={{ left: "70%", top: "55%", animationDelay: "0.3s" }} />
      
      {/* Speed badge */}
      <div className="z-10 bg-[var(--marketing-bg)] border-2 border-[var(--marketing-accent)] text-[var(--marketing-accent)] px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
        <Zap className="w-5 h-5 fill-current" />
        <span className="font-bold text-lg">10ms</span>
      </div>
    </div>
  </PreviewContainer>
);

// Custom Domains Preview - Static
const CustomDomainsPreview = () => (
  <PreviewContainer>
    <div className="flex flex-col gap-3 w-full max-w-xs">
      <div className="bg-[var(--marketing-bg)] border border-[var(--marketing-border)] p-3 rounded-lg flex items-center gap-3 opacity-40">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <LinkIcon className="w-4 h-4 text-gray-400" />
        </div>
        <div className="text-sm text-[var(--marketing-text-muted)] line-through">
          bit.ly/3x8f9a
        </div>
      </div>

      <div className="bg-[var(--marketing-bg)] border-2 border-[var(--marketing-accent)] p-3 rounded-lg flex items-center gap-3 shadow-md">
        <div className="w-10 h-10 rounded-full bg-[var(--marketing-accent)]/10 flex items-center justify-center">
          <Globe className="w-5 h-5 text-[var(--marketing-accent)]" />
        </div>
        <div className="flex flex-col">
          <div className="text-sm font-bold text-[var(--marketing-text)]">
            links.brand.com/launch
          </div>
          <div className="text-xs text-[var(--marketing-accent)] flex items-center gap-1">
            <Check className="w-3 h-3" /> Verified Domain
          </div>
        </div>
      </div>
    </div>
  </PreviewContainer>
);

// Analytics Preview - Static
const AnalyticsPreview = () => (
  <PreviewContainer>
    <div className="relative w-full h-full flex flex-col justify-end">
      {/* Static chart */}
      <svg className="w-full h-24" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
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
      <div className="absolute top-2 right-2 bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)] p-2 rounded-lg shadow-sm">
        <div className="text-xs text-[var(--marketing-text-muted)]">Clicks</div>
        <div className="text-lg font-bold text-[var(--marketing-text)]">24.5k</div>
        <div className="text-xs text-green-500 flex items-center">
          <TrendingUp className="w-3 h-3 mr-1" /> +12%
        </div>
      </div>
    </div>
  </PreviewContainer>
);

// QR Codes Preview - Static
const QrCodesPreview = () => (
  <PreviewContainer>
    <div className="relative flex items-center justify-center">
      <div className="relative w-28 h-28 bg-white rounded-xl p-2 shadow-lg border border-gray-100">
        {/* QR grid */}
        <div className="w-full h-full grid grid-cols-5 gap-0.5">
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
          <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center border">
            <Zap className="w-4 h-4 text-[var(--marketing-accent)]" />
          </div>
        </div>
      </div>

      {/* Color palette */}
      <div className="absolute -bottom-3 -right-3 bg-[var(--marketing-bg-elevated)] p-1.5 rounded-lg border border-[var(--marketing-border)] shadow-md flex gap-1.5">
        <div className="w-5 h-5 rounded bg-black" />
        <div className="w-5 h-5 rounded bg-[var(--marketing-accent)]" />
        <div className="w-5 h-5 rounded bg-purple-500" />
      </div>
    </div>
  </PreviewContainer>
);

// Link Management Preview - Static
const LinkManagementPreview = () => (
  <PreviewContainer>
    <div className="w-full max-w-xs flex flex-col gap-2">
      {[
        { icon: Globe, color: "bg-blue-100 text-blue-600" },
        { icon: LinkIcon, color: "bg-purple-100 text-purple-600" },
        { icon: QrCode, color: "bg-orange-100 text-orange-600" },
      ].map((item, i) => (
        <div
          key={`link-${i}`}
          className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--marketing-bg)] border border-[var(--marketing-border)]"
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.color}`}>
            <item.icon className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="h-2 w-20 bg-[var(--marketing-text)]/10 rounded mb-1.5" />
            <div className="h-2 w-14 bg-[var(--marketing-text)]/5 rounded" />
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500" />
        </div>
      ))}
    </div>
  </PreviewContainer>
);

// Geo Targeting Preview - Static
const GeoTargetingPreview = () => (
  <PreviewContainer>
    <div className="relative w-full h-36 flex items-center justify-center">
      <div className="flex gap-12">
        <div className="flex flex-col items-center gap-2">
          <Smartphone className="w-8 h-8 text-[var(--marketing-text)]" />
          <div className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">iOS</div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Laptop className="w-8 h-8 text-[var(--marketing-text)]" />
          <div className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">Windows</div>
        </div>
      </div>

      {/* Routing indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-[var(--marketing-accent)] rounded-full flex items-center justify-center text-white shadow-lg">
        <MapPin className="w-5 h-5" />
      </div>
      
      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" aria-hidden="true">
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
      <div className="w-full max-w-[180px] h-1 bg-[var(--marketing-border)] rounded-full relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full bg-[var(--marketing-accent)] w-1/3 animate-[shimmer_2s_infinite]" 
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
            className={`w-9 h-9 rounded-lg ${style.bg} flex items-center justify-center shadow-sm`}
          >
            <Target className={`w-4 h-4 ${style.color}`} />
          </div>
        ))}
      </div>
      <div className="text-xs font-medium text-[var(--marketing-text)]">
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
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-[var(--marketing-border)] flex items-center justify-center">
          <LinkIcon className="w-4 h-4 text-[var(--marketing-text-muted)]" />
        </div>
        <span className="text-[10px] text-[var(--marketing-text-muted)]">Click</span>
      </div>

      <div className="w-8 h-0.5 bg-[var(--marketing-accent)]" />

      <div className="flex flex-col items-center gap-1.5">
        <div className="w-12 h-12 rounded-full bg-[var(--marketing-accent)]/10 border-2 border-[var(--marketing-accent)] flex items-center justify-center">
          <Check className="w-5 h-5 text-[var(--marketing-accent)]" />
        </div>
        <span className="text-[10px] font-bold text-[var(--marketing-text)]">Conversion</span>
      </div>
    </div>
  </PreviewContainer>
);

// Team Preview - Static
const TeamPreview = () => (
  <PreviewContainer>
    <div className="flex items-center justify-center">
      <div className="flex -space-x-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`user-${i}`}
            className="w-9 h-9 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center"
          >
            <Users className="w-4 h-4 text-gray-500" />
          </div>
        ))}
        <div className="w-9 h-9 rounded-full border-2 border-white bg-[var(--marketing-accent)] flex items-center justify-center text-white text-xs font-bold">
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
      <Shield className="w-16 h-16 text-[var(--marketing-accent)]/20" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Lock className="w-7 h-7 text-[var(--marketing-accent)]" />
      </div>
      <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full border-2 border-white font-medium">
        SOC 2
      </div>
    </div>
  </PreviewContainer>
);

// Webhooks Preview - Static
const WebhooksPreview = () => (
  <PreviewContainer>
    <div className="relative w-full h-28 flex items-center justify-center">
      {/* Center hub */}
      <div className="relative z-10 w-11 h-11 bg-[var(--marketing-bg)] border-2 border-[var(--marketing-accent)] rounded-lg flex items-center justify-center shadow-lg">
        <Webhook className="w-5 h-5 text-[var(--marketing-accent)]" />
      </div>

      {/* Satellite nodes */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-7 h-7 bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)] rounded-full flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-[var(--marketing-text-muted)]" />
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)] rounded-full flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-[var(--marketing-text-muted)]" />
      </div>
      <div className="absolute top-1/2 left-4 -translate-y-1/2 w-7 h-7 bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)] rounded-full flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-[var(--marketing-text-muted)]" />
      </div>
      <div className="absolute top-1/2 right-4 -translate-y-1/2 w-7 h-7 bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)] rounded-full flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-[var(--marketing-text-muted)]" />
      </div>

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
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
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center opacity-50">
        <LinkIcon className="w-4 h-4 text-gray-400" />
      </div>

      <ArrowRightLeft className="w-5 h-5 text-[var(--marketing-accent)]" />

      <div className="w-10 h-10 rounded-lg bg-[var(--marketing-accent)]/10 border-2 border-[var(--marketing-accent)] flex items-center justify-center shadow-md">
        <Zap className="w-5 h-5 text-[var(--marketing-accent)]" />
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
