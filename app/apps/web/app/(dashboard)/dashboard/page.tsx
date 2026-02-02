import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { getServerUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Link2, Globe, BarChart3, QrCode, Activity, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PendingUrlHandler } from "./pending-url-handler";
import { WelcomeFlow } from "@/components/onboarding/welcome-flow";
import { UsageCard, UsageCardClient, UsageNudgeClient, UpgradeNudge, TrialBanner } from "@/components/billing";
import { DashboardStatsClient } from "./dashboard-stats-client";

export const metadata: Metadata = {
  title: "Dashboard",
};

interface DashboardStats {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
  customDomains: number;
  clicksToday: number;
  clicksTrend: number; // percentage change from yesterday
  subscription?: {
    plan: string;
    status: string;
    trialEndsAt?: string | null;
  };
}

async function getStats(): Promise<DashboardStats> {
  // Skip server-side API calls in production to avoid worker-to-worker 522 timeouts
  // Data will be fetched client-side via DashboardStatsClient
  if (process.env.NODE_ENV === "production" || process.env.CLOUDFLARE_WORKER === "true") {
    return getDefaultStats();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const response = await fetch(`${apiUrl}/api/v1/stats/dashboard`, {
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch stats:", response.status);
      return getDefaultStats();
    }

    const result = await response.json();
    return result.data || getDefaultStats();
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return getDefaultStats();
  }
}

function getDefaultStats(): DashboardStats {
  return {
    totalLinks: 0,
    totalClicks: 0,
    activeLinks: 0,
    customDomains: 0,
    clicksToday: 0,
    clicksTrend: 0,
    subscription: {
      plan: "free",
      status: "active",
      trialEndsAt: null,
    },
  };
}

interface UsageStat {
  current: number;
  limit: number;
  percentage: number;
}

interface UsageData {
  linksThisMonth: UsageStat;
  trackedClicksThisMonth: UsageStat;
  domains: UsageStat;
  teamMembers: UsageStat;
  plan: string;
  status?: string;
}

async function getUsageData(): Promise<UsageData | null> {
  // Skip server-side API calls in production to avoid worker-to-worker 522 timeouts
  // Data will be fetched client-side
  if (process.env.NODE_ENV === "production" || process.env.CLOUDFLARE_WORKER === "true") {
    return null;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const response = await fetch(`${apiUrl}/api/v1/usage`, {
      headers: {
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch usage:", response.status);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error("Error fetching usage data:", error);
    return null;
  }
}

async function DashboardStats() {
  const stats = await getStats();

  return (
    <>
      {/* Trial banner - only shows for users on trial */}
      {stats.subscription?.status === "trialing" && (
        <TrialBanner
          trialEndsAt={stats.subscription?.trialEndsAt || null}
          plan={stats.subscription?.plan || "pro"}
          status={stats.subscription?.status || "active"}
        />
      )}
      <DashboardStatsClient stats={stats} />
    </>
  );
}

function StatsLoading() {
  const statNames = ["total-links", "total-clicks", "today-clicks", "custom-domains"];
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {statNames.map((name, index) => (
        <SkeletonCard key={`stat-${name}`} className={`stagger-${index + 1}`} />
      ))}
    </div>
  );
}

async function UserWelcome() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = user.name || user.email?.split("@")[0] || "there";
  const greeting = getGreeting();

  return (
    <div>
      <h1 className="text-3xl font-bold">
        {greeting}, {displayName}!
      </h1>
      <p className="text-muted-foreground">Here's how your links are performing</p>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Handle pending URL from guest link creation */}
      <PendingUrlHandler />

      {/* Show welcome modal for first-time users */}
      <WelcomeFlow />

      <Suspense fallback={<Skeleton className="h-14 w-64" />}>
        <UserWelcome />
      </Suspense>

      <Suspense fallback={<StatsLoading />}>
        <DashboardStats />
      </Suspense>

      {/* Usage warning nudge - only shows when near/at limits */}
      <Suspense fallback={null}>
        <UsagePanelNudge />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 md:col-span-4 lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
            <CardDescription>Common tasks for your link management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <a
                href="/dashboard/links"
                className="group flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 animate-fade-in-up stagger-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
                style={{ animationFillMode: "forwards" }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-md shadow-primary/10 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-primary">Create New Link</p>
                  <p className="text-sm text-muted-foreground">Shorten a URL</p>
                </div>
              </a>
              <a
                href="/dashboard/analytics"
                className="group flex items-center gap-4 rounded-xl border border-border/50 p-4 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-300 animate-fade-in-up stagger-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
                style={{ animationFillMode: "forwards" }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    View Analytics
                  </p>
                  <p className="text-sm text-muted-foreground">Track your clicks</p>
                </div>
              </a>
              <a
                href="/dashboard/domains"
                className="group flex items-center gap-4 rounded-xl border border-border/50 p-4 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 animate-fade-in-up stagger-3 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
                style={{ animationFillMode: "forwards" }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold group-hover:text-primary transition-colors">
                    Add Domain
                  </p>
                  <p className="text-sm text-muted-foreground">Use your own domain</p>
                </div>
              </a>
              <a
                href="/dashboard/links?qr=true"
                className="group flex items-center gap-4 rounded-xl border border-border/50 p-4 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 animate-fade-in-up stagger-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
                style={{ animationFillMode: "forwards" }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 transition-all duration-300">
                  <QrCode className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold group-hover:text-primary transition-colors">
                    Generate QR Code
                  </p>
                  <p className="text-sm text-muted-foreground">For your links</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Usage Card */}
        <Suspense
          fallback={
            <Card className="col-span-3">
              <CardContent className="p-6">
                <Skeleton className="h-[300px]" />
              </CardContent>
            </Card>
          }
        >
          <UsageCardPanel />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 lg:col-span-7">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent link activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-[200px]" />}>
              <RecentActivity />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function UsagePanelNudge() {
  // In production, we use client-side fetching to avoid worker-to-worker timeouts
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.CLOUDFLARE_WORKER === "true";

  if (isProduction) {
    return <UsageNudgeClient />;
  }

  const usage = await getUsageData();

  if (!usage) {
    return <UsageNudgeClient />;
  }

  // Check if user is approaching any limits
  const isNearLimit =
    (usage.linksThisMonth?.percentage !== null && usage.linksThisMonth?.percentage >= 80) ||
    (usage.trackedClicksThisMonth?.percentage !== null &&
      usage.trackedClicksThisMonth?.percentage >= 80) ||
    (usage.domains?.percentage !== null && usage.domains?.percentage >= 80);

  const isAtLimit =
    (usage.linksThisMonth?.percentage !== null && usage.linksThisMonth?.percentage >= 100) ||
    (usage.trackedClicksThisMonth?.percentage !== null &&
      usage.trackedClicksThisMonth?.percentage >= 100) ||
    (usage.domains?.percentage !== null && usage.domains?.percentage >= 100);

  if (isAtLimit) {
    return (
      <UpgradeNudge
        variant="limit-reached"
        title="You've reached your plan limits"
        description="Upgrade to a higher plan to continue creating links and unlock more features."
        ctaText="View Upgrade Options"
      />
    );
  }

  if (isNearLimit) {
    return (
      <UpgradeNudge
        variant="warning"
        description="You're approaching your plan limits. Consider upgrading for more capacity."
        compact
      />
    );
  }

  return null;
}

async function UsageCardPanel() {
  // In production, we use client-side fetching to avoid worker-to-worker timeouts
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.CLOUDFLARE_WORKER === "true";

  if (isProduction) {
    // Client-side component will fetch data
    return <UsageCardClient className="col-span-3" />;
  }

  // In development, fetch server-side
  const usage = await getUsageData();

  if (!usage) {
    return <UsageCardClient className="col-span-3" />;
  }

  return <UsageCard usage={usage} className="col-span-3" />;
}

async function RecentActivity() {
  // Skip server-side API calls in production to avoid worker-to-worker 522 timeouts
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.CLOUDFLARE_WORKER === "true";

  let recentLinks: { shortUrl: string; clickCount: number; createdAt: string }[] = [];

  if (!isProduction) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
    try {
      const cookieStore = await cookies();
      const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

      const response = await fetch(`${apiUrl}/api/v1/links?perPage=5&sort=created`, {
        headers: {
          Cookie: cookieHeader,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const result = await response.json();
        recentLinks = result.data || [];
      }
    } catch (error) {
      console.error("Error fetching recent links:", error);
    }
  }

  if (recentLinks.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>No links yet</p>
          <a href="/dashboard/links" className="text-sm text-primary hover:underline">
            Create your first link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recentLinks.map((link) => (
        <div
          key={link.shortUrl}
          className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
            <Link2 className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold leading-none truncate">{link.shortUrl}</p>
            <p className="text-xs text-muted-foreground">{link.clickCount} clicks</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
