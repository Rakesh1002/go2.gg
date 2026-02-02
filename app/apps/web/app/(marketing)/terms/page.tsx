import type { Metadata } from "next";
import { getMetadata, siteConfig } from "@repo/config";
import { LegalPageTemplate, type LegalSection } from "@/components/marketing/legal-page-template";

export const metadata: Metadata = getMetadata({
  title: "Terms of Service",
  description: `Terms of Service for ${siteConfig.name} - Enterprise-grade URL shortening and link management platform.`,
});

const sections: LegalSection[] = [
  { id: "agreement", title: "1. Agreement to Terms", icon: "FileText" },
  { id: "eligibility", title: "2. Eligibility", icon: "User" },
  { id: "service", title: "3. Description of Service", icon: "Globe" },
  { id: "accounts", title: "4. User Accounts", icon: "User" },
  { id: "acceptable-use", title: "5. Acceptable Use", icon: "Shield" },
  { id: "api-terms", title: "6. API Terms of Use", icon: "Code" },
  { id: "payment", title: "7. Payment Terms", icon: "CreditCard" },
  { id: "sla", title: "8. Service Level Agreement", icon: "Clock" },
  { id: "data-ownership", title: "9. Data Ownership", icon: "FileCheck" },
  { id: "intellectual-property", title: "10. Intellectual Property", icon: "Scale" },
  { id: "dmca", title: "11. DMCA & Copyright", icon: "FileCheck" },
  { id: "indemnification", title: "12. Indemnification", icon: "Shield" },
  { id: "limitation", title: "13. Limitation of Liability", icon: "AlertTriangle" },
  { id: "disclaimer", title: "14. Disclaimer of Warranties", icon: "AlertTriangle" },
  { id: "termination", title: "15. Termination", icon: "AlertTriangle" },
  { id: "dispute", title: "16. Dispute Resolution", icon: "Gavel" },
  { id: "governing-law", title: "17. Governing Law", icon: "Scale" },
  { id: "export", title: "18. Export Compliance", icon: "Globe" },
  { id: "general", title: "19. General Provisions", icon: "FileText" },
  { id: "changes", title: "20. Changes to Terms", icon: "FileText" },
  { id: "contact", title: "21. Contact Us", icon: "Mail" },
];

