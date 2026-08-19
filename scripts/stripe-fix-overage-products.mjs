#!/usr/bin/env node
/**
 * Fix the duplicate "Go2 Pro" line on Stripe Checkout.
 *
 * Each paid plan ships two subscription items: the flat plan price and a
 * metered overage price. On the live account both prices sit on the SAME
 * product ("Go2 Pro"), so Checkout renders the product name twice — once for
 * the $9 flat line and once for the usage line. This script gives every
 * overage price its own clearly-named product so the usage line reads e.g.
 * "Go2 Pro · Usage overage".
 *
 * It is conservative and idempotent:
 *   - If an overage price already lives on its own (metered-only) product, it
 *     just renames that product. No price IDs change.
 *   - If the overage price shares a product with a flat price, it creates a
 *     NEW product and a NEW metered price that clones the original's meter +
 *     tiers, then prints the env/secret updates you need to apply. The same
 *     meter is reused, so usage reporting is unaffected.
 *
 * Usage (run from app/):
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-fix-overage-products.mjs           # dry run
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-fix-overage-products.mjs --apply   # execute
 *
 * After an --apply that created new prices, set the printed STRIPE_OVERAGE_*
 * values as production secrets and redeploy:
 *   wrangler secret put STRIPE_OVERAGE_PRICE_PRO --env production
 */

import { createRequire } from "node:module";

// `stripe` is a dependency of apps/api, not of the repo root, so resolve it
// from there (this script lives in app/scripts/ and is run from app/).
const requireFromApi = createRequire(new URL("../apps/api/package.json", import.meta.url));
const Stripe = requireFromApi("stripe");

const APPLY = process.argv.includes("--apply");

const SECRET = process.env.STRIPE_SECRET_KEY;
if (!SECRET) {
  console.error("STRIPE_SECRET_KEY is required (use the live/new-account key).");
  process.exit(1);
}
if (!SECRET.includes("live")) {
  console.warn("Warning: key does not look like a live key. Continuing anyway.\n");
}

const stripe = new Stripe(SECRET, { apiVersion: "2025-02-24.acacia" });

// Overage prices to fix, keyed by plan. Defaults match @repo/config/pricing
// (new account acct_1TgyIg43jurh1T6b); override via env if re-provisioned.
const TARGETS = [
  {
    plan: "Pro",
    envVar: "STRIPE_OVERAGE_PRICE_PRO",
    priceId: process.env.STRIPE_OVERAGE_PRICE_PRO ?? "price_1Tgyz443jurh1T6bM87ZdrWG",
    productName: "Go2 Pro · Usage overage",
    productDescription: "Metered usage beyond the Go2 Pro included quota ($0.40 / 1K events).",
  },
  {
    plan: "Business",
    envVar: "STRIPE_OVERAGE_PRICE_BUSINESS",
    priceId: process.env.STRIPE_OVERAGE_PRICE_BUSINESS ?? "price_1Tgyz643jurh1T6brEf93srV",
    productName: "Go2 Business · Usage overage",
    productDescription: "Metered usage beyond the Go2 Business included quota ($0.40 / 1K events).",
  },
  {
    plan: "Scale",
    envVar: "STRIPE_OVERAGE_PRICE_SCALE",
    priceId: process.env.STRIPE_OVERAGE_PRICE_SCALE ?? "price_1Th1xR43jurh1T6b0AIPKr9z",
    productName: "Go2 Scale · Usage overage",
    productDescription: "Metered usage beyond the Go2 Scale included quota ($0.40 / 1K events).",
  },
];

function clonePriceCreateParams(price, newProductId) {
  const r = price.recurring ?? {};
  const params = {
    currency: price.currency,
    product: newProductId,
    nickname: price.nickname ?? undefined,
    recurring: {
      interval: r.interval,
      interval_count: r.interval_count ?? 1,
      usage_type: "metered",
      // Reuse the SAME meter so the usage-report cron keeps working unchanged.
      ...(r.meter ? { meter: r.meter } : {}),
      ...(r.aggregate_usage ? { aggregate_usage: r.aggregate_usage } : {}),
    },
    billing_scheme: price.billing_scheme,
  };
  if (price.billing_scheme === "tiered") {
    params.tiers_mode = price.tiers_mode;
    params.tiers = (price.tiers ?? []).map((t) => ({
      up_to: t.up_to ?? "inf",
      ...(t.unit_amount_decimal != null ? { unit_amount_decimal: t.unit_amount_decimal } : {}),
      ...(t.flat_amount_decimal != null ? { flat_amount_decimal: t.flat_amount_decimal } : {}),
    }));
  } else {
    if (price.unit_amount_decimal != null) params.unit_amount_decimal = price.unit_amount_decimal;
  }
  return params;
}

const newSecrets = [];

for (const target of TARGETS) {
  console.log(`\n=== ${target.plan} overage (${target.priceId}) ===`);
  let price;
  try {
    price = await stripe.prices.retrieve(target.priceId, { expand: ["tiers", "product"] });
  } catch (err) {
    console.error(`  ! Could not retrieve price: ${err.message}`);
    continue;
  }

  const product = price.product;
  const productId = typeof product === "string" ? product : product.id;
  const productName = typeof product === "object" ? product.name : "(unknown)";

  // What else lives on this product?
  const siblings = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const hasFlatSibling = siblings.data.some(
    (p) => p.id !== price.id && p.recurring?.usage_type !== "metered"
  );

  console.log(`  product: ${productId} ("${productName}")`);
  console.log(
    `  shares product with a flat price: ${hasFlatSibling ? "YES (must split)" : "no (rename only)"}`
  );

  if (!hasFlatSibling) {
    // Safe path: the overage price owns its product → just rename it.
    if (productName === target.productName) {
      console.log("  ✓ already named correctly — nothing to do.");
      continue;
    }
    console.log(`  -> rename product to "${target.productName}"`);
    if (APPLY) {
      await stripe.products.update(productId, {
        name: target.productName,
        description: target.productDescription,
      });
      console.log("  ✓ renamed.");
    }
    continue;
  }

  // Split path: create a dedicated product + cloned metered price.
  console.log(`  -> create product "${target.productName}" + clone metered price`);
  if (APPLY) {
    const newProduct = await stripe.products.create({
      name: target.productName,
      description: target.productDescription,
    });
    const newPrice = await stripe.prices.create(clonePriceCreateParams(price, newProduct.id));
    console.log(`  ✓ new product: ${newProduct.id}`);
    console.log(`  ✓ new price:   ${newPrice.id}`);
    // Intentionally do NOT archive the old overage price: existing subscriptions
    // keep it, and leaving it active means checkout can never break if the
    // config update lags. It simply stops being referenced once pricing.ts +
    // .env point at the new id.
    newSecrets.push(`${target.envVar}=${newPrice.id}`);
  } else {
    newSecrets.push(`${target.envVar}=<new price id>`);
  }
}

if (newSecrets.length > 0) {
  console.log("\n--- Update these production values and redeploy ---");
  for (const s of newSecrets) console.log("  " + s);
  console.log(
    "\nSet each as a worker secret, e.g.:\n  echo <price_id> | wrangler secret put STRIPE_OVERAGE_PRICE_PRO --env production"
  );
}

console.log(`\n${APPLY ? "Applied." : "Dry run complete. Re-run with --apply to execute."}`);
