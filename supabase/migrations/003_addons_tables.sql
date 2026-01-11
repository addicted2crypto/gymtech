-- Add-ons and Feature Requests System
-- Modular add-on installation tracking and 24-hour SLA feature requests

-- ============================================
-- ENUMS
-- ============================================

-- Add-on tier enum
DO $$ BEGIN
  CREATE TYPE addon_tier AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add-on category enum
DO $$ BEGIN
  CREATE TYPE addon_category AS ENUM (
    'scheduling',
    'payments',
    'marketing',
    'analytics',
    'engagement',
    'communication',
    'integrations',
    'content',
    'automation'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Feature request status enum
DO $$ BEGIN
  CREATE TYPE request_status AS ENUM (
    'pending',
    'reviewing',
    'in_progress',
    'completed',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Feature request category enum
DO $$ BEGIN
  CREATE TYPE request_category AS ENUM (
    'new_feature',
    'modification',
    'integration',
    'design',
    'bug_fix',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Feature request priority enum
DO $$ BEGIN
  CREATE TYPE request_priority AS ENUM ('normal', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- GYM ADD-ONS TABLE
-- Tracks which add-ons each gym has installed
-- ============================================
CREATE TABLE IF NOT EXISTS gym_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  addon_id TEXT NOT NULL, -- References the addon ID from the registry
  addon_name TEXT NOT NULL, -- Cached name for display
  addon_category addon_category NOT NULL,
  addon_tier addon_tier NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  installed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  last_configured_at TIMESTAMPTZ,
  UNIQUE(gym_id, addon_id)
);

-- ============================================
-- ADDON CONFIGURATIONS TABLE
-- Stores custom configuration for each installed add-on
-- ============================================
CREATE TABLE IF NOT EXISTS addon_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_addon_id UUID REFERENCES gym_addons(id) ON DELETE CASCADE NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  placements TEXT[] DEFAULT ARRAY[]::TEXT[], -- Where the addon is displayed
  custom_styles JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(gym_addon_id)
);

-- ============================================
-- FEATURE REQUESTS TABLE
-- 24-hour SLA feature request tracking
-- ============================================
CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category request_category NOT NULL,
  priority request_priority DEFAULT 'normal',
  status request_status DEFAULT 'pending',
  -- SLA tracking
  sla_deadline TIMESTAMPTZ NOT NULL, -- 24 hours from creation
  sla_met BOOLEAN, -- NULL until completed/rejected, then true/false
  -- Resolution details
  assigned_to TEXT, -- Dev team member name/ID
  dev_notes TEXT,
  resolution_summary TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- Estimated implementation time (in hours)
  estimated_hours INTEGER,
  actual_hours INTEGER
);

-- ============================================
-- FEATURE REQUEST ATTACHMENTS TABLE
-- File uploads for feature requests
-- ============================================
CREATE TABLE IF NOT EXISTS feature_request_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES feature_requests(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER, -- In bytes
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FEATURE REQUEST COMMENTS TABLE
-- Communication thread for each request
-- ============================================
CREATE TABLE IF NOT EXISTS feature_request_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES feature_requests(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL, -- Cached for display
  author_role TEXT NOT NULL, -- 'gym_owner', 'super_admin', 'dev_team'
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Internal dev notes not visible to gym owner
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE gym_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_request_comments ENABLE ROW LEVEL SECURITY;

-- GYM_ADDONS POLICIES
-- Gym owners can manage their own add-ons
CREATE POLICY "Gym owners can view their addons"
  ON gym_addons FOR SELECT
  USING (
    gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('gym_owner', 'super_admin')
  );

CREATE POLICY "Gym owners can install addons"
  ON gym_addons FOR INSERT
  WITH CHECK (
    gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('gym_owner', 'super_admin')
  );

CREATE POLICY "Gym owners can update their addons"
  ON gym_addons FOR UPDATE
  USING (
    gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('gym_owner', 'super_admin')
  );

CREATE POLICY "Gym owners can uninstall addons"
  ON gym_addons FOR DELETE
  USING (
    gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('gym_owner', 'super_admin')
  );

-- Super admins can see all add-ons
CREATE POLICY "Super admins can view all addons"
  ON gym_addons FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- ADDON_CONFIGURATIONS POLICIES
CREATE POLICY "Gym owners can manage addon configs"
  ON addon_configurations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM gym_addons ga
      WHERE ga.id = addon_configurations.gym_addon_id
      AND ga.gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
      AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('gym_owner', 'super_admin')
    )
  );

-- FEATURE_REQUESTS POLICIES
-- Gym owners can manage their own requests
CREATE POLICY "Gym owners can view their requests"
  ON feature_requests FOR SELECT
  USING (
    gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('gym_owner', 'super_admin')
  );

CREATE POLICY "Gym owners can create requests"
  ON feature_requests FOR INSERT
  WITH CHECK (
    gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('gym_owner', 'super_admin')
  );

-- Super admins can view and manage all requests
CREATE POLICY "Super admins can manage all requests"
  ON feature_requests FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- FEATURE_REQUEST_ATTACHMENTS POLICIES
CREATE POLICY "Users can manage attachments on their requests"
  ON feature_request_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM feature_requests fr
      WHERE fr.id = feature_request_attachments.request_id
      AND (
        fr.gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
        OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
      )
    )
  );

