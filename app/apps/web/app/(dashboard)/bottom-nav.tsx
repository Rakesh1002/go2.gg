"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Plus,
  User,
  Settings,
  CreditCard,
  HelpCircle,
  LogOut,
  Link2,
  Globe,
  BarChart3,
  QrCode,
  FileText,
  Upload,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const quickActions = [
  { href: "/dashboard/links", label: "Create New Link", icon: Link2 },
  { href: "/dashboard/bio", label: "Link in Bio", icon: FileText },
  { href: "/dashboard/qr", label: "QR Codes", icon: QrCode },
  { href: "/dashboard/domains", label: "Add Domain", icon: Globe },
  { href: "/dashboard/import", label: "Import Links", icon: Upload },
  { href: "/dashboard/analytics", label: "View Analytics", icon: BarChart3 },
];

const profileActions = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/help", label: "Help & Support", icon: HelpCircle },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    try {
      const { signOut } = await import("@/lib/auth/client");
      await signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }

  const isHomeActive = pathname === "/dashboard";
  const isProfileActive =
    pathname.startsWith("/dashboard/settings") || pathname.startsWith("/dashboard/billing");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--dashboard-border)] bg-[var(--dashboard-bg)] md:hidden">
      <div className="flex h-16 items-center justify-around px-4">
        {/* Home / Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 transition-colors",
            isHomeActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Quick Actions */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-auto flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 text-muted-foreground hover:text-foreground"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                <Plus className="h-5 w-5" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="center" className="w-56 p-2" sideOffset={8}>
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {action.label}
                  </Link>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "flex h-auto flex-col items-center justify-center gap-1 rounded-lg px-4 py-2",
                isProfileActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium">Profile</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-56 p-2" sideOffset={8}>
            <div className="space-y-1">
              {profileActions.map((action) => {
                const Icon = action.icon;
                const isActive = pathname.startsWith(action.href);
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {action.label}
                  </Link>
                );
              })}
              <div className="my-1 border-t border-[var(--dashboard-border)]" />
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}
