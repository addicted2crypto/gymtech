-- GymSaaS Migration: Price Change Approval Workflow
-- Gym owners request price changes, super admin approves

-- ============================================
-- PRICE CHANGE REQUEST STATUS
-- ============================================
DO $$ BEGIN
  CREATE TYPE price_change_status AS ENUM ('pending', 'approved', 'rejected', 'applied');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- PRICE CHANGE REQUESTS TABLE
-- Gym owners submit requests, super admin reviews
-- ============================================
CREATE TABLE IF NOT EXISTS price_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES membership_plans(id) ON DELETE CASCADE NOT NULL,

  -- Who requested and when
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),

  -- The change details
  current_price INTEGER NOT NULL,        -- Price at time of request (cents)
  requested_price INTEGER NOT NULL,      -- New price they want (cents)
  reason TEXT,                           -- Why they want to change it
  effective_date DATE,                   -- When they want it to take effect

  -- Review details
  status price_change_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,                     -- Super admin's notes

  -- For rejected requests - allow resubmission
  rejection_reason TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRICE HISTORY TABLE
-- Track all price changes for audit trail
-- ============================================
CREATE TABLE IF NOT EXISTS membership_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES membership_plans(id) ON DELETE CASCADE NOT NULL,
  old_price INTEGER NOT NULL,
  new_price INTEGER NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  change_request_id UUID REFERENCES price_change_requests(id) ON DELETE SET NULL,
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LOCK DOWN PRICE CHANGES ON MEMBERSHIP_PLANS
-- Only super admin can directly change prices
-- ============================================

-- First, drop the existing owner policy that allows ALL operations
DROP POLICY IF EXISTS "Gym owners can manage membership plans" ON membership_plans;

-- Gym owners can VIEW and CREATE plans
CREATE POLICY "Gym owners can view membership plans"
  ON membership_plans FOR SELECT
  USING (
    gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Gym owners can create membership plans"
  ON membership_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = membership_plans.gym_id
      AND profiles.role IN ('gym_owner', 'super_admin')
    )
  );

-- Gym owners can UPDATE plans BUT NOT the price column
-- They can change name, description, features, is_active
CREATE POLICY "Gym owners can update non-price fields"
  ON membership_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = membership_plans.gym_id
      AND profiles.role IN ('gym_owner', 'super_admin')
    )
  );
-- Note: The actual price protection is done via trigger below

-- Gym owners can DELETE (deactivate) plans
CREATE POLICY "Gym owners can delete membership plans"
  ON membership_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gym_id = membership_plans.gym_id
      AND profiles.role IN ('gym_owner', 'super_admin')
    )
  );

-- ============================================
-- TRIGGER: Prevent direct price changes
-- Only super_admin can change price directly
-- ============================================
CREATE OR REPLACE FUNCTION protect_price_changes()
RETURNS TRIGGER AS $$
DECLARE
  caller_role user_role;
BEGIN
  -- Get caller's role
  SELECT role INTO caller_role
  FROM profiles
  WHERE id = auth.uid();

  -- If price is being changed
  IF NEW.price != OLD.price THEN
    -- Only super_admin can change price directly
    IF caller_role != 'super_admin' THEN
      RAISE EXCEPTION 'Price changes require admin approval. Please submit a price change request.';
    END IF;

    -- Log the price change to history
    INSERT INTO membership_price_history (plan_id, old_price, new_price, changed_by, reason)
    VALUES (OLD.id, OLD.price, NEW.price, auth.uid(), 'Direct change by super admin');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_price_trigger ON membership_plans;
CREATE TRIGGER protect_price_trigger
  BEFORE UPDATE ON membership_plans
  FOR EACH ROW
  EXECUTE FUNCTION protect_price_changes();

-- ============================================
-- RLS POLICIES FOR PRICE CHANGE REQUESTS
-- ============================================
ALTER TABLE price_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_price_history ENABLE ROW LEVEL SECURITY;

-- Gym owners can view and create requests for their gym
CREATE POLICY "Gym owners can view their price requests"
  ON price_change_requests FOR SELECT
  USING (
    gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('gym_owner', 'super_admin')
  );

CREATE POLICY "Gym owners can submit price requests"
  ON price_change_requests FOR INSERT
  WITH CHECK (
    gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'gym_owner'
    AND status = 'pending'  -- Can only create pending requests
  );

-- Super admin can view all requests
CREATE POLICY "Super admin can view all price requests"
  ON price_change_requests FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Super admin can update request status (approve/reject)
CREATE POLICY "Super admin can review price requests"
  ON price_change_requests FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Price history viewable by gym owners (their plans) and super admin (all)
