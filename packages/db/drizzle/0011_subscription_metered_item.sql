-- Stripe metered billing harness for the Scale tier.
-- Adds `stripe_subscription_item_id` to subscriptions so the daily usage-report
-- cron can call stripe.subscriptionItems.createUsageRecord against it.
-- Stays NULL until a customer signs up on the metered SKU.

ALTER TABLE subscriptions ADD COLUMN stripe_subscription_item_id TEXT;
