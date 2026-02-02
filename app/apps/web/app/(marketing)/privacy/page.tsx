import type { Metadata } from "next";
import { getMetadata, siteConfig } from "@repo/config";
import { LegalPageTemplate, type LegalSection } from "@/components/marketing/legal-page-template";

export const metadata: Metadata = getMetadata({
  title: "Privacy Policy",
  description: `Privacy Policy for ${siteConfig.name} - Learn how we collect, use, and protect your personal data. GDPR and CCPA compliant.`,
});

const sections: LegalSection[] = [
  { id: "introduction", title: "1. Introduction", icon: "FileText" },
  { id: "controller", title: "2. Data Controller", icon: "Building" },
  { id: "data-collected", title: "3. Information We Collect", icon: "Database" },
  { id: "lawful-basis", title: "4. Lawful Basis (GDPR)", icon: "Scale" },
  { id: "how-we-use", title: "5. How We Use Your Information", icon: "FileText" },
  { id: "sharing", title: "6. Sharing of Information", icon: "Share2" },
  { id: "subprocessors", title: "7. Sub-processors", icon: "Server" },
  { id: "retention", title: "8. Data Retention", icon: "Clock" },
  { id: "security", title: "9. Data Security", icon: "Lock" },
  { id: "your-rights", title: "10. Your Privacy Rights", icon: "UserCheck" },
  { id: "gdpr", title: "11. GDPR Rights (EEA)", icon: "Shield" },
  { id: "ccpa", title: "12. California Privacy Rights", icon: "Shield" },
  { id: "international", title: "13. International Transfers", icon: "Globe" },
  { id: "cookies", title: "14. Cookies & Tracking", icon: "Cookie" },
  { id: "automated", title: "15. Automated Decision-Making", icon: "Server" },
  { id: "children", title: "16. Children's Privacy", icon: "Baby" },
  { id: "changes", title: "17. Changes to This Policy", icon: "FileText" },
  { id: "contact", title: "18. Contact Us", icon: "Mail" },
];

