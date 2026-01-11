'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  DollarSign,
  Zap,
  ArrowRight,
  Loader2,
  XCircle,
} from 'lucide-react';

type AccountStatus =
  | 'not_connected'
  | 'pending'
  | 'onboarding_incomplete'
  | 'active'
  | 'restricted'
  | 'disabled';

interface StripeAccount {
  id: string;
  email: string;
  business_type: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    disabled_reason?: string;
  };
  created: number;
}

interface AccountStatusResponse {
  status: AccountStatus;
  account: StripeAccount | null;
  error?: string;
}

const STATUS_CONFIG: Record<AccountStatus, {
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
  description: string;
}> = {
  not_connected: {
    icon: CreditCard,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/20',
    label: 'Not Connected',
    description: 'Connect your Stripe account to start accepting payments from members.',
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    label: 'Pending Review',
    description: 'Your account is being reviewed by Stripe. This usually takes 1-2 business days.',
  },
  onboarding_incomplete: {
    icon: AlertCircle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    label: 'Setup Incomplete',
    description: 'Please complete your Stripe account setup to start accepting payments.',
  },
  active: {
    icon: CheckCircle2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    label: 'Active',
    description: 'Your account is fully set up and ready to accept payments.',
  },
  restricted: {
    icon: AlertCircle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    label: 'Action Required',
    description: 'Additional information is needed to continue accepting payments.',
  },
  disabled: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    label: 'Disabled',
    description: 'Your account has been disabled. Please contact support for assistance.',
  },
};

const BENEFITS = [
  {
    icon: DollarSign,
    title: 'Direct Payouts',
    description: 'Payments go directly to your bank account',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    description: 'Industry-leading security and fraud protection',
  },
  {
    icon: Zap,
    title: 'Instant Setup',
    description: 'Get started in under 5 minutes',
  },
];

export default function StripeConnectOnboarding() {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [accountData, setAccountData] = useState<AccountStatusResponse | null>(null);

  const fetchAccountStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/connect');
      const data = await response.json();
      setAccountData(data);
    } catch (error) {
      console.error('Error fetching account status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountStatus();

    // Check URL params for Stripe redirect
    const params = new URLSearchParams(window.location.search);
    const stripeStatus = params.get('stripe');
    if (stripeStatus === 'success') {
      // Clear the URL param
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
    } finally {
      setConnecting(false);
    }
  };

  const handleContinueSetup = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error refreshing link:', error);
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
          <span className="text-gray-400">Loading payment settings...</span>
        </div>
      </div>
    );
  }

  const status = accountData?.status || 'not_connected';
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  // Not connected - show full onboarding UI
  if (status === 'not_connected') {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-orange-500/10 to-amber-500/10 border-b border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <CreditCard className="w-6 h-6 text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Accept Payments</h2>
          </div>
          <p className="text-gray-400">
            Connect with Stripe to accept credit card payments from your members.
            Payments go directly to your bank account.
          </p>
        </div>

        {/* Benefits */}
        <div className="p-6 grid md:grid-cols-3 gap-4 border-b border-white/10">
          {BENEFITS.map((benefit, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg shrink-0">
                <benefit.icon className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-medium text-white text-sm">{benefit.title}</h3>
                <p className="text-xs text-gray-500">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="p-6">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Connect with Stripe
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            You&apos;ll be redirected to Stripe to complete the setup securely.
          </p>
        </div>
      </div>
    );
  }

  // Connected or in-progress states
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {/* Status Header */}
      <div className={`${config.bgColor} border-b ${config.borderColor} p-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${config.bgColor} rounded-lg`}>
              <StatusIcon className={`w-6 h-6 ${config.color}`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Stripe Payments</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 ${config.bgColor} ${config.color} text-xs font-medium rounded-full border ${config.borderColor}`}>
                  {config.label}
                </span>
                {accountData?.account?.email && (
                  <span className="text-sm text-gray-500">{accountData.account.email}</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={fetchAccountStatus}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Status Message */}
      <div className="p-6 border-b border-white/10">
        <p className="text-gray-300">{config.description}</p>

        {/* Requirements if any */}
        {accountData?.account?.requirements?.currently_due?.length > 0 && (
          <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <h4 className="text-sm font-medium text-orange-400 mb-2">Action Required</h4>
            <ul className="space-y-1">
              {accountData.account.requirements.currently_due.map((req, i) => (
                <li key={i} className="text-sm text-gray-400 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                  {req.replace(/_/g, ' ').replace(/\./g, ' - ')}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Account Details (if active) */}
      {status === 'active' && accountData?.account && (
        <div className="p-6 border-b border-white/10 grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Card Payments</p>
              <p className="text-sm font-medium text-white">
                {accountData.account.charges_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Payouts</p>
              <p className="text-sm font-medium text-white">
                {accountData.account.payouts_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-6 flex flex-wrap gap-3">
        {(status === 'onboarding_incomplete' || status === 'restricted') && (
          <button
            onClick={handleContinueSetup}
            disabled={connecting}
            className="flex items-center gap-2 px-4 py-2 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium rounded-lg transition-all disabled:opacity-50"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            Continue Setup
          </button>
        )}

        {status === 'active' && (
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Open Stripe Dashboard
          </a>
        )}

        {accountData?.account?.id && (
          <p className="w-full text-xs text-gray-500 mt-2">
            Account ID: {accountData.account.id}
          </p>
        )}
      </div>
    </div>
  );
}
