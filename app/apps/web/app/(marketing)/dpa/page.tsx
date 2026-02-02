import type { Metadata } from "next";
import { getMetadata, siteConfig } from "@repo/config";
import { LegalPageTemplate, type LegalSection } from "@/components/marketing/legal-page-template";

export const metadata: Metadata = getMetadata({
  title: "Data Processing Agreement",
  description: `Data Processing Agreement (DPA) for ${siteConfig.name} - GDPR-compliant terms for processing personal data on behalf of our customers.`,
});

const sections: LegalSection[] = [
  { id: "introduction", title: "1. Introduction", icon: "FileText" },
  { id: "definitions", title: "2. Definitions", icon: "BookOpen" },
  { id: "scope", title: "3. Scope & Purpose", icon: "Target" },
  { id: "instructions", title: "4. Processing Instructions", icon: "FileText" },
  { id: "security", title: "5. Security Measures", icon: "Shield" },
  { id: "subprocessors", title: "6. Sub-processors", icon: "Server" },
  { id: "data-subject", title: "7. Data Subject Rights", icon: "UserCheck" },
  { id: "breach", title: "8. Data Breach", icon: "AlertTriangle" },
  { id: "audit", title: "9. Audit Rights", icon: "Eye" },
  { id: "deletion", title: "10. Data Deletion", icon: "Trash2" },
  { id: "transfers", title: "11. International Transfers", icon: "Globe" },
  { id: "sccs", title: "12. Standard Contractual Clauses", icon: "FileCheck" },
  { id: "duration", title: "13. Duration & Termination", icon: "Clock" },
  { id: "liability", title: "14. Liability", icon: "Lock" },
  { id: "contact", title: "15. Contact", icon: "Mail" },
];

