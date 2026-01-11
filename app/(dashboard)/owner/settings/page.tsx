'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Settings,
  Building2,
  Globe,
  CreditCard,
  Receipt,
  Bell,
  Shield,
  Palette,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Crown,
} from 'lucide-react';
import StripeConnectOnboarding from '@/components/payments/StripeConnectOnboarding';

type SettingsTab = 'general' | 'billing' | 'payments' | 'domain' | 'notifications' | 'branding' | 'security';

const TABS: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'billing', label: 'Subscription', icon: Receipt },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'domain', label: 'Custom Domain', icon: Globe },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const stripeStatus = searchParams.get('stripe');

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form states
  const [gymName, setGymName] = useState('Iron Temple MMA');
  const [gymEmail, setGymEmail] = useState('contact@irontemple.com');
  const [gymPhone, setGymPhone] = useState('(555) 123-4567');
  const [gymAddress, setGymAddress] = useState('123 Fighter Street, Combat City, CC 12345');
  const [timezone, setTimezone] = useState('America/New_York');

  // Show payments tab if returning from Stripe
  useEffect(() => {
    if (stripeStatus) {
      setActiveTab('payments');
      if (stripeStatus === 'success') {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      }
    }
  }, [stripeStatus]);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your gym&apos;s configuration and preferences</p>
      </div>

      {/* Success Banner */}
      {showSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <p className="text-green-400">
            {stripeStatus === 'success'
              ? 'Stripe account connected successfully!'
              : 'Settings saved successfully!'}
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-linear-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">General Information</h2>
                <p className="text-sm text-gray-500">Basic details about your gym</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Gym Name
                  </label>
                  <input
                    type="text"
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={gymEmail}
                    onChange={(e) => setGymEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={gymPhone}
                    onChange={(e) => setGymPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={gymAddress}
                    onChange={(e) => setGymAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Billing/Subscription Settings */}
          {activeTab === 'billing' && (
            <Suspense fallback={<div className="animate-pulse bg-white/5 rounded-2xl h-96" />}>
              <BillingSection />
            </Suspense>
          )}

          {/* Payments Settings - Stripe Connect */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <StripeConnectOnboarding />

              {/* Additional payment settings */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Payment Preferences</h2>
                  <p className="text-sm text-gray-500">Configure how you accept payments</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <h3 className="font-medium text-white">Auto-collect failed payments</h3>
                      <p className="text-sm text-gray-500">Automatically retry failed subscription payments</p>
                    </div>
                    <button className="relative w-12 h-6 bg-orange-500 rounded-full transition-colors">
                      <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <h3 className="font-medium text-white">Send payment receipts</h3>
                      <p className="text-sm text-gray-500">Email receipts to members after payment</p>
                    </div>
                    <button className="relative w-12 h-6 bg-orange-500 rounded-full transition-colors">
                      <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <h3 className="font-medium text-white">Failed payment notifications</h3>
                      <p className="text-sm text-gray-500">Get notified when a member&apos;s payment fails</p>
                    </div>
                    <button className="relative w-12 h-6 bg-orange-500 rounded-full transition-colors">
                      <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Domain Settings */}
          {activeTab === 'domain' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Custom Domain</h2>
                <p className="text-sm text-gray-500">Use your own domain for your gym&apos;s landing page</p>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-400">Pro Feature</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Custom domains are available on Pro and Enterprise plans.
                      Upgrade to connect your own domain.
                    </p>
                  </div>
                </div>
              </div>

              <div className="opacity-50 pointer-events-none">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Domain
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="www.yourgym.com"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
                    disabled
                  />
                  <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400" disabled>
                    Verify
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Branding Settings */}
          {activeTab === 'branding' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Branding</h2>
                <p className="text-sm text-gray-500">Customize your gym&apos;s appearance</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">IT</span>
                    </div>
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-sm">
                      Upload New
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      defaultValue="#f97316"
                      className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      defaultValue="#f97316"
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Notification Preferences</h2>
                <p className="text-sm text-gray-500">Choose what notifications you receive</p>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'New member signups', description: 'Get notified when someone joins' },
                  { title: 'Class bookings', description: 'Notifications for new class reservations' },
                  { title: 'Payment received', description: 'Get notified for successful payments' },
                  { title: 'Member messages', description: 'Notifications for member inquiries' },
                  { title: 'Weekly reports', description: 'Receive weekly analytics summary' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div>
                      <h3 className="font-medium text-white">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <button className={`relative w-12 h-6 ${i < 3 ? 'bg-orange-500' : 'bg-white/20'} rounded-full transition-colors`}>
                      <span className={`absolute ${i < 3 ? 'right-1' : 'left-1'} top-1 w-4 h-4 bg-white rounded-full`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Security</h2>
                <p className="text-sm text-gray-500">Manage your account security</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-white">Change Password</h3>
                      <p className="text-sm text-gray-500">Update your account password</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder="Current password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <h3 className="font-medium text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-sm">
                    Enable
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <h3 className="font-medium text-white">Active Sessions</h3>
                    <p className="text-sm text-gray-500">Manage devices logged into your account</p>
                  </div>
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-sm">
                    View All
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium rounded-xl transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Billing Section Component
function BillingSection() {
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  // Mock data - in production, fetch from API
  const subscription: {
    tier: 'starter' | 'pro' | 'enterprise';
    status: string;
    currentPeriodEnd: string;
    priceMonthly: number;
    interval: 'monthly' | 'yearly';
  } = {
    tier: 'pro',
    status: 'active',
    currentPeriodEnd: '2024-02-15',
    priceMonthly: 149,
    interval: 'monthly',
  };

  const tierInfo = {
    starter: { name: 'Starter', color: 'gray' },
    pro: { name: 'Pro', color: 'blue' },
    enterprise: { name: 'Enterprise', color: 'purple' },
  };

  const currentTier = tierInfo[subscription.tier];

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open billing portal');
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval: 'monthly' }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create checkout');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <p className="text-green-400">
            Subscription activated successfully! Welcome to {currentTier.name}.
          </p>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Current Plan</h2>
            <p className="text-sm text-gray-500">Manage your TechForGyms subscription</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            subscription.status === 'active'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-yellow-500/10 text-yellow-400'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current" />
            <span className="text-sm capitalize">{subscription.status}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 p-4 bg-white/5 rounded-xl">
          <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
            subscription.tier === 'enterprise'
              ? 'bg-purple-500/20'
              : subscription.tier === 'pro'
                ? 'bg-blue-500/20'
                : 'bg-gray-500/20'
          }`}>
            <Crown className={`w-8 h-8 ${
              subscription.tier === 'enterprise'
                ? 'text-purple-400'
                : subscription.tier === 'pro'
                  ? 'text-blue-400'
                  : 'text-gray-400'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">{currentTier.name} Plan</h3>
            <p className="text-gray-400">
              ${subscription.priceMonthly}/{subscription.interval === 'monthly' ? 'month' : 'year'}
            </p>
          </div>
          <button
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-sm transition-colors"
          >
            {portalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Manage Billing
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-gray-500">Next billing</p>
            <p className="text-white font-medium">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-gray-500">Members used</p>
            <p className="text-white font-medium">47 / 150</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-gray-500">Staff used</p>
            <p className="text-white font-medium">5 / 10</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-gray-500">Emails sent</p>
            <p className="text-white font-medium">823 / 2,000</p>
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      {subscription.tier !== 'enterprise' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Upgrade Your Plan</h2>
            <p className="text-sm text-gray-500">Get more features and higher limits</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {subscription.tier === 'starter' && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Crown className="w-6 h-6 text-blue-400" />
                  <h3 className="font-semibold text-white">Pro Plan</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  150 members, 10 staff, custom domain, SMS marketing, and more.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">$149<span className="text-sm text-gray-400">/mo</span></span>
                  <button
                    onClick={() => handleUpgrade('pro')}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade'}
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <Crown className="w-6 h-6 text-purple-400" />
                <h3 className="font-semibold text-white">Enterprise Plan</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Unlimited everything, white-label branding, API access, dedicated support.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-white">$299<span className="text-sm text-gray-400">/mo</span></span>
                <button
                  onClick={() => handleUpgrade('enterprise')}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage & Limits */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Usage & Limits</h2>
          <p className="text-sm text-gray-500">Monitor your plan usage</p>
        </div>

        <div className="space-y-4">
          <UsageBar label="Members" used={47} limit={150} />
          <UsageBar label="Staff accounts" used={5} limit={10} />
          <UsageBar label="Classes" used={12} limit={25} />
          <UsageBar label="Landing pages" used={2} limit={5} />
          <UsageBar label="Emails this month" used={823} limit={2000} />
          <UsageBar label="SMS this month" used={45} limit={200} />
        </div>
      </div>
    </div>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-300">{label}</span>
        <span className={isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-gray-400'}>
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function OwnerSettingsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-8 bg-white/10 rounded w-1/4 animate-pulse" />
        <div className="flex gap-6">
          <div className="w-64 space-y-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="flex-1 bg-white/5 rounded-2xl h-96 animate-pulse" />
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
