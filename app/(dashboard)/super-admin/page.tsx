'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  TrendingUp,
  CreditCard,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Search,
  Filter,
  MoreVertical,
  Crown,
  Zap,
  MessageSquare,
  Mail,
  Plus,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Gym {
  id: string;
  name: string;
  slug: string;
  tier: string;
  is_trial: boolean;
  trial_ends_at?: string;
  is_suspended: boolean;
  stripe_status?: string;
  created_at: string;
  member_count?: number;
  page_views_30d?: number;
  sms_credits_used?: number;
  sms_credits_monthly?: number;
  email_credits_used?: number;
  email_credits_monthly?: number;
}

interface PlatformStats {
  totalGyms: number;
  totalMembers: number;
  monthlyRevenue: number;
  activeTrials: number;
  churned30d: number;
  newGyms30d: number;
}

export default function SuperAdminDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalGyms: 0,
    totalMembers: 0,
    monthlyRevenue: 0,
    activeTrials: 0,
    churned30d: 0,
    newGyms30d: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Fetch all gyms
      const { data: gymsData, error: gymsError } = await supabase
        .from('gyms')
        .select('*')
        .order('created_at', { ascending: false });

      if (gymsError) {
        console.error('Error fetching gyms:', gymsError);
      } else {
        // For each gym, get member count
        const gymsWithStats = await Promise.all(
          (gymsData || []).map(async (gym) => {
            const { count: memberCount } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('gym_id', gym.id)
              .eq('role', 'member');

            // Handle potentially missing columns from migrations
            const gymAny = gym as Record<string, unknown>;
            const tier = (gymAny.tier as string) || 'starter';
            const isTrial = (gymAny.is_trial as boolean) ?? false;
            const isSuspended = (gymAny.is_suspended as boolean) ?? false;

            return {
              ...gym,
              tier,
              is_trial: isTrial,
              is_suspended: isSuspended,
              trial_ends_at: gymAny.trial_ends_at as string | undefined,
              member_count: memberCount || 0,
              page_views_30d: 0, // TODO: implement page views tracking
              sms_credits_used: 0,
              sms_credits_monthly: tier === 'starter' ? 0 : tier === 'pro' ? 500 : 2000,
              email_credits_used: 0,
              email_credits_monthly: 1000,
              stripe_status: isTrial ? 'trialing' : isSuspended ? 'past_due' : 'active',
            };
          })
        );
        setGyms(gymsWithStats);

        // Calculate platform stats
        const totalGyms = gymsWithStats.length;
        const totalMembers = gymsWithStats.reduce((sum, g) => sum + (g.member_count || 0), 0);
        const activeTrials = gymsWithStats.filter(g => g.is_trial === true).length;

        // Count gyms created in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newGyms30d = gymsWithStats.filter(g => new Date(g.created_at) > thirtyDaysAgo).length;

        setPlatformStats({
          totalGyms,
          totalMembers,
          monthlyRevenue: 0, // TODO: integrate with Stripe
          activeTrials,
          churned30d: 0, // TODO: track churn
          newGyms30d,
        });
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredGyms = gyms.filter(gym => {
    const matchesSearch = gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         gym.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'all' || gym.tier === filterTier;
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'trial' && gym.is_trial) ||
                         (filterStatus === 'active' && !gym.is_trial && gym.stripe_status === 'active') ||
                         (filterStatus === 'past_due' && gym.stripe_status === 'past_due');
    return matchesSearch && matchesTier && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
          <p className="text-gray-400 mt-1">Loading...</p>
        </div>
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/2 mb-3" />
              <div className="h-8 bg-white/10 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
          <p className="text-gray-400 mt-1">
            Monitor all gyms, manage features, and track platform health
          </p>
        </div>
        <Link
          href="/super-admin/testing"
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Test Gym
        </Link>
      </div>

      {/* Platform Stats */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Total Gyms"
          value={platformStats.totalGyms}
          icon={Building2}
          trend="+12 this month"
        />
        <StatCard
          label="Total Members"
          value={platformStats.totalMembers.toLocaleString()}
          icon={Users}
          trend="+1,234 this month"
        />
        <StatCard
          label="MRR"
          value={`$${platformStats.monthlyRevenue.toLocaleString()}`}
          icon={CreditCard}
          trend="+8.2%"
        />
        <StatCard
          label="Active Trials"
          value={platformStats.activeTrials}
          icon={Clock}
          color="amber"
        />
        <StatCard
          label="New This Month"
          value={platformStats.newGyms30d}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Churned (30d)"
          value={platformStats.churned30d}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Gyms Management */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-white">All Gyms</h2>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search gyms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500/50 w-64"
                />
              </div>

              {/* Tier Filter */}
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-orange-500/50"
              >
                <option value="all">All Tiers</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-orange-500/50"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="past_due">Past Due</option>
              </select>
            </div>
          </div>
        </div>

        {/* Gyms Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-white/5">
                <th className="px-6 py-3 font-medium">Gym</th>
                <th className="px-6 py-3 font-medium">Tier</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Members</th>
                <th className="px-6 py-3 font-medium">Page Views</th>
                <th className="px-6 py-3 font-medium">SMS/Email</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredGyms.map((gym) => (
                <tr key={gym.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-linear-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center text-orange-400 font-bold">
                        {gym.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{gym.name}</p>
                        <p className="text-sm text-gray-500">{gym.slug}.gymtech.com</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <TierBadge tier={gym.tier} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={gym.stripe_status} isTrial={gym.is_trial} trialEndsAt={gym.trial_ends_at} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{gym.member_count}</span>
                      <span className="text-gray-500 text-sm">/ {gym.tier === 'starter' ? 100 : gym.tier === 'pro' ? 500 : '∞'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-white">{gym.page_views_30d.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="w-3 h-3 text-gray-500" />
                        <span className={gym.sms_credits_used > gym.sms_credits_monthly * 0.8 ? 'text-amber-400' : 'text-gray-400'}>
                          {gym.sms_credits_used}/{gym.sms_credits_monthly}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-3 h-3 text-gray-500" />
                        <span className={gym.email_credits_used > gym.email_credits_monthly * 0.8 ? 'text-amber-400' : 'text-gray-400'}>
                          {gym.email_credits_used}/{gym.email_credits_monthly}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/super-admin/gyms/${gym.id}`}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="View Details"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                      <button
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="More Options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGyms.length === 0 && (
          <div className="p-12 text-center">
            {gyms.length === 0 ? (
              <div className="space-y-4">
                <Building2 className="w-12 h-12 text-gray-600 mx-auto" />
                <p className="text-gray-400 text-lg">No gyms yet</p>
                <p className="text-gray-500 text-sm">Create a test gym to start exploring the platform</p>
                <Link
                  href="/super-admin/testing"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Test Gym
                </Link>
              </div>
            ) : (
              <p className="text-gray-500">No gyms found matching your filters</p>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <QuickActionCard
          title="Gyms Needing Attention"
          description="3 gyms with payment issues"
          icon={AlertCircle}
          color="red"
          href="/super-admin/gyms?filter=issues"
        />
        <QuickActionCard
          title="Expiring Trials"
          description="5 trials ending this week"
          icon={Clock}
          color="amber"
          href="/super-admin/gyms?filter=expiring"
        />
        <QuickActionCard
          title="Feature Requests"
          description="12 pending requests"
          icon={Zap}
          color="purple"
          href="/super-admin/feature-requests"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'orange'
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color?: 'orange' | 'green' | 'red' | 'amber';
}) {
  const colors = {
    orange: 'bg-orange-500/20 text-orange-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    amber: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {trend && (
        <p className="text-sm text-green-400 mt-1">{trend}</p>
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
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[tier as keyof typeof styles] || styles.starter}`}>
      {tier === 'enterprise' && <Crown className="w-3 h-3" />}
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
}

function StatusBadge({ status, isTrial, trialEndsAt }: { status: string; isTrial: boolean; trialEndsAt?: string }) {
  if (isTrial) {
    const daysLeft = trialEndsAt
      ? Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 14;
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
        <Clock className="w-3 h-3" />
        Trial ({daysLeft}d left)
      </span>
    );
  }

  const styles = {
    active: 'bg-green-500/20 text-green-400',
    past_due: 'bg-red-500/20 text-red-400',
    canceled: 'bg-gray-500/20 text-gray-400',
  };

  const icons = {
    active: CheckCircle2,
    past_due: AlertCircle,
    canceled: AlertCircle,
  };

  const Icon = icons[status as keyof typeof icons] || CheckCircle2;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.active}`}>
      <Icon className="w-3 h-3" />
      {status === 'past_due' ? 'Past Due' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  color,
  href
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: 'red' | 'amber' | 'purple';
  href: string;
}) {
  const colors = {
    red: 'bg-red-500/20 text-red-400 group-hover:bg-red-500/30',
    amber: 'bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30',
    purple: 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30',
  };

  return (
    <Link
      href={href}
      className="group bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
    </Link>
  );
}
