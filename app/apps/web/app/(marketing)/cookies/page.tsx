import type { Metadata } from "next";
import { getMetadata, siteConfig } from "@repo/config";
import { LegalPageTemplate, type LegalSection } from "@/components/marketing/legal-page-template";

export const metadata: Metadata = getMetadata({
  title: "Cookie Policy",
  description: `Cookie Policy for ${siteConfig.name} - Learn about cookies we use, how to manage them, and your choices.`,
});

const sections: LegalSection[] = [
  { id: "what-are-cookies", title: "1. What Are Cookies", icon: "Info" },
  { id: "how-we-use", title: "2. How We Use Cookies", icon: "Cookie" },
  { id: "types", title: "3. Types of Cookies", icon: "List" },
  { id: "cookie-table", title: "4. Cookies We Use", icon: "List" },
  { id: "third-party", title: "5. Third-Party Cookies", icon: "Globe" },
  { id: "consent", title: "6. Cookie Consent", icon: "ToggleRight" },
  { id: "manage-cookies", title: "7. Managing Cookies", icon: "Settings" },
  { id: "browser-settings", title: "8. Browser Instructions", icon: "Monitor" },
  { id: "do-not-track", title: "9. Do Not Track", icon: "Shield" },
  { id: "retention", title: "10. Cookie Retention", icon: "Clock" },
  { id: "changes", title: "11. Changes to This Policy", icon: "FileText" },
  { id: "contact", title: "12. Contact Us", icon: "Mail" },
];

