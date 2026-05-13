/**
 * Webhook Routes
 *
 * Handle webhooks from external services.
 * Each service has its own dedicated handler with signature verification.
 */

import { Hono } from "hono";
import type { Env } from "../bindings.js";
import { stripeWebhooks } from "./webhooks/stripe.js";

const webhooks = new Hono<{ Bindings: Env }>();

// Mount Stripe webhooks
webhooks.route("/stripe", stripeWebhooks);

// Future webhook handlers can be added here:
// webhooks.route("/github", githubWebhooks);
// webhooks.route("/slack", slackWebhooks);

export { webhooks };
