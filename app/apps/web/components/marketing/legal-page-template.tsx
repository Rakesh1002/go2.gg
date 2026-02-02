"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  Printer,
  Menu,
  X,
  FileText,
  Shield,
  Cookie,
  Scale,
  FileCheck,
  ExternalLink,
  User,
  Globe,
  Code,
  CreditCard,
  Clock,
  AlertTriangle,
  Gavel,
  Mail,
  Lock,
  Database,
  Eye,
  Share2,
  Settings,
  Bell,
  Smartphone,
  Building,
  Key,
  Info,
  List,
  ToggleRight,
  Monitor,
  Target,
  Ban,
  ShieldAlert,
  RotateCcw,
  Flag,
  BookOpen,
  Trash2,
  UserCheck,
  Baby,
  Server,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Icon name to component mapping
const iconMap: Record<string, LucideIcon> = {
  FileText,
  Shield,
  Cookie,
  Scale,
  FileCheck,
  User,
  Globe,
  Code,
  CreditCard,
  Clock,
  AlertTriangle,
  Gavel,
  Mail,
  Lock,
  Database,
  Eye,
  Share2,
  Settings,
  Bell,
  Smartphone,
  Building,
  Key,
  Info,
  List,
  ToggleRight,
  Monitor,
  Target,
  Ban,
  ShieldAlert,
  RotateCcw,
  Flag,
  BookOpen,
  Trash2,
  UserCheck,
  Baby,
  Server,
};

export interface LegalSection {
  id: string;
  title: string;
  icon?: string;
}

interface RelatedDoc {
  title: string;
  href: string;
  description?: string;
}

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  effectiveDate?: string;
  sections: LegalSection[];
  relatedDocs?: RelatedDoc[];
  children: ReactNode;
}

// Icon mapping for legal pages
const legalPageIcons: Record<string, LucideIcon> = {
  "/terms": Scale,
  "/privacy": Shield,
  "/cookies": Cookie,
  "/acceptable-use": FileCheck,
  "/dpa": FileText,
};

// All legal documents for related docs
const allLegalDocs: RelatedDoc[] = [
  { title: "Terms of Service", href: "/terms", description: "Service agreement and usage terms" },
  { title: "Privacy Policy", href: "/privacy", description: "How we handle your data" },
  { title: "Cookie Policy", href: "/cookies", description: "Cookie usage and preferences" },
  {
    title: "Acceptable Use",
    href: "/acceptable-use",
    description: "Permitted and prohibited uses",
  },
  { title: "DPA", href: "/dpa", description: "Data processing agreement" },
];

