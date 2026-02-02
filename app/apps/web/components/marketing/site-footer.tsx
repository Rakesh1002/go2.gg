"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { siteConfig } from "@repo/config";
import { Logo } from "@/components/ui/logo";
import {
  ArrowUpRight,
  Mail,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface FooterLink {
  title: string;
  href: string;
  external?: boolean;
}

const footerLinks: Record<string, FooterLink[]> = {
  product: [
    { title: "Features", href: "/features" },
    { title: "Analytics", href: "/features/analytics" },
    { title: "Custom Domains", href: "/features/custom-domains" },
    { title: "QR Codes", href: "/features/qr-codes" },
    { title: "API", href: "/features/api" },
    { title: "Pricing", href: "/pricing" },
  ],
  solutions: [
    { title: "For Agencies", href: "/solutions/agencies" },
    { title: "For Creators", href: "/solutions/creators" },
    { title: "For Developers", href: "/solutions/developers" },
    { title: "For Marketers", href: "/solutions/marketers" },
    { title: "Enterprise", href: "/solutions/enterprise" },
  ],
  resources: [
    { title: "Documentation", href: "/docs" },
    { title: "Blog", href: "/blog" },
    { title: "Help Center", href: "/help" },
    { title: "Free Tools", href: "/tools" },
    { title: "Guides", href: "/guides" },
  ],
  company: [
    { title: "About", href: "/about" },
    { title: "Contact", href: "/contact" },
    { title: "Careers", href: "/careers" },
    { title: "Partners", href: "/partners" },
  ],
  developers: [
    { title: "API Reference", href: "/docs/api/overview" },
    { title: "Changelog", href: "/changelog" },
    { title: "Status", href: "/status" },
    ...(siteConfig.links.github
      ? [{ title: "GitHub", href: siteConfig.links.github, external: true }]
      : []),
  ],
};

const socialLinks = [
  {
    name: "X (Twitter)",
    href: siteConfig.links.twitter,
    icon: (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    href: siteConfig.links.github,
    icon: (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    name: "Discord",
    href: siteConfig.links.discord,
    icon: (
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
      </svg>
    ),
  },
];

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setStatus("loading");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
      const response = await fetch(`${apiUrl}/api/v1/newsletter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source: "footer",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setStatus("success");
      setEmail("");

      if (data.alreadyExists) {
        toast.success("You're already subscribed! We'll keep you updated.");
      } else {
        toast.success("Thanks for subscribing! Check your email for confirmation.");
      }

      // Reset status after a few seconds
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("idle");
      toast.error(
        err instanceof Error ? err.message : "Failed to subscribe. Please try again."
      );
    }
  };

  return (
    <footer className="relative overflow-hidden border-t border-[var(--marketing-border)] bg-[var(--marketing-bg)] text-[var(--marketing-text)]">
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Navigation Grid - 2 columns on mobile, 3 on md, 7 on lg */}
        <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-3 lg:grid-cols-7">
          {/* Brand Column - spans full width on mobile, 3 on md, 2 on lg */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Logo size="lg" showText />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--marketing-text-muted)]">
              The edge-native link platform. Built on Cloudflare&apos;s network
              for sub-10ms redirects globally. Open source and developer-first.
            </p>

            {/* Newsletter */}
            <div className="mt-8">
              <p className="text-sm font-semibold text-[var(--marketing-text)]">
                Stay updated
              </p>
              <form onSubmit={handleNewsletterSubmit} className="mt-3 flex max-w-xs gap-2">
                <Input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === "loading" || status === "success"}
                  className="h-10 bg-[var(--marketing-bg-elevated)] border-[var(--marketing-border)] text-[var(--marketing-text)] focus-visible:ring-[var(--marketing-accent)]/20"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={status === "loading" || status === "success"}
                  className="h-10 px-4 bg-[var(--marketing-accent)] text-white hover:bg-[var(--marketing-accent-light)]"
                >
                  {status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : status === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Navigation Columns - each takes 1 column */}
          {Object.entries(footerLinks).map(([category, links], idx) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--marketing-text-muted)]">
                {category}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="group inline-flex items-center gap-1.5 text-sm text-[var(--marketing-text-muted)] transition-colors hover:text-[var(--marketing-accent)]"
                    >
                      <span>{link.title}</span>
                      {link.external && (
                        <ArrowUpRight className="h-3 w-3 opacity-40 transition-opacity group-hover:opacity-100" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-[var(--marketing-border)] pt-8 md:flex-row">
          <p className="text-sm text-[var(--marketing-text-muted)]">
            &copy; {new Date().getFullYear()} {siteConfig.creator}. All rights
            reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--marketing-text-muted)]">
            {socialLinks.map(
              (social) =>
                social.href && (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--marketing-bg-elevated)] text-[var(--marketing-text-muted)] transition-colors hover:bg-[var(--marketing-accent)]/10 hover:text-[var(--marketing-accent)]"
                  >
                    <span className="sr-only">{social.name}</span>
                    {social.icon}
                  </motion.a>
                ),
            )}
            <Link
              href="/privacy"
              className="hover:text-[var(--marketing-text)] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-[var(--marketing-text)] transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/cookies"
              className="hover:text-[var(--marketing-text)] transition-colors"
            >
              Cookies
            </Link>
            <Link
              href="/acceptable-use"
              className="hover:text-[var(--marketing-text)] transition-colors"
            >
              Acceptable Use
            </Link>
            <Link
              href="/dpa"
              className="hover:text-[var(--marketing-text)] transition-colors"
            >
              DPA
            </Link>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <span className="text-xs font-medium text-[var(--marketing-text)]">
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
