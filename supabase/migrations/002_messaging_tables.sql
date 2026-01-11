-- Messaging System Tables
-- Secure messaging with PII protection

-- Add attendance_percentage to profiles for consistency level queries
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS attendance_percentage INTEGER DEFAULT 0;

-- Create offer type enum
DO $$ BEGIN
  CREATE TYPE offer_type AS ENUM ('percent_off', 'dollar_off', 'free_class', 'free_merch', 'free_month');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- COUPONS TABLE
-- Stores promotional coupons created via messaging
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  offer_type offer_type NOT NULL,
  value INTEGER DEFAULT 0, -- Percentage or dollar amount
  description TEXT,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  max_uses INTEGER, -- NULL = unlimited
  current_uses INTEGER DEFAULT 0,
  min_purchase INTEGER, -- Minimum purchase amount in cents (optional)
  applicable_to TEXT DEFAULT 'all', -- 'all', 'membership', 'class', 'merch'
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gym_id, code)
);

-- Coupon redemptions tracking
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount_saved INTEGER, -- Amount saved in cents
  order_id TEXT, -- Reference to Stripe payment or internal order
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create message channel enum
DO $$ BEGIN
  CREATE TYPE message_channel AS ENUM ('email', 'sms', 'both');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create message status enum
DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('queued', 'sending', 'sent', 'delivered', 'failed', 'bounced');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- MESSAGE CAMPAIGNS TABLE
-- Tracks bulk messaging campaigns initiated by gym owners
-- ============================================
CREATE TABLE IF NOT EXISTS message_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_type TEXT NOT NULL, -- 'all_members', 'trial_users', 'inactive', 'specific_level'
  consistency_level TEXT, -- 'bronze', 'silver', 'gold', 'platinum' (if applicable)
  channel message_channel NOT NULL,
  subject TEXT, -- For emails
  message_template TEXT NOT NULL, -- Original template with {tokens}
  total_recipients INTEGER DEFAULT 0,
  queued_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- MESSAGE QUEUE TABLE
-- Individual messages queued for sending
-- PII (email/phone) is NEVER stored here - only profile ID reference
-- ============================================
CREATE TABLE IF NOT EXISTS message_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES message_campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  channel message_channel NOT NULL,
  subject TEXT, -- Personalized subject (PII-free)
  body TEXT NOT NULL, -- Personalized message body (PII-free after token replacement)
  status message_status DEFAULT 'queued',
  external_id TEXT, -- ID from email/SMS provider (SendGrid, Twilio, etc.)
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MESSAGE TEMPLATES TABLE
-- Reusable message templates per gym
-- ============================================
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  template_type TEXT DEFAULT 'promotional', -- 'promotional', 'reminder', 'welcome', 'reactivation'
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- Ensures PII is protected and gym data is isolated
-- ============================================

-- Enable RLS on new tables
ALTER TABLE message_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- MESSAGE CAMPAIGNS POLICIES
-- Only gym owners can view their campaigns
CREATE POLICY "Gym owners can view their campaigns"
  ON message_campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = message_campaigns.gym_id
      AND profiles.role IN ('gym_owner', 'super_admin')
    )
  );

-- Only gym owners can create campaigns for their gym
CREATE POLICY "Gym owners can create campaigns"
  ON message_campaigns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = message_campaigns.gym_id
      AND profiles.role IN ('gym_owner', 'super_admin')
    )
  );

-- MESSAGE QUEUE POLICIES
-- Only gym owners can view messages for their gym
CREATE POLICY "Gym owners can view message queue"
  ON message_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = message_queue.gym_id
      AND profiles.role IN ('gym_owner', 'super_admin')
    )
  );

-- Only gym owners can insert into message queue
CREATE POLICY "Gym owners can queue messages"
  ON message_queue FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = message_queue.gym_id
      AND profiles.role IN ('gym_owner', 'super_admin')
    )
  );

-- Allow service role to update message status (for background workers)
-- Note: This uses service role key, not user auth

