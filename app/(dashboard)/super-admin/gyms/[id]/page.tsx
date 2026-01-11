'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  Eye,
  Globe,
  MessageSquare,
  Mail,
  Gift,
  Crown,
  Zap,
  Shield,
  CheckCircle2,
  X,
  ExternalLink,
  Copy,
  MoreVertical,
  Save,
  RefreshCw,
} from 'lucide-react';

// Demo gym data - will come from Supabase
const demoGym: {
  id: string;
  name: string;
  slug: string;
  custom_domain: string;
  domain_verified: boolean;
  tier: 'starter' | 'pro' | 'enterprise';
  is_trial: boolean;
  stripe_account_id: string;
  stripe_subscription_id: string;
  created_at: string;
  settings: { timezone: string; currency: string };
} = {
  id: '1',
  name: 'Iron MMA Academy',
  slug: 'iron-mma',
  custom_domain: 'www.ironmma.com',
  domain_verified: true,
  tier: 'pro',
  is_trial: false,
  stripe_account_id: 'acct_1234567890',
  stripe_subscription_id: 'sub_1234567890',
  created_at: '2025-11-15',
  settings: {
    timezone: 'America/New_York',
    currency: 'USD',
  },
};

const demoFeatures = {
  // Core
  class_scheduling: true,
  payment_processing: true,
  check_in_system: true,
  basic_analytics: true,
  subdomain_site: true,
  // Pro
  landing_page_builder: true,
  custom_domain: true,
  loyalty_rewards: true,
  flash_sales: true,
  sms_marketing: true,
  advanced_analytics: true,
  // Enterprise
  multi_location: false,
  white_label: false,
  social_crossposting: false,
  trial_lead_insights: false,
  api_access: false,
  dedicated_manager: false,
  // Usage
  sms_credits_monthly: 500,
  sms_credits_used: 123,
  email_credits_monthly: 1000,
  email_credits_used: 456,
};

const demoStats = {
  member_count: 247,
  active_members: 198,
  class_count: 12,
  classes_this_month: 156,
  bookings_this_month: 1234,
  lead_count: 34,
  page_views_30d: 1523,
  revenue_30d: 24500,
};

