-- ============================================
-- Migration 013: Add class_schedules RLS policies
-- ============================================
-- Issue: class_schedules table has RLS enabled but no write policies
-- Solution: Add INSERT/UPDATE/DELETE policies for owners and managers
-- Aligns with Migration 006 pattern for classes table
-- ============================================

-- Owners and managers can manage class schedules
-- Matches the pattern from 006_role_permissions.sql for consistency
CREATE POLICY "Owners and managers can manage class schedules"
  ON class_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      JOIN profiles p ON p.gym_id = c.gym_id
      WHERE c.id = class_schedules.class_id
      AND p.id = auth.uid()
      AND p.role IN ('gym_owner', 'gym_manager', 'super_admin')
    )
  );
