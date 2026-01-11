import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// This endpoint creates a gym without requiring Stripe payment
// Only accessible by super admins for testing purposes

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass RLS
);

// Helper to verify super_admin role from session
async function verifySuperAdmin(): Promise<{ authorized: boolean; userId?: string }> {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Read-only for this check
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { authorized: false };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'super_admin') {
    return { authorized: false };
  }

  return { authorized: true, userId: user.id };
}

export async function POST(request: NextRequest) {
  try {
    // Verify super_admin via session
    const auth = await verifySuperAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, tier, ownerEmail } = body;

    if (!name || !slug || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, tier' },
        { status: 400 }
      );
    }

    // Check if slug is available
    const { data: existingGym } = await supabaseAdmin
      .from('gyms')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingGym) {
      return NextResponse.json(
        { error: 'Slug already taken' },
        { status: 400 }
      );
    }

    // Create the gym with specified tier (bypassing payment)
    const { data: gym, error: gymError } = await supabaseAdmin
      .from('gyms')
      .insert({
        name,
        slug,
        tier,
        is_trial: false, // Not a trial - full access for testing
        trial_ends_at: null,
        is_suspended: false,
        settings: {
          timezone: 'America/New_York',
          currency: 'USD',
          test_mode: true, // Flag this as a test gym
        },
      })
      .select()
      .single();

    if (gymError) {
      console.error('Error creating gym:', gymError);
      return NextResponse.json(
        { error: 'Failed to create gym' },
        { status: 500 }
      );
    }

    // If owner email provided, create owner profile
    if (ownerEmail) {
      // Check if user exists
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', ownerEmail)
        .single();

      if (existingUser) {
        // Link existing user to new gym as owner
        await supabaseAdmin
          .from('profiles')
          .update({ gym_id: gym.id, role: 'gym_owner' })
          .eq('id', existingUser.id);
      }
      // If user doesn't exist, they'll need to sign up
    }

    return NextResponse.json({
      success: true,
      gym: {
        id: gym.id,
        name: gym.name,
        slug: gym.slug,
        tier: gym.tier,
        subdomain: `${gym.slug}.techforgyms.shop`,
      },
    });
  } catch (error) {
    console.error('Error in demo gym creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update tier for a demo gym
export async function PATCH(request: NextRequest) {
  try {
    // Verify super_admin via session
    const auth = await verifySuperAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { gymId, tier } = body;

    if (!gymId || !tier) {
      return NextResponse.json(
        { error: 'Missing gymId or tier' },
        { status: 400 }
      );
    }

    const validTiers = ['starter', 'pro', 'enterprise'];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('gyms')
      .update({ tier })
      .eq('id', gymId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update tier' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating gym tier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete demo gym
export async function DELETE(request: NextRequest) {
  try {
    // Verify super_admin via session
    const auth = await verifySuperAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get('gymId');

    if (!gymId) {
      return NextResponse.json(
        { error: 'Missing gymId' },
        { status: 400 }
      );
    }

    // Only allow deleting test mode gyms
    const { data: gym } = await supabaseAdmin
      .from('gyms')
      .select('settings')
      .eq('id', gymId)
      .single();

    if (!gym?.settings?.test_mode) {
      return NextResponse.json(
        { error: 'Can only delete test mode gyms via this endpoint' },
        { status: 400 }
      );
    }

    // Delete gym (cascade should handle related records)
    const { error } = await supabaseAdmin
      .from('gyms')
      .delete()
      .eq('id', gymId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete gym' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting demo gym:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
