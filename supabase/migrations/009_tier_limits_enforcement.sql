-- GymSaaS Migration: Tier Limits & Enforcement
-- Updates tier system with proper limits and enforcement functions

-- ============================================
-- ENSURE GYM_MANAGER ROLE EXISTS
-- ============================================
DO $$
BEGIN
  -- Add gym_manager to user_role enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'gym_manager' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'gym_manager' BEFORE 'gym_staff';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--
-- PRICING STRATEGY:
-- ┌─────────────┬──────────┬───────────┬─────────────┐
-- │             │ STARTER  │    PRO    │ ENTERPRISE  │
-- ├─────────────┼──────────┼───────────┼─────────────┤
-- │ Price       │ $79/mo   │ $149/mo   │ $299/mo     │
-- │ Members     │ 25       │ 150       │ Unlimited   │
-- │ Staff       │ 3        │ 10        │ Unlimited   │
-- │ Classes     │ 5        │ 25        │ Unlimited   │
-- │ Pages       │ 1        │ 5         │ Unlimited   │
-- │ Locations   │ 1        │ 1         │ 5           │
-- │ $/member    │ $3.16    │ $0.99     │ Scales      │
-- └─────────────┴──────────┴───────────┴─────────────┘

-- ============================================
-- PLATFORM PRICING TABLE
-- Central place to manage tier pricing/limits
-- ============================================
CREATE TABLE IF NOT EXISTS platform_tiers (
  tier gym_tier PRIMARY KEY,
  display_name TEXT NOT NULL,
  price_monthly_cents INTEGER NOT NULL,
  price_yearly_cents INTEGER, -- Optional annual discount
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,

  -- Hard limits
  max_members INTEGER NOT NULL,
  max_staff INTEGER NOT NULL,
  max_classes INTEGER NOT NULL,
  max_landing_pages INTEGER NOT NULL,
  max_locations INTEGER NOT NULL,

  -- Soft limits (usage-based)
  email_credits_monthly INTEGER NOT NULL DEFAULT 500,
  sms_credits_monthly INTEGER NOT NULL DEFAULT 0,

  -- Feature flags
  features JSONB NOT NULL DEFAULT '{}',

  -- Display
  description TEXT,
  is_popular BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert tier configurations
INSERT INTO platform_tiers (
  tier, display_name, price_monthly_cents, price_yearly_cents,
  max_members, max_staff, max_classes, max_landing_pages, max_locations,
  email_credits_monthly, sms_credits_monthly,
  features, description, is_popular, sort_order
) VALUES
(
  'starter',
  'Starter',
  7900,  -- $79/month
  86900, -- $869/year ($79 × 11 = 1 month free, ~$72.42/mo)
  25,    -- members
  3,     -- staff (owner + 2)
  5,     -- classes
  1,     -- landing page
  1,     -- location
  500,   -- emails/month
  0,     -- no SMS
  '{
    "subdomain_site": true,
    "custom_domain": false,
    "landing_page_builder": true,
    "class_scheduling": true,
    "basic_check_in": true,
    "advanced_check_in": false,
    "payment_processing": true,
    "basic_analytics": true,
    "advanced_analytics": false,
    "loyalty_rewards": false,
    "flash_sales": false,
    "email_messaging": true,
    "sms_messaging": false,
    "in_app_messaging": true,
    "multi_location": false,
    "white_label": false,
    "api_access": false,
    "priority_support": false
  }'::jsonb,
  'Perfect for new gyms and small dojos getting started',
  FALSE,
  1
),
(
  'pro',
  'Pro',
  14900, -- $149/month
  163900, -- $1,639/year ($149 × 11 = 1 month free, ~$136.58/mo)
  150,   -- members
  10,    -- staff
  25,    -- classes
  5,     -- landing pages
  1,     -- location
  2000,  -- emails/month
  200,   -- SMS/month
  '{
    "subdomain_site": true,
    "custom_domain": true,
    "landing_page_builder": true,
    "class_scheduling": true,
    "basic_check_in": true,
    "advanced_check_in": true,
    "payment_processing": true,
    "basic_analytics": true,
    "advanced_analytics": true,
    "loyalty_rewards": true,
    "flash_sales": true,
    "email_messaging": true,
    "sms_messaging": true,
    "in_app_messaging": true,
    "multi_location": false,
    "white_label": false,
    "api_access": false,
    "priority_support": true
  }'::jsonb,
  'For growing gyms ready to engage and retain members',
  TRUE, -- Mark as popular
  2
),
(
  'enterprise',
  'Enterprise',
  29900, -- $299/month
  328900, -- $3,289/year ($299 × 11 = 1 month free, ~$274.08/mo)
  999999, -- "unlimited" members
  999999, -- "unlimited" staff
  999999, -- "unlimited" classes
  999999, -- "unlimited" landing pages
  5,      -- locations
  10000,  -- emails/month
  1000,   -- SMS/month
  '{
    "subdomain_site": true,
    "custom_domain": true,
    "landing_page_builder": true,
    "class_scheduling": true,
    "basic_check_in": true,
    "advanced_check_in": true,
    "payment_processing": true,
    "basic_analytics": true,
    "advanced_analytics": true,
    "loyalty_rewards": true,
    "flash_sales": true,
    "email_messaging": true,
    "sms_messaging": true,
    "in_app_messaging": true,
    "multi_location": true,
    "white_label": true,
    "api_access": true,
    "priority_support": true
  }'::jsonb,
  'For established gyms and multi-location businesses',
  FALSE,
  3
)
ON CONFLICT (tier) DO UPDATE SET
  price_monthly_cents = EXCLUDED.price_monthly_cents,
  price_yearly_cents = EXCLUDED.price_yearly_cents,
  max_members = EXCLUDED.max_members,
  max_staff = EXCLUDED.max_staff,
  max_classes = EXCLUDED.max_classes,
  max_landing_pages = EXCLUDED.max_landing_pages,
  max_locations = EXCLUDED.max_locations,
  email_credits_monthly = EXCLUDED.email_credits_monthly,
  sms_credits_monthly = EXCLUDED.sms_credits_monthly,
  features = EXCLUDED.features,
  updated_at = NOW();

