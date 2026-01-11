-- Add stripe_customer_id to gyms table for platform subscriptions
-- This is separate from stripe_account_id which is for Stripe Connect (gym's own payments)

ALTER TABLE gyms ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Index for looking up gyms by customer ID
CREATE INDEX IF NOT EXISTS idx_gyms_stripe_customer_id ON gyms(stripe_customer_id);

COMMENT ON COLUMN gyms.stripe_customer_id IS 'Stripe Customer ID for platform subscription billing';
COMMENT ON COLUMN gyms.stripe_account_id IS 'Stripe Connect Account ID for gym member payments';