export default function DPAPage() {
  const companyName = siteConfig.creator;
  const productName = siteConfig.name;
  const lastUpdated = "January 15, 2026";
  const effectiveDate = "February 1, 2026";

  return (
    <LegalPageTemplate
      title="Data Processing Agreement"
      lastUpdated={lastUpdated}
      effectiveDate={effectiveDate}
      sections={sections}
    >
      {/* Section 1: Introduction */}
      <section id="introduction">
        <h2>1. Introduction</h2>
        <p>
          This Data Processing Agreement (&quot;DPA&quot;) forms part of the agreement between
          {companyName} (&quot;Processor&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;
          {productName}&quot;) and you (&quot;Controller&quot;, &quot;Customer&quot;, or
          &quot;you&quot;) for the provision of the {productName}
          services as described in our <a href="/terms">Terms of Service</a> (the
          &quot;Agreement&quot;).
        </p>
        <p>
          This DPA applies where and only to the extent that {productName} processes Personal Data
          on behalf of the Customer in the course of providing the Service, and such Personal Data
          is subject to Data Protection Laws.
        </p>
        <p>
          The purpose of this DPA is to ensure that the processing of Personal Data by
          {productName} on behalf of the Customer complies with applicable data protection
          regulations, including the General Data Protection Regulation (EU) 2016/679
          (&quot;GDPR&quot;), UK GDPR, and other applicable data protection laws.
        </p>
        <h3>1.1 How to Execute This DPA</h3>
        <p>
          By using {productName} services, you agree to the terms of this DPA. For enterprise
          customers requiring a signed copy, please contact{" "}
          <a href="mailto:legal@go2.gg">legal@go2.gg</a>.
        </p>
      </section>

      {/* Section 2: Definitions */}
      <section id="definitions">
        <h2>2. Definitions</h2>
        <p>In this DPA, the following terms shall have the meanings set out below:</p>
        <table>
          <thead>
            <tr>
              <th>Term</th>
              <th>Definition</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Controller</strong>
              </td>
              <td>
                The entity which determines the purposes and means of the processing of Personal
                Data (i.e., the Customer).
              </td>
            </tr>
            <tr>
              <td>
                <strong>Processor</strong>
              </td>
              <td>
                The entity which processes Personal Data on behalf of the Controller (i.e.,{" "}
                {productName}).
              </td>
            </tr>
            <tr>
              <td>
                <strong>Sub-processor</strong>
              </td>
              <td>
                Any third party engaged by the Processor to process Personal Data on behalf of the
                Controller.
              </td>
            </tr>
            <tr>
              <td>
                <strong>Personal Data</strong>
              </td>
              <td>
                Any information relating to an identified or identifiable natural person (&quot;Data
                Subject&quot;).
              </td>
            </tr>
            <tr>
              <td>
                <strong>Data Subject</strong>
              </td>
              <td>
                An identified or identifiable natural person whose Personal Data is processed.
              </td>
            </tr>
            <tr>
              <td>
                <strong>Processing</strong>
              </td>
              <td>
                Any operation performed on Personal Data, including collection, storage, use,
                disclosure, or deletion.
              </td>
            </tr>
            <tr>
              <td>
                <strong>Personal Data Breach</strong>
              </td>
              <td>
                A breach of security leading to accidental or unlawful destruction, loss,
                alteration, unauthorized disclosure of, or access to Personal Data.
              </td>
            </tr>
            <tr>
              <td>
                <strong>Data Protection Laws</strong>
              </td>
              <td>GDPR, UK GDPR, CCPA, and any other applicable data protection legislation.</td>
            </tr>
            <tr>
              <td>
                <strong>SCCs</strong>
              </td>
              <td>
                Standard Contractual Clauses approved by the European Commission for international
                data transfers.
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Section 3: Scope & Purpose */}
      <section id="scope">
        <h2>3. Scope &amp; Purpose of Processing</h2>
        <h3>3.1 Scope</h3>
        <p>
          This DPA applies to the processing of Personal Data that the Customer submits to{" "}
          {productName} or that is collected through the Customer&apos;s use of the Service,
          including:
        </p>
        <ul>
          <li>Click data from end users who interact with Customer&apos;s shortened links</li>
          <li>Analytics data associated with link interactions</li>
          <li>Any Personal Data contained in custom link parameters or metadata</li>
        </ul>

        <h3>3.2 Categories of Data Subjects</h3>
        <ul>
          <li>End users who click on Customer&apos;s shortened links</li>
          <li>Customer&apos;s employees who use the Service</li>
          <li>Any other individuals whose data the Customer submits to the Service</li>
        </ul>

        <h3>3.3 Types of Personal Data</h3>
        <table>
          <thead>
            <tr>
              <th>Data Type</th>
              <th>Examples</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Technical identifiers</strong>
              </td>
              <td>IP addresses (anonymized after processing), device fingerprints</td>
            </tr>
            <tr>
              <td>
                <strong>Location data</strong>
              </td>
              <td>Approximate geographic location (country, region, city) derived from IP</td>
            </tr>
            <tr>
              <td>
                <strong>Device information</strong>
              </td>
              <td>Browser type, operating system, device type</td>
            </tr>
            <tr>
              <td>
                <strong>Referrer data</strong>
              </td>
              <td>Source URL, UTM parameters</td>
            </tr>
          </tbody>
        </table>

        <h3>3.4 Purpose of Processing</h3>
        <p>{productName} processes Personal Data solely for the following purposes:</p>
        <ul>
          <li>Providing link redirection services</li>
          <li>Generating analytics and reports for the Customer</li>
          <li>Detecting and preventing abuse and fraud</li>
          <li>Maintaining the security and integrity of the Service</li>
        </ul>

        <h3>3.5 Duration of Processing</h3>
        <p>
          Processing will continue for the duration of the Agreement, plus any retention period
          required by law or as specified in the data retention schedule.
        </p>
      </section>

      {/* Section 4: Processing Instructions */}
      <section id="instructions">
        <h2>4. Processing Instructions</h2>
        <h3>4.1 Controller&apos;s Instructions</h3>
        <p>
          {productName} shall process Personal Data only on documented instructions from the
          Controller, unless required by law. The Controller&apos;s instructions are documented in:
        </p>
        <ul>
          <li>This DPA</li>
          <li>The Terms of Service</li>
          <li>Customer&apos;s configuration of the Service</li>
          <li>Any additional written instructions from the Controller</li>
        </ul>

        <h3>4.2 Compliance with Instructions</h3>
        <p>
          {productName} will immediately inform the Controller if, in its opinion, an instruction
          infringes Data Protection Laws. {productName} may suspend the relevant processing until
          the Controller confirms or modifies the instruction.
        </p>

        <h3>4.3 Confidentiality</h3>
        <p>
          {productName} ensures that persons authorized to process Personal Data have committed to
          confidentiality or are under an appropriate statutory obligation of confidentiality.
        </p>

        <h3>4.4 Processing Limitations</h3>
        <p>{productName} shall not:</p>
        <ul>
          <li>Process Personal Data for any purpose other than as instructed by the Controller</li>
          <li>Sell Personal Data to third parties</li>
          <li>Share Personal Data for cross-context behavioral advertising</li>
          <li>
            Combine Personal Data from the Controller with data from other sources for
            Processor&apos;s own purposes
          </li>
        </ul>
      </section>

      {/* Section 5: Security Measures */}
      <section id="security">
        <h2>5. Security Measures</h2>
        <p>
          {productName} implements and maintains appropriate technical and organizational measures
          to protect Personal Data against unauthorized or unlawful processing, accidental loss,
          destruction, or damage.
        </p>

        <h3>5.1 Technical Measures</h3>
        <table>
          <thead>
            <tr>
              <th>Measure</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Encryption in transit</strong>
              </td>
              <td>TLS 1.3 for all data transmission</td>
            </tr>
            <tr>
              <td>
                <strong>Encryption at rest</strong>
              </td>
              <td>AES-256 encryption for stored data</td>
            </tr>
            <tr>
              <td>
                <strong>Access controls</strong>
              </td>
              <td>Role-based access control (RBAC), principle of least privilege</td>
            </tr>
            <tr>
              <td>
                <strong>Authentication</strong>
              </td>
              <td>Strong password policies, multi-factor authentication</td>
            </tr>
            <tr>
              <td>
                <strong>Network security</strong>
              </td>
              <td>Firewalls, DDoS protection, intrusion detection</td>
            </tr>
            <tr>
              <td>
                <strong>Monitoring</strong>
              </td>
              <td>24/7 security monitoring, logging, and alerting</td>
            </tr>
          </tbody>
        </table>

        <h3>5.2 Organizational Measures</h3>
        <ul>
          <li>Security awareness training for all employees</li>
          <li>Background checks for personnel with access to Personal Data</li>
          <li>Documented security policies and procedures</li>
          <li>Incident response plan</li>
          <li>Regular security assessments and penetration testing</li>
          <li>Vendor security reviews for sub-processors</li>
        </ul>

        <h3>5.3 Certifications</h3>
        <p>Our infrastructure providers maintain the following certifications:</p>
        <ul>
          <li>SOC 2 Type II</li>
          <li>ISO 27001</li>
          <li>PCI DSS (for payment processing)</li>
        </ul>
      </section>

      {/* Section 6: Sub-processors */}
      <section id="subprocessors">
        <h2>6. Sub-processors</h2>
        <h3>6.1 Authorization</h3>
        <p>
          The Controller provides general authorization for {productName} to engage sub-processors
          to assist in providing the Service. A current list of sub-processors is available in our{" "}
          <a href="/privacy">Privacy Policy</a>.
        </p>

        <h3>6.2 Sub-processor Requirements</h3>
        <p>Before engaging any sub-processor, {productName} shall:</p>
        <ul>
          <li>Conduct due diligence on the sub-processor&apos;s security practices</li>
          <li>
            Enter into a written agreement with data protection obligations equivalent to this DPA
          </li>
          <li>Remain fully liable for the sub-processor&apos;s performance</li>
        </ul>

        <h3>6.3 Current Sub-processors</h3>
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
              <td>Cloudflare, Inc.</td>
              <td>Infrastructure, CDN, security</td>
              <td>Global (Edge)</td>
            </tr>
            <tr>
              <td>Stripe, Inc.</td>
              <td>Payment processing</td>
              <td>United States</td>
            </tr>
            <tr>
              <td>PostHog Inc.</td>
              <td>Product analytics</td>
              <td>European Union</td>
            </tr>
          </tbody>
        </table>

        <h3>6.4 Changes to Sub-processors</h3>
        <p>
          {productName} will notify the Controller of any intended changes to sub-processors at
          least 30 days in advance by:
        </p>
        <ul>
          <li>Email notification to the account owner</li>
          <li>Updating the sub-processor list in our Privacy Policy</li>
        </ul>
        <p>
          The Controller may object to a new sub-processor within 14 days of notification. If the
          objection is not resolved, the Controller may terminate the Agreement.
        </p>
      </section>

      {/* Section 7: Data Subject Rights */}
      <section id="data-subject">
        <h2>7. Data Subject Rights</h2>
        <h3>7.1 Assistance with Requests</h3>
        <p>
          {productName} will assist the Controller in responding to Data Subject requests to
          exercise their rights under Data Protection Laws, including:
        </p>
        <ul>
          <li>Right of access</li>
          <li>Right to rectification</li>
          <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
          <li>Right to restriction of processing</li>
          <li>Right to data portability</li>
          <li>Right to object</li>
        </ul>

        <h3>7.2 Notification</h3>
        <p>
          If {productName} receives a request directly from a Data Subject regarding the
          Controller&apos;s data, {productName} will promptly notify the Controller and will not
          respond to the request without the Controller&apos;s authorization, unless required by
          law.
        </p>

        <h3>7.3 Self-Service Tools</h3>
        <p>The Controller can use the {productName} dashboard and API to:</p>
        <ul>
          <li>Export analytics data</li>
          <li>Delete specific links and associated data</li>
          <li>Access and modify account information</li>
        </ul>
      </section>

      {/* Section 8: Data Breach */}
      <section id="breach">
        <h2>8. Personal Data Breach</h2>
        <h3>8.1 Notification</h3>
        <p>
          {productName} will notify the Controller without undue delay (and in any event within 72
          hours) after becoming aware of a Personal Data Breach affecting the Controller&apos;s
          data.
        </p>

        <h3>8.2 Breach Notification Contents</h3>
        <p>The notification will include, to the extent known:</p>
        <ul>
          <li>
            Nature of the breach, including categories and approximate number of Data Subjects
            affected
          </li>
          <li>Name and contact details of the point of contact</li>
          <li>Likely consequences of the breach</li>
          <li>Measures taken or proposed to address the breach and mitigate effects</li>
        </ul>

        <h3>8.3 Cooperation</h3>
        <p>
          {productName} will cooperate with the Controller and take reasonable steps to assist in
          investigating, mitigating, and remediating the breach.
        </p>

        <h3>8.4 Exclusions</h3>
        <p>
          Unsuccessful attacks (e.g., blocked intrusion attempts, pings, port scans) that do not
          result in unauthorized access to Personal Data do not constitute a Personal Data Breach.
        </p>
      </section>

      {/* Section 9: Audit Rights */}
      <section id="audit">
        <h2>9. Audit Rights</h2>
        <h3>9.1 Information</h3>
        <p>
          {productName} will make available to the Controller all information necessary to
          demonstrate compliance with this DPA, including:
        </p>
        <ul>
          <li>Security certifications and audit reports (SOC 2, etc.)</li>
          <li>Penetration test summaries</li>
          <li>Data protection impact assessments (where relevant)</li>
        </ul>

        <h3>9.2 Audits</h3>
        <p>
          The Controller (or an independent auditor appointed by the Controller) may conduct audits
          to verify {productName}&apos;s compliance with this DPA, subject to:
        </p>
        <ul>
          <li>At least 30 days&apos; prior written notice</li>
          <li>Reasonable scope and timing to minimize disruption</li>
          <li>Confidentiality obligations regarding any information obtained</li>
          <li>The Controller bearing the costs of the audit</li>
          <li>
            A maximum of one audit per 12-month period (unless required by a supervisory authority)
          </li>
        </ul>

        <h3>9.3 Third-Party Audits</h3>
        <p>
          {productName} may satisfy audit requests by providing existing third-party audit reports
          (e.g., SOC 2) that cover the relevant controls.
        </p>
      </section>

      {/* Section 10: Data Deletion */}
      <section id="deletion">
        <h2>10. Data Deletion &amp; Return</h2>
        <h3>10.1 Upon Termination</h3>
        <p>
          Upon termination of the Agreement or at the Controller&apos;s request, {productName}
          will:
        </p>
        <ul>
          <li>
            Return all Personal Data to the Controller in a commonly used format (upon request)
          </li>
          <li>Delete all Personal Data within 30 days of termination</li>
          <li>Provide written certification of deletion upon request</li>
        </ul>

        <h3>10.2 Exceptions</h3>
        <p>
          {productName} may retain Personal Data to the extent required by applicable law, provided
          that:
        </p>
        <ul>
          <li>Processing is limited to compliance with legal obligations</li>
          <li>Appropriate confidentiality measures remain in place</li>
          <li>The Controller is informed of the legal requirement</li>
        </ul>

        <h3>10.3 Sub-processor Deletion</h3>
        <p>
          {productName} will ensure that sub-processors delete Personal Data in accordance with the
          same requirements.
        </p>
      </section>

      {/* Section 11: International Transfers */}
      <section id="transfers">
        <h2>11. International Data Transfers</h2>
        <h3>11.1 Transfer Mechanisms</h3>
        <p>
          When transferring Personal Data to countries outside the EEA that do not have an adequacy
          decision, {productName} implements appropriate safeguards including:
        </p>
        <ul>
          <li>
            <strong>Standard Contractual Clauses (SCCs)</strong> - EU Commission approved clauses
          </li>
          <li>
            <strong>UK IDTA</strong> - International Data Transfer Agreement for UK transfers
          </li>
          <li>
            <strong>Supplementary measures</strong> - Technical measures such as encryption
          </li>
        </ul>

        <h3>11.2 Transfer Impact Assessments</h3>
        <p>
          {productName} has conducted transfer impact assessments for data transfers to our
          sub-processors and can provide these assessments to Customers upon request.
        </p>

        <h3>11.3 Government Access Requests</h3>
        <p>
          If {productName} receives a legally binding request from a government authority for access
          to Personal Data, {productName} will:
        </p>
        <ul>
          <li>Challenge the request if there are reasonable grounds</li>
          <li>Notify the Controller before disclosure (unless prohibited by law)</li>
          <li>Limit disclosure to the minimum data required</li>
        </ul>
      </section>

      {/* Section 12: Standard Contractual Clauses */}
      <section id="sccs">
        <h2>12. Standard Contractual Clauses</h2>
        <h3>12.1 Incorporation</h3>
        <p>
          For transfers of Personal Data from the EEA to countries without an adequacy decision, the
          Standard Contractual Clauses (Commission Implementing Decision (EU) 2021/914) are
          incorporated by reference:
        </p>
        <ul>
          <li>
            <strong>Module Two</strong>: Controller to Processor transfers
          </li>
          <li>
            <strong>Clause 7</strong>: Optional docking clause included
          </li>
          <li>
            <strong>Clause 9</strong>: General authorization for sub-processors
          </li>
          <li>
            <strong>Clause 17</strong>: Governed by the laws of Ireland
          </li>
          <li>
            <strong>Clause 18</strong>: Disputes resolved by courts of Ireland
          </li>
        </ul>

        <h3>12.2 UK Transfers</h3>
        <p>
          For transfers from the UK, the UK International Data Transfer Addendum (IDTA) to the EU
          SCCs is incorporated as applicable.
        </p>

        <h3>12.3 Swiss Transfers</h3>
        <p>
          For transfers from Switzerland, the SCCs apply with the modifications specified by the
          Swiss Federal Data Protection and Information Commissioner.
        </p>

        <h3>12.4 Conflict</h3>
        <p>
          In case of conflict between this DPA and the SCCs, the SCCs shall prevail to the extent of
          the conflict.
        </p>
      </section>

      {/* Section 13: Duration & Termination */}
      <section id="duration">
        <h2>13. Duration &amp; Termination</h2>
        <h3>13.1 Term</h3>
        <p>
          This DPA shall remain in effect for the duration of the Agreement between
          {productName} and the Controller.
        </p>

        <h3>13.2 Survival</h3>
        <p>The following provisions shall survive termination:</p>
        <ul>
          <li>Data deletion and return obligations (Section 10)</li>
          <li>Confidentiality obligations</li>
          <li>Liability provisions</li>
        </ul>

        <h3>13.3 Updates</h3>
        <p>
          {productName} may update this DPA from time to time to reflect changes in legal
          requirements or our processing activities. Material changes will be notified at least 30
          days in advance.
        </p>
      </section>

      {/* Section 14: Liability */}
      <section id="liability">
        <h2>14. Liability</h2>
        <h3>14.1 General</h3>
        <p>
          Each party&apos;s liability arising out of or related to this DPA shall be subject to the
          limitations of liability set forth in the Agreement.
        </p>

        <h3>14.2 Indemnification</h3>
        <p>
          Each party shall indemnify the other for any fines or penalties imposed by a supervisory
          authority to the extent directly arising from that party&apos;s violation of Data
          Protection Laws.
        </p>

        <h3>14.3 Sub-processor Liability</h3>
        <p>
          {productName} remains fully liable to the Controller for the performance of sub-processor
          obligations under this DPA.
        </p>
      </section>

      {/* Section 15: Contact */}
      <section id="contact">
        <h2>15. Contact Information</h2>
        <p>
          For questions about this Data Processing Agreement or to exercise any rights under this
          DPA:
        </p>
        <ul>
          <li>
            <strong>General DPA inquiries:</strong> <a href="mailto:legal@go2.gg">legal@go2.gg</a>
          </li>
          <li>
            <strong>Data Protection Officer:</strong> <a href="mailto:dpo@go2.gg">dpo@go2.gg</a>
          </li>
          <li>
            <strong>Security concerns:</strong> <a href="mailto:security@go2.gg">security@go2.gg</a>
          </li>
          <li>
            <strong>For a signed copy:</strong> <a href="mailto:legal@go2.gg">legal@go2.gg</a>
          </li>
        </ul>
        <p>Enterprise customers may request customized DPA terms by contacting our legal team.</p>
      </section>
    </LegalPageTemplate>
  );
}
