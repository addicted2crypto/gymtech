/**
 * Server-Side Supabase Client
 *
 * SECURITY: This file should ONLY be imported in:
 * - Server Components (app/.../*.tsx without 'use client')
 * - API Routes (app/api/.../*.ts)
 * - Server Actions
 *
 * NEVER import this in client components or files with 'use client'
 */

import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

// Validate required environment variables at startup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Create a Supabase client for Server Components
 * Uses the anon key with RLS - user's session determines access
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Create an untyped Supabase client for database operations
 *
 * The @supabase/ssr package has a TypeScript bug where all database
 * operations (select/insert/update/delete) resolve parameter types to 'never'.
 * This client uses the base package which doesn't have this issue.
 *
 * Note: This client doesn't handle cookies, so use createClient() for auth.
 */
export function createDbClient() {
  return createSupabaseClient(
    supabaseUrl!,
    supabaseAnonKey!
  );
}

/**
 * Create an ADMIN Supabase client
 *
 * ⚠️ DANGER: This bypasses ALL Row Level Security!
 *
 * Only use for:
 * - Background jobs (cron, webhooks)
 * - System operations (sending emails, SMS)
 * - Admin operations that require full access
 *
 * NEVER:
 * - Return data from this client directly to users without filtering
 * - Use in client components
 * - Log or expose the service key
 */
export async function createAdminClient() {
  if (!supabaseServiceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY not configured - admin operations unavailable'
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl!,
    supabaseServiceKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Get the current authenticated user (server-side)
 * Returns null if not authenticated
 */
export async function getServerUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get user profile with role and gym info (server-side)
 * Returns null if not authenticated or profile not found
 *
 * NOTE: This does NOT return encrypted PII fields
 */
export async function getServerUserProfile() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Select only safe fields - never select email_encrypted or phone_encrypted
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
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
      notification_preferences,
      created_at,
      gyms (
        id,
        name,
        slug,
        logo_url,
        tier,
        settings
      )
    `)
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return profile;
}

/**
 * Require authentication - throws if not logged in
 * Use in API routes and server actions
 */
export async function requireAuth() {
  const user = await getServerUser();

  if (!user) {
    throw new Error('Unauthorized: Authentication required');
  }

  return user;
}

/**
 * Require specific role(s) - throws if unauthorized
 * @param allowedRoles - Array of roles that can access this resource
 */
export async function requireRole(allowedRoles: string[]) {
  const profile = await getServerUserProfile();

  if (!profile) {
    throw new Error('Unauthorized: Authentication required');
  }

  if (!allowedRoles.includes(profile.role)) {
    throw new Error(`Forbidden: Requires role: ${allowedRoles.join(' or ')}`);
  }

  return profile;
}

/**
 * Check if current user has a specific permission
 * Uses the has_permission database function
 */
export async function checkPermission(permission: string): Promise<boolean> {
  const supabase = await createClient();
  const user = await getServerUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase.rpc('has_permission', {
    p_user_id: user.id,
    p_permission: permission,
  });

  if (error) {
    console.error('Permission check failed:', error);
    return false;
  }

  return data ?? false;
}

/**
 * Get decrypted PII for a member (server-side only)
 * Logs access for audit trail
 *
 * @param memberId - The profile ID to get PII for
 * @param accessType - Why PII is being accessed ('view', 'export', 'message')
 */
export async function getMemberPII(
  memberId: string,
  accessType: 'view' | 'export' | 'message'
) {
  const supabase = await createClient();

  // This function enforces role checks and logs access
  const { data, error } = await supabase.rpc('get_recipient_contact_info', {
    recipient_profile_id: memberId,
  });

  if (error) {
    throw new Error(`Failed to get member PII: ${error.message}`);
  }

  // Log the access (the function already does this, but we can add app-level logging too)
  await supabase.rpc('log_pii_access', {
    p_accessed_profile_id: memberId,
    p_access_type: accessType,
  });

  // The RPC returns contact info as JSON
  const result = data as unknown;
  if (Array.isArray(result) && result.length > 0) {
    return result[0] as { email?: string; phone?: string } | null;
  }
  return result as { email?: string; phone?: string } | null;
}