export function LegalPageTemplate({
  title,
  lastUpdated,
  effectiveDate,
  sections,
  relatedDocs,
  children,
}: LegalPageProps) {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get the icon for current page
  const PageIcon = legalPageIcons[pathname] || FileText;

  // Filter out current page from related docs
  const otherLegalDocs = relatedDocs || allLegalDocs.filter((doc) => doc.href !== pathname);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map((section) => ({
        id: section.id,
        element: document.getElementById(section.id),
      }));

      const scrollPosition = window.scrollY + 150;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        if (section.element && section.element.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (mobileMenuOpen && !target.closest("[data-mobile-menu]")) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [mobileMenuOpen]);

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-[var(--marketing-bg)] print:bg-white">
      {/* Header */}
      <div className="border-b border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)]/80 backdrop-blur-md sticky top-0 z-20 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-end gap-2">
            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="hidden sm:flex items-center gap-2 text-[var(--marketing-text-muted)] hover:text-[var(--marketing-text)]"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden md:inline">Print</span>
              </Button>

              {/* Mobile ToC Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="lg:hidden text-[var(--marketing-text-muted)] border-[var(--marketing-border)]"
                data-mobile-menu
              >
                {mobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <>
                    <Menu className="h-4 w-4" />
                    <span className="hidden xs:inline ml-1.5 text-xs">Contents</span>
                    <ChevronDown className="h-3 w-3 ml-1 hidden xs:inline" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Table of Contents Dropdown */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-x-0 top-[53px] sm:top-[65px] z-30 bg-[var(--marketing-bg-elevated)] border-b border-[var(--marketing-border)] shadow-xl max-h-[70vh] overflow-y-auto print:hidden"
          data-mobile-menu
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--marketing-text-muted)]">
                On this page
              </p>
              <span className="text-xs text-[var(--marketing-text-muted)]">
                {sections.length} sections
              </span>
            </div>
            <nav className="space-y-0.5">
              {sections.map((section) => {
                const SectionIcon = section.icon ? iconMap[section.icon] : undefined;
                return (
                  <button
                    type="button"
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2.5",
                      activeSection === section.id
                        ? "bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] font-medium"
                        : "text-[var(--marketing-text-muted)] hover:text-[var(--marketing-text)] hover:bg-[var(--marketing-bg)] active:bg-[var(--marketing-bg)]"
                    )}
                  >
                    {SectionIcon && <SectionIcon className="h-4 w-4 shrink-0 opacity-70" />}
                    <span className="flex-1 truncate">{section.title}</span>
                    {activeSection === section.id && (
                      <span className="text-xs bg-[var(--marketing-accent)]/20 text-[var(--marketing-accent)] px-1.5 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Related Docs */}
            <div className="mt-4 pt-4 border-t border-[var(--marketing-border)]">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--marketing-text-muted)] mb-3">
                Related Documents
              </p>
              <div className="flex flex-wrap gap-2">
                {otherLegalDocs.map((doc) => (
                  <Link
                    key={doc.href}
                    href={doc.href}
                    className="text-xs px-3 py-1.5 rounded-full bg-[var(--marketing-bg)] border border-[var(--marketing-border)] text-[var(--marketing-text-muted)] hover:text-[var(--marketing-accent)] hover:border-[var(--marketing-accent)]/30 transition-colors"
                  >
                    {doc.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 top-[53px] sm:top-[65px] bg-black/20 z-20 cursor-default"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] xl:grid-cols-[240px_1fr_280px] gap-6 lg:gap-8 xl:gap-12">
          {/* Left Sidebar - Table of Contents (Desktop) */}
          <aside className="hidden lg:block print:hidden">
            <div className="sticky top-28">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--marketing-text-muted)] mb-4">
                On this page
              </p>
              <nav className="space-y-0.5 max-h-[calc(100vh-200px)] overflow-y-auto">
                {sections.map((section) => {
                  const SectionIcon = section.icon ? iconMap[section.icon] : undefined;
                  return (
                    <button
                      type="button"
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2",
                        activeSection === section.id
                          ? "bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] font-medium border-l-2 border-[var(--marketing-accent)]"
                          : "text-[var(--marketing-text-muted)] hover:text-[var(--marketing-text)] hover:bg-[var(--marketing-bg-elevated)]"
                      )}
                    >
                      {SectionIcon && <SectionIcon className="h-4 w-4 shrink-0" />}
                      <span className="truncate">{section.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="min-w-0 max-w-none">
            {/* Title Section */}
            <div className="mb-6 sm:mb-8 md:mb-10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)] shrink-0">
                  <PageIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--marketing-text)] print:text-3xl">
                    {title}
                  </h1>
                </div>
              </div>

              {/* Date badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                <Badge
                  variant="outline"
                  className="bg-[var(--marketing-bg-elevated)] border-[var(--marketing-border)] text-[var(--marketing-text-muted)] font-normal text-xs"
                >
                  Last updated: {lastUpdated}
                </Badge>
                {effectiveDate && (
                  <Badge
                    variant="outline"
                    className="bg-[var(--marketing-accent)]/5 border-[var(--marketing-accent)]/20 text-[var(--marketing-accent)] font-normal text-xs"
                  >
                    Effective: {effectiveDate}
                  </Badge>
                )}
              </div>
            </div>

            {/* Content with enhanced responsive prose styling */}
            <div
              className={cn(
                "legal-prose",
                // Base prose
                "prose prose-neutral max-w-none",
                // Responsive text sizing
                "prose-sm sm:prose-base md:prose-lg",
                // Headings
                "prose-headings:text-[var(--marketing-text)] prose-headings:font-semibold prose-headings:scroll-mt-20 sm:prose-headings:scroll-mt-28",
                // H2 styling - responsive
                "prose-h2:text-lg sm:prose-h2:text-xl md:prose-h2:text-2xl",
                "prose-h2:mt-8 sm:prose-h2:mt-10 md:prose-h2:mt-12",
                "prose-h2:mb-3 sm:prose-h2:mb-4",
                "prose-h2:pb-2 sm:prose-h2:pb-3",
                "prose-h2:border-b prose-h2:border-[var(--marketing-border)]",
                // H3 styling - responsive
                "prose-h3:text-base sm:prose-h3:text-lg",
                "prose-h3:mt-6 sm:prose-h3:mt-8",
                "prose-h3:mb-2 sm:prose-h3:mb-3",
                // Paragraph styling
                "prose-p:text-[var(--marketing-text-muted)]",
                "prose-p:leading-relaxed sm:prose-p:leading-relaxed",
                "prose-p:text-sm sm:prose-p:text-base",
                // Links
                "prose-a:text-[var(--marketing-accent)] prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-a:break-words",
                // Strong text
                "prose-strong:text-[var(--marketing-text)] prose-strong:font-semibold",
                // Lists
                "prose-ul:text-[var(--marketing-text-muted)] prose-ul:my-3 sm:prose-ul:my-4",
                "prose-ol:text-[var(--marketing-text-muted)] prose-ol:my-3 sm:prose-ol:my-4",
                "prose-li:marker:text-[var(--marketing-accent)]",
                "prose-li:my-0.5 sm:prose-li:my-1",
                "prose-li:text-sm sm:prose-li:text-base",
                // Code
                "prose-code:text-xs sm:prose-code:text-sm prose-code:bg-[var(--marketing-bg-elevated)] prose-code:px-1 sm:prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
                // Print styles
                "print:prose-sm print:prose-headings:text-black print:prose-p:text-gray-700"
              )}
            >
              {children}
            </div>

            {/* Mobile Related Documents */}
            <div className="lg:hidden mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-[var(--marketing-border)] print:hidden">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--marketing-text-muted)] mb-4">
                Related Documents
              </p>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                {otherLegalDocs.map((doc) => (
                  <Link
                    key={doc.href}
                    href={doc.href}
                    className="group flex items-center gap-2 p-3 rounded-lg border border-[var(--marketing-border)] hover:border-[var(--marketing-accent)]/30 hover:bg-[var(--marketing-bg-elevated)] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--marketing-text)] group-hover:text-[var(--marketing-accent)] transition-colors truncate">
                        {doc.title}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-[var(--marketing-text-muted)] mt-0.5 truncate hidden xs:block">
                          {doc.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--marketing-text-muted)] group-hover:text-[var(--marketing-accent)] shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="mt-10 sm:mt-12 md:mt-16 pt-6 sm:pt-8 border-t border-[var(--marketing-border)] print:hidden">
              <p className="text-xs sm:text-sm text-[var(--marketing-text-muted)] mb-4">
                Questions about this policy? Contact us at{" "}
                <a
                  href="mailto:legal@go2.gg"
                  className="text-[var(--marketing-accent)] hover:underline"
                >
                  legal@go2.gg
                </a>
              </p>
            </div>
          </main>

          {/* Right Sidebar - Related Documents (Desktop) */}
          <aside className="hidden lg:block print:hidden">
            <div className="sticky top-28 space-y-6">
              {/* Related Documents */}
              <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4 xl:p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--marketing-text-muted)] mb-4">
                  Related Documents
                </p>
                <nav className="space-y-1.5">
                  {otherLegalDocs.map((doc) => (
                    <Link
                      key={doc.href}
                      href={doc.href}
                      className="group flex items-start gap-2 p-2 -mx-2 rounded-lg hover:bg-[var(--marketing-bg)] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--marketing-text)] group-hover:text-[var(--marketing-accent)] transition-colors">
                          {doc.title}
                        </p>
                        {doc.description && (
                          <p className="text-xs text-[var(--marketing-text-muted)] mt-0.5 truncate">
                            {doc.description}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-[var(--marketing-text-muted)] group-hover:text-[var(--marketing-accent)] shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Quick Actions */}
              <div className="rounded-xl border border-[var(--marketing-border)] bg-[var(--marketing-bg-elevated)] p-4 xl:p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--marketing-text-muted)] mb-4">
                  Actions
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="w-full justify-start gap-2 border-[var(--marketing-border)] text-[var(--marketing-text-muted)] hover:text-[var(--marketing-text)]"
                  >
                    <Printer className="h-4 w-4" />
                    Print this page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full justify-start gap-2 border-[var(--marketing-border)] text-[var(--marketing-text-muted)] hover:text-[var(--marketing-text)]"
                  >
                    <a href="mailto:legal@go2.gg">
                      <FileText className="h-4 w-4" />
                      Contact Legal
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Print-only footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-sm text-gray-600">
        <p>
          Go2 - {title} | Last updated: {lastUpdated}
          {effectiveDate && ` | Effective: ${effectiveDate}`}
        </p>
        <p>For the latest version, visit: go2.gg{pathname}</p>
      </div>
    </div>
  );
}

// Section component helper for consistent section styling
export function LegalSection({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon?: string;
  children: ReactNode;
}) {
  const Icon = icon ? iconMap[icon] : undefined;
  return (
    <section id={id} className="scroll-mt-20 sm:scroll-mt-28">
      <h2 className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-[var(--marketing-accent)]/10 text-[var(--marketing-accent)]">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </span>
        )}
        {title}
      </h2>
      {children}
    </section>
  );
}