export default function TermsPage() {
  const companyName = siteConfig.creator;
  const productName = siteConfig.name;
  const contactEmail = siteConfig.email;
  const lastUpdated = "January 15, 2026";
  const effectiveDate = "February 1, 2026";

  return (
    <LegalPageTemplate
      title="Terms of Service"
      lastUpdated={lastUpdated}
      effectiveDate={effectiveDate}
      sections={sections}
    >
      {/* Section 1: Agreement to Terms */}
      <section id="agreement">
        <h2>1. Agreement to Terms</h2>
        <p>
          Welcome to {productName}. These Terms of Service (&quot;Terms&quot;) constitute a legally
          binding agreement between you (&quot;you&quot;, &quot;your&quot;, or &quot;User&quot;) and{" "}
          {companyName}
          (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or &quot;Company&quot;) governing your
          access to and use of the {productName} platform, including our website at go2.gg, APIs,
          mobile applications, and all related services (collectively, the &quot;Service&quot;).
        </p>
        <p>
          <strong>
            By accessing or using the Service, you acknowledge that you have read, understood, and
            agree to be bound by these Terms.
          </strong>{" "}
          If you do not agree to these Terms, you must not access or use the Service.
        </p>
        <p>
          If you are using the Service on behalf of an organization, you represent and warrant that
          you have the authority to bind that organization to these Terms. In such cases,
          &quot;you&quot; and &quot;your&quot; will refer to that organization.
        </p>
      </section>

      {/* Section 2: Eligibility */}
      <section id="eligibility">
        <h2>2. Eligibility</h2>
        <p>To use the Service, you must:</p>
        <ul>
          <li>Be at least 18 years of age, or the age of legal majority in your jurisdiction</li>
          <li>Have the legal capacity to enter into a binding contract</li>
          <li>Not be prohibited from using the Service under applicable laws</li>
          <li>Not have been previously suspended or removed from the Service</li>
        </ul>
        <h3>2.1 Business Use</h3>
        <p>
          If you are using the Service for business purposes, you represent that you have the
          authority to bind your business entity to these Terms and that your business is legally
          formed and in good standing in its jurisdiction of formation.
        </p>
        <h3>2.2 Restricted Territories</h3>
        <p>
          The Service is not available to users located in countries subject to comprehensive U.S.
          sanctions, including but not limited to Cuba, Iran, North Korea, Syria, and the Crimea
          region. By using the Service, you represent that you are not located in any such
          territory.
        </p>
      </section>

      {/* Section 3: Description of Service */}
      <section id="service">
        <h2>3. Description of Service</h2>
        <p>
          {productName} provides an edge-native URL shortening and link management platform that
          enables users to:
        </p>
        <ul>
          <li>Create shortened URLs with custom slugs and branded domains</li>
          <li>Generate and manage QR codes linked to shortened URLs</li>
          <li>Track click analytics including geographic, device, and referrer data</li>
          <li>Manage custom domains for branded short links</li>
          <li>Access programmatic link management via our REST API</li>
          <li>Collaborate with team members on link management</li>
          <li>Integrate with third-party tools via webhooks and APIs</li>
        </ul>
        <h3>3.1 Service Modifications</h3>
        <p>
          We reserve the right to modify, update, or discontinue any aspect of the Service at any
          time, with or without notice. We will make reasonable efforts to notify users of material
          changes that may affect their use of the Service.
        </p>
        <h3>3.2 Beta Features</h3>
        <p>
          We may offer certain features in &quot;beta&quot; or &quot;preview&quot; status. Beta
          features are provided &quot;as is&quot; without warranty and may be modified or
          discontinued at any time. Your use of beta features is at your own risk.
        </p>
      </section>

      {/* Section 4: User Accounts */}
      <section id="accounts">
        <h2>4. User Accounts</h2>
        <h3>4.1 Account Creation</h3>
        <p>
          To access certain features of the Service, you must create an account. When creating an
          account, you agree to:
        </p>
        <ul>
          <li>Provide accurate, complete, and current registration information</li>
          <li>Maintain and promptly update your account information</li>
          <li>Keep your password secure and confidential</li>
          <li>Accept responsibility for all activities that occur under your account</li>
          <li>Notify us immediately of any unauthorized use of your account</li>
        </ul>
        <h3>4.2 Account Security</h3>
        <p>
          You are solely responsible for maintaining the security of your account credentials. We
          strongly recommend enabling two-factor authentication (2FA) for enhanced security. We will
          not be liable for any loss or damage arising from your failure to protect your account
          credentials.
        </p>
        <h3>4.3 Account Sharing</h3>
        <p>
          Your account is personal to you and may not be shared with or transferred to others unless
          you are on a team or enterprise plan that explicitly permits multiple users. Unauthorized
          account sharing may result in account termination.
        </p>
      </section>

      {/* Section 5: Acceptable Use */}
      <section id="acceptable-use">
        <h2>5. Acceptable Use</h2>
        <p>
          You agree to use the Service in compliance with all applicable laws and these Terms. For
          detailed prohibited uses, please refer to our{" "}
          <a href="/acceptable-use">Acceptable Use Policy</a>, which is incorporated into these
          Terms by reference.
        </p>
        <h3>5.1 Prohibited Content</h3>
        <p>You may not create shortened links that direct to content that:</p>
        <ul>
          <li>Contains malware, viruses, or other malicious code</li>
          <li>Facilitates phishing, fraud, or identity theft</li>
          <li>Promotes violence, terrorism, or hate speech</li>
          <li>Contains child sexual abuse material (CSAM)</li>
          <li>Infringes on intellectual property rights</li>
          <li>Violates any applicable law or regulation</li>
          <li>Distributes spam or unsolicited commercial messages</li>
        </ul>
        <h3>5.2 Prohibited Activities</h3>
        <p>You may not:</p>
        <ul>
          <li>Attempt to circumvent rate limits, usage restrictions, or security measures</li>
          <li>Use automated systems to access the Service in violation of our robots.txt</li>
          <li>Interfere with or disrupt the Service or servers connected to the Service</li>
          <li>Reverse engineer, decompile, or attempt to extract source code from the Service</li>
          <li>Resell or redistribute the Service without our written consent</li>
          <li>Use the Service to collect personal data without proper consent</li>
        </ul>
        <h3>5.3 Link Scanning</h3>
        <p>
          We employ automated systems to scan links for malicious content. Links that violate our
          policies may be disabled without notice. Repeated violations may result in account
          suspension or termination.
        </p>
      </section>

      {/* Section 6: API Terms */}
      <section id="api-terms">
        <h2>6. API Terms of Use</h2>
        <h3>6.1 API Access</h3>
        <p>
          Access to our API is granted subject to these Terms and any applicable API documentation.
          You must obtain API credentials (API keys) to access the API programmatically.
        </p>
        <h3>6.2 API Key Security</h3>
        <p>
          Your API keys are confidential and must be protected. You are responsible for all activity
          that occurs using your API keys. Do not share, publish, or embed API keys in client-side
          code or public repositories.
        </p>
        <h3>6.3 Rate Limits</h3>
        <p>
          API access is subject to rate limits based on your subscription plan. Current rate limits
          are documented in our API documentation. Exceeding rate limits may result in temporary
          access restrictions or additional charges.
        </p>
        <table>
          <thead>
            <tr>
              <th>Plan</th>
              <th>Requests/Minute</th>
              <th>Requests/Day</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Free</td>
              <td>60</td>
              <td>1,000</td>
            </tr>
            <tr>
              <td>Pro</td>
              <td>300</td>
              <td>50,000</td>
            </tr>
            <tr>
              <td>Business</td>
              <td>1,000</td>
              <td>500,000</td>
            </tr>
            <tr>
              <td>Enterprise</td>
              <td>Custom</td>
              <td>Custom</td>
            </tr>
          </tbody>
        </table>
        <h3>6.4 Fair Use</h3>
        <p>
          You agree to use the API in a manner consistent with its intended purpose. Excessive or
          abusive API usage may result in temporary or permanent restrictions on your access.
        </p>
        <h3>6.5 API Changes</h3>
        <p>
          We may modify the API at any time. We will provide reasonable notice of breaking changes
          and maintain deprecated endpoints for a reasonable transition period (typically 90 days)
          when feasible.
        </p>
      </section>

      {/* Section 7: Payment Terms */}
      <section id="payment">
        <h2>7. Payment Terms</h2>
        <h3>7.1 Subscription Plans</h3>
        <p>
          Certain features of the Service require a paid subscription. By subscribing to a paid
          plan, you agree to pay all applicable fees as described on our pricing page.
        </p>
        <h3>7.2 Billing</h3>
        <ul>
          <li>Subscriptions are billed in advance on a monthly or annual basis</li>
          <li>All fees are non-refundable except as required by law or as specified herein</li>
          <li>You authorize us to charge your payment method for all applicable fees</li>
          <li>
            Prices may change with 30 days&apos; notice; existing subscriptions will be honored
            until renewal
          </li>
        </ul>
        <h3>7.3 Automatic Renewal</h3>
        <p>
          Subscriptions automatically renew at the end of each billing period unless cancelled. You
          may cancel your subscription at any time through your account settings. Cancellation takes
          effect at the end of the current billing period.
        </p>
        <h3>7.4 Refunds</h3>
        <p>
          We offer a 14-day money-back guarantee for new subscriptions. After 14 days, fees are
          non-refundable. Refund requests should be submitted to {contactEmail}.
        </p>
        <h3>7.5 Taxes</h3>
        <p>
          All fees are exclusive of taxes. You are responsible for all applicable taxes, except for
          taxes on our income. We will collect applicable sales tax where required by law.
        </p>
      </section>

      {/* Section 8: Service Level Agreement */}
      <section id="sla">
        <h2>8. Service Level Agreement</h2>
        <h3>8.1 Uptime Commitment</h3>
        <p>
          For customers on Business and Enterprise plans, we commit to the following uptime
          guarantee for the core redirect service:
        </p>
        <table>
          <thead>
            <tr>
              <th>Plan</th>
              <th>Monthly Uptime</th>
              <th>Service Credit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Business</td>
              <td>99.9%</td>
              <td>10% per 0.1% below target</td>
            </tr>
            <tr>
              <td>Enterprise</td>
              <td>99.99%</td>
              <td>25% per 0.01% below target</td>
            </tr>
          </tbody>
        </table>
        <h3>8.2 Exclusions</h3>
        <p>The SLA does not apply to:</p>
        <ul>
          <li>Scheduled maintenance (with 24-hour notice)</li>
          <li>Factors outside our reasonable control (force majeure)</li>
          <li>Issues caused by your systems or third-party services</li>
          <li>Features in beta or preview status</li>
          <li>Free or Pro plan users</li>
        </ul>
        <h3>8.3 Claiming Credits</h3>
        <p>
          To claim service credits, you must submit a request to {contactEmail} within 30 days of
          the incident. Credits will be applied to future invoices and do not exceed one
          month&apos;s subscription fees.
        </p>
      </section>

      {/* Section 9: Data Ownership */}
      <section id="data-ownership">
        <h2>9. Data Ownership</h2>
        <h3>9.1 Your Data</h3>
        <p>
          You retain all ownership rights to data you upload or create through the Service
          (&quot;Your Data&quot;). This includes your links, custom domains, analytics data, and any
          other content you provide.
        </p>
        <h3>9.2 License Grant</h3>
        <p>
          By using the Service, you grant us a limited, non-exclusive, worldwide license to use,
          process, and display Your Data solely as necessary to provide and improve the Service.
          This license terminates when you delete Your Data or close your account.
        </p>
        <h3>9.3 Data Portability</h3>
        <p>
          You may export Your Data at any time through your account dashboard or via the API. Upon
          account termination, you may request a data export within 30 days.
        </p>
        <h3>9.4 Data Processing</h3>
        <p>
          For customers subject to GDPR or similar data protection laws, our{" "}
          <a href="/dpa">Data Processing Agreement</a> governs how we process personal data on your
          behalf.
        </p>
      </section>

      {/* Section 10: Intellectual Property */}
      <section id="intellectual-property">
        <h2>10. Intellectual Property</h2>
        <h3>10.1 Our Intellectual Property</h3>
        <p>
          The Service, including its design, features, code, documentation, trademarks, and content
          created by us, are owned by {companyName} and protected by intellectual property laws. You
          may not copy, modify, or create derivative works from any part of the Service without our
          written consent.
        </p>
        <h3>10.2 Trademarks</h3>
        <p>
          &quot;{productName}&quot;, our logo, and other marks are trademarks of {companyName}. You
          may not use our trademarks without prior written permission, except to accurately refer to
          our Service.
        </p>
        <h3>10.3 Feedback</h3>
        <p>
          If you provide feedback or suggestions about the Service, you grant us the right to use
          such feedback without restriction or compensation to you.
        </p>
      </section>

      {/* Section 11: DMCA */}
      <section id="dmca">
        <h2>11. DMCA &amp; Copyright</h2>
        <h3>11.1 Copyright Complaints</h3>
        <p>
          We respect intellectual property rights and respond to valid DMCA takedown notices. If you
          believe content accessible through our Service infringes your copyright, please submit a
          DMCA notice to our designated agent:
        </p>
        <p>
          <strong>DMCA Agent</strong>
          <br />
          {companyName}
          <br />
          Email: dmca@go2.gg
        </p>
        <h3>11.2 DMCA Notice Requirements</h3>
        <p>Your notice must include:</p>
        <ul>
          <li>Identification of the copyrighted work claimed to be infringed</li>
          <li>
            Identification of the infringing material with sufficient information to locate it
          </li>
          <li>Your contact information (address, phone number, email)</li>
          <li>A statement of good faith belief that the use is not authorized</li>
          <li>A statement under penalty of perjury that the information is accurate</li>
          <li>Your physical or electronic signature</li>
        </ul>
        <h3>11.3 Counter-Notices</h3>
        <p>
          If you believe content was removed in error, you may submit a counter-notice with the
          required information under 17 U.S.C. § 512(g). We will forward counter-notices to the
          original complainant.
        </p>
        <h3>11.4 Repeat Infringers</h3>
        <p>
          We maintain a policy of terminating accounts of repeat infringers in appropriate
          circumstances.
        </p>
      </section>

      {/* Section 12: Indemnification */}
      <section id="indemnification">
        <h2>12. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless {companyName}, its officers, directors,
          employees, agents, and affiliates from and against any claims, liabilities, damages,
          losses, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or
          relating to:
        </p>
        <ul>
          <li>Your use of the Service</li>
          <li>Your violation of these Terms</li>
          <li>Your violation of any third-party rights, including intellectual property rights</li>
          <li>Content you create, upload, or share through the Service</li>
          <li>Your violation of any applicable law or regulation</li>
        </ul>
        <p>
          We reserve the right to assume exclusive defense and control of any matter subject to
          indemnification, and you agree to cooperate with our defense.
        </p>
      </section>

      {/* Section 13: Limitation of Liability */}
      <section id="limitation">
        <h2>13. Limitation of Liability</h2>
        <h3>13.1 Exclusion of Damages</h3>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, {companyName.toUpperCase()} SHALL NOT BE LIABLE
          FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT
          NOT LIMITED TO LOSS OF PROFITS, DATA, BUSINESS, OR GOODWILL, REGARDLESS OF WHETHER WE WERE
          ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <h3>13.2 Liability Cap</h3>
        <p>
          OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE
          SERVICE SHALL NOT EXCEED THE GREATER OF: (A) THE AMOUNTS YOU PAID TO US IN THE TWELVE (12)
          MONTHS PRIOR TO THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS ($100).
        </p>
        <h3>13.3 Essential Purpose</h3>
        <p>
          The limitations in this section apply even if any limited remedy fails of its essential
          purpose.
        </p>
      </section>

      {/* Section 14: Disclaimer */}
      <section id="disclaimer">
        <h2>14. Disclaimer of Warranties</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
          OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
        </p>
        <p>We do not warrant that:</p>
        <ul>
          <li>The Service will be uninterrupted, secure, or error-free</li>
          <li>The results obtained from the Service will be accurate or reliable</li>
          <li>Any errors in the Service will be corrected</li>
          <li>The Service will meet your specific requirements</li>
        </ul>
        <p>
          Some jurisdictions do not allow the exclusion of certain warranties, so some of the above
          limitations may not apply to you.
        </p>
      </section>

      {/* Section 15: Termination */}
      <section id="termination">
        <h2>15. Termination</h2>
        <h3>15.1 Termination by You</h3>
        <p>
          You may terminate your account at any time through your account settings or by contacting
          us. Upon termination, you will lose access to the Service and Your Data after a 30-day
          grace period.
        </p>
        <h3>15.2 Termination by Us</h3>
        <p>
          We may suspend or terminate your account immediately, with or without notice, for any
          reason, including:
        </p>
        <ul>
          <li>Breach of these Terms or our Acceptable Use Policy</li>
          <li>Non-payment of fees</li>
          <li>Fraudulent or illegal activity</li>
          <li>Extended inactivity (accounts inactive for more than 12 months)</li>
          <li>Requests by law enforcement or government agencies</li>
        </ul>
        <h3>15.3 Effect of Termination</h3>
        <p>
          Upon termination, your right to use the Service immediately ceases. Sections that by their
          nature should survive termination will survive, including intellectual property,
          indemnification, limitation of liability, and dispute resolution.
        </p>
      </section>

      {/* Section 16: Dispute Resolution */}
      <section id="dispute">
        <h2>16. Dispute Resolution</h2>
        <h3>16.1 Informal Resolution</h3>
        <p>
          Before filing a formal claim, you agree to contact us at {contactEmail} to attempt to
          resolve any dispute informally. We will work with you in good faith to resolve the matter
          within 30 days.
        </p>
        <h3>16.2 Binding Arbitration</h3>
        <p>
          If informal resolution is unsuccessful, any dispute arising out of or relating to these
          Terms or the Service shall be resolved by binding arbitration administered by JAMS under
          its Streamlined Arbitration Rules. The arbitration will be conducted in English, and the
          arbitrator&apos;s decision will be final and binding.
        </p>
        <h3>16.3 Class Action Waiver</h3>
        <p>
          YOU AND {companyName.toUpperCase()} AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER
          ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY
          PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
        </p>
        <h3>16.4 Exceptions</h3>
        <p>
          Either party may seek injunctive relief in any court of competent jurisdiction for actual
          or threatened infringement of intellectual property rights.
        </p>
      </section>

      {/* Section 17: Governing Law */}
      <section id="governing-law">
        <h2>17. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the State of
          Delaware, United States, without regard to its conflict of law provisions. For matters not
          subject to arbitration, you consent to the exclusive jurisdiction of the state and federal
          courts located in Delaware.
        </p>
      </section>

      {/* Section 18: Export Compliance */}
      <section id="export">
        <h2>18. Export Compliance</h2>
        <p>
          You agree to comply with all applicable export and re-export control laws and regulations,
          including:
        </p>
        <ul>
          <li>The U.S. Export Administration Regulations (EAR)</li>
          <li>The Office of Foreign Assets Control (OFAC) sanctions programs</li>
          <li>Applicable export control laws in your jurisdiction</li>
        </ul>
        <p>
          You may not access or use the Service if you are located in, or a national or resident of,
          any country subject to comprehensive U.S. sanctions, or if you are on any U.S. government
          list of prohibited or restricted parties.
        </p>
      </section>

      {/* Section 19: General Provisions */}
      <section id="general">
        <h2>19. General Provisions</h2>
        <h3>19.1 Entire Agreement</h3>
        <p>
          These Terms, together with our Privacy Policy, Acceptable Use Policy, and DPA (where
          applicable), constitute the entire agreement between you and {companyName} regarding the
          Service.
        </p>
        <h3>19.2 Severability</h3>
        <p>
          If any provision of these Terms is held invalid or unenforceable, that provision will be
          modified to the minimum extent necessary, and the remaining provisions will remain in full
          force and effect.
        </p>
        <h3>19.3 Waiver</h3>
        <p>
          Our failure to enforce any right or provision of these Terms will not constitute a waiver
          of such right or provision.
        </p>
        <h3>19.4 Assignment</h3>
        <p>
          You may not assign or transfer these Terms without our prior written consent. We may
          assign these Terms without restriction.
        </p>
        <h3>19.5 Force Majeure</h3>
        <p>
          Neither party shall be liable for any failure or delay in performance due to causes beyond
          reasonable control, including natural disasters, war, terrorism, riots, pandemics,
          government actions, or internet disruptions.
        </p>
        <h3>19.6 No Third-Party Beneficiaries</h3>
        <p>
          These Terms do not create any third-party beneficiary rights, except as expressly provided
          herein.
        </p>
      </section>

      {/* Section 20: Changes to Terms */}
      <section id="changes">
        <h2>20. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of material
          changes by:
        </p>
        <ul>
          <li>Posting the updated Terms on this page with a new &quot;Last updated&quot; date</li>
          <li>Sending an email to your registered email address for material changes</li>
          <li>Displaying a prominent notice in the Service dashboard</li>
        </ul>
        <p>
          Your continued use of the Service after changes become effective constitutes your
          acceptance of the modified Terms. If you do not agree to the changes, you must stop using
          the Service.
        </p>
      </section>

      {/* Section 21: Contact */}
      <section id="contact">
        <h2>21. Contact Us</h2>
        <p>If you have any questions about these Terms, please contact us:</p>
        <ul>
          <li>
            <strong>Email:</strong> <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </li>
          <li>
            <strong>Legal inquiries:</strong> <a href="mailto:legal@go2.gg">legal@go2.gg</a>
          </li>
          <li>
            <strong>Address:</strong> {companyName}, Attn: Legal Department
          </li>
        </ul>
      </section>
    </LegalPageTemplate>
  );
}
