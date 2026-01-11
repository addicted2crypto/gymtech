-- GymSaaS Migration: Gym Tiers & Feature Control
-- This migration adds subscription tiers and feature flags for gyms

-- ============================================
-- GYM SUBSCRIPTION TIERS
-- ============================================

-- Create tier type
CREATE TYPE gym_tier AS ENUM ('starter', 'pro', 'enterprise');

-- Add tier column to gyms table
ALTER TABLE gyms ADD COLUMN tier gym_tier DEFAULT 'starter';
ALTER TABLE gyms ADD COLUMN tier_started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE gyms ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE gyms ADD COLUMN max_members INTEGER DEFAULT 100;
ALTER TABLE gyms ADD COLUMN trial_ends_at TIMESTAMPTZ;
ALTER TABLE gyms ADD COLUMN is_trial BOOLEAN DEFAULT TRUE;

-- Feature flags for each gym (controlled by super admin)
CREATE TABLE gym_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE UNIQUE,
  -- Core features (all tiers)
  class_scheduling BOOLEAN DEFAULT TRUE,
  payment_processing BOOLEAN DEFAULT TRUE,
  check_in_system BOOLEAN DEFAULT TRUE,
  basic_analytics BOOLEAN DEFAULT TRUE,
  subdomain_site BOOLEAN DEFAULT TRUE,
  -- Pro features
  landing_page_builder BOOLEAN DEFAULT FALSE,
  custom_domain BOOLEAN DEFAULT FALSE,
  loyalty_rewards BOOLEAN DEFAULT FALSE,
  flash_sales BOOLEAN DEFAULT FALSE,
  sms_marketing BOOLEAN DEFAULT FALSE,
  advanced_analytics BOOLEAN DEFAULT FALSE,
  -- Enterprise features
  multi_location BOOLEAN DEFAULT FALSE,
  white_label BOOLEAN DEFAULT FALSE,
  social_crossposting BOOLEAN DEFAULT FALSE,
  trial_lead_insights BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  dedicated_manager BOOLEAN DEFAULT FALSE,
  -- Usage limits
  sms_credits_monthly INTEGER DEFAULT 0,
  email_credits_monthly INTEGER DEFAULT 1000,
  sms_credits_used INTEGER DEFAULT 0,
  email_credits_used INTEGER DEFAULT 0,
  credits_reset_at TIMESTAMPTZ DEFAULT NOW(),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gym_features ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SUPER ADMIN POLICIES - Full Access to Everything
-- ============================================

-- Drop existing super admin policy and recreate with better permissions
DROP POLICY IF EXISTS "Super admins have full access to gyms" ON gyms;

-- Super admin can do anything to any table
CREATE POLICY "Super admin full access to gyms"
  ON gyms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin full access to profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin full access to gym_features"
  ON gym_features FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin full access to membership_plans"
  ON membership_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin full access to classes"
  ON classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin full access to leads"
  ON leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin full access to landing_pages"
  ON landing_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin full access to flash_sales"
  ON flash_sales FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin full access to page_views"
  ON page_views FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- ============================================
-- GYM OWNER POLICIES FOR THEIR GYM'S DATA
-- ============================================

-- Gym owners can view their own features
CREATE POLICY "Gym owners can view their features"
  ON gym_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = gym_features.gym_id
      AND profiles.role = 'gym_owner'
    )
  );

-- Gym owners can manage their classes
CREATE POLICY "Gym owners can manage classes"
  ON classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = classes.gym_id
      AND profiles.role = 'gym_owner'
    )
  );

-- Gym owners can manage their membership plans
CREATE POLICY "Gym owners can manage membership plans"
  ON membership_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = membership_plans.gym_id
      AND profiles.role = 'gym_owner'
    )
  );

-- Gym owners can manage their leads
CREATE POLICY "Gym owners can manage leads"
  ON leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = leads.gym_id
      AND profiles.role IN ('gym_owner', 'gym_staff')
    )
  );

-- Gym owners can manage their flash sales
CREATE POLICY "Gym owners can manage flash sales"
  ON flash_sales FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = flash_sales.gym_id
      AND profiles.role = 'gym_owner'
    )
  );

