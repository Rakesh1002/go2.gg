"use client";

import { cn } from "@/lib/utils";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";
import { DashboardNav } from "./dashboard-nav";

function SidebarContent() {
  const { isCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden border-r border-[var(--dashboard-border)] bg-sidebar md:flex md:flex-col transition-all duration-200",
        isCollapsed ? "md:w-16" : "md:w-60 lg:w-64"
      )}
    >
      <DashboardNav />
    </aside>
  );
}

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--dashboard-bg)]">
        <SidebarContent />
        {children}
      </div>
    </SidebarProvider>
  );
}
