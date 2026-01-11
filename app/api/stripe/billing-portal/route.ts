import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('gym_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.gym_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get gym's Stripe customer ID
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('stripe_customer_id')
      .eq('id', profile.gym_id)
      .single();

    if (gymError || !gym?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 });
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: gym.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/owner/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
