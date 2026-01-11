-- GymSaaS Migration: Check-in System, Locations, and Streak Enhancements
-- Adds multi-location support, check-in verification, and class streaks

-- ============================================
-- LOCATIONS TABLE (for multi-location gyms)
-- ============================================
CREATE TABLE IF NOT EXISTS gym_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- "Downtown", "Westside", etc.
  code CHAR(1) NOT NULL, -- 'A', 'B', 'C' - appended to member IDs
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  -- Geofencing for check-in verification
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  geofence_radius_meters INTEGER DEFAULT 100, -- How close member must be
  -- Bluetooth beacon ID (optional)
  bluetooth_beacon_id TEXT,
  -- Operating hours (JSONB for flexibility)
  operating_hours JSONB DEFAULT '{}'::jsonb,
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gym_id, code)
);

-- ============================================
-- MEMBER ENHANCEMENTS
-- ============================================

-- Add member number and location fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_location_id UUID REFERENCES gym_locations(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Class attendance streak (separate from login streak)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS class_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_class_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS classes_attended INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS classes_missed INTEGER DEFAULT 0;

-- Notification preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_enabled": true,
  "sms_enabled": false,
  "push_enabled": true,
  "streak_alerts": true,
  "class_reminders": true,
  "promo_messages": true
}'::jsonb;

-- ============================================
-- CHECK-IN ENHANCEMENTS
-- ============================================

-- Create check-in method enum
DO $$ BEGIN
  CREATE TYPE checkin_method AS ENUM ('self_app', 'self_tablet', 'staff_manual', 'auto_bluetooth');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add check-in details to class_bookings
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS checkin_method checkin_method;
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS checkin_location_id UUID REFERENCES gym_locations(id) ON DELETE SET NULL;
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES profiles(id) ON DELETE SET NULL; -- Staff who checked them in
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS checkin_latitude DECIMAL(10, 8);
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS checkin_longitude DECIMAL(11, 8);
ALTER TABLE class_bookings ADD COLUMN IF NOT EXISTS was_no_show BOOLEAN DEFAULT FALSE;

-- ============================================
-- GYM SETTINGS ENHANCEMENTS
-- ============================================

-- Add settings to gyms table
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS allow_cross_location_checkin BOOLEAN DEFAULT FALSE;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS require_geofence_checkin BOOLEAN DEFAULT FALSE;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS member_id_prefix TEXT; -- e.g., "GYM" for "GYM-001"
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS next_member_number INTEGER DEFAULT 1;

-- Soft delete for data retention on cancellation
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ; -- When hard delete will occur
ALTER TABLE gyms ADD COLUMN IF NOT EXISTS data_retention_days INTEGER DEFAULT 30;

-- ============================================
-- STREAK TRACKING TABLE
-- Detailed history of streaks for gamification
-- ============================================
CREATE TABLE IF NOT EXISTS streak_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  streak_type TEXT NOT NULL, -- 'login', 'class', 'perfect_week'
  streak_count INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STREAK REWARDS TABLE
-- Define rewards for hitting streak milestones
-- ============================================
CREATE TABLE IF NOT EXISTS streak_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  streak_type TEXT NOT NULL, -- 'login', 'class'
  streak_threshold INTEGER NOT NULL, -- e.g., 7, 30, 100
  reward_type TEXT NOT NULL, -- 'points', 'discount', 'free_class', 'badge'
  reward_value INTEGER, -- Points amount or discount percentage
  badge_name TEXT, -- For badge rewards
  badge_image_url TEXT,
  notification_title TEXT,
  notification_message TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gym_id, streak_type, streak_threshold)
);

-- ============================================
-- MEMBER BADGES TABLE
-- Earned badges for achievements
-- ============================================
CREATE TABLE IF NOT EXISTS member_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_name TEXT NOT NULL,
  badge_image_url TEXT,
  earned_reason TEXT,
  streak_reward_id UUID REFERENCES streak_rewards(id) ON DELETE SET NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATION QUEUE TABLE
-- Pending notifications to send
-- ============================================
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL, -- 'streak_milestone', 'class_reminder', 'perk_unlocked'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  -- Channels to send on (based on user prefs + gym settings)
  send_push BOOLEAN DEFAULT FALSE,
  send_email BOOLEAN DEFAULT FALSE,
  send_sms BOOLEAN DEFAULT FALSE,
  -- Status tracking
  push_sent_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  sms_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTION: Generate Member Number
-- Creates IDs like "GYM-001A" for multi-location
-- ============================================
CREATE OR REPLACE FUNCTION generate_member_number()
RETURNS TRIGGER AS $$
DECLARE
  gym_prefix TEXT;
  next_num INTEGER;
  location_code CHAR(1);
  new_member_number TEXT;
BEGIN
  -- Only generate for members (not staff/owners)
  IF NEW.role != 'member' THEN
    RETURN NEW;
  END IF;

  -- Skip if already has a member number
  IF NEW.member_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get gym settings
  SELECT
    COALESCE(member_id_prefix, 'MBR'),
    next_member_number
  INTO gym_prefix, next_num
  FROM gyms
  WHERE id = NEW.gym_id;

  -- Get location code if member has a primary location
  IF NEW.primary_location_id IS NOT NULL THEN
    SELECT code INTO location_code
    FROM gym_locations
    WHERE id = NEW.primary_location_id;
  END IF;

  -- Generate member number: PREFIX-001 or PREFIX-001A
  new_member_number := gym_prefix || '-' || LPAD(next_num::TEXT, 3, '0');
  IF location_code IS NOT NULL THEN
    new_member_number := new_member_number || location_code;
  END IF;

  NEW.member_number := new_member_number;

  -- Increment gym's counter
  UPDATE gyms
  SET next_member_number = next_member_number + 1
  WHERE id = NEW.gym_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER generate_member_number_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_member_number();

-- ============================================
-- FUNCTION: Update Class Streak
-- Called after check-in or no-show marking
-- ============================================
CREATE OR REPLACE FUNCTION update_class_streak()
RETURNS TRIGGER AS $$
BEGIN
  -- When member checks in
  IF NEW.checked_in_at IS NOT NULL AND OLD.checked_in_at IS NULL THEN
    UPDATE profiles
    SET
      class_streak = class_streak + 1,
      classes_attended = classes_attended + 1,
      best_class_streak = GREATEST(best_class_streak, class_streak + 1)
    WHERE id = NEW.member_id;
  END IF;

  -- When marked as no-show, reset streak
  IF NEW.was_no_show = TRUE AND OLD.was_no_show = FALSE THEN
    -- Save current streak to history before resetting
    INSERT INTO streak_history (member_id, streak_type, streak_count, started_at, ended_at, is_active)
    SELECT
      NEW.member_id,
      'class',
      class_streak,
      NOW() - (class_streak || ' days')::INTERVAL,
      NOW(),
      FALSE
    FROM profiles
    WHERE id = NEW.member_id AND class_streak > 0;

    -- Reset streak and increment misses
    UPDATE profiles
    SET
      class_streak = 0,
      classes_missed = classes_missed + 1
    WHERE id = NEW.member_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER class_streak_trigger
  AFTER UPDATE OF checked_in_at, was_no_show ON class_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_class_streak();

-- ============================================
-- FUNCTION: Verify Check-in Location
-- Validates member is within geofence
-- ============================================
CREATE OR REPLACE FUNCTION verify_checkin_location(
  p_gym_id UUID,
  p_location_id UUID,
  p_latitude DECIMAL,
  p_longitude DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  loc_lat DECIMAL;
  loc_lng DECIMAL;
  loc_radius INTEGER;
  distance_meters DECIMAL;
BEGIN
  -- Get location coordinates
  SELECT latitude, longitude, geofence_radius_meters
  INTO loc_lat, loc_lng, loc_radius
  FROM gym_locations
  WHERE id = p_location_id AND gym_id = p_gym_id;

  IF loc_lat IS NULL OR loc_lng IS NULL THEN
    -- Location doesn't have geofencing, allow check-in
    RETURN TRUE;
  END IF;

  -- Calculate distance using Haversine formula (simplified)
  -- Returns approximate distance in meters
  distance_meters := 6371000 * acos(
    cos(radians(loc_lat)) * cos(radians(p_latitude)) *
    cos(radians(p_longitude) - radians(loc_lng)) +
    sin(radians(loc_lat)) * sin(radians(p_latitude))
  );

  RETURN distance_meters <= loc_radius;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE gym_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- GYM_LOCATIONS POLICIES
CREATE POLICY "Anyone can view active gym locations"
  ON gym_locations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Gym owners can manage locations"
  ON gym_locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = gym_locations.gym_id
      AND profiles.role IN ('gym_owner', 'super_admin')
    )
  );

-- STREAK_HISTORY POLICIES
CREATE POLICY "Members can view own streak history"
  ON streak_history FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "Gym owners can view member streaks"
  ON streak_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.gym_id = p2.gym_id
      WHERE p1.id = auth.uid()
      AND p2.id = streak_history.member_id
      AND p1.role IN ('gym_owner', 'gym_staff', 'super_admin')
    )
  );

-- STREAK_REWARDS POLICIES
CREATE POLICY "Anyone in gym can view streak rewards"
  ON streak_rewards FOR SELECT
  USING (
    gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
    AND is_active = true
  );

