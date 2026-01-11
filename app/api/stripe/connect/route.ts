import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, getStripeReturnUrl, getAccountStatus } from '@/lib/stripe';

// GET - Get Stripe Connect account status
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('gym_id, role')
      .eq('id', authUser.id)
      .single();

    if (!profile || !profile.gym_id) {
      return NextResponse.json({ error: 'No gym associated' }, { status: 400 });
    }

    if (profile.role !== 'gym_owner' && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get gym's Stripe account ID
    const { data: gym } = await supabase
      .from('gyms')
      .select('stripe_account_id')
      .eq('id', profile.gym_id)
      .single();

    if (!gym?.stripe_account_id) {
      return NextResponse.json({
        status: 'not_connected',
        account: null,
      });
    }

    // Fetch account details from Stripe
    try {
      const account = await stripe.accounts.retrieve(gym.stripe_account_id);

      return NextResponse.json({
        status: getAccountStatus(account),
        account: {
          id: account.id,
          email: account.email,
          business_type: account.business_type,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          requirements: {
            currently_due: account.requirements?.currently_due || [],
            eventually_due: account.requirements?.eventually_due || [],
            past_due: account.requirements?.past_due || [],
            disabled_reason: account.requirements?.disabled_reason,
          },
          created: account.created,
        },
      });
    } catch {
      // Account might have been deleted on Stripe's end
      return NextResponse.json({
        status: 'not_connected',
        account: null,
        error: 'Could not retrieve account',
      });
    }
  } catch (error) {
    console.error('Stripe Connect API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or refresh Stripe Connect onboarding link
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('gym_id, role, first_name, last_name')
      .eq('id', authUser.id)
      .single();

    if (!profile || !profile.gym_id) {
      return NextResponse.json({ error: 'No gym associated' }, { status: 400 });
    }

    if (profile.role !== 'gym_owner' && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body; // 'create' or 'refresh'

    // Get gym details
    const { data: gym } = await supabase
      .from('gyms')
      .select('id, name, stripe_account_id')
      .eq('id', profile.gym_id)
      .single();

    if (!gym) {
      return NextResponse.json({ error: 'Gym not found' }, { status: 404 });
    }

    let accountId = gym.stripe_account_id;

    // Create new account if needed
    if (!accountId || action === 'create') {
      const account = await stripe.accounts.create({
        type: 'express', // Express accounts are easier to set up
        country: 'US',
        email: authUser.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        business_profile: {
          name: gym.name,
          mcc: '7941', // MCC for sporting/recreational camps
          url: process.env.NEXT_PUBLIC_APP_URL,
        },
        metadata: {
          gym_id: gym.id,
          gym_name: gym.name,
        },
      });

      accountId = account.id;

      // Save the account ID to the gym
      await supabase
        .from('gyms')
        .update({ stripe_account_id: accountId })
        .eq('id', gym.id);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: getStripeReturnUrl('/owner/settings?stripe=refresh'),
      return_url: getStripeReturnUrl('/owner/settings?stripe=success'),
      type: 'account_onboarding',
    });

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      accountId,
    });
  } catch (error) {
    console.error('Stripe Connect API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Disconnect Stripe account (doesn't delete from Stripe, just unlinks)
export async function DELETE() {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('gym_id, role')
      .eq('id', authUser.id)
      .single();

    if (!profile || !profile.gym_id) {
      return NextResponse.json({ error: 'No gym associated' }, { status: 400 });
    }

    if (profile.role !== 'gym_owner' && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Remove the account ID from the gym (account still exists on Stripe)
    await supabase
      .from('gyms')
      .update({ stripe_account_id: null })
      .eq('id', profile.gym_id);

    return NextResponse.json({
      success: true,
      message: 'Stripe account disconnected',
    });
  } catch (error) {
    console.error('Stripe Connect API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
