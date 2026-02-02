"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  X,
  BarChart3,
  Zap,
  Globe,
  Shield,
  Code2,
  Briefcase,
  Smartphone,
  BookOpen,
  HelpCircle,
  FileText,
  Hammer,
  LayoutDashboard,
  Github,
} from "lucide-react";
import { headerCTA, siteConfig } from "@repo/config";
import { useSession } from "@/lib/auth/client";

const platformItems = [
  {
    title: "Features Overview",
    href: "/features",
    description: "Explore all capabilities of the Go2 platform.",
    icon: Zap,
  },
  {
    title: "Analytics",
    href: "/features/analytics",
    description: "Real-time insights for your links.",
    icon: BarChart3,
  },
  {
    title: "Custom Domains",
    href: "/features/custom-domains",
    description: "Use your own brand domain.",
    icon: Globe,
  },
  {
    title: "API & Webhooks",
    href: "/features/api",
    description: "Programmatic access for developers.",
    icon: Code2,
  },
];

const solutionItems = [
  {
    title: "For Agencies",
    href: "/solutions/agencies",
    description: "Manage multiple clients with ease.",
    icon: Briefcase,
  },
  {
    title: "For Creators",
    href: "/solutions/creators",
    description: "Engage your audience everywhere.",
    icon: Smartphone,
  },
  {
    title: "For Developers",
    href: "/solutions/developers",
    description: "Integrate powerful short links.",
    icon: Code2,
  },
  {
    title: "Enterprise",
    href: "/solutions/enterprise",
    description: "Scale with security and control.",
    icon: Shield,
  },
];

