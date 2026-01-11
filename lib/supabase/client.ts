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
 *
 * ARCHITECTURE NOTE:
 * We use two clients due to a type inference bug in @supabase/ssr:
 * - createAuthClient(): For authentication (handles cookies properly)
 * - createClient(): For database operations (has correct TypeScript types)
 */

import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Create a Supabase client for AUTHENTICATION operations
 *
 * Use this for:
 * - supabase.auth.signUp()
 * - supabase.auth.signInWithPassword()
 * - supabase.auth.signOut()
 * - supabase.auth.getUser()
 * - supabase.auth.getSession()
 *
 * This uses @supabase/ssr which properly handles cookies in the browser.
 */
export function createAuthClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Create a typed Supabase client for DATABASE operations
 *
 * Use this for:
 * - .from('table').select()
 * - .from('table').insert()
 * - .from('table').update()
 * - .from('table').delete()
 * - .rpc()
 *
 * This uses the base @supabase/supabase-js package which has correct
 * TypeScript type inference with the Database generic.
 */
export function createClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(
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
  const auth = createAuthClient();
  const db = createClient();

  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const { data: profile } = await db
    .from('profiles')
    .select(SAFE_PROFILE_FIELDS)
    .eq('id', user.id)
    .single();

  return profile;
}

interface SafeMemberListRow {
  id: string;
  gym_id: string;
  member_number: string | null;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  class_streak: number;
  is_trial: boolean;
}

/**
 * Search members by name (for check-in screens)
 * Returns only safe display fields
 */
export async function searchMembers(searchTerm: string, gymId: string): Promise<SafeMemberListRow[]> {
  const db = createClient();

  // Use the safe_member_list view which excludes PII
  // Cast is needed because views aren't in generated types
  const { data, error } = await (db as unknown as { from: (table: string) => ReturnType<typeof db.from> })
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

  return (data ?? []) as SafeMemberListRow[];
}

interface SafeBookingListRow {
  id: string;
  member_id: string;
  class_name: string;
  class_time: string;
  booking_date: string;
  status: string;
  checked_in_at: string | null;
}

/**
 * Get today's bookings for a member (check-in display)
 */
export async function getMemberTodayBookings(memberId: string): Promise<SafeBookingListRow[]> {
  const db = createClient();

  const today = new Date().toISOString().split('T')[0];

  // Cast is needed because views aren't in generated types
  const { data, error } = await (db as unknown as { from: (table: string) => ReturnType<typeof db.from> })
    .from('safe_booking_list')
    .select('*')
    .eq('member_id', memberId)
    .eq('booking_date', today);

  if (error) {
    console.error('Failed to get bookings:', error);
    return [];
  }

  return (data ?? []) as SafeBookingListRow[];
}
