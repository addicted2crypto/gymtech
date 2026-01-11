/**
 * Client-Side Supabase Client
 *
 * SECURITY: This client uses the ANON key which is safe to expose.
 * All data access is restricted by Row Level Security (RLS) policies.
 *
 * ✅ SAFE to use in:
 * - Client components ('use client')
 * - Browser-side code
 *
 * ⚠️ NEVER access these from client code:
 * - email_encrypted
 * - phone_encrypted
 * - Any column with "_encrypted" suffix
 * - Service role operations
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Create a Supabase client for browser/client components
 *
 * This client:
 * - Uses the public anon key (safe to expose)
 * - All queries are filtered by RLS policies
 * - User can only access data their role allows
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Safe profile fields that can be selected from client
 * NEVER add email_encrypted or phone_encrypted to this list
 */
export const SAFE_PROFILE_FIELDS = `
  id,
  gym_id,
  role,
  first_name,
  last_name,
  avatar_url,
  member_number,
  login_streak,
  total_logins,
  loyalty_points,
  class_streak,
  is_trial,
  created_at
` as const;

/**
 * Safe member fields for search/display (check-in screens)
 * Used when staff searches for members
 */
export const SAFE_MEMBER_SEARCH_FIELDS = `
  id,
  member_number,
  first_name,
  last_name,
  avatar_url,
  class_streak,
  is_trial
` as const;

/**
 * Get the current user's profile (client-side)
 * Returns only safe, non-PII fields
 */
export async function getClientUserProfile() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select(SAFE_PROFILE_FIELDS)
    .eq('id', user.id)
    .single();

  return profile;
}

/**
 * Search members by name (for check-in screens)
 * Returns only safe display fields
 */
export async function searchMembers(searchTerm: string, gymId: string) {
  const supabase = createClient();

  // Use the safe_member_list view which excludes PII
  const { data, error } = await supabase
    .from('safe_member_list')
    .select('*')
    .eq('gym_id', gymId)
    .eq('is_trial', false) // Trial members can't check in
    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%`)
    .limit(10);

  if (error) {
    console.error('Member search failed:', error);
    return [];
  }

  return data ?? [];
}

/**
 * Get today's bookings for a member (check-in display)
 */
export async function getMemberTodayBookings(memberId: string) {
  const supabase = createClient();

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('safe_booking_list')
    .select('*')
    .eq('member_id', memberId)
    .eq('booking_date', today);

  if (error) {
    console.error('Failed to get bookings:', error);
    return [];
  }

  return data ?? [];
}