const resourceItems = [
  {
    title: "Documentation",
    href: "/docs",
    description: "Guides and API reference.",
    icon: BookOpen,
  },
  {
    title: "Help Center",
    href: "/help",
    description: "FAQs and support articles.",
    icon: HelpCircle,
  },
  {
    title: "Blog",
    href: "/blog",
    description: "Latest updates and tips.",
    icon: FileText,
  },
  {
    title: "Free Tools",
    href: "/tools/qr-generator",
    description: "QR Generator, Link Checker, and more.",
    icon: Hammer,
  },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session, isPending } = useSession();

  const isAuthenticated = !!session?.user;

  // Track scroll position for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      // Trigger at ~50px scroll (roughly 5% of viewport on most screens)
      setScrolled(window.scrollY > 50);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-[var(--marketing-border)]/50 bg-[var(--marketing-bg)]/80 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-transparent backdrop-blur-none"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo & Primary Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Logo showText className="flex" />
          </Link>

          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-9 px-4 text-sm font-medium bg-transparent text-[var(--marketing-text-muted)] hover:text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/10 data-[state=open]:bg-[var(--marketing-accent)]/10 data-[state=open]:text-[var(--marketing-text)]">
                  Platform
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)]">
                    {platformItems.map((item) => (
                      <ListItem
                        key={item.title}
                        title={item.title}
                        href={item.href}
                        icon={item.icon}
                      >
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-9 px-4 text-sm font-medium bg-transparent text-[var(--marketing-text-muted)] hover:text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/10 data-[state=open]:bg-[var(--marketing-accent)]/10 data-[state=open]:text-[var(--marketing-text)]">
                  Solutions
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)]">
                    {solutionItems.map((item) => (
                      <ListItem
                        key={item.title}
                        title={item.title}
                        href={item.href}
                        icon={item.icon}
                      >
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-9 px-4 text-sm font-medium bg-transparent text-[var(--marketing-text-muted)] hover:text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/10 data-[state=open]:bg-[var(--marketing-accent)]/10 data-[state=open]:text-[var(--marketing-text)]">
                  Resources
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-[var(--marketing-bg-elevated)] border border-[var(--marketing-border)]">
                    {resourceItems.map((item) => (
                      <ListItem
                        key={item.title}
                        title={item.title}
                        href={item.href}
                        icon={item.icon}
                      >
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/pricing" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "h-9 px-4 text-sm font-medium bg-transparent text-[var(--marketing-text-muted)] hover:text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/10"
                    )}
                  >
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {/* GitHub Link */}
          {siteConfig.links.github && (
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full text-[var(--marketing-text-muted)] transition-colors hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-text)]"
              aria-label="View on GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          )}

          <div className="hidden items-center gap-3 sm:flex">
            {isPending ? (
              // Loading state - show subtle placeholder
              <div className="h-9 w-24 animate-pulse rounded-full bg-[var(--marketing-accent)]/10" />
            ) : isAuthenticated ? (
              // Authenticated - show Dashboard button
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="h-9 font-semibold px-5 rounded-full bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)] shadow-none gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              // Not authenticated - show Sign In and Start Free buttons
              <>
                <Link href={headerCTA.signIn.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 font-medium text-[var(--marketing-text-muted)] hover:text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/10 px-4"
                  >
                    {headerCTA.signIn.title}
                  </Button>
                </Link>
                <Link href={headerCTA.getStarted.href}>
                  <Button
                    size="sm"
                    className="h-9 font-semibold px-5 rounded-full bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)] shadow-none"
                  >
                    {headerCTA.getStarted.title}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-[var(--marketing-text)] hover:bg-[var(--marketing-accent)]/10"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-80 p-0 bg-[var(--marketing-bg)] border-l border-[var(--marketing-border)]"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-[var(--marketing-border)] p-4">
                  <Logo showText />
                </div>

                <nav className="flex-1 overflow-auto p-4 bg-[var(--marketing-bg)]">
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--marketing-text-muted)]">
                        Platform
                      </h4>
                      <div className="space-y-1">
                        {platformItems.map((item) => (
                          <MobileLink key={item.href} href={item.href} onOpenChange={setMobileOpen}>
                            {item.title}
                          </MobileLink>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--marketing-text-muted)]">
                        Solutions
                      </h4>
                      <div className="space-y-1">
                        {solutionItems.map((item) => (
                          <MobileLink key={item.href} href={item.href} onOpenChange={setMobileOpen}>
                            {item.title}
                          </MobileLink>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--marketing-text-muted)]">
                        Resources
                      </h4>
                      <div className="space-y-1">
                        {resourceItems.map((item) => (
                          <MobileLink key={item.href} href={item.href} onOpenChange={setMobileOpen}>
                            {item.title}
                          </MobileLink>
                        ))}
                      </div>
                    </div>
                  </div>
                </nav>

                <div className="border-t border-[var(--marketing-border)] p-4 space-y-3 bg-[var(--marketing-bg)]">
                  {isPending ? (
                    <div className="h-11 w-full animate-pulse rounded-xl bg-[var(--marketing-accent)]/10" />
                  ) : isAuthenticated ? (
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block">
                      <Button className="w-full h-11 rounded-xl shadow-none bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)] gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={headerCTA.signIn.href}
                        onClick={() => setMobileOpen(false)}
                        className="block"
                      >
                        <Button
                          variant="outline"
                          className="w-full h-11 border-[var(--marketing-border)] rounded-xl text-[var(--marketing-text)] bg-transparent hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-accent)] hover:border-[var(--marketing-accent)]"
                        >
                          {headerCTA.signIn.title}
                        </Button>
                      </Link>
                      <Link
                        href={headerCTA.getStarted.href}
                        onClick={() => setMobileOpen(false)}
                        className="block"
                      >
                        <Button className="w-full h-11 rounded-xl shadow-none bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]">
                          {headerCTA.getStarted.title}
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

const ListItem = ({ className, title, children, icon: Icon, href, ...props }: any) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-[var(--marketing-accent)]/10 focus:bg-[var(--marketing-accent)]/10 group",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2 text-sm font-medium leading-none text-[var(--marketing-text)] group-hover:text-[var(--marketing-accent)] transition-colors">
            {Icon && <Icon className="h-4 w-4" />}
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-[var(--marketing-text-muted)] group-hover:text-[var(--marketing-text-muted)]/80 pl-6 mt-1 transition-colors">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

const MobileLink = ({ href, onOpenChange, children, className, ...props }: any) => {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      onClick={() => onOpenChange(false)}
      className={cn(
        "block rounded-lg px-2 py-2 text-base font-medium transition-colors hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-accent)]",
        pathname === href
          ? "bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]"
          : "text-[var(--marketing-text-muted)]",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
};