CREATE POLICY "Gym owners can manage streak rewards"
  ON streak_rewards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = streak_rewards.gym_id
      AND profiles.role IN ('gym_owner', 'super_admin')
    )
  );

-- MEMBER_BADGES POLICIES
CREATE POLICY "Members can view own badges"
  ON member_badges FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "Gym members can view each other badges"
  ON member_badges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.gym_id = p2.gym_id
      WHERE p1.id = auth.uid()
      AND p2.id = member_badges.member_id
    )
  );

-- NOTIFICATION_QUEUE POLICIES (mostly system-managed)
CREATE POLICY "Members can view own notifications"
  ON notification_queue FOR SELECT
  USING (recipient_id = auth.uid());

-- ============================================
-- MISSING POLICIES FROM SCHEMA REVIEW
-- ============================================

-- Members can view membership plans
CREATE POLICY "Members can view gym membership plans"
  ON membership_plans FOR SELECT
  USING (
    gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
    AND is_active = true
  );

-- Members can view class schedules
CREATE POLICY "Members can view class schedules"
  ON class_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      JOIN profiles p ON p.gym_id = c.gym_id
      WHERE c.id = class_schedules.class_id
      AND p.id = auth.uid()
    )
  );

-- Members can view loyalty rewards
CREATE POLICY "Members can view gym rewards"
  ON loyalty_rewards FOR SELECT
  USING (
    is_active = true
    AND gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
  );

-- Staff can update check-in status
CREATE POLICY "Staff can update bookings for check-in"
  ON class_bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles staff
      JOIN profiles member ON staff.gym_id = member.gym_id
      WHERE staff.id = auth.uid()
      AND member.id = class_bookings.member_id
      AND staff.role IN ('gym_owner', 'gym_staff')
    )
  );

-- Staff can view all bookings in their gym
CREATE POLICY "Staff can view gym bookings"
  ON class_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles staff
      JOIN profiles member ON staff.gym_id = member.gym_id
      WHERE staff.id = auth.uid()
      AND member.id = class_bookings.member_id
      AND staff.role IN ('gym_owner', 'gym_staff')
    )
  );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_gym_locations_gym_id ON gym_locations(gym_id);
CREATE INDEX IF NOT EXISTS idx_profiles_member_number ON profiles(member_number);
CREATE INDEX IF NOT EXISTS idx_profiles_gym_trial ON profiles(gym_id, is_trial);
CREATE INDEX IF NOT EXISTS idx_class_bookings_location ON class_bookings(checkin_location_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_noshow ON class_bookings(was_no_show, schedule_id);
CREATE INDEX IF NOT EXISTS idx_streak_history_member ON streak_history(member_id, streak_type);
CREATE INDEX IF NOT EXISTS idx_streak_rewards_gym ON streak_rewards(gym_id, streak_type);
CREATE INDEX IF NOT EXISTS idx_member_badges_member ON member_badges(member_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_recipient ON notification_queue(recipient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_gyms_deleted ON gyms(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================
-- VIEW: Member Check-in Display
-- For tablet/kiosk - shows only safe info
-- ============================================
CREATE OR REPLACE VIEW member_checkin_display AS
SELECT
  p.id,
  p.member_number,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.gym_id,
  p.class_streak,
  p.is_trial,
  -- Today's booked classes
  (
    SELECT json_agg(json_build_object(
      'booking_id', cb.id,
      'class_name', c.name,
      'start_time', cs.start_time,
      'checked_in', cb.checked_in_at IS NOT NULL
    ))
    FROM class_bookings cb
    JOIN class_schedules cs ON cs.id = cb.schedule_id
    JOIN classes c ON c.id = cs.class_id
    WHERE cb.member_id = p.id
    AND cb.booking_date = CURRENT_DATE
  ) AS todays_classes
FROM profiles p
WHERE p.role = 'member'
AND p.is_trial = FALSE; -- Trial members can't check in

-- Grant access to authenticated users
GRANT SELECT ON member_checkin_display TO authenticated;

-- ============================================
-- VIEW: Soft-deleted Gyms Pending Cleanup
-- For super admin cleanup jobs
-- ============================================
CREATE OR REPLACE VIEW gyms_pending_deletion AS
SELECT
  g.id,
  g.name,
  g.slug,
  g.deleted_at,
  g.deletion_scheduled_at,
  g.data_retention_days,
  (SELECT COUNT(*) FROM profiles p WHERE p.gym_id = g.id) AS member_count,
  g.stripe_account_id,
  g.stripe_subscription_id
FROM gyms g
WHERE g.deleted_at IS NOT NULL
AND g.deletion_scheduled_at <= NOW();

GRANT SELECT ON gyms_pending_deletion TO authenticated;
