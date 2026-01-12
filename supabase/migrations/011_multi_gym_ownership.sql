-- GymSaaS Migration: Multi-Gym Ownership Support
-- Enables enterprise tier users to own/manage multiple gyms

-- ============================================
-- GYM OWNERS JUNCTION TABLE
-- ============================================

-- Links users to gyms they own or manage
CREATE TABLE gym_owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'admin')),
  is_primary BOOLEAN DEFAULT FALSE, -- Their "main" gym for default routing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, gym_id)
);

-- Enable RLS
ALTER TABLE gym_owners ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR GYM_OWNERS
-- ============================================

-- Super admin full access
CREATE POLICY "Super admin full access to gym_owners"
  ON gym_owners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Users can see their own gym associations
CREATE POLICY "Users can view their gym_owners records"
  ON gym_owners FOR SELECT
  USING (user_id = auth.uid());

-- Gym owners can add managers to their gym
CREATE POLICY "Gym owners can manage their gym's owners"
  ON gym_owners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM gym_owners go
      WHERE go.user_id = auth.uid()
      AND go.gym_id = gym_owners.gym_id
      AND go.role = 'owner'
    )
  );

-- ============================================
-- FUNCTION: Sync gym_owners when profile created/updated
-- ============================================

-- When a gym_owner profile is created, add to gym_owners table
CREATE OR REPLACE FUNCTION sync_profile_to_gym_owners()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync for gym_owner role with a gym_id
  IF NEW.role = 'gym_owner' AND NEW.gym_id IS NOT NULL THEN
    -- Insert or update the gym_owners record
    INSERT INTO gym_owners (user_id, gym_id, role, is_primary)
    VALUES (NEW.id, NEW.gym_id, 'owner', TRUE)
    ON CONFLICT (user_id, gym_id)
    DO UPDATE SET
      role = 'owner',
      is_primary = TRUE,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_gym_owner_sync
  AFTER INSERT OR UPDATE OF gym_id, role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_gym_owners();

-- ============================================
-- FUNCTION: Check if user can access gym (multi-gym aware)
-- ============================================

CREATE OR REPLACE FUNCTION user_can_access_gym(check_user_id UUID, check_gym_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admin can access any gym
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = check_user_id AND role = 'super_admin'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check gym_owners table for multi-gym access
  IF EXISTS (
    SELECT 1 FROM gym_owners
    WHERE user_id = check_user_id AND gym_id = check_gym_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Fall back to profiles.gym_id for single-gym users
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = check_user_id AND gym_id = check_gym_id
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEW: User's accessible gyms
-- ============================================

CREATE OR REPLACE VIEW user_gyms AS
SELECT
  go.user_id,
  go.gym_id,
  go.role AS owner_role,
  go.is_primary,
  g.name,
  g.slug,
  g.tier,
  g.logo_url,
  g.is_trial,
  g.trial_ends_at,
  g.created_at AS gym_created_at,
  gf.multi_location AS has_multi_location
FROM gym_owners go
JOIN gyms g ON g.id = go.gym_id
LEFT JOIN gym_features gf ON gf.gym_id = g.id;

-- Grant access
GRANT SELECT ON user_gyms TO authenticated;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_gym_owners_user_id ON gym_owners(user_id);
CREATE INDEX idx_gym_owners_gym_id ON gym_owners(gym_id);
CREATE INDEX idx_gym_owners_primary ON gym_owners(user_id, is_primary) WHERE is_primary = TRUE;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE TRIGGER gym_owners_updated_at
  BEFORE UPDATE ON gym_owners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- BACKFILL: Sync existing gym_owner profiles
-- ============================================

INSERT INTO gym_owners (user_id, gym_id, role, is_primary)
SELECT id, gym_id, 'owner', TRUE
FROM profiles
WHERE role = 'gym_owner' AND gym_id IS NOT NULL
ON CONFLICT (user_id, gym_id) DO NOTHING;