-- ============================================
-- UPDATE GYMS TABLE WITH NEW LIMIT COLUMNS
-- ============================================
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS max_staff INTEGER DEFAULT 3;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS max_classes INTEGER DEFAULT 5;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS max_landing_pages INTEGER DEFAULT 1;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS max_locations INTEGER DEFAULT 1;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing';
-- subscription_status: 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'suspended'

-- Add suspension tracking columns
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS owner_contact_email TEXT; -- For suspension notice

-- Update existing gyms table defaults to match starter tier
UPDATE gyms SET max_members = 25 WHERE max_members = 100 OR max_members IS NULL;

-- ============================================
-- FUNCTION: Get gym's current usage
-- ============================================
CREATE OR REPLACE FUNCTION get_gym_usage(p_gym_id UUID)
RETURNS TABLE (
  member_count INTEGER,
  staff_count INTEGER,
  class_count INTEGER,
  landing_page_count INTEGER,
  location_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM profiles WHERE gym_id = p_gym_id AND role = 'member'),
    (SELECT COUNT(*)::INTEGER FROM profiles WHERE gym_id = p_gym_id AND role IN ('gym_owner', 'gym_manager', 'gym_staff')),
    (SELECT COUNT(*)::INTEGER FROM classes WHERE gym_id = p_gym_id AND is_active = true),
    (SELECT COUNT(*)::INTEGER FROM landing_pages WHERE gym_id = p_gym_id),
    (SELECT COUNT(*)::INTEGER FROM gym_locations WHERE gym_id = p_gym_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Check if gym can add member
-- ============================================
CREATE OR REPLACE FUNCTION can_add_member(p_gym_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_max INTEGER;
  v_current INTEGER;
  v_status TEXT;
BEGIN
  -- Get gym limits and status
  SELECT max_members, subscription_status INTO v_max, v_status FROM gyms WHERE id = p_gym_id;

  -- Check subscription status
  IF v_status NOT IN ('trialing', 'active') THEN
    RETURN FALSE;
  END IF;

  -- Count current members
  SELECT COUNT(*) INTO v_current FROM profiles WHERE gym_id = p_gym_id AND role = 'member';

  RETURN v_current < v_max;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Check if gym can add staff
-- ============================================
CREATE OR REPLACE FUNCTION can_add_staff(p_gym_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_max INTEGER;
  v_current INTEGER;
  v_status TEXT;
BEGIN
  SELECT max_staff, subscription_status INTO v_max, v_status FROM gyms WHERE id = p_gym_id;

  IF v_status NOT IN ('trialing', 'active') THEN
    RETURN FALSE;
  END IF;

  SELECT COUNT(*) INTO v_current
  FROM profiles
  WHERE gym_id = p_gym_id AND role IN ('gym_owner', 'gym_manager', 'gym_staff');

  RETURN v_current < v_max;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Check if gym can add class
-- ============================================
CREATE OR REPLACE FUNCTION can_add_class(p_gym_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_max INTEGER;
  v_current INTEGER;
  v_status TEXT;
BEGIN
  SELECT max_classes, subscription_status INTO v_max, v_status FROM gyms WHERE id = p_gym_id;

  IF v_status NOT IN ('trialing', 'active') THEN
    RETURN FALSE;
  END IF;

  SELECT COUNT(*) INTO v_current FROM classes WHERE gym_id = p_gym_id AND is_active = true;

  RETURN v_current < v_max;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Check if gym can add landing page
-- ============================================
CREATE OR REPLACE FUNCTION can_add_landing_page(p_gym_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_max INTEGER;
  v_current INTEGER;
  v_status TEXT;
BEGIN
  SELECT max_landing_pages, subscription_status INTO v_max, v_status FROM gyms WHERE id = p_gym_id;

  IF v_status NOT IN ('trialing', 'active') THEN
    RETURN FALSE;
  END IF;

  SELECT COUNT(*) INTO v_current FROM landing_pages WHERE gym_id = p_gym_id;

  RETURN v_current < v_max;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Check if gym has feature
-- ============================================
CREATE OR REPLACE FUNCTION gym_has_feature(p_gym_id UUID, p_feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier gym_tier;
  v_features JSONB;
  v_status TEXT;
BEGIN
  -- Get gym's tier and status
  SELECT tier, subscription_status INTO v_tier, v_status FROM gyms WHERE id = p_gym_id;

  -- If not active/trialing, no features
  IF v_status NOT IN ('trialing', 'active') THEN
    RETURN FALSE;
  END IF;

  -- Get features for this tier
  SELECT features INTO v_features FROM platform_tiers WHERE tier = v_tier;

  -- Check if feature is enabled
  RETURN COALESCE((v_features->>p_feature)::boolean, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Enforce member limit on insert
-- ============================================
CREATE OR REPLACE FUNCTION enforce_member_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'member' AND NEW.gym_id IS NOT NULL THEN
    IF NOT can_add_member(NEW.gym_id) THEN
      RAISE EXCEPTION 'Member limit reached for this gym. Please upgrade your plan.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_member_limit ON profiles;
CREATE TRIGGER check_member_limit
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'member')
  EXECUTE FUNCTION enforce_member_limit();

-- ============================================
-- TRIGGER: Enforce staff limit on insert
-- ============================================
CREATE OR REPLACE FUNCTION enforce_staff_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('gym_manager', 'gym_staff') AND NEW.gym_id IS NOT NULL THEN
    IF NOT can_add_staff(NEW.gym_id) THEN
      RAISE EXCEPTION 'Staff limit reached for this gym. Please upgrade your plan.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_staff_limit ON profiles;
CREATE TRIGGER check_staff_limit
  BEFORE INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.role IN ('gym_manager', 'gym_staff'))
  EXECUTE FUNCTION enforce_staff_limit();

-- ============================================
-- TRIGGER: Enforce class limit on insert
-- ============================================
CREATE OR REPLACE FUNCTION enforce_class_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT can_add_class(NEW.gym_id) THEN
    RAISE EXCEPTION 'Class limit reached for this gym. Please upgrade your plan.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_class_limit ON classes;
CREATE TRIGGER check_class_limit
  BEFORE INSERT ON classes
  FOR EACH ROW
  EXECUTE FUNCTION enforce_class_limit();

-- ============================================
-- TRIGGER: Enforce landing page limit
-- ============================================
CREATE OR REPLACE FUNCTION enforce_landing_page_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT can_add_landing_page(NEW.gym_id) THEN
    RAISE EXCEPTION 'Landing page limit reached for this gym. Please upgrade your plan.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_landing_page_limit ON landing_pages;
CREATE TRIGGER check_landing_page_limit
  BEFORE INSERT ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION enforce_landing_page_limit();

-- ============================================
-- FUNCTION: Upgrade gym tier (called by webhook)
-- ============================================
CREATE OR REPLACE FUNCTION upgrade_gym_tier(
  p_gym_id UUID,
  p_new_tier gym_tier,
  p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier_config RECORD;
BEGIN
  -- Get new tier configuration
  SELECT * INTO v_tier_config FROM platform_tiers WHERE tier = p_new_tier;

  -- Update gym with new limits
  UPDATE gyms
  SET
    tier = p_new_tier,
    tier_started_at = NOW(),
    stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
    subscription_status = 'active',
    is_trial = FALSE,
    max_members = v_tier_config.max_members,
    max_staff = v_tier_config.max_staff,
    max_classes = v_tier_config.max_classes,
    max_landing_pages = v_tier_config.max_landing_pages,
    max_locations = v_tier_config.max_locations,
    updated_at = NOW()
  WHERE id = p_gym_id;

  -- Update gym_features with new credits
  UPDATE gym_features
  SET
    email_credits_monthly = v_tier_config.email_credits_monthly,
    sms_credits_monthly = v_tier_config.sms_credits_monthly,
    -- Reset usage on upgrade
    email_credits_used = 0,
    sms_credits_used = 0,
    credits_reset_at = NOW(),
    updated_at = NOW()
  WHERE gym_id = p_gym_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Handle subscription status change
-- (Called by Stripe webhook)
-- ============================================
CREATE OR REPLACE FUNCTION update_subscription_status(
  p_gym_id UUID,
  p_status TEXT,
  p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE gyms
  SET
    subscription_status = p_status,
    stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
    updated_at = NOW()
  WHERE id = p_gym_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEW: Gym tier usage summary
-- ============================================
CREATE OR REPLACE VIEW gym_tier_usage AS
SELECT
  g.id AS gym_id,
  g.name,
  g.tier,
  g.subscription_status,
  g.is_trial,
  g.trial_ends_at,
  g.max_members,
  g.max_staff,
  g.max_classes,
  g.max_landing_pages,
  usage.member_count,
  usage.staff_count,
  usage.class_count,
  usage.landing_page_count,
  usage.location_count,
  -- Usage percentages
  ROUND((usage.member_count::NUMERIC / NULLIF(g.max_members, 0)) * 100, 1) AS member_usage_pct,
  ROUND((usage.staff_count::NUMERIC / NULLIF(g.max_staff, 0)) * 100, 1) AS staff_usage_pct,
  ROUND((usage.class_count::NUMERIC / NULLIF(g.max_classes, 0)) * 100, 1) AS class_usage_pct,
  -- Approaching limits flags
  usage.member_count >= (g.max_members * 0.8) AS approaching_member_limit,
  usage.staff_count >= (g.max_staff * 0.8) AS approaching_staff_limit,
  usage.class_count >= (g.max_classes * 0.8) AS approaching_class_limit
FROM gyms g
CROSS JOIN LATERAL get_gym_usage(g.id) AS usage;

GRANT SELECT ON gym_tier_usage TO authenticated;
GRANT SELECT ON platform_tiers TO authenticated;

-- ============================================
-- RLS for platform_tiers (public read)
-- ============================================
ALTER TABLE platform_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view platform tiers"
  ON platform_tiers FOR SELECT
  USING (true);

CREATE POLICY "Only super admin can modify tiers"
  ON platform_tiers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_gyms_subscription_status ON gyms(subscription_status);
CREATE INDEX IF NOT EXISTS idx_gyms_is_trial ON gyms(is_trial);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE platform_tiers IS 'Central configuration for all subscription tiers and their limits';
COMMENT ON FUNCTION can_add_member(UUID) IS 'Check if gym has capacity for another member';
COMMENT ON FUNCTION can_add_staff(UUID) IS 'Check if gym has capacity for another staff member';
COMMENT ON FUNCTION gym_has_feature(UUID, TEXT) IS 'Check if gym has access to a specific feature';
COMMENT ON FUNCTION upgrade_gym_tier(UUID, gym_tier, TEXT) IS 'Upgrade gym to new tier, called by Stripe webhook';

-- ============================================
-- TRIAL & SUSPENSION SYSTEM
-- ============================================

-- Set default trial period on new gyms
CREATE OR REPLACE FUNCTION set_trial_period()
RETURNS TRIGGER AS $$
BEGIN
  -- 14-day trial from creation
  NEW.trial_ends_at := NOW() + INTERVAL '14 days';
  NEW.is_trial := TRUE;
  NEW.subscription_status := 'trialing';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_gym_trial ON gyms;
CREATE TRIGGER set_gym_trial
  BEFORE INSERT ON gyms
  FOR EACH ROW
  WHEN (NEW.trial_ends_at IS NULL)
  EXECUTE FUNCTION set_trial_period();

-- ============================================
-- FUNCTION: Check if gym is suspended
-- Used by landing page to show suspension notice
-- ============================================
CREATE OR REPLACE FUNCTION is_gym_suspended(p_gym_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_status TEXT;
  v_trial_ends TIMESTAMPTZ;
  v_is_trial BOOLEAN;
BEGIN
  SELECT subscription_status, trial_ends_at, is_trial
  INTO v_status, v_trial_ends, v_is_trial
  FROM gyms
  WHERE id = p_gym_id;

  -- Explicitly suspended
  IF v_status = 'suspended' THEN
    RETURN TRUE;
  END IF;

  -- Trial expired without payment
  IF v_is_trial AND v_trial_ends < NOW() THEN
    RETURN TRUE;
  END IF;

  -- Past due or unpaid
  IF v_status IN ('past_due', 'unpaid', 'canceled') THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get suspension info for landing page
-- Returns NULL if not suspended, otherwise returns notice data
-- ============================================
CREATE OR REPLACE FUNCTION get_gym_suspension_info(p_gym_id UUID)
RETURNS TABLE (
  is_suspended BOOLEAN,
  gym_name TEXT,
  owner_email TEXT,
  suspended_at TIMESTAMPTZ,
  deletion_date TIMESTAMPTZ,
  days_until_deletion INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    is_gym_suspended(g.id),
    g.name,
    g.owner_contact_email,
    COALESCE(g.suspended_at, g.trial_ends_at),
    g.deletion_scheduled_at,
    EXTRACT(DAY FROM (g.deletion_scheduled_at - NOW()))::INTEGER
  FROM gyms g
  WHERE g.id = p_gym_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Suspend gym (called when trial expires or payment fails)
-- ============================================
CREATE OR REPLACE FUNCTION suspend_gym(p_gym_id UUID, p_reason TEXT DEFAULT 'payment_failed')
RETURNS BOOLEAN AS $$
DECLARE
  v_owner_email TEXT;
BEGIN
  -- Get owner's email for the suspension notice
  SELECT
    COALESCE(
      (SELECT decrypt_pii(email_encrypted) FROM profiles
       WHERE gym_id = p_gym_id AND role = 'gym_owner' LIMIT 1),
      'Contact gym directly'
    )
  INTO v_owner_email;

  -- Update gym status
  UPDATE gyms
  SET
    subscription_status = 'suspended',
    suspended_at = NOW(),
    deletion_scheduled_at = NOW() + INTERVAL '15 days',
    owner_contact_email = v_owner_email,
    updated_at = NOW()
  WHERE id = p_gym_id
  AND subscription_status != 'suspended'; -- Don't re-suspend

  -- Log this action (for super admin visibility)
  -- Could insert into an audit log table here

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Reactivate gym (when payment received)
-- ============================================
CREATE OR REPLACE FUNCTION reactivate_gym(p_gym_id UUID, p_stripe_subscription_id TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE gyms
  SET
    subscription_status = 'active',
    is_trial = FALSE,
    suspended_at = NULL,
    deletion_scheduled_at = NULL,
    stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
    updated_at = NOW()
  WHERE id = p_gym_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEW: Gyms pending deletion
-- For super admin to review before auto-delete
-- ============================================
CREATE OR REPLACE VIEW gyms_pending_deletion AS
SELECT
  g.id,
  g.name,
  g.slug,
  g.owner_contact_email,
  g.suspended_at,
  g.deletion_scheduled_at,
  EXTRACT(DAY FROM (g.deletion_scheduled_at - NOW()))::INTEGER AS days_remaining,
  g.trial_ends_at,
  g.subscription_status,
  (SELECT COUNT(*) FROM profiles WHERE gym_id = g.id AND role = 'member') AS member_count,
  (SELECT COUNT(*) FROM classes WHERE gym_id = g.id) AS class_count,
  (SELECT first_name || ' ' || last_name FROM profiles WHERE gym_id = g.id AND role = 'gym_owner' LIMIT 1) AS owner_name
FROM gyms g
WHERE g.deletion_scheduled_at IS NOT NULL
  AND g.deletion_scheduled_at > NOW()
ORDER BY g.deletion_scheduled_at ASC;

GRANT SELECT ON gyms_pending_deletion TO authenticated;

-- ============================================
-- VIEW: Gyms ready for deletion (past 15 days)
-- Super admin runs this to see what to delete
-- ============================================
CREATE OR REPLACE VIEW gyms_ready_for_deletion AS
SELECT
  g.id,
  g.name,
  g.slug,
  g.owner_contact_email,
  g.suspended_at,
  g.deletion_scheduled_at,
  g.subscription_status,
  (SELECT COUNT(*) FROM profiles WHERE gym_id = g.id) AS total_users
FROM gyms g
WHERE g.deletion_scheduled_at IS NOT NULL
  AND g.deletion_scheduled_at <= NOW()
  AND g.subscription_status = 'suspended';

GRANT SELECT ON gyms_ready_for_deletion TO authenticated;

-- ============================================
-- FUNCTION: Process expired trials
-- Run this daily via cron/scheduled function
-- ============================================
CREATE OR REPLACE FUNCTION process_expired_trials()
RETURNS TABLE (
  gym_id UUID,
  gym_name TEXT,
  action_taken TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH expired AS (
    SELECT g.id, g.name
    FROM gyms g
    WHERE g.is_trial = TRUE
      AND g.trial_ends_at < NOW()
      AND g.subscription_status = 'trialing'
  )
  UPDATE gyms
  SET subscription_status = 'suspended',
      suspended_at = NOW(),
      deletion_scheduled_at = NOW() + INTERVAL '15 days'
  FROM expired
  WHERE gyms.id = expired.id
  RETURNING gyms.id, gyms.name, 'suspended'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Delete gym and all data
-- Only callable by super_admin, permanently removes gym
-- ============================================
CREATE OR REPLACE FUNCTION delete_gym_permanently(p_gym_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- Verify super admin
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();

  IF v_caller_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can permanently delete gyms';
  END IF;

  -- The CASCADE constraints will handle related data
  DELETE FROM gyms WHERE id = p_gym_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Extend trial (for special cases)
-- ============================================
CREATE OR REPLACE FUNCTION extend_trial(p_gym_id UUID, p_days INTEGER DEFAULT 7)
RETURNS BOOLEAN AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- Only super admin can extend trials
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();

  IF v_caller_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can extend trials';
  END IF;

  UPDATE gyms
  SET
    trial_ends_at = GREATEST(trial_ends_at, NOW()) + (p_days || ' days')::INTERVAL,
    subscription_status = 'trialing',
    is_trial = TRUE,
    suspended_at = NULL,
    deletion_scheduled_at = NULL,
    updated_at = NOW()
  WHERE id = p_gym_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES for suspension queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_gyms_trial_ends ON gyms(trial_ends_at) WHERE is_trial = TRUE;
CREATE INDEX IF NOT EXISTS idx_gyms_deletion_scheduled ON gyms(deletion_scheduled_at) WHERE deletion_scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gyms_suspended ON gyms(subscription_status) WHERE subscription_status = 'suspended';

-- ============================================
-- ADDITIONAL COMMENTS
-- ============================================
COMMENT ON FUNCTION is_gym_suspended(UUID) IS 'Check if gym should show suspension notice on landing page';
COMMENT ON FUNCTION suspend_gym(UUID, TEXT) IS 'Suspend gym and schedule deletion in 15 days';
COMMENT ON FUNCTION reactivate_gym(UUID, TEXT) IS 'Reactivate suspended gym when payment received';
COMMENT ON FUNCTION process_expired_trials() IS 'Daily job to suspend gyms with expired trials';
COMMENT ON FUNCTION delete_gym_permanently(UUID) IS 'Permanently delete gym and all data - super admin only';
