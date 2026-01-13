import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get current user and verify they have permission
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile to check role and gym
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, gym_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only gym_owner, gym_staff, and super_admin can add members
    const allowedRoles = ['super_admin', 'gym_owner', 'gym_staff'];
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      first_name,
      last_name,
      role = 'member',
      gym_id,
      is_trial = false,
      send_invite = true
    } = body;

    // Validate required fields
    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Determine which gym to add the member to
    const targetGymId = profile.role === 'super_admin' && gym_id
      ? gym_id
      : profile.gym_id;

    if (!targetGymId) {
      return NextResponse.json(
        { error: 'No gym associated with your account' },
        { status: 400 }
      );
    }

    // Validate role - gym staff can only add members, not other staff
    const memberRole = profile.role === 'gym_staff' ? 'member' : role;
    if (!['member', 'gym_staff', 'gym_owner'].includes(memberRole)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Use admin client to create the user
    const adminClient = await createAdminClient();

    // Generate a temporary password (user will need to reset)
    const tempPassword = `Temp${Date.now()}!${Math.random().toString(36).slice(2)}`;

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: !send_invite, // If sending invite, don't auto-confirm
      user_metadata: {
        first_name,
        last_name,
      },
    });

    if (authError) {
      // Check if user already exists
      if (authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: `Failed to create user: ${authError.message}` },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Generate member number
    const memberNumber = `MEM-${Date.now().toString(36).toUpperCase()}`;

    // Create profile - use direct insert with service role
    const { data: newProfile, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        gym_id: targetGymId,
        role: memberRole,
        first_name,
        last_name,
        member_number: memberRole === 'member' ? memberNumber : null,
        is_trial,
        login_streak: 0,
        total_logins: 0,
        loyalty_points: 0,
        class_streak: 0,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      // Try to clean up the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Send password reset email so user can set their own password
    if (send_invite) {
      await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://techforgyms.shop'}/member`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      member: {
        id: newProfile.id,
        first_name: newProfile.first_name,
        last_name: newProfile.last_name,
        member_number: newProfile.member_number,
        role: newProfile.role,
        is_trial: newProfile.is_trial,
      },
      message: send_invite
        ? 'Member created. An invitation email will be sent.'
        : 'Member created successfully.',
    });

  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
