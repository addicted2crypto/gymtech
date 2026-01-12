'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Gym } from '@/types/database';
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
  AlertCircle,
} from 'lucide-react';

type Tab = 'overview' | 'members' | 'features' | 'billing';

interface GymStats {
  member_count: number;
  active_members: number;
  class_count: number;
  page_views_30d: number;
}

interface GymFeatures {
  class_scheduling: boolean;
  payment_processing: boolean;
  check_in_system: boolean;
  basic_analytics: boolean;
  subdomain_site: boolean;
  landing_page_builder: boolean;
  custom_domain: boolean;
  loyalty_rewards: boolean;
  flash_sales: boolean;
  sms_marketing: boolean;
  advanced_analytics: boolean;
  multi_location: boolean;
  white_label: boolean;
  social_crossposting: boolean;
  trial_lead_insights: boolean;
  api_access: boolean;
  dedicated_manager: boolean;
  sms_credits_monthly: number;
  sms_credits_used: number;
  email_credits_monthly: number;
  email_credits_used: number;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  last_login_at: string | null;
}

// Get default features based on tier
function getDefaultFeatures(tier: string): GymFeatures {
  const base = {
    class_scheduling: true,
    payment_processing: true,
    check_in_system: true,
    basic_analytics: true,
    subdomain_site: true,
    landing_page_builder: false,
    custom_domain: false,
    loyalty_rewards: false,
    flash_sales: false,
    sms_marketing: false,
    advanced_analytics: false,
    multi_location: false,
    white_label: false,
    social_crossposting: false,
    trial_lead_insights: false,
    api_access: false,
    dedicated_manager: false,
    sms_credits_monthly: 0,
    sms_credits_used: 0,
    email_credits_monthly: 100,
    email_credits_used: 0,
  };

  if (tier === 'pro') {
    return {
      ...base,
      landing_page_builder: true,
      custom_domain: true,
      loyalty_rewards: true,
      flash_sales: true,
      sms_marketing: true,
      advanced_analytics: true,
      sms_credits_monthly: 500,
      email_credits_monthly: 1000,
    };
  }

  if (tier === 'enterprise') {
    return {
      ...base,
      landing_page_builder: true,
      custom_domain: true,
      loyalty_rewards: true,
      flash_sales: true,
      sms_marketing: true,
      advanced_analytics: true,
      multi_location: true,
      white_label: true,
      social_crossposting: true,
      trial_lead_insights: true,
      api_access: true,
      dedicated_manager: true,
      sms_credits_monthly: 2000,
      email_credits_monthly: 5000,
    };
  }

  return base;
}