export default function PrivacyPage() {
  const companyName = siteConfig.creator;
  const productName = siteConfig.name;
  const contactEmail = siteConfig.email;
  const lastUpdated = "January 15, 2026";
  const effectiveDate = "February 1, 2026";

  return (
    <LegalPageTemplate
      title="Privacy Policy"
      lastUpdated={lastUpdated}
      effectiveDate={effectiveDate}
      sections={sections}
    >
      {/* Section 1: Introduction */}
      <section id="introduction">
        <h2>1. Introduction</h2>
        <p>
          {companyName} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or the
          &quot;Company&quot;) is committed to protecting your privacy. This Privacy Policy explains
          how we collect, use, disclose, and safeguard your personal information when you use{" "}
          {productName} and our related services, websites, and applications (collectively, the
          &quot;Service&quot;).
        </p>
        <p>
          This Privacy Policy applies to all users of our Service, including visitors, registered
          users, and customers. By accessing or using the Service, you acknowledge that you have
          read, understood, and agree to the practices described in this Privacy Policy.
        </p>
        <p>
          We process personal data in compliance with applicable data protection laws, including the
          General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and
          other applicable privacy regulations.
        </p>
      </section>

      {/* Section 2: Data Controller */}
      <section id="controller">
        <h2>2. Data Controller</h2>
        <p>
          For the purposes of data protection laws, {companyName} is the data controller for
          personal data collected through the Service for our own purposes (such as account
          management and billing).
        </p>
        <p>
          When you use our Service to create shortened links and collect analytics data, you (or
          your organization) are the data controller for any personal data of your end users, and we
          act as a data processor on your behalf. This processing is governed by our{" "}
          <a href="/dpa">Data Processing Agreement</a>.
        </p>
        <h3>Contact Information</h3>
        <ul>
          <li>
            <strong>Company:</strong> {companyName}
          </li>
          <li>
            <strong>Email:</strong> privacy@go2.gg
          </li>
          <li>
            <strong>Data Protection Officer:</strong> dpo@go2.gg
          </li>
        </ul>
      </section>

      {/* Section 3: Information We Collect */}
      <section id="data-collected">
        <h2>3. Information We Collect</h2>

        <h3>3.1 Information You Provide Directly</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Examples</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Account Information</strong>
              </td>
              <td>Name, email address, password</td>
              <td>Account creation, authentication</td>
            </tr>
            <tr>
              <td>
                <strong>Profile Information</strong>
              </td>
              <td>Profile picture, company name, job title</td>
              <td>Personalization, collaboration</td>
            </tr>
            <tr>
              <td>
                <strong>Billing Information</strong>
              </td>
              <td>Payment method, billing address</td>
              <td>Payment processing, invoicing</td>
            </tr>
            <tr>
              <td>
                <strong>Content</strong>
              </td>
              <td>Links created, custom domains, tags</td>
              <td>Service functionality</td>
            </tr>
            <tr>
              <td>
                <strong>Communications</strong>
              </td>
              <td>Support requests, feedback, survey responses</td>
              <td>Customer support, service improvement</td>
            </tr>
          </tbody>
        </table>

        <h3>3.2 Information Collected Automatically</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Examples</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Device Information</strong>
              </td>
              <td>Browser type, operating system, device type</td>
              <td>Service optimization, security</td>
            </tr>
            <tr>
              <td>
                <strong>Usage Data</strong>
              </td>
              <td>Pages visited, features used, actions taken</td>
              <td>Analytics, service improvement</td>
            </tr>
            <tr>
              <td>
                <strong>Log Data</strong>
              </td>
              <td>IP address, access times, referring URLs</td>
              <td>Security, troubleshooting</td>
            </tr>
            <tr>
              <td>
                <strong>Link Analytics</strong>
              </td>
              <td>Click counts, geographic data, referrer data</td>
              <td>Analytics feature for users</td>
            </tr>
          </tbody>
        </table>

        <h3>3.3 Information from Third Parties</h3>
        <ul>
          <li>
            <strong>OAuth Providers:</strong> If you sign in with Google or GitHub, we receive your
            name and email from those services
          </li>
          <li>
            <strong>Payment Processors:</strong> Stripe provides us with payment confirmation and
            limited card details (last 4 digits)
          </li>
          <li>
            <strong>Referrals:</strong> If someone invites you, we receive your email address from
            them
          </li>
        </ul>
      </section>

      {/* Section 4: Lawful Basis */}
      <section id="lawful-basis">
        <h2>4. Lawful Basis for Processing (GDPR)</h2>
        <p>
          Under the General Data Protection Regulation (GDPR), we process your personal data based
          on the following lawful bases:
        </p>
        <table>
          <thead>
            <tr>
              <th>Lawful Basis</th>
              <th>Processing Activities</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Contract Performance</strong> (Art. 6(1)(b))
              </td>
              <td>
                <ul>
                  <li>Creating and managing your account</li>
                  <li>Providing the link shortening service</li>
                  <li>Processing payments</li>
                  <li>Customer support</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Legitimate Interests</strong> (Art. 6(1)(f))
              </td>
              <td>
                <ul>
                  <li>Service analytics and improvement</li>
                  <li>Fraud prevention and security</li>
                  <li>Marketing to existing customers</li>
                  <li>Enforcing our terms of service</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Consent</strong> (Art. 6(1)(a))
              </td>
              <td>
                <ul>
                  <li>Marketing communications (where required)</li>
                  <li>Non-essential cookies and tracking</li>
                  <li>Participation in surveys and research</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td>
                <strong>Legal Obligation</strong> (Art. 6(1)(c))
              </td>
              <td>
                <ul>
                  <li>Tax and accounting records</li>
                  <li>Responding to legal requests</li>
                  <li>Compliance with data protection laws</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Section 5: How We Use Your Information */}
      <section id="how-we-use">
        <h2>5. How We Use Your Information</h2>
        <p>We use the information we collect for the following purposes:</p>

        <h3>5.1 Providing the Service</h3>
        <ul>
          <li>Creating and managing your account</li>
          <li>Processing link creation, customization, and analytics</li>
          <li>Enabling custom domain configuration</li>
          <li>Generating QR codes</li>
          <li>Providing API access</li>
        </ul>

        <h3>5.2 Improving the Service</h3>
        <ul>
          <li>Analyzing usage patterns to improve features</li>
          <li>Conducting A/B testing</li>
          <li>Developing new features based on user needs</li>
          <li>Optimizing performance and reliability</li>
        </ul>

        <h3>5.3 Communication</h3>
        <ul>
          <li>Sending transactional emails (account verification, password reset)</li>
          <li>Providing customer support</li>
          <li>Sending service announcements and updates</li>
          <li>Marketing communications (with consent where required)</li>
        </ul>

        <h3>5.4 Security and Compliance</h3>
        <ul>
          <li>Detecting and preventing fraud and abuse</li>
          <li>Enforcing our Terms of Service and Acceptable Use Policy</li>
          <li>Responding to legal requests</li>
          <li>Complying with applicable laws</li>
        </ul>
      </section>

      {/* Section 6: Sharing */}
      <section id="sharing">
        <h2>6. Sharing of Information</h2>
        <p>
          <strong>We do not sell your personal information.</strong> We may share your information
          in the following circumstances:
        </p>

        <h3>6.1 Service Providers</h3>
        <p>
          We share information with third-party service providers who help us operate our Service.
          These providers are contractually obligated to protect your data and may only use it for
          the purposes we specify.
        </p>

        <h3>6.2 Legal Requirements</h3>
        <p>
          We may disclose your information if required by law or if we believe disclosure is
          necessary to:
        </p>
        <ul>
          <li>Comply with legal obligations or valid legal process</li>
          <li>Protect the rights, property, or safety of {companyName}, our users, or others</li>
          <li>Enforce our Terms of Service or investigate violations</li>
          <li>Respond to government requests</li>
        </ul>

        <h3>6.3 Business Transfers</h3>
        <p>
          In the event of a merger, acquisition, or sale of assets, your information may be
          transferred to the acquiring entity. We will notify you before your information is
          transferred and becomes subject to a different privacy policy.
        </p>

        <h3>6.4 With Your Consent</h3>
        <p>
          We may share your information with third parties when you give us explicit consent to do
          so.
        </p>

        <h3>6.5 Aggregated Data</h3>
        <p>
          We may share aggregated, anonymized data that cannot reasonably be used to identify you
          (e.g., industry benchmarks, statistical reports).
        </p>
      </section>

      {/* Section 7: Sub-processors */}
      <section id="subprocessors">
        <h2>7. Sub-processors</h2>
        <p>
          We use the following third-party sub-processors to help deliver our Service. Each
          sub-processor has committed to appropriate data protection measures.
        </p>
        <table>
          <thead>
            <tr>
              <th>Sub-processor</th>
              <th>Purpose</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Cloudflare</strong>
              </td>
              <td>Infrastructure, CDN, edge computing, DDoS protection</td>
              <td>Global (Edge)</td>
            </tr>
            <tr>
              <td>
                <strong>Supabase</strong>
              </td>
              <td>Database, authentication, user management</td>
              <td>United States</td>
            </tr>
            <tr>
              <td>
                <strong>Stripe</strong>
              </td>
              <td>Payment processing, subscription management</td>
              <td>United States</td>
            </tr>
            <tr>
              <td>
                <strong>PostHog</strong>
              </td>
              <td>Product analytics (self-hosted option available)</td>
              <td>European Union</td>
            </tr>
            <tr>
              <td>
                <strong>Resend</strong>
              </td>
              <td>Transactional email delivery</td>
              <td>United States</td>
            </tr>
          </tbody>
        </table>
        <p>
          For enterprise customers requiring EU data residency, please{" "}
          <a href="/contact">contact us</a> to discuss available options.
        </p>
        <p>
          We maintain an up-to-date list of sub-processors and will notify customers of any changes
          in accordance with our <a href="/dpa">Data Processing Agreement</a>.
        </p>
      </section>

      {/* Section 8: Retention */}
      <section id="retention">
        <h2>8. Data Retention</h2>
        <p>
          We retain your personal data only for as long as necessary to fulfill the purposes for
          which it was collected, unless a longer retention period is required by law.
        </p>
        <table>
          <thead>
            <tr>
              <th>Data Category</th>
              <th>Retention Period</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Account Data</strong>
              </td>
              <td>Duration of account + 30 days</td>
              <td>Service provision, recovery period</td>
            </tr>
            <tr>
              <td>
                <strong>Billing Records</strong>
              </td>
              <td>7 years after transaction</td>
              <td>Tax and legal requirements</td>
            </tr>
            <tr>
              <td>
                <strong>Link Analytics</strong>
              </td>
              <td>Per plan (90 days - unlimited)</td>
              <td>Feature provision</td>
            </tr>
            <tr>
              <td>
                <strong>Server Logs</strong>
              </td>
              <td>90 days</td>
              <td>Security, troubleshooting</td>
            </tr>
            <tr>
              <td>
                <strong>Support Tickets</strong>
              </td>
              <td>3 years after resolution</td>
              <td>Service quality, legal</td>
            </tr>
            <tr>
              <td>
                <strong>Marketing Preferences</strong>
              </td>
              <td>Until withdrawal of consent</td>
              <td>Compliance with opt-out</td>
            </tr>
          </tbody>
        </table>
        <p>
          When you delete your account, we will delete or anonymize your personal data within 30
          days, except where we are required to retain it for legal or legitimate business purposes.
        </p>
      </section>

      {/* Section 9: Security */}
      <section id="security">
        <h2>9. Data Security</h2>
        <p>
          We implement comprehensive technical and organizational measures to protect your personal
          data against unauthorized access, alteration, disclosure, or destruction.
        </p>
        <h3>9.1 Technical Measures</h3>
        <ul>
          <li>
            <strong>Encryption:</strong> TLS 1.3 for data in transit, AES-256 for data at rest
          </li>
          <li>
            <strong>Access Controls:</strong> Role-based access, principle of least privilege
          </li>
          <li>
            <strong>Authentication:</strong> Secure password hashing (bcrypt), 2FA support
          </li>
          <li>
            <strong>Infrastructure:</strong> SOC2 Type II compliant hosting providers
          </li>
          <li>
            <strong>Monitoring:</strong> 24/7 security monitoring and alerting
          </li>
        </ul>
        <h3>9.2 Organizational Measures</h3>
        <ul>
          <li>Regular security training for all employees</li>
          <li>Background checks for employees with data access</li>
          <li>Incident response procedures</li>
          <li>Regular security assessments and penetration testing</li>
          <li>Vendor security reviews</li>
        </ul>
        <h3>9.3 Breach Notification</h3>
        <p>
          In the event of a data breach affecting your personal data, we will notify you and
          relevant authorities as required by applicable law, typically within 72 hours of becoming
          aware of the breach.
        </p>
      </section>

      {/* Section 10: Your Rights */}
      <section id="your-rights">
        <h2>10. Your Privacy Rights</h2>
        <p>
          Depending on your location and applicable laws, you may have the following rights
          regarding your personal data:
        </p>
        <ul>
          <li>
            <strong>Access:</strong> Request a copy of the personal data we hold about you
          </li>
          <li>
            <strong>Rectification:</strong> Request correction of inaccurate or incomplete data
          </li>
          <li>
            <strong>Erasure:</strong> Request deletion of your personal data (&quot;right to be
            forgotten&quot;)
          </li>
          <li>
            <strong>Portability:</strong> Receive your data in a structured, machine-readable format
          </li>
          <li>
            <strong>Restriction:</strong> Request restriction of processing in certain circumstances
          </li>
          <li>
            <strong>Objection:</strong> Object to processing based on legitimate interests
          </li>
          <li>
            <strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent
          </li>
        </ul>
        <p>
          To exercise any of these rights, please contact us at{" "}
          <a href="mailto:privacy@go2.gg">privacy@go2.gg</a>. We will respond to your request within
          30 days (or as required by applicable law).
        </p>
        <p>You may also export your data directly from your account dashboard at any time.</p>
      </section>

      {/* Section 11: GDPR Rights */}
      <section id="gdpr">
        <h2>11. GDPR Rights (EEA Residents)</h2>
        <p>
          If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland,
          you have additional rights under the General Data Protection Regulation:
        </p>
        <h3>11.1 Legal Basis</h3>
        <p>
          We only process your personal data when we have a valid legal basis, as described in
          Section 4 above.
        </p>
        <h3>11.2 Data Protection Authority</h3>
        <p>
          You have the right to lodge a complaint with your local supervisory authority if you
          believe we have violated your data protection rights. A list of EU supervisory authorities
          is available at{" "}
          <a
            href="https://edpb.europa.eu/about-edpb/board/members_en"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://edpb.europa.eu/about-edpb/board/members_en
          </a>
        </p>
        <h3>11.3 Data Protection Officer</h3>
        <p>
          Our Data Protection Officer can be reached at <a href="mailto:dpo@go2.gg">dpo@go2.gg</a>.
        </p>
        <h3>11.4 Data Processing Agreement</h3>
        <p>
          For customers who use our Service to process personal data of individuals in the EEA, our{" "}
          <a href="/dpa">Data Processing Agreement</a> incorporates the Standard Contractual Clauses
          approved by the European Commission.
        </p>
      </section>

      {/* Section 12: CCPA Rights */}
      <section id="ccpa">
        <h2>12. California Privacy Rights (CCPA/CPRA)</h2>
        <p>
          If you are a California resident, you have specific rights under the California Consumer
          Privacy Act (CCPA) and California Privacy Rights Act (CPRA):
        </p>
        <h3>12.1 Right to Know</h3>
        <p>
          You have the right to request information about the categories and specific pieces of
          personal information we have collected, the sources, the purposes, and the categories of
          third parties with whom we share it.
        </p>
        <h3>12.2 Right to Delete</h3>
        <p>
          You have the right to request deletion of your personal information, subject to certain
          exceptions (e.g., legal obligations, ongoing transactions).
        </p>
        <h3>12.3 Right to Correct</h3>
        <p>You have the right to request correction of inaccurate personal information.</p>
        <h3>12.4 Right to Opt-Out of Sale/Sharing</h3>
        <p>
          <strong>We do not sell your personal information.</strong> We do not share your personal
          information for cross-context behavioral advertising purposes.
        </p>
        <h3>12.5 Non-Discrimination</h3>
        <p>
          We will not discriminate against you for exercising any of your privacy rights. We will
          not deny you goods or services, charge different prices, or provide a different quality of
          service.
        </p>
        <h3>12.6 Exercising Your Rights</h3>
        <p>To submit a verifiable consumer request, you may:</p>
        <ul>
          <li>
            Email us at <a href="mailto:privacy@go2.gg">privacy@go2.gg</a>
          </li>
          <li>Use the data export feature in your account settings</li>
        </ul>
        <p>
          We will verify your identity before processing your request. An authorized agent may
          submit a request on your behalf with written authorization.
        </p>
        <h3>12.7 Categories of Personal Information</h3>
        <p>
          In the preceding 12 months, we have collected the following categories of personal
          information:
        </p>
        <ul>
          <li>Identifiers (name, email, IP address)</li>
          <li>Commercial information (subscription history, payment records)</li>
          <li>Internet activity (browsing history within our Service, interactions)</li>
          <li>Geolocation data (approximate location based on IP)</li>
          <li>Professional information (company name, job title)</li>
        </ul>
      </section>

      {/* Section 13: International Transfers */}
      <section id="international">
        <h2>13. International Data Transfers</h2>
        <p>
          Your personal data may be transferred to and processed in countries other than your
          country of residence. These countries may have different data protection laws.
        </p>
        <h3>13.1 Transfer Mechanisms</h3>
        <p>When we transfer data outside the EEA, we ensure appropriate safeguards through:</p>
        <ul>
          <li>
            <strong>Standard Contractual Clauses (SCCs):</strong> EU Commission-approved contractual
            clauses
          </li>
          <li>
            <strong>Adequacy Decisions:</strong> Transfers to countries deemed adequate by the EU
            Commission
          </li>
          <li>
            <strong>Binding Corporate Rules:</strong> For transfers within our corporate group
            (where applicable)
          </li>
        </ul>
        <h3>13.2 Data Localization</h3>
        <p>
          For Enterprise customers with specific data residency requirements, we offer EU-only data
          processing options. Please <a href="/contact">contact us</a> for details.
        </p>
      </section>

      {/* Section 14: Cookies */}
      <section id="cookies">
        <h2>14. Cookies &amp; Tracking Technologies</h2>
        <p>
          We use cookies and similar technologies to provide, protect, and improve our Service. For
          detailed information about the cookies we use and how to manage them, please see our{" "}
          <a href="/cookies">Cookie Policy</a>.
        </p>
        <h3>14.1 Types of Cookies</h3>
        <ul>
          <li>
            <strong>Essential Cookies:</strong> Required for the Service to function
          </li>
          <li>
            <strong>Analytics Cookies:</strong> Help us understand how you use the Service
          </li>
          <li>
            <strong>Preference Cookies:</strong> Remember your settings and preferences
          </li>
        </ul>
        <h3>14.2 Do Not Track</h3>
        <p>
          Our Service does not currently respond to &quot;Do Not Track&quot; browser signals.
          However, you can control cookies through your browser settings and our cookie consent
          mechanism.
        </p>
      </section>

      {/* Section 15: Automated Decision-Making */}
      <section id="automated">
        <h2>15. Automated Decision-Making</h2>
        <p>We use automated systems to help detect and prevent abuse of our Service, including:</p>
        <ul>
          <li>
            <strong>Spam Detection:</strong> Automated scanning of links for malicious content
          </li>
          <li>
            <strong>Fraud Prevention:</strong> Pattern analysis to detect fraudulent accounts
          </li>
          <li>
            <strong>Rate Limiting:</strong> Automatic enforcement of usage limits
          </li>
        </ul>
        <p>
          These automated processes may result in temporary restrictions on your account. If you
          believe a decision was made in error, you can contact us at {contactEmail} for human
          review.
        </p>
        <p>
          We do not use automated decision-making for decisions that produce legal effects or
          similarly significantly affect you, without human oversight.
        </p>
      </section>

      {/* Section 16: Children's Privacy */}
      <section id="children">
        <h2>16. Children&apos;s Privacy</h2>
        <p>
          Our Service is not directed to children under the age of 16 (or 13 in the United States).
          We do not knowingly collect personal information from children.
        </p>
        <p>
          If we become aware that we have collected personal information from a child without
          parental consent, we will take steps to delete that information promptly. If you believe
          we have collected information from a child, please contact us at{" "}
          <a href="mailto:privacy@go2.gg">privacy@go2.gg</a>.
        </p>
      </section>

      {/* Section 17: Changes */}
      <section id="changes">
        <h2>17. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or
          applicable laws. When we make changes:
        </p>
        <ul>
          <li>We will update the &quot;Last updated&quot; date at the top of this page</li>
          <li>
            For material changes, we will notify you by email or prominent notice in the Service
          </li>
          <li>We will provide at least 30 days&apos; notice before material changes take effect</li>
        </ul>
        <p>
          We encourage you to review this Privacy Policy periodically. Your continued use of the
          Service after changes become effective constitutes your acceptance of the revised policy.
        </p>
      </section>

      {/* Section 18: Contact */}
      <section id="contact">
        <h2>18. Contact Us</h2>
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our data
          practices, please contact us:
        </p>
        <ul>
          <li>
            <strong>General inquiries:</strong>{" "}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </li>
          <li>
            <strong>Privacy-specific inquiries:</strong>{" "}
            <a href="mailto:privacy@go2.gg">privacy@go2.gg</a>
          </li>
          <li>
            <strong>Data Protection Officer:</strong> <a href="mailto:dpo@go2.gg">dpo@go2.gg</a>
          </li>
          <li>
            <strong>Mailing Address:</strong> {companyName}, Attn: Privacy Team
          </li>
        </ul>
        <p>We aim to respond to all privacy-related inquiries within 30 days.</p>
      </section>
    </LegalPageTemplate>
  );
}
