import { agenticManifest } from "@/lib/agentic/manifest";
import { pricingPlans } from "@repo/config";
import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 3600;

// Why inline (not a redirect to api.go2.gg/api/openapi.json):
//   1. The MPP scanner (mpp.dev / isitagentready.com) requires `/openapi.json`
//      at the site root with HTTP 200 and `x-payment-info` extensions on
//      payable operations. Some scanners abort on multi-hop redirects.
//   2. The Cloudflare Worker hosting the web app cannot fetch its own zone
//      without hitting a 522 subrequest loop, so we cannot proxy the upstream
//      spec at the edge.
//
// This document advertises the payable surface (Stripe Checkout sessions per
// pricing plan) so AI-agent payment clients can discover and initiate billing.
// The full Go2 REST surface lives at `${apiUrl}/api/openapi.json` and is
// referenced via `externalDocs` below.
export async function GET() {
  const m = agenticManifest;
  const apiUrl = m.product.apiUrl;
  const siteUrl = m.product.siteUrl;

  type StripeMethod = "stripe";
  type Intent = "session";

  const payablePlans = pricingPlans.filter((p) => p.priceMonthly !== null && p.priceMonthly > 0);

  const checkoutPath = (planId: string, cadence: "monthly" | "annual") =>
    `/api/v1/billing/checkout/${planId}/${cadence}`;

  const buildCheckoutOp = (
    planId: string,
    planName: string,
    cadence: "monthly" | "annual",
    amountUsd: number,
    priceId: string
  ) => ({
    tags: ["Billing"],
    summary: `Start checkout for ${planName} (${cadence})`,
    description: `Creates a Stripe Checkout session for the ${planName} plan billed ${cadence}. Calls POST ${apiUrl}/api/v1/billing/checkout with priceId=${priceId} under the hood.`,
    operationId: `checkout_${planId}_${cadence}`,
    "x-payment-info": {
      intent: "session" as Intent,
      method: "stripe" as StripeMethod,
      amount: Math.round(amountUsd * 100),
      currency: "USD",
      description: `Go2 ${planName} plan, ${cadence} billing`,
    },
    requestBody: {
      required: false,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              successUrl: { type: "string", format: "uri" },
              cancelUrl: { type: "string", format: "uri" },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Stripe Checkout session created.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["url"],
              properties: {
                sessionId: { type: "string" },
                url: { type: "string", format: "uri" },
              },
            },
          },
        },
      },
    },
  });

  const paths: Record<string, Record<string, unknown>> = {};

  for (const plan of payablePlans) {
    if (plan.priceMonthly !== null && plan.stripePriceIdMonthly) {
      paths[checkoutPath(plan.id, "monthly")] = {
        post: buildCheckoutOp(
          plan.id,
          plan.name,
          "monthly",
          plan.priceMonthly,
          plan.stripePriceIdMonthly
        ),
      };
    }
    if (plan.priceAnnual !== null && plan.stripePriceIdAnnual) {
      paths[checkoutPath(plan.id, "annual")] = {
        post: buildCheckoutOp(
          plan.id,
          plan.name,
          "annual",
          plan.priceAnnual,
          plan.stripePriceIdAnnual
        ),
      };
    }
  }

  // Also expose the underlying generic checkout endpoint with `x-payment-info`
  // so MPP clients that don't enumerate path-per-plan still see one payable op.
  const proMonthly = pricingPlans.find((p) => p.id === "pro");
  if (proMonthly && proMonthly.priceMonthly !== null) {
    paths["/api/v1/billing/checkout"] = {
      post: {
        tags: ["Billing"],
        summary: "Create a Stripe Checkout session for any plan",
        description:
          "Generic checkout creator. Pass `priceId` for the desired plan in the request body. Amount and currency are determined by the Stripe price.",
        operationId: "create_checkout_session",
        "x-payment-info": {
          intent: "session" as Intent,
          method: "stripe" as StripeMethod,
          amount: Math.round(proMonthly.priceMonthly * 100),
          currency: "USD",
          description: "Go2 subscription plan via Stripe Checkout",
        },
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["priceId"],
                properties: {
                  priceId: { type: "string" },
                  organizationId: { type: "string", format: "uuid" },
                  successUrl: { type: "string", format: "uri" },
                  cancelUrl: { type: "string", format: "uri" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Stripe Checkout session created.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    sessionId: { type: "string" },
                    url: { type: "string", format: "uri" },
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  const doc = {
    openapi: "3.1.0",
    info: {
      title: `${m.product.name} — Payable Operations`,
      version: "1.0.0",
      summary: "MPP-discoverable payment surface for Go2.",
      description:
        "This document exposes the payable operations of Go2 (Stripe Checkout sessions per subscription plan) so AI-agent payment clients can discover billing flows via the Machine Payment Protocol (https://mpp.dev). The full Go2 REST API is documented separately — see externalDocs below.",
      contact: { name: m.product.name, url: siteUrl, email: m.product.contactEmail },
      license: { name: "AGPL-3.0", url: "https://www.gnu.org/licenses/agpl-3.0.html" },
    },
    servers: [{ url: apiUrl, description: "Production" }],
    externalDocs: {
      description: "Full Go2 REST API specification",
      url: `${apiUrl}/api/openapi.json`,
    },
    tags: [{ name: "Billing", description: "Subscription checkout and customer portal." }],
    paths,
  };

  return NextResponse.json(doc, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}
