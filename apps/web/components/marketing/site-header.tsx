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
  Bot,
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
  Terminal,
  GitCompare,
  ScrollText,
  PlugZap,
  Building2,
} from "lucide-react";
import { siteConfig } from "@repo/config";
import { useSession } from "@/lib/auth/client";

const agentItems = [
  {
    title: "Links for AI Agents",
    href: "/agents",
    description: "Per-run attribution, MCP, edge-native API.",
    icon: Bot,
  },
  {
    title: "5-min Quickstart",
    href: "/agents/quickstart",
    description: "Install the MCP server and ship your first attributed link.",
    icon: Terminal,
  },
  {
    title: "MCP Server",
    href: "/developers/mcp",
    description: "Stdio + remote with OAuth 2.1. Works in Claude Code, Cursor, Codex.",
    icon: PlugZap,
  },
  {
    title: "REST API",
    href: "/developers/api",
    description: "OpenAPI 3.1, bearer auth, agent-attribution endpoints.",
    icon: Code2,
  },
  {
    title: "vs. Dub.co",
    href: "/compare/dub-vs-go2-for-agents",
    description: "Honest comparison for AI-agent teams.",
    icon: GitCompare,
  },
  {
    title: "AGENTS.md & Skills",
    href: "/developers/skills",
    description: "Drop-in Claude Skill, Cursor rules, Codex AGENTS.md.",
    icon: ScrollText,
  },
];

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
    title: "For Owners",
    href: "/solutions/owners",
    description: "Your agent ships. You own the dashboard.",
    icon: Building2,
  },
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
  const [mounted, setMounted] = useState(false);
  const { data: session, isPending } = useSession();

  const isAuthenticated = !!session?.user;
  // Auth is a client-only signal — the server can't know it, so it always
  // renders the placeholder. Render the same placeholder on the first client
  // paint (mounted === false) to avoid a hydration mismatch that would force
  // React to regenerate the whole marketing tree.
  const authPending = !mounted || isPending;

  useEffect(() => {
    setMounted(true);
  }, []);

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
        "fixed top-0 right-0 left-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-[var(--marketing-border)]/50 border-b bg-[var(--marketing-bg)]/80 shadow-sm backdrop-blur-xl"
          : "border-transparent border-b bg-[var(--marketing-bg)]/30 backdrop-blur-md"
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
                <NavigationMenuTrigger className="h-9 bg-transparent px-4 font-medium text-[var(--marketing-text-muted)] text-sm hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-text)] data-[state=open]:bg-[var(--marketing-accent)]/10 data-[state=open]:text-[var(--marketing-text)]">
                  <Bot className="mr-1.5 h-3.5 w-3.5 text-[var(--marketing-accent)]" />
                  For Agents
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4 md:w-[520px] md:grid-cols-2 lg:w-[640px]">
                    {agentItems.map((item) => (
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
                      "h-9 bg-transparent px-4 font-medium text-[var(--marketing-text-muted)] text-sm hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-text)]"
                    )}
                  >
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/docs" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "h-9 bg-transparent px-4 font-medium text-[var(--marketing-text-muted)] text-sm hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-text)]"
                    )}
                  >
                    Docs
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link href="/blog" legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "h-9 bg-transparent px-4 font-medium text-[var(--marketing-text-muted)] text-sm hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-text)]"
                    )}
                  >
                    Blog
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-9 bg-transparent px-4 font-medium text-[var(--marketing-text-muted)] text-sm hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-text)] data-[state=open]:bg-[var(--marketing-accent)]/10 data-[state=open]:text-[var(--marketing-text)]">
                  More
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[400px] gap-4 border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4 md:w-[560px] md:grid-cols-3 lg:w-[680px]">
                    <div>
                      <p className="mb-2 px-2 font-bold text-[10px] text-[var(--marketing-text-muted)] uppercase tracking-wider">
                        Platform
                      </p>
                      <ul className="space-y-1">
                        {platformItems.map((item) => (
                          <ListItem
                            key={item.title}
                            title={item.title}
                            href={item.href}
                            icon={item.icon}
                            compact
                          >
                            {item.description}
                          </ListItem>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 px-2 font-bold text-[10px] text-[var(--marketing-text-muted)] uppercase tracking-wider">
                        Solutions
                      </p>
                      <ul className="space-y-1">
                        {solutionItems.map((item) => (
                          <ListItem
                            key={item.title}
                            title={item.title}
                            href={item.href}
                            icon={item.icon}
                            compact
                          >
                            {item.description}
                          </ListItem>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 px-2 font-bold text-[10px] text-[var(--marketing-text-muted)] uppercase tracking-wider">
                        Resources
                      </p>
                      <ul className="space-y-1">
                        {resourceItems.map((item) => (
                          <ListItem
                            key={item.title}
                            title={item.title}
                            href={item.href}
                            icon={item.icon}
                            compact
                          >
                            {item.description}
                          </ListItem>
                        ))}
                      </ul>
                    </div>
                  </div>
                </NavigationMenuContent>
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
              className="hidden h-9 w-9 items-center justify-center rounded-full text-[var(--marketing-text-muted)] transition-colors hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-text)] sm:flex"
              aria-label="View on GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          )}

          <div className="hidden items-center gap-3 sm:flex">
            {authPending ? (
              // Loading state - show subtle placeholder
              <div className="h-9 w-24 animate-pulse rounded-full bg-[var(--marketing-accent)]/10" />
            ) : isAuthenticated ? (
              // Authenticated - show Dashboard button
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="h-9 gap-2 rounded-full bg-[var(--marketing-accent)] px-5 font-semibold text-white shadow-none hover:bg-[var(--marketing-accent-light)]"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              // Not authenticated - show Sign In and Install MCP buttons
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-4 font-medium text-[var(--marketing-text-muted)] hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-text)]"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/agents/quickstart">
                  <Button
                    size="sm"
                    className="h-9 gap-1.5 rounded-full bg-[var(--marketing-accent)] px-5 font-semibold text-white shadow-none hover:bg-[var(--marketing-accent-light)]"
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    Install MCP
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
              className="w-80 border-[var(--marketing-border)] border-l bg-[var(--marketing-bg)] p-0"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-[var(--marketing-border)] border-b p-4">
                  <Logo showText />
                </div>

                <nav className="flex-1 overflow-auto bg-[var(--marketing-bg)] p-4">
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-2 px-2 font-semibold text-[var(--marketing-accent)] text-xs uppercase tracking-wider">
                        For Agents
                      </h4>
                      <div className="space-y-1">
                        {agentItems.map((item) => (
                          <MobileLink key={item.href} href={item.href} onOpenChange={setMobileOpen}>
                            {item.title}
                          </MobileLink>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 px-2 font-semibold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
                        Browse
                      </h4>
                      <div className="space-y-1">
                        <MobileLink href="/pricing" onOpenChange={setMobileOpen}>
                          Pricing
                        </MobileLink>
                        <MobileLink href="/docs" onOpenChange={setMobileOpen}>
                          Docs
                        </MobileLink>
                        <MobileLink href="/blog" onOpenChange={setMobileOpen}>
                          Blog
                        </MobileLink>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 px-2 font-semibold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
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
                      <h4 className="mb-2 px-2 font-semibold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
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
                      <h4 className="mb-2 px-2 font-semibold text-[var(--marketing-text-muted)] text-xs uppercase tracking-wider">
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

                <div className="space-y-3 border-[var(--marketing-border)] border-t bg-[var(--marketing-bg)] p-4">
                  {authPending ? (
                    <div className="h-11 w-full animate-pulse rounded-xl bg-[var(--marketing-accent)]/10" />
                  ) : isAuthenticated ? (
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block">
                      <Button className="h-11 w-full gap-2 rounded-xl bg-[var(--marketing-accent)] text-white shadow-none hover:bg-[var(--marketing-accent-light)]">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setMobileOpen(false)} className="block">
                        <Button
                          variant="outline"
                          className="h-11 w-full rounded-xl border-[var(--marketing-border)] bg-transparent text-[var(--marketing-text)] hover:border-[var(--marketing-accent)] hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-accent)]"
                        >
                          Sign in
                        </Button>
                      </Link>
                      <Link
                        href="/agents/quickstart"
                        onClick={() => setMobileOpen(false)}
                        className="block"
                      >
                        <Button className="h-11 w-full gap-2 rounded-xl bg-[var(--marketing-accent)] text-white shadow-none hover:bg-[var(--marketing-accent-light)]">
                          <Terminal className="h-4 w-4" />
                          Install MCP
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

const ListItem = ({ className, title, children, icon: Icon, href, compact, ...props }: any) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "group block select-none rounded-lg leading-none no-underline outline-none transition-colors hover:bg-[var(--marketing-accent)]/10 focus:bg-[var(--marketing-accent)]/10",
            compact ? "p-2" : "space-y-1 p-3",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2 font-medium text-[var(--marketing-text)] text-sm leading-none transition-colors group-hover:text-[var(--marketing-accent)]">
            {Icon && <Icon className="h-4 w-4" />}
            {title}
          </div>
          {!compact && (
            <p className="mt-1 line-clamp-2 pl-6 text-[var(--marketing-text-muted)] text-sm leading-snug transition-colors group-hover:text-[var(--marketing-text-muted)]/80">
              {children}
            </p>
          )}
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
        "block rounded-lg px-2 py-2 font-medium text-base transition-colors hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-accent)]",
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
