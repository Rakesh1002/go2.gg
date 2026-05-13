/**
 * Stripe Customer Portal
 */

import type Stripe from "stripe";
import type { CreatePortalParams, PortalSession } from "../types.js";

/**
 * Create a Customer Portal session.
 */
export async function createPortalSession(
  stripe: Stripe,
  params: CreatePortalParams
): Promise<PortalSession> {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });

  return {
    id: session.id,
    url: session.url,
  };
}
