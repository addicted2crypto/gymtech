-- GymSaaS Initial Database Schema
-- Run this in your Supabase SQL editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('super_admin', 'gym_owner', 'gym_staff', 'member');
CREATE TYPE membership_interval AS ENUM ('week', 'month', 'year');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'trial', 'converted', 'lost');
CREATE TYPE campaign_trigger AS ENUM ('trial_signup', 'inactive_7_days', 'inactive_30_days', 'birthday', 'membership_expiring');
CREATE TYPE campaign_channel AS ENUM ('email', 'sms');
CREATE TYPE social_platform AS ENUM ('instagram', 'facebook', 'tiktok', 'youtube');

-- ============================================
-- GYMS TABLE
-- ============================================
CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  custom_domain TEXT UNIQUE,
  domain_verified BOOLEAN DEFAULT FALSE,
  stripe_account_id TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gym domains for verification
CREATE TABLE gym_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  ssl_provisioned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES gyms(id) ON DELETE SET NULL,
  role user_role DEFAULT 'member',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_url TEXT,
  email_encrypted TEXT,
  phone_encrypted TEXT,
  login_streak INTEGER DEFAULT 0,
  total_logins INTEGER DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEMBERSHIP TABLES
-- ============================================
CREATE TABLE membership_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in cents
  interval membership_interval DEFAULT 'month',
  stripe_price_id TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE member_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES membership_plans(id) ON DELETE SET NULL,
  stripe_subscription_id TEXT,
  status subscription_status DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLASSES & SCHEDULING
-- ============================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  capacity INTEGER DEFAULT 20,
  duration_minutes INTEGER DEFAULT 60,
  category TEXT DEFAULT 'general',
  difficulty_level TEXT DEFAULT 'all-levels',
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE class_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  recurring BOOLEAN DEFAULT TRUE,
  specific_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE class_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES class_schedules(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'booked',
  checked_in_at TIMESTAMPTZ,
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  -- Generated column for date-based uniqueness (computed at insert, stored)
  booking_date DATE GENERATED ALWAYS AS ((booked_at AT TIME ZONE 'UTC')::date) STORED,
  -- Prevent double-booking same class on same day
  UNIQUE(schedule_id, member_id, booking_date)
);

-- ============================================
-- ENGAGEMENT & REWARDS
-- ============================================
CREATE TABLE loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL, -- 'discount', 'free_class', 'merch', etc.
  discount_percent INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE flash_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_percent INTEGER NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  min_login_streak INTEGER DEFAULT 0,
  applicable_to TEXT DEFAULT 'all', -- 'all', specific plan_id, or class_id
  coupon_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE member_rewards_claimed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES loyalty_rewards(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LANDING PAGES
-- ============================================
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}'::jsonb, -- Page builder state
  is_published BOOLEAN DEFAULT FALSE,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gym_id, slug)
);

-- ============================================
-- MEDIA & SOCIAL
-- ============================================
CREATE TABLE media_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image', 'video'
  caption TEXT,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  social_posted_to JSONB DEFAULT '[]'::jsonb, -- Array of platforms posted to
  coupon_code TEXT, -- Coupon attached to social posts
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE social_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gym_id, platform)
);

CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id UUID REFERENCES media_uploads(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  platform_post_id TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  engagement_data JSONB DEFAULT '{}'::jsonb -- likes, comments, shares
);

-- ============================================
-- CRM & LEADS
-- ============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'website', 'referral', 'social', 'walk-in'
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  status lead_status DEFAULT 'new',
  notes TEXT,
  trial_started_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE automated_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type campaign_trigger NOT NULL,
  message_template TEXT NOT NULL,
  channel campaign_channel NOT NULL,
  delay_hours INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES automated_campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- ============================================
-- ANALYTICS
-- ============================================
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  page_slug TEXT NOT NULL,
  visitor_id TEXT NOT NULL, -- Anonymous visitor ID
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_rewards_claimed ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Super admin can access everything
CREATE POLICY "Super admins have full access to gyms"
  ON gyms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Gym owners can manage their own gym
CREATE POLICY "Gym owners can manage their gym"
  ON gyms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = gyms.id
      AND profiles.role = 'gym_owner'
    )
  );

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Gym owners/staff can view all profiles in their gym
CREATE POLICY "Gym staff can view gym members"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.gym_id = profiles.gym_id
      AND p.role IN ('gym_owner', 'gym_staff')
    )
  );

-- Members can view classes in their gym
CREATE POLICY "Members can view gym classes"
  ON classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = classes.gym_id
    )
  );

-- Members can view flash sales based on their login streak
CREATE POLICY "Members can view eligible flash sales"
  ON flash_sales FOR SELECT
  USING (
    is_active = true
    AND valid_from <= NOW()
    AND valid_until >= NOW()
    AND min_login_streak <= (
      SELECT login_streak FROM profiles WHERE id = auth.uid()
    )
    AND gym_id = (
      SELECT gym_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Members can book classes
CREATE POLICY "Members can manage their own bookings"
  ON class_bookings FOR ALL
  USING (member_id = auth.uid());

-- Public can view published landing pages
CREATE POLICY "Anyone can view published landing pages"
  ON landing_pages FOR SELECT
  USING (is_published = true);

-- Gym owners can manage landing pages
CREATE POLICY "Gym owners can manage landing pages"
  ON landing_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = landing_pages.gym_id
      AND profiles.role = 'gym_owner'
    )
  );

-- Page views are insertable by anyone (anonymous tracking)
CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update login streak
CREATE OR REPLACE FUNCTION update_login_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if last login was yesterday
  IF OLD.last_login_at IS NOT NULL AND
     OLD.last_login_at::date = (CURRENT_DATE - INTERVAL '1 day')::date THEN
    NEW.login_streak := OLD.login_streak + 1;
  -- Check if last login was today (don't increment)
  ELSIF OLD.last_login_at IS NOT NULL AND
        OLD.last_login_at::date = CURRENT_DATE THEN
    NEW.login_streak := OLD.login_streak;
  -- Reset streak if more than 1 day gap
  ELSE
    NEW.login_streak := 1;
  END IF;

  NEW.total_logins := OLD.total_logins + 1;
  NEW.last_login_at := NOW();

  -- Award loyalty points based on streak
  IF NEW.login_streak >= 7 THEN
    NEW.loyalty_points := OLD.loyalty_points + 10;
  ELSIF NEW.login_streak >= 3 THEN
    NEW.loyalty_points := OLD.loyalty_points + 5;
  ELSE
    NEW.loyalty_points := OLD.loyalty_points + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER gyms_updated_at
  BEFORE UPDATE ON gyms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to create profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_gym_id ON profiles(gym_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_classes_gym_id ON classes(gym_id);
CREATE INDEX idx_class_schedules_class_id ON class_schedules(class_id);
CREATE INDEX idx_class_bookings_member_id ON class_bookings(member_id);
CREATE INDEX idx_class_bookings_schedule_id ON class_bookings(schedule_id);
CREATE INDEX idx_flash_sales_gym_id ON flash_sales(gym_id);
CREATE INDEX idx_flash_sales_active ON flash_sales(is_active, valid_from, valid_until);
CREATE INDEX idx_landing_pages_gym_slug ON landing_pages(gym_id, slug);
CREATE INDEX idx_media_uploads_gym_id ON media_uploads(gym_id);
CREATE INDEX idx_page_views_gym_date ON page_views(gym_id, created_at);
CREATE INDEX idx_leads_gym_status ON leads(gym_id, status);
CREATE INDEX idx_member_subscriptions_member_id ON member_subscriptions(member_id);
