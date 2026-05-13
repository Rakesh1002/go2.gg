"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OrgSwitcher } from "@/components/org/org-switcher";
import { useSession } from "@/lib/auth/client";
import { useSidebar } from "@/contexts/sidebar-context";
import { useSubscription } from "@/contexts/subscription-context";
import { canAccessFeature, type Feature } from "@/lib/feature-gates";
import {
  LayoutDashboard,
  Settings,
  CreditCard,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Link2,
  Shield,
  Globe,
  BarChart3,
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
  Bot,
  Gift,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { siteConfig } from "@repo/config";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  feature?: Feature; // If set, will show lock for users without access
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
      {
        href: "/dashboard/agent-runs",
        label: "Agent Runs",
        icon: Bot,
        badge: "New",
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

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isCollapsed, toggleCollapsed } = useSidebar();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  const user = session?.user;
  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const userImage = user?.image || null;
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col">
        {/* Logo - Minimal style */}
        <div
          className={cn(
            "flex h-14 items-center border-[var(--dashboard-border)] border-b",
            isCollapsed ? "justify-center px-2" : "justify-between px-5",
          )}
        >
          <Link href="/dashboard" className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <span className="font-bold text-xs">
                {siteConfig.name.charAt(0)}
              </span>
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-foreground tracking-tight">
                {siteConfig.name}
              </span>
            )}
          </Link>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={toggleCollapsed}
              title="Collapse sidebar (⌘B)"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <div className="flex justify-center border-[var(--dashboard-border)] border-b py-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={toggleCollapsed}
              title="Expand sidebar (⌘B)"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Organization Switcher - Only show for Business/Enterprise plans */}
        {!isCollapsed &&
          (subscription.plan === "business" ||
            subscription.plan === "enterprise") && (
            <div className="border-[var(--dashboard-border)] border-b px-3 py-3">
              <OrgSwitcher />
            </div>
          )}

        {/* Navigation - Clean & Minimal */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto py-3",
            isCollapsed ? "px-2" : "px-3",
          )}
        >
          {/* Dashboard - Standalone */}
          {(() => {
            const Icon = DASHBOARD_ITEM.icon;
            const isActive = pathname === DASHBOARD_ITEM.href;

            const dashboardLink = (
              <Link
                href={DASHBOARD_ITEM.href}
                className={cn(
                  "flex items-center rounded-lg font-medium text-sm transition-colors",
                  isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && (
                  <span className="flex-1">{DASHBOARD_ITEM.label}</span>
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip>
                  <TooltipTrigger asChild>{dashboardLink}</TooltipTrigger>
                  <TooltipContent side="right">
                    {DASHBOARD_ITEM.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return dashboardLink;
          })()}

          {/* Categories with headings */}
          {NAV_CATEGORIES.map((category, categoryIndex) => (
            <div key={category.label} className="mt-4">
              {/* Category heading */}
              {!isCollapsed && (
                <span className="block px-3 py-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  {category.label}
                </span>
              )}
              {isCollapsed && categoryIndex > 0 && (
                <div className="my-2 border-[var(--dashboard-border)] border-t" />
              )}

              {/* Category items */}
              <div className="space-y-0.5">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      pathname.startsWith(item.href));

                  // Check if feature is locked for current plan
                  const isLocked =
                    item.feature && !subscriptionLoading
                      ? !canAccessFeature(subscription.plan, item.feature)
                      : false;

                  const linkContent = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-lg font-medium text-sm transition-colors",
                        isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : isLocked
                            ? "text-muted-foreground/60 hover:bg-accent hover:text-muted-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isLocked && "opacity-60",
                        )}
                      />
                      {!isCollapsed && (
                        <>
                          <span
                            className={cn("flex-1", isLocked && "opacity-80")}
                          >
                            {item.label}
                          </span>
                          {isLocked ? (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                          ) : item.badge ? (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "px-1.5 py-0 font-medium text-[10px]",
                                isActive
                                  ? "border-0 bg-primary/20 text-primary"
                                  : "border-0 bg-muted text-muted-foreground",
                              )}
                            >
                              {item.badge}
                            </Badge>
                          ) : null}
                        </>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="flex items-center gap-2"
                        >
                          {item.label}
                          {isLocked ? (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          ) : item.badge ? (
                            <Badge
                              variant="secondary"
                              className="px-1.5 py-0 font-medium text-[10px]"
                            >
                              {item.badge}
                            </Badge>
                          ) : null}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return linkContent;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Help link */}
        <div
          className={cn(
            "border-[var(--dashboard-border)] border-t py-2",
            isCollapsed ? "px-2" : "px-3",
          )}
        >
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/help"
                  className="flex items-center justify-center rounded-lg p-2 font-medium text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
                >
                  <HelpCircle className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Help & Support</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/help"
              className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Help & Support</span>
            </Link>
          )}
        </div>

        {/* User menu - Shows profile picture, name, and email */}
        <div
          className={cn(
            "border-[var(--dashboard-border)] border-t",
            isCollapsed ? "p-2" : "p-3",
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {isCollapsed ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 hover:bg-accent"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userImage || undefined} alt={userName} />
                    <AvatarFallback className="bg-primary/10 font-medium text-primary text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="h-auto w-full justify-start gap-2.5 px-2 py-2 hover:bg-accent"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userImage || undefined} alt={userName} />
                    <AvatarFallback className="bg-primary/10 font-medium text-primary text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col items-start text-left">
                    <span className="w-full truncate font-medium text-foreground text-sm">
                      {userName}
                    </span>
                    <span className="w-full truncate text-muted-foreground text-xs">
                      {userEmail}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isCollapsed ? "center" : "start"}
              side="top"
              className="w-56"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="font-medium text-sm leading-none">{userName}</p>
                  <p className="text-muted-foreground text-xs leading-none">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/settings/security"
                  className="cursor-pointer"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Security & SSO
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/billing" className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/affiliates" className="cursor-pointer">
                  <Gift className="mr-2 h-4 w-4" />
                  Refer & earn
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
