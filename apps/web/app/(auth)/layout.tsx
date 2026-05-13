import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      {/* Warm gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Top-left coral glow */}
        <div className="-left-40 -top-40 absolute h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
        {/* Bottom-right peach glow */}
        <div className="-bottom-40 -right-40 absolute h-[500px] w-[500px] rounded-full bg-[oklch(0.75_0.12_60_/_0.08)] blur-[100px]" />
        {/* Center subtle gradient */}
        <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-primary/3 to-transparent blur-[80px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full flex-col items-center px-4 py-12">
        {/* Logo */}
        <div className="mb-8">
          <Logo size="lg" showText href="/" />
        </div>

        {/* Auth card container */}
        <div className="w-full max-w-md">{children}</div>

        {/* Footer links */}
        <div className="mt-8 flex items-center gap-4 text-muted-foreground text-sm">
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
          <span className="text-border">|</span>
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <span className="text-border">|</span>
          <Link href="/help" className="transition-colors hover:text-foreground">
            Help
          </Link>
        </div>
      </div>
    </div>
  );
}