export default function GymDetailPage() {
  const params = useParams();
  const gymId = params.id as string;

  const [gym, setGym] = useState<Gym | null>(null);
  const [stats, setStats] = useState<GymStats>({ member_count: 0, active_members: 0, class_count: 0, page_views_30d: 0 });
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [features, setFeatures] = useState<GymFeatures>(getDefaultFeatures('starter'));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchGymData() {
      const supabase = createClient();

      // Fetch gym details
      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', gymId)
        .single();

      if (gymError) {
        setError('Failed to load gym: ' + gymError.message);
        setLoading(false);
        return;
      }

      if (!gymData) {
        setError('Gym not found');
        setLoading(false);
        return;
      }

      setGym(gymData);
      setFeatures(getDefaultFeatures(gymData.tier));

      // Fetch member count
      const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gymId);

      // Fetch class count
      const { count: classCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gymId);

      // Fetch members list (top 10)
      const { data: membersData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, created_at, last_login_at')
        .eq('gym_id', gymId)
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        member_count: memberCount || 0,
        active_members: memberCount || 0, // TODO: Calculate based on recent activity
        class_count: classCount || 0,
        page_views_30d: 0, // TODO: Calculate from page_views table
      });

      setMembers(membersData || []);
      setLoading(false);
    }

    fetchGymData();
  }, [gymId]);

  const handleFeatureToggle = (feature: string) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature as keyof typeof prev]
    }));
  };

  const handleSaveFeatures = async () => {
    setSaving(true);
    // TODO: Save to gym_features table
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !gym) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
        <p className="text-gray-400 mb-4">{error || 'Gym not found'}</p>
        <Link
          href="/super-admin/gyms"
          className="text-orange-400 hover:text-orange-300"
        >
          ← Back to All Gyms
        </Link>
      </div>
    );
  }

  const memberLimit = gym.tier === 'starter' ? 100 : gym.tier === 'pro' ? 500 : 999999;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/super-admin/gyms"
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-linear-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {gym.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{gym.name}</h1>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span>{gym.slug}.techforgyms.shop</span>
                {gym.custom_domain && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {gym.custom_domain}
                      {gym.domain_verified && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TierBadge tier={gym.tier} />
          {gym.is_trial && (
            <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
              Trial
            </span>
          )}
          <a
            href={`https://${gym.slug}.techforgyms.shop`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Visit Site
          </a>
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
            <StatCard label="Total Members" value={stats.member_count} subtext={`of ${memberLimit === 999999 ? '∞' : memberLimit} max`} icon={Users} />
            <StatCard label="Classes" value={stats.class_count} subtext="Active classes" icon={Calendar} />
            <StatCard label="Page Views" value={stats.page_views_30d} subtext="Last 30 days" icon={Eye} />
            <StatCard label="Tier" value={gym.tier.charAt(0).toUpperCase() + gym.tier.slice(1)} subtext={gym.is_trial ? 'Trial period' : 'Active'} icon={Crown} />
          </div>

          {/* Quick Info */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Gym Info */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Gym Information</h3>
              <div className="space-y-3">
                <InfoRow label="Created" value={new Date(gym.created_at).toLocaleDateString()} />
                <InfoRow label="Gym ID" value={gym.id} copyable />
                {gym.stripe_account_id && (
                  <InfoRow label="Stripe Account" value={gym.stripe_account_id} copyable />
                )}
                {gym.trial_ends_at && (
                  <InfoRow label="Trial Ends" value={new Date(gym.trial_ends_at).toLocaleDateString()} />
                )}
              </div>
            </div>

            {/* Usage */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Usage</h3>
              <div className="space-y-4">
                <UsageBar
                  label="Members"
                  used={stats.member_count}
                  total={memberLimit}
                  icon={Users}
                />
                {features.sms_credits_monthly > 0 && (
                  <UsageBar
                    label="SMS Credits"
                    used={features.sms_credits_used}
                    total={features.sms_credits_monthly}
                    icon={MessageSquare}
                  />
                )}
                {features.email_credits_monthly > 0 && (
                  <UsageBar
                    label="Email Credits"
                    used={features.email_credits_used}
                    total={features.email_credits_monthly}
                    icon={Mail}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-white">Members ({stats.member_count})</h3>
          </div>
          {members.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No members yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm border-b border-white/5">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Last Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-white">{member.first_name} {member.last_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'gym_owner'
                          ? 'bg-purple-500/20 text-purple-400'
                          : member.role === 'gym_staff'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {member.role.replace('gym_', '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{new Date(member.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {member.last_login_at ? new Date(member.last_login_at).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'features' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              Features are determined by the gym's tier. Override features below for testing.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFeatures(getDefaultFeatures(gym.tier))}
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
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Subscription</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-gray-400">Current Plan</span>
                <TierBadge tier={gym.tier} />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-gray-400">Status</span>
                <span className={gym.is_trial ? 'text-blue-400' : 'text-green-400'}>
                  {gym.is_trial ? 'Trial' : 'Active'}
                </span>
              </div>
              {gym.stripe_subscription_id && (
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <span className="text-gray-400">Stripe Subscription</span>
                  <span className="text-gray-300 font-mono text-sm">{gym.stripe_subscription_id}</span>
                </div>
              )}
              {gym.trial_ends_at && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-400">Trial Ends</span>
                  <span className="text-white">{new Date(gym.trial_ends_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {gym.tier !== 'enterprise' && (
              <button className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                Upgrade to {gym.tier === 'starter' ? 'Pro' : 'Enterprise'}
              </button>
            )}
            {gym.tier !== 'starter' && (
              <button className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors">
                Downgrade
              </button>
            )}
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
        <span className="text-white font-mono text-sm truncate max-w-48">{value}</span>
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
  const percentage = total > 0 && total !== 999999 ? Math.min((used / total) * 100, 100) : 0;
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
          style={{ width: `${total === 999999 ? 0 : percentage}%` }}
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
