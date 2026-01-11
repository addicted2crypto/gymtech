import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Use service role client for webhook processing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Map Stripe price IDs to tier names
// These will be populated after creating products in Stripe Dashboard
const PRICE_TO_TIER: Record<string, 'starter' | 'pro' | 'enterprise'> = {
  // Monthly prices - UPDATE THESE after creating in Stripe
  // 'price_xxxxx': 'starter',
  // 'price_xxxxx': 'pro',
  // 'price_xxxxx': 'enterprise',
  // Yearly prices
  // 'price_xxxxx': 'starter',
  // 'price_xxxxx': 'pro',
  // 'price_xxxxx': 'enterprise',
};

// Helper to get tier from price ID
function getTierFromPriceId(priceId: string): 'starter' | 'pro' | 'enterprise' | null {
  return PRICE_TO_TIER[priceId] || null;
}

// Helper to get gym ID from subscription metadata
async function getGymIdFromSubscription(subscription: Stripe.Subscription): Promise<string | null> {
  // First check subscription metadata
  if (subscription.metadata?.gym_id) {
    return subscription.metadata.gym_id;
  }

  // Then check customer metadata
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (!customer.deleted && customer.metadata?.gym_id) {
    return customer.metadata.gym_id;
  }

  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      // Connect account events
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        console.log('Account updated:', account.id);

        // Update gym's Stripe status if needed
        // The account status is always fetched live from Stripe,
        // but we could cache some info if needed
        break;
      }

      case 'account.application.authorized': {
        const account = event.data.object as unknown as Stripe.Account;
        console.log('Account authorized:', account.id);
        break;
      }

      case 'account.application.deauthorized': {
        const account = event.data.object as unknown as Stripe.Account;
        console.log('Account deauthorized:', account.id);

        // Remove Stripe account ID from gym
        await supabaseAdmin
          .from('gyms')
          .update({ stripe_account_id: null })
          .eq('stripe_account_id', account.id);
        break;
      }

      // Payment events
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);

        // Log successful payment
        // In production, update member subscription, send receipt, etc.
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', paymentIntent.id);

        // Handle failed payment
        // Notify gym owner, update member status, etc.
        break;
      }

      // Platform Subscription events (gym tier subscriptions)
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription created:', subscription.id);

        const gymId = await getGymIdFromSubscription(subscription);
        if (!gymId) {
          console.log('No gym_id found for subscription, may be a member subscription');
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        const tier = getTierFromPriceId(priceId);

        if (tier) {
          // Platform subscription - activate gym tier
          await supabaseAdmin
            .from('gyms')
            .update({
              tier: tier,
              stripe_subscription_id: subscription.id,
              is_trial: false,
              trial_ends_at: null,
              suspended_at: null,
              suspension_reason: null,
              tier_started_at: new Date().toISOString(),
            })
            .eq('id', gymId);

          console.log(`Gym ${gymId} activated with ${tier} tier`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated:', subscription.id);

        const gymId = await getGymIdFromSubscription(subscription);
        if (!gymId) {
          console.log('No gym_id found for subscription');
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        const tier = getTierFromPriceId(priceId);

        if (tier) {
          // Handle subscription status changes
          if (subscription.status === 'active') {
            await supabaseAdmin
              .from('gyms')
              .update({
                tier: tier,
                suspended_at: null,
                suspension_reason: null,
              })
              .eq('id', gymId);
          } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            // Payment failed - send warning but don't suspend yet
            console.log(`Gym ${gymId} subscription is ${subscription.status}`);
          } else if (subscription.status === 'canceled') {
            // Subscription cancelled - suspend gym
            await supabaseAdmin
              .from('gyms')
              .update({
                suspended_at: new Date().toISOString(),
                suspension_reason: 'Subscription cancelled',
              })
              .eq('id', gymId);
            console.log(`Gym ${gymId} suspended due to cancelled subscription`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', subscription.id);

        const gymId = await getGymIdFromSubscription(subscription);
        if (!gymId) {
          console.log('No gym_id found for subscription');
          break;
        }

        // Subscription fully cancelled - suspend gym
        await supabaseAdmin
          .from('gyms')
          .update({
            stripe_subscription_id: null,
            suspended_at: new Date().toISOString(),
            suspension_reason: 'Subscription ended',
          })
          .eq('id', gymId);

        console.log(`Gym ${gymId} suspended - subscription ended`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice paid:', invoice.id);

        // Record payment, update member's payment history
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', invoice.id);

        // Notify member, retry payment, etc.
        break;
      }

      // Payout events (for gym owners)
      case 'payout.created': {
        const payout = event.data.object as Stripe.Payout;
        console.log('Payout created:', payout.id);
        break;
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout;
        console.log('Payout completed:', payout.id);
        break;
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        console.log('Payout failed:', payout.id);

        // Notify gym owner of payout failure
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Note: In Next.js App Router, body parsing is handled automatically.
// We use request.text() to get the raw body for Stripe signature verification.
