'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, X, Loader2 } from 'lucide-react';

const tiers = [
  {
    name: 'Starter',
    id: 'starter',
    description: 'Perfect for small gyms and personal trainers',
    priceMonthly: 79,
    priceYearly: 869,
    features: {
      members: '25 members',
      staff: '3 staff accounts',
      classes: '5 classes',
      landingPages: '1 landing page',
      emails: '500 emails/month',
      sms: null,
      classScheduling: true,
      paymentProcessing: true,
      checkInSystem: true,
      basicAnalytics: true,
      subdomainSite: true,
      customDomain: false,
      loyaltyRewards: false,
      flashSales: false,
      smsMarketing: false,
      advancedAnalytics: false,
      multiLocation: false,
      whiteLabel: false,
      apiAccess: false,
      dedicatedManager: false,
    },
  },
  {
    name: 'Pro',
    id: 'pro',
    description: 'For growing gyms with ambitious goals',
    priceMonthly: 149,
    priceYearly: 1639,
    popular: true,
    features: {
      members: '150 members',
      staff: '10 staff accounts',
      classes: '25 classes',
      landingPages: '5 landing pages',
      emails: '2,000 emails/month',
      sms: '200 SMS/month',
      classScheduling: true,
      paymentProcessing: true,
      checkInSystem: true,
      basicAnalytics: true,
      subdomainSite: true,
      customDomain: true,
      loyaltyRewards: true,
      flashSales: true,
      smsMarketing: true,
      advancedAnalytics: true,
      multiLocation: false,
      whiteLabel: false,
      apiAccess: false,
      dedicatedManager: false,
    },
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    description: 'For established gyms and fitness chains',
    priceMonthly: 299,
    priceYearly: 3289,
    features: {
      members: 'Unlimited members',
      staff: 'Unlimited staff',
      classes: 'Unlimited classes',
      landingPages: 'Unlimited pages',
      emails: '10,000 emails/month',
      sms: '1,000 SMS/month',
      classScheduling: true,
      paymentProcessing: true,
      checkInSystem: true,
      basicAnalytics: true,
      subdomainSite: true,
      customDomain: true,
      loyaltyRewards: true,
      flashSales: true,
      smsMarketing: true,
      advancedAnalytics: true,
      multiLocation: true,
      whiteLabel: true,
      apiAccess: true,
      dedicatedManager: true,
    },
  },
];

const featureLabels: Record<string, string> = {
  classScheduling: 'Class scheduling',
  paymentProcessing: 'Payment processing',
  checkInSystem: 'Check-in system',
  basicAnalytics: 'Basic analytics',
  subdomainSite: 'Subdomain website',
  customDomain: 'Custom domain',
  loyaltyRewards: 'Loyalty rewards program',
  flashSales: 'Flash sales & promotions',
  smsMarketing: 'SMS marketing',
  advancedAnalytics: 'Advanced analytics',
  multiLocation: 'Multi-location support',
  whiteLabel: 'White-label branding',
  apiAccess: 'API access',
  dedicatedManager: 'Dedicated account manager',
};

function PricingContent() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled');

  const handleSelectPlan = async (tierId: string) => {
    setLoading(tierId);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tierId, interval }),
      });

      const data = await response.json();

      if (data.error) {
        if (response.status === 401) {
          // Not logged in - redirect to signup with plan info
          router.push(`/signup?plan=${tierId}&interval=${interval}`);
          return;
        }
        alert(data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-xl text-gray-300 max-w-2xl mx-auto">
            Start your 14-day free trial. No credit card required.
          </p>

          {canceled && (
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg max-w-md mx-auto">
              <p className="text-yellow-400">
                Checkout was canceled. Feel free to try again when you&apos;re ready.
              </p>
            </div>
          )}

          {/* Interval toggle */}
          <div className="mt-10 flex justify-center">
            <div className="relative bg-gray-800 rounded-lg p-1 flex">
              <button
                onClick={() => setInterval('monthly')}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  interval === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval('yearly')}
                className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                  interval === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  1 month free
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl ${
                tier.popular
                  ? 'bg-linear-to-b from-blue-600 to-blue-700 ring-2 ring-blue-400'
                  : 'bg-gray-800'
              } p-8`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-400 text-blue-900 text-sm font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
                <p className="mt-2 text-sm text-gray-300">{tier.description}</p>

                <div className="mt-6">
                  <span className="text-5xl font-bold text-white">
                    ${interval === 'monthly' ? tier.priceMonthly : tier.priceYearly}
                  </span>
                  <span className="text-gray-300">
                    /{interval === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>

                {interval === 'yearly' && (
                  <p className="mt-2 text-sm text-green-400">
                    Save ${tier.priceMonthly * 12 - tier.priceYearly}/year
                  </p>
                )}
              </div>

              <button
                onClick={() => handleSelectPlan(tier.id)}
                disabled={loading !== null}
                className={`mt-8 w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center ${
                  tier.popular
                    ? 'bg-white text-blue-600 hover:bg-gray-100'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === tier.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Start free trial'
                )}
              </button>

              <div className="mt-8 space-y-4">
                {/* Limits */}
                <div className="space-y-2 pb-4 border-b border-gray-700">
                  <p className="text-sm text-white font-medium">Includes:</p>
                  <p className="text-sm text-gray-300">{tier.features.members}</p>
                  <p className="text-sm text-gray-300">{tier.features.staff}</p>
                  <p className="text-sm text-gray-300">{tier.features.classes}</p>
                  <p className="text-sm text-gray-300">{tier.features.landingPages}</p>
                  <p className="text-sm text-gray-300">{tier.features.emails}</p>
                  {tier.features.sms && (
                    <p className="text-sm text-gray-300">{tier.features.sms}</p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {Object.entries(featureLabels).map(([key, label]) => {
                    const hasFeature = tier.features[key as keyof typeof tier.features];
                    return (
                      <div key={key} className="flex items-center gap-3">
                        {hasFeature ? (
                          <Check className="w-5 h-5 text-green-400 shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-500 shrink-0" />
                        )}
                        <span
                          className={`text-sm ${
                            hasFeature ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ or additional info */}
        <div className="mt-16 text-center">
          <p className="text-gray-400">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
          <p className="mt-2 text-gray-400">
            Need a custom plan?{' '}
            <a href="mailto:support@techforgyms.shop" className="text-blue-400 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
            <div className="text-center animate-pulse">
              <div className="h-12 bg-white/10 rounded w-1/2 mx-auto" />
              <div className="h-6 bg-white/10 rounded w-1/3 mx-auto mt-4" />
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-800 rounded-2xl p-8 animate-pulse">
                  <div className="h-6 bg-white/10 rounded w-1/2 mx-auto" />
                  <div className="h-12 bg-white/10 rounded w-1/3 mx-auto mt-6" />
                  <div className="h-12 bg-white/10 rounded w-full mt-8" />
                  <div className="space-y-3 mt-8">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="h-4 bg-white/10 rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
