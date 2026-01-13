-- GymSaaS Migration 006 Part 2: Update policies to include gym_manager
-- NOTE: Run this AFTER the enum value has been added in part 1

-- ============================================
-- UPDATE EXISTING POLICIES TO INCLUDE MANAGER
-- ============================================

-- CLASSES: Managers can manage classes (staff cannot)
DROP POLICY IF EXISTS "Gym owners can manage classes" ON classes;
CREATE POLICY "Owners and managers can manage classes"
  ON classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = classes.gym_id
      AND profiles.role IN ('gym_owner', 'gym_manager', 'super_admin')
    )
  );

-- LEADS: Managers can manage all leads, staff only assigned leads
DROP POLICY IF EXISTS "Gym owners can manage leads" ON leads;

CREATE POLICY "Owners and managers can manage leads"
  ON leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = leads.gym_id
      AND profiles.role IN ('gym_owner', 'gym_manager', 'super_admin')
    )
  );

CREATE POLICY "Staff can view assigned leads"
  ON leads FOR SELECT
  USING (
    assigned_to = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'gym_staff'
    )
  );

-- FLASH_SALES: Managers can create, staff cannot
DROP POLICY IF EXISTS "Gym owners can manage flash sales" ON flash_sales;
CREATE POLICY "Owners and managers can manage flash sales"
  ON flash_sales FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = flash_sales.gym_id
      AND profiles.role IN ('gym_owner', 'gym_manager', 'super_admin')
    )
  );

-- COUPONS: Managers can manage, staff cannot
DROP POLICY IF EXISTS "Gym owners can manage coupons" ON coupons;
CREATE POLICY "Owners and managers can manage coupons"
  ON coupons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = coupons.gym_id
      AND profiles.role IN ('gym_owner', 'gym_manager', 'super_admin')
    )
  );

-- MESSAGE_CAMPAIGNS: Managers can create, staff cannot
DROP POLICY IF EXISTS "Gym owners can view their campaigns" ON message_campaigns;
DROP POLICY IF EXISTS "Gym owners can create campaigns" ON message_campaigns;

CREATE POLICY "Owners and managers can view campaigns"
  ON message_campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = message_campaigns.gym_id
      AND profiles.role IN ('gym_owner', 'gym_manager', 'super_admin')
    )
  );

CREATE POLICY "Owners and managers can create campaigns"
  ON message_campaigns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = message_campaigns.gym_id
      AND profiles.role IN ('gym_owner', 'gym_manager', 'super_admin')
    )
  );

-- MESSAGE_TEMPLATES: Managers can manage, staff cannot
DROP POLICY IF EXISTS "Gym owners can manage their templates" ON message_templates;
CREATE POLICY "Owners and managers can manage templates"
  ON message_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = message_templates.gym_id
      AND profiles.role IN ('gym_owner', 'gym_manager', 'super_admin')
    )
  );

-- MESSAGE_QUEUE: Managers can use, staff cannot
DROP POLICY IF EXISTS "Gym owners can view message queue" ON message_queue;
DROP POLICY IF EXISTS "Gym owners can queue messages" ON message_queue;

CREATE POLICY "Owners and managers can view message queue"
  ON message_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = message_queue.gym_id
      AND profiles.role IN ('gym_owner', 'gym_manager', 'super_admin')
    )
  );

CREATE POLICY "Owners and managers can queue messages"
  ON message_queue FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = message_queue.gym_id
      AND profiles.role IN ('gym_owner', 'gym_manager', 'super_admin')
    )
  );

-- FEATURE_REQUESTS: Managers can also submit
DROP POLICY IF EXISTS "Gym owners can view their requests" ON feature_requests;
DROP POLICY IF EXISTS "Gym owners can create requests" ON feature_requests;

CREATE POLICY "Owners and managers can view requests"
  ON feature_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = feature_requests.gym_id
      AND profiles.role IN ('gym_owner', 'gym_manager', 'super_admin')
    )
  );

CREATE POLICY "Owners and managers can create requests"
  ON feature_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = feature_requests.gym_id
      AND profiles.role IN ('gym_owner', 'gym_manager', 'super_admin')
    )
  );

-- ============================================
-- STAFF-SPECIFIC POLICIES (Limited Access)
-- ============================================

-- Staff can view today's class schedules only
CREATE POLICY "Staff can view todays schedules"
  ON class_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'gym_staff'
    )
    AND (
      (recurring = TRUE AND day_of_week = EXTRACT(DOW FROM CURRENT_DATE))
      OR
      (specific_date = CURRENT_DATE)
    )
  );

-- Staff can view classes (names, not full management)
CREATE POLICY "Staff can view gym classes"
  ON classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = classes.gym_id
      AND profiles.role = 'gym_staff'
    )
  );

