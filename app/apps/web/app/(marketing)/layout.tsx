import type { ReactNode } from "react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

interface MarketingLayoutProps {
  children: ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--marketing-bg)] text-[var(--marketing-text)] selection:bg-[var(--marketing-accent)] selection:text-[var(--marketing-bg)]">
      <SiteHeader />
      {/* pt-16 accounts for the fixed header height (h-16 = 64px) */}
      <main className="flex-1 relative pt-16">{children}</main>
      <SiteFooter />
    </div>
  );
}
