/**
 * V1 API Router
 *
 * Contains all versioned API routes:
 * - /users - User profile management
 * - /organizations - Organization CRUD
 * - /files - File upload/download (R2)
 * - /stats - Dashboard statistics
 * - /links - URL shortener link management
 * - /domains - Custom domain management
 * - /usage - Organization usage stats and limits
 * - /slugs - AI-powered slug suggestions
 * - /bulk - Bulk operations (CSV import/export)
 * - /conversions - Conversion tracking and goals
 * - /migrations - Competitor migration tools
 */

import { Hono } from "hono";
import type { Env } from "../../bindings.js";
import { abTests } from "./ab-tests.js";
import { abuse } from "./abuse.js";
import { affiliatesRouter } from "./affiliates.js";
import { agentAttribution } from "./agent-attribution.js";
import { agentRuns } from "./agent-runs.js";
import { aiRouter } from "./ai.js";
import { analyticsRouter } from "./analytics.js";
import { apiKeys } from "./api-keys.js";
import { audit } from "./audit.js";
import { bulk } from "./bulk.js";
import { claimLinks } from "./claim-links.js";
import { contact } from "./contact.js";
import { conversions, publicConversions } from "./conversions.js";
import { domains } from "./domains.js";
import { files } from "./files.js";
import { folders } from "./folders.js";
import { galleriesRouter } from "./galleries.js";
import { links } from "./links.js";
import { log } from "./log.js";
import { migrations } from "./migrations.js";
import { newsletter } from "./newsletter.js";
import { organizations } from "./organizations.js";
import { publicGalleries } from "./public-galleries.js";
import { publicLinks } from "./public-links.js";
import { qrRouter } from "./qr.js";
import { slugs } from "./slugs.js";
import { sso } from "./sso.js";
import { stats } from "./stats.js";
import { support } from "./support.js";
import { usage } from "./usage.js";
import { users } from "./users.js";
import { waitlist } from "./waitlist.js";
import { webhooksRouter } from "./webhooks.js";
import { whiteLabel } from "./white-label.js";

const v1 = new Hono<{ Bindings: Env }>();

// Mount route groups
// Note: /auth and /billing are mounted at the app level, not here
v1.route("/users", users);
v1.route("/organizations", organizations);
v1.route("/files", files);
v1.route("/api-keys", apiKeys);
v1.route("/stats", stats);
v1.route("/links", links);
v1.route("/domains", domains);
v1.route("/usage", usage);
v1.route("/slugs", slugs); // AI-powered slug suggestions
v1.route("/public/links", publicLinks); // Guest link creation (no auth required)
v1.route("/claim", claimLinks); // Claim guest links after signup
v1.route("/webhooks", webhooksRouter); // Outgoing webhook management
v1.route("/galleries", galleriesRouter); // Link-in-Bio galleries
v1.route("/qr", qrRouter); // QR code generation
v1.route("/public/galleries", publicGalleries); // Public gallery viewing
v1.route("/ai", aiRouter); // AI-powered features
v1.route("/bulk", bulk); // Bulk operations (CSV import/export)
v1.route("/conversions", conversions); // Conversion tracking and goals
v1.route("/public/conversions", publicConversions); // Public conversion tracking (no auth)
v1.route("/migrations", migrations); // Competitor migration tools
v1.route("/support", support); // AI-powered support agent
v1.route("/contact", contact); // Contact form submissions
v1.route("/waitlist", waitlist); // Waitlist signups
v1.route("/newsletter", newsletter); // Newsletter subscriptions
v1.route("/sso", sso); // Enterprise SSO/SAML
v1.route("/audit", audit); // Enterprise audit logging
v1.route("/white-label", whiteLabel); // White-label / Reseller program
v1.route("/analytics", analyticsRouter); // Link click analytics
v1.route("/affiliates", affiliatesRouter); // Affiliate program
v1.route("/ab-tests", abTests); // A/B testing
v1.route("/folders", folders); // Link folders
v1.route("/agent-attribution", agentAttribution); // Agent attribution (Links for AI Agents)
v1.route("/agent-runs", agentRuns); // First-class agent run records (incl. zero-click runs)
v1.route("/log", log); // Frontend log forwarder → Axiom dataset
v1.route("/abuse", abuse); // Public abuse reports (no auth required)

export { v1 };
