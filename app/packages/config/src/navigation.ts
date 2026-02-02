/**
 * Navigation Configuration
 *
 * Header and footer navigation items for Go2.
 */

export interface NavItem {
  /** Display title */
  title: string;
  /** Link href */
  href: string;
  /** Open in new tab */
  external?: boolean;
  /** Show badge (e.g., "New") */
  badge?: string;
  /** Child items for dropdown */
  children?: NavItem[];
}

export interface FooterSection {
  /** Section title */
  title: string;
  /** Links in this section */
  links: NavItem[];
}

/**
 * Header navigation items
 */
export const headerNav: NavItem[] = [
  { title: "Features", href: "/features" },
  { title: "Pricing", href: "/pricing" },
  { title: "Docs", href: "/docs" },
  {
    title: "Resources",
    href: "#",
    children: [
      { title: "Help Center", href: "/help" },
      { title: "Contact", href: "/contact" },
      { title: "API Reference", href: "/docs/api/overview" },
      { title: "UTM Builder", href: "/tools/utm-builder", badge: "New" },
    ],
  },
  { title: "About", href: "/about" },
];

/**
 * Footer navigation sections
 */
export const footerNav: FooterSection[] = [
  {
    title: "Product",
    links: [
      { title: "Link Shortener", href: "/features/links" },
      { title: "QR Codes", href: "/features/qr-codes" },
      { title: "Custom Domains", href: "/features/domains" },
      { title: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { title: "Documentation", href: "/docs" },
      { title: "API Reference", href: "/docs/api/overview" },
      { title: "Help Center", href: "/help" },
      { title: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { title: "About", href: "/about" },
      { title: "Contact", href: "/contact" },
      { title: "Twitter", href: "https://x.com/buildwithrakesh", external: true },
      { title: "GitHub", href: "https://github.com/rakesh1002/go2.gg", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { title: "Terms of Service", href: "/terms" },
      { title: "Privacy Policy", href: "/privacy" },
      { title: "Cookie Policy", href: "/cookies" },
      { title: "Acceptable Use", href: "/acceptable-use" },
      { title: "DPA", href: "/dpa" },
    ],
  },
];

/**
 * Dashboard navigation (when logged in)
 */
export const dashboardNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Links", href: "/dashboard/links" },
  { title: "Domains", href: "/dashboard/domains" },
  { title: "Analytics", href: "/dashboard/analytics" },
  { title: "API Keys", href: "/dashboard/api-keys" },
  { title: "Team", href: "/dashboard/team" },
  { title: "Billing", href: "/dashboard/billing" },
  { title: "Settings", href: "/dashboard/settings" },
];

/**
 * Mobile menu items (combines header nav with additional items)
 */
export const mobileNav: NavItem[] = [
  { title: "Features", href: "/features" },
  { title: "Pricing", href: "/#pricing" },
  { title: "Docs", href: "/docs" },
  { title: "About", href: "/about" },
  { title: "Help Center", href: "/help" },
  { title: "Contact", href: "/contact" },
];

/**
 * CTA buttons for header
 */
export const headerCTA = {
  signIn: { title: "Sign In", href: "/login" },
  getStarted: { title: "Start free", href: "/register" },
};