-- ============================================
-- ANALYTICS ACCESS
-- ============================================

DROP POLICY IF EXISTS "Super admin full access to page_views" ON page_views;

CREATE POLICY "Owners and managers can view analytics"
  ON page_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = page_views.gym_id
      AND profiles.role IN ('gym_owner', 'gym_manager', 'super_admin')
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
-- STREAK_REWARDS: Managers can manage
-- ============================================
DROP POLICY IF EXISTS "Gym owners can manage streak rewards" ON streak_rewards;
CREATE POLICY "Owners and managers can manage streak rewards"
  ON streak_rewards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = streak_rewards.gym_id
      AND profiles.role IN ('gym_owner', 'gym_manager', 'super_admin')
    )
  );

-- ============================================
-- HELPER VIEW: Staff Dashboard (Limited)
-- ============================================
CREATE OR REPLACE VIEW staff_dashboard AS
SELECT
  p.id,
  p.gym_id,
  (
    SELECT COUNT(*) FROM class_bookings cb
    JOIN class_schedules cs ON cs.id = cb.schedule_id
    JOIN classes c ON c.id = cs.class_id
    WHERE c.gym_id = p.gym_id
    AND cb.booking_date = CURRENT_DATE
    AND cb.checked_in_at IS NULL
  ) AS pending_checkins_today,
  (
    SELECT COUNT(*) FROM class_bookings cb
    JOIN class_schedules cs ON cs.id = cb.schedule_id
    JOIN classes c ON c.id = cs.class_id
    WHERE c.gym_id = p.gym_id
    AND cb.booking_date = CURRENT_DATE
    AND cb.checked_in_at IS NOT NULL
  ) AS completed_checkins_today,
  (
    SELECT json_agg(json_build_object(
      'class_name', c.name,
      'start_time', cs.start_time,
      'capacity', c.capacity,
      'booked', (SELECT COUNT(*) FROM class_bookings cb2 WHERE cb2.schedule_id = cs.id AND cb2.booking_date = CURRENT_DATE)
    ))
    FROM class_schedules cs
    JOIN classes c ON c.id = cs.class_id
    WHERE c.gym_id = p.gym_id
    AND (
      (cs.recurring = TRUE AND cs.day_of_week = EXTRACT(DOW FROM CURRENT_DATE))
      OR cs.specific_date = CURRENT_DATE
    )
  ) AS todays_classes
FROM profiles p
WHERE p.id = auth.uid()
AND p.role = 'gym_staff';

GRANT SELECT ON staff_dashboard TO authenticated;

-- ============================================
-- FUNCTION: Check role permission
-- ============================================
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = p_user_id;

  CASE p_permission
    WHEN 'platform.admin' THEN
      RETURN user_role = 'super_admin';
    WHEN 'gym.settings' THEN
      RETURN user_role IN ('gym_owner', 'super_admin');
    WHEN 'gym.billing' THEN
      RETURN user_role IN ('gym_owner', 'super_admin');
    WHEN 'gym.website' THEN
      RETURN user_role IN ('gym_owner', 'super_admin');
    WHEN 'gym.addons' THEN
      RETURN user_role IN ('gym_owner', 'super_admin');
    WHEN 'marketing.campaigns' THEN
      RETURN user_role IN ('gym_owner', 'gym_manager', 'super_admin');
    WHEN 'marketing.flashsales' THEN
      RETURN user_role IN ('gym_owner', 'gym_manager', 'super_admin');
    WHEN 'marketing.coupons' THEN
      RETURN user_role IN ('gym_owner', 'gym_manager', 'super_admin');
    WHEN 'members.view' THEN
      RETURN user_role IN ('gym_owner', 'gym_manager', 'gym_staff', 'super_admin');
    WHEN 'members.manage' THEN
      RETURN user_role IN ('gym_owner', 'gym_manager', 'super_admin');
    WHEN 'members.checkin' THEN
      RETURN user_role IN ('gym_owner', 'gym_manager', 'gym_staff', 'super_admin');
    WHEN 'classes.view' THEN
      RETURN user_role IN ('gym_owner', 'gym_manager', 'gym_staff', 'super_admin');
    WHEN 'classes.manage' THEN
      RETURN user_role IN ('gym_owner', 'gym_manager', 'super_admin');
    WHEN 'leads.view_all' THEN
      RETURN user_role IN ('gym_owner', 'gym_manager', 'super_admin');
    WHEN 'leads.view_assigned' THEN
      RETURN user_role IN ('gym_owner', 'gym_manager', 'gym_staff', 'super_admin');
    WHEN 'leads.manage' THEN
      RETURN user_role IN ('gym_owner', 'gym_manager', 'super_admin');
    WHEN 'analytics.view' THEN
      RETURN user_role IN ('gym_owner', 'gym_manager', 'super_admin');
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
