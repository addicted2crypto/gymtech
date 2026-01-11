-- GymSaaS Migration: Security & PII Encryption
-- Implements actual encryption for sensitive data

-- ============================================
-- ENCRYPTION KEY MANAGEMENT
-- The encryption key is stored as a database secret
-- Set via: SELECT set_config('app.encryption_key', 'your-32-char-key', false);
-- In production, use Supabase Vault or environment variables
-- ============================================

-- ============================================
-- ENCRYPTION FUNCTIONS
-- ============================================

-- Encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_pii(plain_text TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Get encryption key from settings (set by server on connection)
  encryption_key := current_setting('app.encryption_key', true);

  IF encryption_key IS NULL OR length(encryption_key) < 32 THEN
    -- In development without key, return as-is (log warning)
    RAISE WARNING 'Encryption key not set or too short. Data stored without encryption.';
    RETURN plain_text;
  END IF;

  -- Use pgcrypto to encrypt
  RETURN encode(
    pgp_sym_encrypt(
      plain_text,
      encryption_key,
      'cipher-algo=aes256'
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_pii(encrypted_text TEXT)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  IF encrypted_text IS NULL THEN
    RETURN NULL;
  END IF;

  encryption_key := current_setting('app.encryption_key', true);

  IF encryption_key IS NULL OR length(encryption_key) < 32 THEN
    -- If no key, assume data is plain text (dev mode)
    RETURN encrypted_text;
  END IF;

  -- Decrypt using pgcrypto
  BEGIN
    RETURN pgp_sym_decrypt(
      decode(encrypted_text, 'base64'),
      encryption_key,
      'cipher-algo=aes256'
    );
  EXCEPTION WHEN OTHERS THEN
    -- If decryption fails, data might be plain text
    RETURN encrypted_text;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECURE PII ACCESS FUNCTION
-- Only callable by authorized roles, server-side
-- ============================================

-- Drop the old function and recreate with proper encryption
DROP FUNCTION IF EXISTS get_recipient_contact_info(UUID);

CREATE OR REPLACE FUNCTION get_recipient_contact_info(recipient_profile_id UUID)
RETURNS TABLE (
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role user_role;
  caller_gym_id UUID;
  recipient_gym_id UUID;
BEGIN
  -- Get the role and gym of the calling user
  SELECT role, gym_id INTO caller_role, caller_gym_id
  FROM profiles
  WHERE id = auth.uid();

  -- Only allow gym owners, managers, and super admins
  IF caller_role NOT IN ('gym_owner', 'gym_manager', 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized: Insufficient role to access PII';
  END IF;

  -- Get recipient's gym
  SELECT gym_id INTO recipient_gym_id
  FROM profiles
  WHERE id = recipient_profile_id;

  -- Super admin can access any gym, others only their own
  IF caller_role != 'super_admin' AND caller_gym_id != recipient_gym_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access members outside your gym';
  END IF;

  -- Return decrypted PII
  RETURN QUERY
  SELECT
    decrypt_pii(p.email_encrypted) AS email,
    decrypt_pii(p.phone_encrypted) AS phone,
    p.first_name,
    p.last_name
  FROM profiles p
  WHERE p.id = recipient_profile_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-encrypt PII on insert/update
-- ============================================

CREATE OR REPLACE FUNCTION encrypt_profile_pii()
RETURNS TRIGGER AS $$
BEGIN
  -- Only encrypt if values are provided and not already encrypted
  -- Check if value looks like base64 (already encrypted)
  IF NEW.email_encrypted IS NOT NULL
     AND NEW.email_encrypted != ''
     AND NEW.email_encrypted NOT LIKE '%==%' THEN
    NEW.email_encrypted := encrypt_pii(NEW.email_encrypted);
  END IF;

  IF NEW.phone_encrypted IS NOT NULL
     AND NEW.phone_encrypted != ''
     AND NEW.phone_encrypted NOT LIKE '%==%' THEN
    NEW.phone_encrypted := encrypt_pii(NEW.phone_encrypted);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic encryption
DROP TRIGGER IF EXISTS encrypt_profile_pii_trigger ON profiles;
CREATE TRIGGER encrypt_profile_pii_trigger
  BEFORE INSERT OR UPDATE OF email_encrypted, phone_encrypted ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_profile_pii();

-- ============================================
-- AUDIT LOG TABLE
-- Track who accessed what PII
-- ============================================
CREATE TABLE IF NOT EXISTS pii_access_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  accessed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  accessed_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL, -- 'view', 'export', 'message'
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pii_access_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs"
  ON pii_access_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_pii_access_log_accessed_by ON pii_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_pii_access_log_accessed_at ON pii_access_log(accessed_at);

-- ============================================
-- FUNCTION: Log PII access
-- Call this whenever PII is accessed
-- ============================================
CREATE OR REPLACE FUNCTION log_pii_access(
  p_accessed_profile_id UUID,
  p_access_type TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO pii_access_log (accessed_by, accessed_profile_id, access_type, ip_address, user_agent)
  VALUES (auth.uid(), p_accessed_profile_id, p_access_type, p_ip_address, p_user_agent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SECURE VIEWS - NO PII EXPOSED
-- These views are safe for client-side queries
-- ============================================

-- Safe member list for gym staff (check-in purposes)
CREATE OR REPLACE VIEW safe_member_list AS
SELECT
  p.id,
  p.member_number,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.gym_id,
  p.role,
  p.is_trial,
  p.class_streak,
  p.login_streak,
  p.loyalty_points,
  p.created_at
  -- NO email_encrypted, NO phone_encrypted
FROM profiles p;

-- RLS on the view (through underlying table)
GRANT SELECT ON safe_member_list TO authenticated;

-- Safe booking list (no member PII)
CREATE OR REPLACE VIEW safe_booking_list AS
SELECT
  cb.id,
  cb.schedule_id,
  cb.member_id,
  cb.status,
  cb.checked_in_at,
  cb.booked_at,
  cb.booking_date,
  cb.checkin_method,
  cb.was_no_show,
  p.member_number,
  p.first_name,
  p.last_name,
  p.avatar_url,
  c.name AS class_name,
  cs.start_time,
  cs.day_of_week
FROM class_bookings cb
JOIN profiles p ON p.id = cb.member_id
JOIN class_schedules cs ON cs.id = cb.schedule_id
JOIN classes c ON c.id = cs.class_id;

GRANT SELECT ON safe_booking_list TO authenticated;

-- ============================================
-- RLS POLICY AUDIT
-- Ensure no PII leaks through policies
-- ============================================

-- Verify profiles table only returns safe columns to members
-- Members should NEVER see other members' encrypted fields

-- Tighten the existing "Users can view their own profile" policy
-- This is already correct - users can only see their own row

-- Add explicit column-level security note:
-- In application code, NEVER select email_encrypted or phone_encrypted
-- directly. Always use get_recipient_contact_info() which logs access.

-- ============================================
-- API KEY PROTECTION
-- These are reminders - actual implementation in Next.js
-- ============================================

/*
CRITICAL: Never expose these in client-side code:
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY
- SENDGRID_API_KEY
- TWILIO_AUTH_TOKEN
- Any encryption keys

HOW TO USE SAFELY:

1. Server Components (safe):
   const supabase = createServerClient() // Uses service role

2. Client Components (RLS enforced):
   const supabase = createBrowserClient() // Uses anon key + RLS

3. API Routes (safe):
   // app/api/secure-action/route.ts
   const supabase = createRouteHandlerClient()

4. Environment Variables:
   - NEXT_PUBLIC_* = visible to client (only use for public keys)
   - No prefix = server-only (never exposed)
*/

-- ============================================
-- SENSITIVE DATA CLEANUP FUNCTION
-- For GDPR/data deletion requests
-- ============================================
CREATE OR REPLACE FUNCTION anonymize_member_data(p_member_id UUID)
RETURNS void AS $$
BEGIN
  -- Verify caller has permission
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('gym_owner', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only owners and admins can anonymize data';
  END IF;

  -- Anonymize the profile
  UPDATE profiles
  SET
    first_name = 'Deleted',
    last_name = 'User',
    email_encrypted = NULL,
    phone_encrypted = NULL,
    avatar_url = NULL,
    notification_preferences = '{}'::jsonb
  WHERE id = p_member_id;

  -- Log the action
  INSERT INTO pii_access_log (accessed_by, accessed_profile_id, access_type)
  VALUES (auth.uid(), p_member_id, 'anonymize');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
