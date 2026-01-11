import Stripe from 'stripe';

// Initialize Stripe with the secret key
// In production, this should only be used server-side
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe Connect account types
export type StripeAccountType = 'express' | 'standard';

// Helper to get the correct return URL based on environment
export function getStripeReturnUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}${path}`;
}

// Helper to format currency amounts (Stripe uses cents)
export function formatStripeAmount(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100);
}

// Helper to convert dollars to cents for Stripe
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Helper to convert cents to dollars
export function toDollars(cents: number): number {
  return cents / 100;
}

// Stripe Connect fee configuration
export const PLATFORM_FEE_PERCENT = 5; // 5% platform fee on transactions

// Calculate platform fee for a transaction
export function calculatePlatformFee(amountInCents: number): number {
  return Math.round(amountInCents * (PLATFORM_FEE_PERCENT / 100));
}

// Stripe account status mapping
export type ConnectAccountStatus =
  | 'not_connected'
  | 'pending'
  | 'onboarding_incomplete'
  | 'active'
  | 'restricted'
  | 'disabled';

export function getAccountStatus(account: Stripe.Account | null): ConnectAccountStatus {
  if (!account) return 'not_connected';

  if (account.details_submitted === false) {
    return 'onboarding_incomplete';
  }

  if (account.charges_enabled && account.payouts_enabled) {
    return 'active';
  }

  if (account.requirements?.disabled_reason) {
    return 'disabled';
  }

  if (account.requirements?.currently_due?.length) {
    return 'restricted';
  }

  return 'pending';
}

// Status display configuration
export const ACCOUNT_STATUS_CONFIG: Record<ConnectAccountStatus, {
  label: string;
  color: string;
  description: string;
}> = {
  not_connected: {
    label: 'Not Connected',
    color: 'gray',
    description: 'Connect your Stripe account to start accepting payments.',
  },
  pending: {
    label: 'Pending',
    color: 'yellow',
    description: 'Your account is being reviewed by Stripe.',
  },
  onboarding_incomplete: {
    label: 'Setup Incomplete',
    color: 'orange',
    description: 'Please complete your Stripe account setup to accept payments.',
  },
  active: {
    label: 'Active',
    color: 'green',
    description: 'Your account is active and ready to accept payments.',
  },
  restricted: {
    label: 'Restricted',
    color: 'orange',
    description: 'Additional information is required to continue accepting payments.',
  },
  disabled: {
    label: 'Disabled',
    color: 'red',
    description: 'Your account has been disabled. Please contact support.',
  },
};
