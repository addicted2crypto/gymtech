import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This endpoint creates a gym without requiring Stripe payment
// Only accessible by super admins for testing purposes

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass RLS
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, tier, ownerEmail } = body;

    // TODO: Verify caller is super_admin via session/token
    // For now, check for admin header (replace with proper auth)
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!name || !slug || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, tier' },
        { status: 400 }
      );
    }

    // Check if slug is available
    const { data: existingGym } = await supabase
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
    const { data: gym, error: gymError } = await supabase
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
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', ownerEmail)
        .single();

      if (existingUser) {
        // Link existing user to new gym as owner
        await supabase
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
    const body = await request.json();
    const { gymId, tier } = body;

    // Verify admin
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { error } = await supabase
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
    const { searchParams } = new URL(request.url);
    const gymId = searchParams.get('gymId');

    // Verify admin
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!gymId) {
      return NextResponse.json(
        { error: 'Missing gymId' },
        { status: 400 }
      );
    }

    // Only allow deleting test mode gyms
    const { data: gym } = await supabase
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
    const { error } = await supabase
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