export default function CookiesPage() {
  const productName = siteConfig.name;
  const contactEmail = siteConfig.email;
  const lastUpdated = "January 15, 2026";
  const effectiveDate = "February 1, 2026";

  return (
    <LegalPageTemplate
      title="Cookie Policy"
      lastUpdated={lastUpdated}
      effectiveDate={effectiveDate}
      sections={sections}
    >
      {/* Section 1: What Are Cookies */}
      <section id="what-are-cookies">
        <h2>1. What Are Cookies</h2>
        <p>
          Cookies are small text files that are stored on your device (computer, tablet, or mobile
          phone) when you visit a website. They are widely used to make websites work more
          efficiently, provide a better user experience, and give website owners useful information
          about how their site is being used.
        </p>
        <p>Cookies can be &quot;persistent&quot; or &quot;session&quot; cookies:</p>
        <ul>
          <li>
            <strong>Session cookies</strong> are temporary and are deleted when you close your
            browser. They help us recognize you as you navigate between pages.
          </li>
          <li>
            <strong>Persistent cookies</strong> remain on your device for a set period or until you
            delete them. They help us remember your preferences for future visits.
          </li>
        </ul>
        <p>Cookies can also be categorized by who sets them:</p>
        <ul>
          <li>
            <strong>First-party cookies</strong> are set by {productName} directly.
          </li>
          <li>
            <strong>Third-party cookies</strong> are set by other services we use (like analytics or
            payment processors).
          </li>
        </ul>
      </section>

      {/* Section 2: How We Use Cookies */}
      <section id="how-we-use">
        <h2>2. How We Use Cookies</h2>
        <p>
          We use cookies and similar technologies to provide, protect, and improve the
          {productName} Service. Specifically, we use cookies to:
        </p>
        <ul>
          <li>
            <strong>Authenticate users:</strong> Keep you signed in as you navigate between pages
          </li>
          <li>
            <strong>Remember preferences:</strong> Save your theme choice, language, and other
            settings
          </li>
          <li>
            <strong>Ensure security:</strong> Detect fraudulent activity and protect your account
          </li>
          <li>
            <strong>Analyze usage:</strong> Understand how people use our Service to improve it
          </li>
          <li>
            <strong>Process payments:</strong> Enable secure payment processing through Stripe
          </li>
          <li>
            <strong>Measure performance:</strong> Monitor page load times and service reliability
          </li>
        </ul>
      </section>

      {/* Section 3: Types of Cookies */}
      <section id="types">
        <h2>3. Types of Cookies</h2>
        <p>We categorize the cookies we use into the following groups:</p>

        <h3>3.1 Essential Cookies (Strictly Necessary)</h3>
        <p>
          These cookies are necessary for the Service to function and cannot be disabled. They
          handle critical functions like authentication, security, and payment processing. Without
          these cookies, we cannot provide the Service.
        </p>
        <p>
          <strong>Legal basis:</strong> These cookies do not require consent as they are strictly
          necessary for the service you have requested.
        </p>

        <h3>3.2 Analytics Cookies (Performance)</h3>
        <p>
          These cookies help us understand how visitors interact with our Service by collecting and
          reporting information anonymously. They help us improve the user experience by identifying
          popular features and potential issues.
        </p>
        <p>
          <strong>Legal basis:</strong> Consent (where required) or legitimate interests.
        </p>

        <h3>3.3 Preference Cookies (Functionality)</h3>
        <p>
          These cookies remember your settings and preferences (like your preferred theme or
          language) to provide a more personalized experience.
        </p>
        <p>
          <strong>Legal basis:</strong> Legitimate interests or consent.
        </p>
      </section>

      {/* Section 4: Cookie Table */}
      <section id="cookie-table">
        <h2>4. Cookies We Use</h2>
        <p>Below is a detailed list of cookies used on {productName}:</p>

        <h3>4.1 Essential Cookies</h3>
        <table>
          <thead>
            <tr>
              <th>Cookie Name</th>
              <th>Provider</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>sb-access-token</code>
              </td>
              <td>Supabase</td>
              <td>Authentication token for logged-in users</td>
              <td>1 hour</td>
            </tr>
            <tr>
              <td>
                <code>sb-refresh-token</code>
              </td>
              <td>Supabase</td>
              <td>Token to refresh authentication session</td>
              <td>7 days</td>
            </tr>
            <tr>
              <td>
                <code>__cf_bm</code>
              </td>
              <td>Cloudflare</td>
              <td>Bot detection and security protection</td>
              <td>30 minutes</td>
            </tr>
            <tr>
              <td>
                <code>cf_clearance</code>
              </td>
              <td>Cloudflare</td>
              <td>Security challenge clearance</td>
              <td>1 year</td>
            </tr>
            <tr>
              <td>
                <code>__stripe_mid</code>
              </td>
              <td>Stripe</td>
              <td>Fraud prevention for payment processing</td>
              <td>1 year</td>
            </tr>
            <tr>
              <td>
                <code>__stripe_sid</code>
              </td>
              <td>Stripe</td>
              <td>Session ID for payment processing</td>
              <td>Session</td>
            </tr>
            <tr>
              <td>
                <code>csrf_token</code>
              </td>
              <td>{productName}</td>
              <td>Cross-site request forgery protection</td>
              <td>Session</td>
            </tr>
          </tbody>
        </table>

        <h3>4.2 Analytics Cookies</h3>
        <table>
          <thead>
            <tr>
              <th>Cookie Name</th>
              <th>Provider</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>ph_phc_*</code>
              </td>
              <td>PostHog</td>
              <td>Anonymous product analytics and feature usage</td>
              <td>1 year</td>
            </tr>
            <tr>
              <td>
                <code>ph_*_posthog</code>
              </td>
              <td>PostHog</td>
              <td>Session replay and user journey tracking</td>
              <td>1 year</td>
            </tr>
          </tbody>
        </table>

        <h3>4.3 Preference Cookies</h3>
        <table>
          <thead>
            <tr>
              <th>Cookie Name</th>
              <th>Provider</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>theme</code>
              </td>
              <td>{productName}</td>
              <td>Remember light/dark theme preference</td>
              <td>1 year</td>
            </tr>
            <tr>
              <td>
                <code>sidebar-collapsed</code>
              </td>
              <td>{productName}</td>
              <td>Remember sidebar state preference</td>
              <td>1 year</td>
            </tr>
            <tr>
              <td>
                <code>cookie-consent</code>
              </td>
              <td>{productName}</td>
              <td>Remember your cookie consent choices</td>
              <td>1 year</td>
            </tr>
            <tr>
              <td>
                <code>locale</code>
              </td>
              <td>{productName}</td>
              <td>Remember language preference</td>
              <td>1 year</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Section 5: Third-Party Cookies */}
      <section id="third-party">
        <h2>5. Third-Party Cookies</h2>
        <p>
          Some cookies on our Service are set by third-party services that we use. These services
          have their own privacy policies governing the use of cookies:
        </p>

        <h3>5.1 Cloudflare</h3>
        <p>
          We use Cloudflare for infrastructure, security, and performance. Cloudflare may set
          cookies for bot detection, DDoS protection, and security verification.
        </p>
        <ul>
          <li>
            <strong>Privacy Policy:</strong>{" "}
            <a href="https://www.cloudflare.com/privacy/" target="_blank" rel="noopener noreferrer">
              cloudflare.com/privacy
            </a>
          </li>
          <li>
            <strong>Cookie Information:</strong>{" "}
            <a
              href="https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cloudflare Cookies
            </a>
          </li>
        </ul>

        <h3>5.2 Stripe</h3>
        <p>
          We use Stripe for payment processing. Stripe sets cookies for fraud detection and to
          process payments securely.
        </p>
        <ul>
          <li>
            <strong>Privacy Policy:</strong>{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
              stripe.com/privacy
            </a>
          </li>
          <li>
            <strong>Cookie Information:</strong>{" "}
            <a href="https://stripe.com/cookie-settings" target="_blank" rel="noopener noreferrer">
              Stripe Cookies
            </a>
          </li>
        </ul>

        <h3>5.3 Supabase</h3>
        <p>
          We use Supabase for authentication and database services. Supabase sets cookies to manage
          user sessions and authentication.
        </p>
        <ul>
          <li>
            <strong>Privacy Policy:</strong>{" "}
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
              supabase.com/privacy
            </a>
          </li>
        </ul>

        <h3>5.4 PostHog</h3>
        <p>
          We use PostHog for product analytics to understand how users interact with our Service.
          PostHog collects anonymized usage data.
        </p>
        <ul>
          <li>
            <strong>Privacy Policy:</strong>{" "}
            <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer">
              posthog.com/privacy
            </a>
          </li>
          <li>
            <strong>Note:</strong> PostHog is privacy-focused and GDPR compliant. Data is processed
            in the EU.
          </li>
        </ul>
      </section>

      {/* Section 6: Cookie Consent */}
      <section id="consent">
        <h2>6. Cookie Consent</h2>
        <p>
          When you first visit {productName}, you will see a cookie consent banner that allows you
          to accept or customize your cookie preferences.
        </p>
        <h3>6.1 Your Choices</h3>
        <ul>
          <li>
            <strong>Accept All:</strong> Enables all cookies including analytics
          </li>
          <li>
            <strong>Essential Only:</strong> Only enables cookies required for the Service to
            function
          </li>
          <li>
            <strong>Customize:</strong> Choose which categories of cookies to enable
          </li>
        </ul>
        <h3>6.2 Changing Your Preferences</h3>
        <p>You can change your cookie preferences at any time by:</p>
        <ul>
          <li>Clicking &quot;Cookie Settings&quot; in the footer of any page</li>
          <li>Clearing your cookies and revisiting the site to see the consent banner again</li>
          <li>Using your browser settings to manage cookies (see Section 8)</li>
        </ul>
        <h3>6.3 Consent Record</h3>
        <p>
          We keep a record of your consent choice to demonstrate compliance with privacy
          regulations. This record includes the date and time of consent and the choices made.
        </p>
      </section>

      {/* Section 7: Managing Cookies */}
      <section id="manage-cookies">
        <h2>7. Managing Cookies</h2>
        <p>You have several options for controlling and managing cookies:</p>
        <h3>7.1 Our Cookie Settings</h3>
        <p>
          Use our cookie consent tool to manage your preferences for analytics and preference
          cookies. Essential cookies cannot be disabled as they are required for the Service to
          function.
        </p>
        <h3>7.2 Browser Settings</h3>
        <p>Most browsers allow you to control cookies through their settings. You can:</p>
        <ul>
          <li>Block all cookies</li>
          <li>Block only third-party cookies</li>
          <li>Delete existing cookies</li>
          <li>Receive notifications before a cookie is set</li>
        </ul>
        <p>
          <strong>Note:</strong> Blocking essential cookies will prevent you from using
          {productName} properly. You may not be able to sign in or use core features.
        </p>
        <h3>7.3 Opt-Out Tools</h3>
        <p>Some third-party services provide opt-out mechanisms:</p>
        <ul>
          <li>
            <strong>PostHog:</strong> You can opt out via our cookie settings or by enabling
            &quot;Do Not Track&quot;
          </li>
          <li>
            <strong>Stripe:</strong> Essential for payment processing; cannot be disabled when
            making payments
          </li>
        </ul>
      </section>

      {/* Section 8: Browser Instructions */}
      <section id="browser-settings">
        <h2>8. Browser-Specific Instructions</h2>
        <p>Here&apos;s how to manage cookies in popular browsers:</p>

        <h3>8.1 Google Chrome</h3>
        <ol>
          <li>Click the three-dot menu icon in the top right</li>
          <li>Select &quot;Settings&quot;</li>
          <li>Click &quot;Privacy and security&quot; in the left sidebar</li>
          <li>Click &quot;Cookies and other site data&quot;</li>
          <li>Choose your preferred settings</li>
        </ol>
        <p>
          <a
            href="https://support.google.com/chrome/answer/95647"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chrome cookie documentation
          </a>
        </p>

        <h3>8.2 Mozilla Firefox</h3>
        <ol>
          <li>Click the hamburger menu icon in the top right</li>
          <li>Select &quot;Settings&quot;</li>
          <li>Click &quot;Privacy &amp; Security&quot; in the left sidebar</li>
          <li>Under &quot;Cookies and Site Data&quot;, manage your settings</li>
        </ol>
        <p>
          <a
            href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
            target="_blank"
            rel="noopener noreferrer"
          >
            Firefox cookie documentation
          </a>
        </p>

        <h3>8.3 Safari (macOS)</h3>
        <ol>
          <li>Click &quot;Safari&quot; in the menu bar</li>
          <li>Select &quot;Settings&quot; (or &quot;Preferences&quot;)</li>
          <li>Click the &quot;Privacy&quot; tab</li>
          <li>Manage your cookie settings under &quot;Website tracking&quot;</li>
        </ol>
        <p>
          <a
            href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
            target="_blank"
            rel="noopener noreferrer"
          >
            Safari cookie documentation
          </a>
        </p>

        <h3>8.4 Microsoft Edge</h3>
        <ol>
          <li>Click the three-dot menu icon in the top right</li>
          <li>Select &quot;Settings&quot;</li>
          <li>Click &quot;Cookies and site permissions&quot;</li>
          <li>Click &quot;Manage and delete cookies and site data&quot;</li>
        </ol>
        <p>
          <a
            href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
            target="_blank"
            rel="noopener noreferrer"
          >
            Edge cookie documentation
          </a>
        </p>

        <h3>8.5 Safari (iOS)</h3>
        <ol>
          <li>Open the Settings app</li>
          <li>Scroll down and tap &quot;Safari&quot;</li>
          <li>Under &quot;Privacy &amp; Security&quot;, manage cookie settings</li>
          <li>Toggle &quot;Block All Cookies&quot; on or off</li>
        </ol>

        <h3>8.6 Chrome (Android)</h3>
        <ol>
          <li>Open Chrome and tap the three-dot menu</li>
          <li>Tap &quot;Settings&quot; &gt; &quot;Site settings&quot; &gt; &quot;Cookies&quot;</li>
          <li>Choose your preferred settings</li>
        </ol>
      </section>

      {/* Section 9: Do Not Track */}
      <section id="do-not-track">
        <h2>9. Do Not Track Signals</h2>
        <p>
          &quot;Do Not Track&quot; (DNT) is a privacy setting in most browsers that sends a signal
          to websites requesting not to be tracked.
        </p>
        <h3>9.1 Our Response to DNT</h3>
        <p>
          Currently, there is no universal standard for how websites should respond to DNT signals.{" "}
          {productName} does not currently change its behavior in response to DNT signals.
        </p>
        <p>
          However, we provide you with meaningful control over analytics cookies through our cookie
          consent mechanism, and we respect your choices made there.
        </p>
        <h3>9.2 Global Privacy Control (GPC)</h3>
        <p>
          We recognize and honor the Global Privacy Control (GPC) signal. When we detect a GPC
          signal, we will treat it as an opt-out of the sale or sharing of personal information
          under applicable state privacy laws.
        </p>
      </section>

      {/* Section 10: Cookie Retention */}
      <section id="retention">
        <h2>10. Cookie Retention Periods</h2>
        <p>The retention period for cookies varies based on their purpose:</p>
        <table>
          <thead>
            <tr>
              <th>Cookie Type</th>
              <th>Typical Duration</th>
              <th>Why This Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Session cookies</strong>
              </td>
              <td>End of browser session</td>
              <td>Only needed for current visit</td>
            </tr>
            <tr>
              <td>
                <strong>Authentication</strong>
              </td>
              <td>1 hour - 7 days</td>
              <td>Balance between security and convenience</td>
            </tr>
            <tr>
              <td>
                <strong>Security (CSRF)</strong>
              </td>
              <td>Session</td>
              <td>Only needed for current session</td>
            </tr>
            <tr>
              <td>
                <strong>Preferences</strong>
              </td>
              <td>1 year</td>
              <td>Remember settings between visits</td>
            </tr>
            <tr>
              <td>
                <strong>Analytics</strong>
              </td>
              <td>1 year</td>
              <td>Understand usage patterns over time</td>
            </tr>
            <tr>
              <td>
                <strong>Consent record</strong>
              </td>
              <td>1 year</td>
              <td>Comply with consent requirements</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Section 11: Changes */}
      <section id="changes">
        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes in our practices,
          technology, or legal requirements. When we make changes:
        </p>
        <ul>
          <li>We will update the &quot;Last updated&quot; date at the top of this page</li>
          <li>For significant changes, we may show a new cookie consent banner</li>
          <li>We encourage you to review this policy periodically</li>
        </ul>
      </section>

      {/* Section 12: Contact */}
      <section id="contact">
        <h2>12. Contact Us</h2>
        <p>
          If you have questions about our use of cookies or this Cookie Policy, please contact us:
        </p>
        <ul>
          <li>
            <strong>Email:</strong> <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </li>
          <li>
            <strong>Privacy inquiries:</strong> <a href="mailto:privacy@go2.gg">privacy@go2.gg</a>
          </li>
        </ul>
        <p>
          For information about how we handle your personal data more broadly, please see our{" "}
          <a href="/privacy">Privacy Policy</a>.
        </p>
      </section>
    </LegalPageTemplate>
  );
}