-- ============================================
-- FUNCTION: Auto-create gym features on gym creation
-- ============================================
CREATE OR REPLACE FUNCTION create_gym_features()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO gym_features (gym_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_gym_created
  AFTER INSERT ON gyms
  FOR EACH ROW
  EXECUTE FUNCTION create_gym_features();

-- ============================================
-- FUNCTION: Update features based on tier
-- ============================================
CREATE OR REPLACE FUNCTION update_gym_tier_features()
RETURNS TRIGGER AS $$
BEGIN
  -- When gym tier changes, update their features accordingly
  IF NEW.tier != OLD.tier THEN
    UPDATE gym_features
    SET
      -- Pro features (enabled for pro and enterprise)
      landing_page_builder = NEW.tier IN ('pro', 'enterprise'),
      custom_domain = NEW.tier IN ('pro', 'enterprise'),
      loyalty_rewards = NEW.tier IN ('pro', 'enterprise'),
      flash_sales = NEW.tier IN ('pro', 'enterprise'),
      sms_marketing = NEW.tier IN ('pro', 'enterprise'),
      advanced_analytics = NEW.tier IN ('pro', 'enterprise'),
      sms_credits_monthly = CASE
        WHEN NEW.tier = 'starter' THEN 0
        WHEN NEW.tier = 'pro' THEN 500
        WHEN NEW.tier = 'enterprise' THEN 2000
      END,
      -- Enterprise features
      multi_location = NEW.tier = 'enterprise',
      white_label = NEW.tier = 'enterprise',
      social_crossposting = NEW.tier = 'enterprise',
      trial_lead_insights = NEW.tier = 'enterprise',
      api_access = NEW.tier = 'enterprise',
      dedicated_manager = NEW.tier = 'enterprise',
      -- Update max members on gyms table
      updated_at = NOW()
    WHERE gym_id = NEW.id;

    -- Update max members on gym
    NEW.max_members := CASE
      WHEN NEW.tier = 'starter' THEN 100
      WHEN NEW.tier = 'pro' THEN 500
      WHEN NEW.tier = 'enterprise' THEN 999999
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_gym_tier_change
  BEFORE UPDATE OF tier ON gyms
  FOR EACH ROW
  EXECUTE FUNCTION update_gym_tier_features();

-- ============================================
-- FUNCTION: Reset monthly credits
-- ============================================
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE gym_features
  SET
    sms_credits_used = 0,
    email_credits_used = 0,
    credits_reset_at = NOW()
  WHERE credits_reset_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEW: Gym Dashboard Stats (for super admin)
-- ============================================
CREATE OR REPLACE VIEW gym_stats AS
SELECT
  g.id AS gym_id,
  g.name,
  g.slug,
  g.tier,
  g.is_trial,
  g.trial_ends_at,
  g.created_at,
  gf.sms_credits_used,
  gf.sms_credits_monthly,
  gf.email_credits_used,
  gf.email_credits_monthly,
  (SELECT COUNT(*) FROM profiles p WHERE p.gym_id = g.id AND p.role = 'member') AS member_count,
  (SELECT COUNT(*) FROM classes c WHERE c.gym_id = g.id) AS class_count,
  (SELECT COUNT(*) FROM leads l WHERE l.gym_id = g.id) AS lead_count,
  (SELECT COUNT(*) FROM page_views pv WHERE pv.gym_id = g.id AND pv.created_at > NOW() - INTERVAL '30 days') AS page_views_30d
FROM gyms g
LEFT JOIN gym_features gf ON gf.gym_id = g.id;

-- Grant access to the view
GRANT SELECT ON gym_stats TO authenticated;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_gyms_tier ON gyms(tier);
CREATE INDEX idx_gyms_trial ON gyms(is_trial, trial_ends_at);
CREATE INDEX idx_gym_features_gym_id ON gym_features(gym_id);

-- ============================================
-- UPDATED_AT TRIGGER FOR GYM_FEATURES
-- ============================================
CREATE TRIGGER gym_features_updated_at
  BEFORE UPDATE ON gym_features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