const demoMembers = [
  { id: '1', name: 'John Smith', email: 'john@email.com', status: 'active', joined: '2025-06-15', lastLogin: '2026-01-04' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@email.com', status: 'active', joined: '2025-08-22', lastLogin: '2026-01-05' },
  { id: '3', name: 'Mike Williams', email: 'mike@email.com', status: 'inactive', joined: '2025-04-10', lastLogin: '2025-12-15' },
  { id: '4', name: 'Emily Brown', email: 'emily@email.com', status: 'active', joined: '2025-10-01', lastLogin: '2026-01-03' },
  { id: '5', name: 'David Lee', email: 'david@email.com', status: 'active', joined: '2025-11-30', lastLogin: '2026-01-05' },
];

type Tab = 'overview' | 'members' | 'features' | 'billing';

export default function GymDetailPage() {
  const params = useParams();
  const gymId = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [features, setFeatures] = useState(demoFeatures);
  const [saving, setSaving] = useState(false);

  const handleFeatureToggle = (feature: string) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature as keyof typeof prev]
    }));
  };

  const handleSaveFeatures = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/super-admin"
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {demoGym.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{demoGym.name}</h1>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span>{demoGym.slug}.gymtech.com</span>
                {demoGym.custom_domain && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {demoGym.custom_domain}
                      {demoGym.domain_verified && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TierBadge tier={demoGym.tier} />
          <a
            href={`https://${demoGym.slug}.gymtech.com`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Visit Site
          </a>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex gap-6">
          {(['overview', 'members', 'features', 'billing'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? 'text-orange-400 border-orange-400'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard label="Total Members" value={demoStats.member_count} subtext={`${demoStats.active_members} active`} icon={Users} />
            <StatCard label="Classes" value={demoStats.class_count} subtext={`${demoStats.classes_this_month} this month`} icon={Calendar} />
            <StatCard label="Page Views" value={demoStats.page_views_30d} subtext="Last 30 days" icon={Eye} />
            <StatCard label="Revenue" value={`$${(demoStats.revenue_30d / 100).toLocaleString()}`} subtext="Last 30 days" icon={CreditCard} />
          </div>

          {/* Quick Info */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Gym Info */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Gym Information</h3>
              <div className="space-y-3">
                <InfoRow label="Created" value={new Date(demoGym.created_at).toLocaleDateString()} />
                <InfoRow label="Timezone" value={demoGym.settings.timezone} />
                <InfoRow label="Currency" value={demoGym.settings.currency} />
                <InfoRow label="Stripe Account" value={demoGym.stripe_account_id} copyable />
              </div>
            </div>

            {/* Usage */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Usage This Month</h3>
              <div className="space-y-4">
                <UsageBar
                  label="SMS Credits"
                  used={features.sms_credits_used}
                  total={features.sms_credits_monthly}
                  icon={MessageSquare}
                />
                <UsageBar
                  label="Email Credits"
                  used={features.email_credits_used}
                  total={features.email_credits_monthly}
                  icon={Mail}
                />
                <UsageBar
                  label="Members"
                  used={demoStats.member_count}
                  total={demoGym.tier === 'starter' ? 100 : demoGym.tier === 'pro' ? 500 : 999999}
                  icon={Users}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-white">Members ({demoStats.member_count})</h3>
            <button className="text-sm text-orange-400 hover:text-orange-300">
              Export CSV
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-white/5">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {demoMembers.map((member) => (
                <tr key={member.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-white">{member.name}</td>
                  <td className="px-4 py-3 text-gray-400">{member.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{member.joined}</td>
                  <td className="px-4 py-3 text-gray-400">{member.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              Manually override features for this gym. Changes will persist until you reset them.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFeatures(demoFeatures)}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reset to Tier Defaults
              </button>
              <button
                onClick={handleSaveFeatures}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>

          {/* Feature Groups */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Core Features */}
            <FeatureGroup
              title="Core Features"
              badge="All Plans"
              badgeColor="green"
              features={[
                { key: 'class_scheduling', label: 'Class Scheduling' },
                { key: 'payment_processing', label: 'Payment Processing' },
                { key: 'check_in_system', label: 'Check-In System' },
                { key: 'basic_analytics', label: 'Basic Analytics' },
                { key: 'subdomain_site', label: 'Subdomain Site' },
              ]}
              values={features}
              onToggle={handleFeatureToggle}
            />

            {/* Pro Features */}
            <FeatureGroup
              title="Pro Features"
              badge="Pro+"
              badgeColor="purple"
              features={[
                { key: 'landing_page_builder', label: 'Landing Page Builder' },
                { key: 'custom_domain', label: 'Custom Domain' },
                { key: 'loyalty_rewards', label: 'Loyalty & Rewards' },
                { key: 'flash_sales', label: 'Flash Sales' },
                { key: 'sms_marketing', label: 'SMS Marketing' },
                { key: 'advanced_analytics', label: 'Advanced Analytics' },
              ]}
              values={features}
              onToggle={handleFeatureToggle}
            />

            {/* Enterprise Features */}
            <FeatureGroup
              title="Enterprise Features"
              badge="Enterprise"
              badgeColor="amber"
              features={[
                { key: 'multi_location', label: 'Multi-Location' },
                { key: 'white_label', label: 'White Label' },
                { key: 'social_crossposting', label: 'Social Cross-Posting' },
                { key: 'trial_lead_insights', label: 'Trial Lead Insights' },
                { key: 'api_access', label: 'API Access' },
                { key: 'dedicated_manager', label: 'Dedicated Manager' },
              ]}
              values={features}
              onToggle={handleFeatureToggle}
            />
          </div>

          {/* Usage Limits */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Usage Limits</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Monthly SMS Credits</label>
                <input
                  type="number"
                  value={features.sms_credits_monthly}
                  onChange={(e) => setFeatures(prev => ({ ...prev, sms_credits_monthly: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Monthly Email Credits</label>
                <input
                  type="number"
                  value={features.email_credits_monthly}
                  onChange={(e) => setFeatures(prev => ({ ...prev, email_credits_monthly: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Subscription</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-gray-400">Current Plan</span>
                <TierBadge tier={demoGym.tier} />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-gray-400">Status</span>
                <span className="text-green-400">Active</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-gray-400">Monthly Amount</span>
                <span className="text-white font-medium">$199.00/month</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-gray-400">Stripe Subscription</span>
                <span className="text-gray-300 font-mono text-sm">{demoGym.stripe_subscription_id}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-400">Next Billing Date</span>
                <span className="text-white">February 15, 2026</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
              Upgrade to Enterprise
            </button>
            <button className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors">
              Downgrade
            </button>
            <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
              Cancel Subscription
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const styles = {
    starter: 'bg-gray-500/20 text-gray-400',
    pro: 'bg-purple-500/20 text-purple-400',
    enterprise: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${styles[tier as keyof typeof styles] || styles.starter}`}>
      {tier === 'enterprise' && <Crown className="w-4 h-4" />}
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
}

function StatCard({ label, value, subtext, icon: Icon }: { label: string; value: string | number; subtext: string; icon: React.ElementType }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm">{label}</span>
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-500">{subtext}</p>
    </div>
  );
}

function InfoRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-gray-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-white font-mono text-sm">{value}</span>
        {copyable && (
          <button
            onClick={() => navigator.clipboard.writeText(value)}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function UsageBar({ label, used, total, icon: Icon }: { label: string; used: number; total: number; icon: React.ElementType }) {
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const isHigh = percentage > 80;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Icon className="w-4 h-4" />
          {label}
        </div>
        <span className={`text-sm ${isHigh ? 'text-amber-400' : 'text-gray-400'}`}>
          {used.toLocaleString()} / {total === 999999 ? '∞' : total.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? 'bg-amber-500' : 'bg-green-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function FeatureGroup({
  title,
  badge,
  badgeColor,
  features,
  values,
  onToggle
}: {
  title: string;
  badge: string;
  badgeColor: 'green' | 'purple' | 'amber';
  features: { key: string; label: string }[];
  values: Record<string, boolean | number>;
  onToggle: (key: string) => void;
}) {
  const badgeColors = {
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">{title}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColors[badgeColor]}`}>
          {badge}
        </span>
      </div>
      <div className="space-y-3">
        {features.map((feature) => (
          <label key={feature.key} className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">{feature.label}</span>
            <button
              onClick={() => onToggle(feature.key)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                values[feature.key] ? 'bg-green-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                  values[feature.key] ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </label>
        ))}
      </div>
    </div>
  );
}