-- MESSAGE TEMPLATES POLICIES
CREATE POLICY "Gym owners can manage their templates"
  ON message_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = message_templates.gym_id
      AND profiles.role IN ('gym_owner', 'super_admin')
    )
  );

-- COUPONS POLICIES
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Gym owners can manage coupons for their gym
CREATE POLICY "Gym owners can manage coupons"
  ON coupons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = coupons.gym_id
      AND profiles.role IN ('gym_owner', 'super_admin')
    )
  );

-- Members can view active coupons for their gym (to redeem)
CREATE POLICY "Members can view active coupons"
  ON coupons FOR SELECT
  USING (
    is_active = true
    AND valid_from <= NOW()
    AND valid_until >= NOW()
    AND gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
  );

-- Members can view their own redemptions
CREATE POLICY "Members can view own redemptions"
  ON coupon_redemptions FOR SELECT
  USING (member_id = auth.uid());

-- System can insert redemptions (via service role or validated API)
CREATE POLICY "Allow redemption inserts"
  ON coupon_redemptions FOR INSERT
  WITH CHECK (member_id = auth.uid());

-- ============================================
-- SECURE FUNCTION FOR DECRYPTING PII
-- Only callable server-side with service role
-- ============================================
CREATE OR REPLACE FUNCTION get_recipient_contact_info(recipient_profile_id UUID)
RETURNS TABLE (
  email TEXT,
  phone TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Get the role of the calling user
  SELECT role INTO caller_role
  FROM profiles
  WHERE id = auth.uid();

  -- Only allow gym owners and super admins to access PII
  IF caller_role NOT IN ('gym_owner', 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized access to PII';
  END IF;

  -- Only allow access to members in the same gym
  IF NOT EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.gym_id = p2.gym_id
    WHERE p1.id = auth.uid()
    AND p2.id = recipient_profile_id
    AND p1.role IN ('gym_owner', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Cannot access members outside your gym';
  END IF;

  -- Return decrypted PII (in production, use pgcrypto decrypt functions)
  -- This assumes email_encrypted/phone_encrypted store the actual values
  -- In production, these would be encrypted and this function would decrypt
  RETURN QUERY
  SELECT
    profiles.email_encrypted AS email,
    profiles.phone_encrypted AS phone
  FROM profiles
  WHERE profiles.id = recipient_profile_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_message_campaigns_gym_id ON message_campaigns(gym_id);
CREATE INDEX IF NOT EXISTS idx_message_campaigns_created_at ON message_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_queue_gym_id ON message_queue(gym_id);
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON message_queue(status);
CREATE INDEX IF NOT EXISTS idx_message_queue_campaign_id ON message_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_message_templates_gym_id ON message_templates(gym_id);
CREATE INDEX IF NOT EXISTS idx_profiles_attendance ON profiles(gym_id, attendance_percentage);
CREATE INDEX IF NOT EXISTS idx_coupons_gym_id ON coupons(gym_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(gym_id, code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(gym_id, is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_member ON coupon_redemptions(member_id);

-- ============================================
-- TRIGGER FOR TEMPLATE UPDATED_AT
-- ============================================
CREATE TRIGGER message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- HELPER VIEW FOR CAMPAIGN STATS
-- Aggregates message stats without exposing PII
-- ============================================
CREATE OR REPLACE VIEW campaign_stats AS
SELECT
  mc.id,
  mc.gym_id,
  mc.recipient_type,
  mc.channel,
  mc.subject,
  mc.total_recipients,
  mc.created_at,
  mc.completed_at,
  COUNT(CASE WHEN mq.status = 'sent' THEN 1 END) AS sent,
  COUNT(CASE WHEN mq.status = 'delivered' THEN 1 END) AS delivered,
  COUNT(CASE WHEN mq.status = 'failed' THEN 1 END) AS failed,
  COUNT(CASE WHEN mq.opened_at IS NOT NULL THEN 1 END) AS opened
FROM message_campaigns mc
LEFT JOIN message_queue mq ON mq.campaign_id = mc.id
GROUP BY mc.id;

-- Grant select on view to authenticated users
GRANT SELECT ON campaign_stats TO authenticated;
