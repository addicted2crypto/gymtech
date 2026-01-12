-- Fix RLS policy for gyms table INSERT
-- The original "FOR ALL" policy only has USING clause which doesn't work for INSERT
-- INSERT operations require WITH CHECK clause

-- Drop the existing policy and recreate with proper clauses
DROP POLICY IF EXISTS "Super admins have full access to gyms" ON gyms;

-- Super admin SELECT policy
CREATE POLICY "Super admins can view all gyms"
  ON gyms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Super admin INSERT policy (uses WITH CHECK, not USING)
CREATE POLICY "Super admins can create gyms"
  ON gyms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Super admin UPDATE policy
CREATE POLICY "Super admins can update all gyms"
  ON gyms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Super admin DELETE policy
CREATE POLICY "Super admins can delete all gyms"
  ON gyms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );
