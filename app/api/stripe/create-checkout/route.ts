import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

// Stripe Price IDs - UPDATE THESE after creating products in Stripe Dashboard
const TIER_PRICES = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || '',
    yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || '',
  },
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '',
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
  },
  enterprise: {
    monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '',
    yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '',
  },
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile and gym
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, gyms(*)')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.role !== 'gym_owner') {
      return NextResponse.json({ error: 'Only gym owners can subscribe' }, { status: 403 });
    }

    if (!profile.gym_id) {
      return NextResponse.json({ error: 'No gym associated with this account' }, { status: 400 });
    }

    const body = await request.json();
    const { tier, interval } = body as {
      tier: 'starter' | 'pro' | 'enterprise';
      interval: 'monthly' | 'yearly';
    };

    if (!tier || !interval) {
      return NextResponse.json({ error: 'Missing tier or interval' }, { status: 400 });
    }

    const priceId = TIER_PRICES[tier]?.[interval];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid tier or interval' }, { status: 400 });
    }

    // Check if gym already has a Stripe customer
    let customerId = profile.gyms?.stripe_customer_id;

    if (!customerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile.gyms?.name || `${profile.first_name} ${profile.last_name}`,
        metadata: {
          gym_id: profile.gym_id,
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to gym
      await supabase
        .from('gyms')
        .update({ stripe_customer_id: customerId })
        .eq('id', profile.gym_id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/owner/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          gym_id: profile.gym_id,
          tier: tier,
        },
      },
      metadata: {
        gym_id: profile.gym_id,
        tier: tier,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
