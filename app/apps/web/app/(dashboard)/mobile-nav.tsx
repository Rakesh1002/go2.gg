"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { OrgSwitcher } from "@/components/org/org-switcher";
import { useSubscription } from "@/contexts/subscription-context";
import { canAccessFeature, type Feature } from "@/lib/feature-gates";
import {
  LayoutDashboard,
  Settings,
  CreditCard,
  Menu,
  LogOut,
  Link2,
  Globe,
  BarChart3,
  Users,
  Gift,
  HelpCircle,
  QrCode,
  FileText,
  Upload,
  Lock,
  Target,
  FolderOpen,
  TrendingUp,
  FlaskConical,
  Code,
} from "lucide-react";
import { siteConfig } from "@repo/config";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  feature?: Feature;
}

interface NavCategory {
  label: string;
  items: NavItem[];
}

// Dashboard stays separate as standalone item
const DASHBOARD_ITEM: NavItem = {
  href: "/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
};

const NAV_CATEGORIES: NavCategory[] = [
  {
    label: "Links",
    items: [
      { href: "/dashboard/links", label: "Links", icon: Link2 },
      { href: "/dashboard/qr", label: "QR Codes", icon: QrCode },
      {
        href: "/dashboard/folders",
        label: "Folders",
        icon: FolderOpen,
        feature: "folders",
      },
      {
        href: "/dashboard/bio",
        label: "Link in Bio",
        icon: FileText,
        feature: "bioPages",
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      {
        href: "/dashboard/conversions",
        label: "Conversions",
        icon: TrendingUp,
        feature: "conversionTracking",
      },
      {
        href: "/dashboard/ab-tests",
        label: "A/B Tests",
        icon: FlaskConical,
        feature: "abTesting",
      },
      {
        href: "/dashboard/pixels",
        label: "Pixels",
        icon: Target,
        feature: "pixelTracking",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/dashboard/domains", label: "Domains", icon: Globe },
      { href: "/dashboard/import", label: "Import", icon: Upload },
      {
        href: "/dashboard/team",
        label: "Team",
        icon: Users,
        feature: "teamMembers",
      },
      { href: "/dashboard/developer", label: "Developer", icon: Code },
    ],
  },
];

// User menu items (shown after categories)
const userMenuItems: NavItem[] = [
  { href: "/dashboard/affiliates", label: "Affiliates", icon: Gift },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { subscription, loading: subscriptionLoading } = useSubscription();

  async function handleSignOut() {
    try {
      const { signOut } = await import("@/lib/auth/client");
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      // Always redirect to landing page, regardless of success/failure
      // Use replace to prevent back button returning to dashboard
      window.location.replace("/");
    }
  }

  return (
    <div className="flex items-center md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 border-r border-[var(--dashboard-border)]">
          <SheetHeader className="h-14 flex flex-row items-center gap-2.5 px-5 border-b border-[var(--dashboard-border)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="font-bold text-xs">{siteConfig.name.charAt(0)}</span>
            </div>
            <SheetTitle className="text-base font-semibold">{siteConfig.name}</SheetTitle>
          </SheetHeader>

          {/* Organization Switcher */}
          <div className="px-3 py-3 border-b border-[var(--dashboard-border)]">
            <OrgSwitcher />
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-3">
            {/* Dashboard - Standalone */}
            {(() => {
              const Icon = DASHBOARD_ITEM.icon;
              const isActive = pathname === DASHBOARD_ITEM.href;

              return (
                <Link
                  href={DASHBOARD_ITEM.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{DASHBOARD_ITEM.label}</span>
                </Link>
              );
            })()}

            {/* Categories with headings */}
            {NAV_CATEGORIES.map((category) => (
              <div key={category.label} className="mt-4">
                {/* Category heading */}
                <span className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  {category.label}
                </span>

                {/* Category items */}
                <div className="space-y-0.5">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    // Check if feature is locked for current plan
                    const isLocked =
                      item.feature && !subscriptionLoading
                        ? !canAccessFeature(subscription.plan, item.feature)
                        : false;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : isLocked
                              ? "text-muted-foreground/60 hover:bg-accent hover:text-muted-foreground"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", isLocked && "opacity-60")} />
                        <span className={cn("flex-1", isLocked && "opacity-80")}>{item.label}</span>
                        {isLocked ? (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                        ) : item.badge ? (
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] px-1.5 py-0 font-medium",
                              isActive
                                ? "bg-primary/20 text-primary border-0"
                                : "bg-muted text-muted-foreground border-0"
                            )}
                          >
                            {item.badge}
                          </Badge>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="my-3 border-t border-[var(--dashboard-border)]" />

            {/* User menu items */}
            <div className="space-y-0.5">
              {userMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="my-3 border-t border-[var(--dashboard-border)]" />

            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Help & Support</span>
            </Link>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 mt-1 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Logo for mobile header */}
      <Link href="/dashboard" className="flex items-center gap-2 ml-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="font-bold text-[10px]">{siteConfig.name.charAt(0)}</span>
        </div>
        <span className="font-semibold text-sm tracking-tight">{siteConfig.name}</span>
      </Link>
    </div>
  );
}