CREATE POLICY "View price history"
  ON membership_price_history FOR SELECT
  USING (
    plan_id IN (
      SELECT mp.id FROM membership_plans mp
      WHERE mp.gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
    )
    OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- ============================================
-- FUNCTION: Submit Price Change Request
-- Called by gym owner to request a price change
-- ============================================
CREATE OR REPLACE FUNCTION submit_price_change_request(
  p_plan_id UUID,
  p_new_price INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_effective_date DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_gym_id UUID;
  v_current_price INTEGER;
  v_request_id UUID;
  v_caller_role user_role;
BEGIN
  -- Get caller's role
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();

  IF v_caller_role != 'gym_owner' THEN
    RAISE EXCEPTION 'Only gym owners can submit price change requests';
  END IF;

  -- Get plan details
  SELECT gym_id, price INTO v_gym_id, v_current_price
  FROM membership_plans
  WHERE id = p_plan_id;

  -- Verify ownership
  IF v_gym_id != (SELECT gym_id FROM profiles WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'You can only change prices for your own gym''s plans';
  END IF;

  -- Check for pending request on same plan
  IF EXISTS (
    SELECT 1 FROM price_change_requests
    WHERE plan_id = p_plan_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'There is already a pending price change request for this plan';
  END IF;

  -- Create the request
  INSERT INTO price_change_requests (
    gym_id,
    plan_id,
    requested_by,
    current_price,
    requested_price,
    reason,
    effective_date
  ) VALUES (
    v_gym_id,
    p_plan_id,
    auth.uid(),
    v_current_price,
    p_new_price,
    p_reason,
    COALESCE(p_effective_date, CURRENT_DATE + INTERVAL '7 days')
  )
  RETURNING id INTO v_request_id;

  -- TODO: Trigger notification to super admin
  -- This would be handled by a webhook or edge function

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Approve Price Change (Super Admin)
-- ============================================
CREATE OR REPLACE FUNCTION approve_price_change(
  p_request_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Verify caller is super admin
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can approve price changes';
  END IF;

  -- Get the request
  SELECT * INTO v_request
  FROM price_change_requests
  WHERE id = p_request_id;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Price change request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'This request has already been processed';
  END IF;

  -- Update the request status
  UPDATE price_change_requests
  SET
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    review_notes = p_notes,
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Apply the price change (this bypasses the trigger check because we're super_admin)
  UPDATE membership_plans
  SET price = v_request.requested_price
  WHERE id = v_request.plan_id;

  -- Update request to 'applied'
  UPDATE price_change_requests
  SET status = 'applied', updated_at = NOW()
  WHERE id = p_request_id;

  -- Log to history with request reference
  INSERT INTO membership_price_history (
    plan_id, old_price, new_price, changed_by, change_request_id, reason
  ) VALUES (
    v_request.plan_id,
    v_request.current_price,
    v_request.requested_price,
    auth.uid(),
    p_request_id,
    v_request.reason
  );

  -- TODO: Notify gym owner of approval

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Reject Price Change (Super Admin)
-- ============================================
CREATE OR REPLACE FUNCTION reject_price_change(
  p_request_id UUID,
  p_rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verify caller is super admin
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can reject price changes';
  END IF;

  -- Verify request exists and is pending
  IF NOT EXISTS (
    SELECT 1 FROM price_change_requests
    WHERE id = p_request_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Update the request
  UPDATE price_change_requests
  SET
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    rejection_reason = p_rejection_reason,
    updated_at = NOW()
  WHERE id = p_request_id;

  -- TODO: Notify gym owner of rejection with reason

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEW: Pending Price Changes (Super Admin Dashboard)
-- ============================================
CREATE OR REPLACE VIEW pending_price_changes AS
SELECT
  pcr.id,
  pcr.gym_id,
  g.name AS gym_name,
  mp.name AS plan_name,
  pcr.current_price,
  pcr.requested_price,
  (pcr.requested_price - pcr.current_price) AS price_difference,
  ROUND(((pcr.requested_price - pcr.current_price)::DECIMAL / pcr.current_price) * 100, 1) AS percent_change,
  pcr.reason,
  pcr.effective_date,
  pcr.requested_at,
  p.first_name || ' ' || p.last_name AS requested_by_name,
  pcr.status
FROM price_change_requests pcr
JOIN gyms g ON g.id = pcr.gym_id
JOIN membership_plans mp ON mp.id = pcr.plan_id
JOIN profiles p ON p.id = pcr.requested_by
WHERE pcr.status = 'pending'
ORDER BY pcr.requested_at ASC;

GRANT SELECT ON pending_price_changes TO authenticated;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_price_requests_gym ON price_change_requests(gym_id);
CREATE INDEX IF NOT EXISTS idx_price_requests_status ON price_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_price_requests_plan ON price_change_requests(plan_id);
CREATE INDEX IF NOT EXISTS idx_price_history_plan ON membership_price_history(plan_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER price_change_requests_updated_at
  BEFORE UPDATE ON price_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
