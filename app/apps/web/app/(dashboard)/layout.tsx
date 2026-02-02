import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/server";
import { MobileNav } from "./mobile-nav";
import { BottomNav } from "./bottom-nav";
import { SidebarWrapper } from "./sidebar-wrapper";
import { SubscriptionProvider } from "@/contexts/subscription-context";
import { KeyboardShortcutProvider } from "@/contexts/keyboard-shortcut-context";
import { QueryProvider } from "@/lib/query-client";
import { CommandPaletteWrapper } from "./command-palette-wrapper";
import { UpgradeBanner } from "@/components/billing";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <QueryProvider>
      <SubscriptionProvider>
        <KeyboardShortcutProvider>
          {/* Command Palette - Global search and quick actions */}
          <CommandPaletteWrapper />

          {/* Upgrade Banner - Shows when limits are exceeded */}
          <UpgradeBanner />

          <SidebarWrapper>
            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Mobile header - only visible on mobile */}
              <header className="flex h-14 items-center gap-4 border-b border-[var(--dashboard-border)] bg-[var(--dashboard-bg)] px-4 md:hidden">
                <MobileNav />
              </header>

              {/* Page content - Clean with generous whitespace */}
              <main className="flex-1 overflow-y-auto bg-[var(--dashboard-bg-muted)]">
                <div className="mx-auto max-w-6xl p-6 pb-24 md:p-8 md:pb-8 lg:p-10">{children}</div>
              </main>

              {/* Mobile bottom navigation */}
              <BottomNav />
            </div>
          </SidebarWrapper>
        </KeyboardShortcutProvider>
      </SubscriptionProvider>
    </QueryProvider>
  );
}
