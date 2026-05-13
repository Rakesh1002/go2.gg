/**
 * Stripe Customers
 */

import type Stripe from "stripe";

export interface CreateCustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

/**
 * Create a Stripe customer.
 */
export async function createCustomer(
  stripe: Stripe,
  params: CreateCustomerParams
): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: params.metadata,
  });
}

/**
 * Get a customer by ID.
 */
export async function getCustomer(
  stripe: Stripe,
  customerId: string
): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      return null;
    }
    return customer as Stripe.Customer;
  } catch {
    return null;
  }
}

/**
 * Update a customer.
 */
export async function updateCustomer(
  stripe: Stripe,
  customerId: string,
  params: Partial<CreateCustomerParams>
): Promise<Stripe.Customer> {
  return stripe.customers.update(customerId, {
    email: params.email,
    name: params.name,
    metadata: params.metadata,
  });
}

/**
 * Find customer by email.
 */
export async function findCustomerByEmail(
  stripe: Stripe,
  email: string
): Promise<Stripe.Customer | null> {
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  return customers.data[0] ?? null;
}