-- FEATURE_REQUEST_COMMENTS POLICIES
-- Gym owners can see non-internal comments on their requests
CREATE POLICY "Gym owners can view public comments"
  ON feature_request_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM feature_requests fr
      WHERE fr.id = feature_request_comments.request_id
      AND fr.gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
      AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('gym_owner', 'super_admin')
    )
    AND (is_internal = FALSE OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin')
  );

-- Gym owners can add comments to their requests
CREATE POLICY "Gym owners can add comments"
  ON feature_request_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM feature_requests fr
      WHERE fr.id = feature_request_comments.request_id
      AND fr.gym_id = (SELECT gym_id FROM profiles WHERE id = auth.uid())
    )
    AND is_internal = FALSE -- Gym owners cannot add internal comments
  );

-- Super admins can manage all comments
CREATE POLICY "Super admins can manage all comments"
  ON feature_request_comments FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_gym_addons_gym_id ON gym_addons(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_addons_addon_id ON gym_addons(addon_id);
CREATE INDEX IF NOT EXISTS idx_gym_addons_category ON gym_addons(addon_category);
CREATE INDEX IF NOT EXISTS idx_gym_addons_enabled ON gym_addons(gym_id, is_enabled);

CREATE INDEX IF NOT EXISTS idx_addon_configs_gym_addon ON addon_configurations(gym_addon_id);

CREATE INDEX IF NOT EXISTS idx_feature_requests_gym_id ON feature_requests(gym_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_sla ON feature_requests(sla_deadline, status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_priority ON feature_requests(priority, status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_created ON feature_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_request_attachments_request ON feature_request_attachments(request_id);
CREATE INDEX IF NOT EXISTS idx_request_comments_request ON feature_request_comments(request_id);

-- ============================================
-- TRIGGER FOR ADDON CONFIG UPDATED_AT
-- ============================================
CREATE TRIGGER addon_configurations_updated_at
  BEFORE UPDATE ON addon_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FUNCTION TO AUTO-SET SLA DEADLINE
-- Sets 24-hour deadline on feature request creation
-- ============================================
CREATE OR REPLACE FUNCTION set_sla_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- Set SLA deadline to 24 hours from creation
  -- Urgent requests might have different handling in business logic
  NEW.sla_deadline := NEW.created_at + INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_request_sla_deadline
  BEFORE INSERT ON feature_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_sla_deadline();

-- ============================================
-- FUNCTION TO TRACK SLA COMPLIANCE
-- Called when request is completed/rejected
-- ============================================
CREATE OR REPLACE FUNCTION check_sla_compliance()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes to completed or rejected, check if SLA was met
  IF NEW.status IN ('completed', 'rejected') AND OLD.status NOT IN ('completed', 'rejected') THEN
    NEW.completed_at := NOW();
    NEW.sla_met := NOW() <= NEW.sla_deadline;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_request_sla_check
  BEFORE UPDATE ON feature_requests
  FOR EACH ROW
  EXECUTE FUNCTION check_sla_compliance();

-- ============================================
-- VIEW FOR SLA DASHBOARD
-- Shows pending requests with SLA status
-- ============================================
CREATE OR REPLACE VIEW sla_dashboard AS
SELECT
  fr.id,
  fr.gym_id,
  g.name AS gym_name,
  fr.title,
  fr.category,
  fr.priority,
  fr.status,
  fr.sla_deadline,
  fr.created_at,
  CASE
    WHEN fr.status IN ('completed', 'rejected') THEN
      CASE WHEN fr.sla_met THEN 'met' ELSE 'missed' END
    WHEN NOW() > fr.sla_deadline THEN 'overdue'
    WHEN NOW() > fr.sla_deadline - INTERVAL '4 hours' THEN 'at_risk'
    ELSE 'on_track'
  END AS sla_status,
  EXTRACT(EPOCH FROM (fr.sla_deadline - NOW())) / 3600 AS hours_remaining,
  fr.assigned_to
FROM feature_requests fr
JOIN gyms g ON g.id = fr.gym_id
ORDER BY
  CASE fr.priority WHEN 'urgent' THEN 0 ELSE 1 END,
  fr.sla_deadline ASC;

-- Grant select on view to authenticated users
GRANT SELECT ON sla_dashboard TO authenticated;

-- ============================================
-- VIEW FOR ADDON USAGE STATS
-- Analytics on add-on popularity
-- ============================================
CREATE OR REPLACE VIEW addon_usage_stats AS
SELECT
  addon_id,
  addon_name,
  addon_category,
  addon_tier,
  COUNT(*) AS total_installs,
  COUNT(*) FILTER (WHERE is_enabled = TRUE) AS active_installs,
  MIN(installed_at) AS first_installed,
  MAX(installed_at) AS last_installed
FROM gym_addons
GROUP BY addon_id, addon_name, addon_category, addon_tier
ORDER BY total_installs DESC;

-- Grant select on view to authenticated users (super admin will filter in app)
GRANT SELECT ON addon_usage_stats TO authenticated;
