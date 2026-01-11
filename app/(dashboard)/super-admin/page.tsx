'use client';

import { useState } from 'react';
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
} from 'lucide-react';

// Demo data - will come from Supabase gym_stats view
const demoGyms = [
  {
    id: '1',
    name: 'Iron MMA Academy',
    slug: 'iron-mma',
    tier: 'pro',
    is_trial: false,
    member_count: 247,
    class_count: 12,
    lead_count: 34,
    page_views_30d: 1523,
    sms_credits_used: 123,
    sms_credits_monthly: 500,
    email_credits_used: 456,
    email_credits_monthly: 1000,
    created_at: '2025-11-15',
    stripe_status: 'active',
  },
  {
    id: '2',
    name: 'Downtown BJJ',
    slug: 'downtown-bjj',
    tier: 'starter',
    is_trial: true,
    trial_ends_at: '2026-01-20',
    member_count: 45,
    class_count: 8,
    lead_count: 12,
    page_views_30d: 234,
    sms_credits_used: 0,
    sms_credits_monthly: 0,
    email_credits_used: 89,
    email_credits_monthly: 1000,
    created_at: '2026-01-06',
    stripe_status: 'trialing',
  },
  {
    id: '3',
    name: 'Elite Fight Club',
    slug: 'elite-fight',
    tier: 'enterprise',
    is_trial: false,
    member_count: 823,
    class_count: 24,
    lead_count: 156,
    page_views_30d: 4521,
    sms_credits_used: 1234,
    sms_credits_monthly: 2000,
    email_credits_used: 2345,
    email_credits_monthly: 5000,
    created_at: '2025-08-01',
    stripe_status: 'active',
  },
  {
    id: '4',
    name: 'Muay Thai Masters',
    slug: 'muay-thai-masters',
    tier: 'pro',
    is_trial: false,
    member_count: 189,
    class_count: 10,
    lead_count: 28,
    page_views_30d: 987,
    sms_credits_used: 234,
    sms_credits_monthly: 500,
    email_credits_used: 567,
    email_credits_monthly: 1000,
    created_at: '2025-10-01',
    stripe_status: 'past_due',
  },
];

const platformStats = {
  totalGyms: 127,
  totalMembers: 15234,
  monthlyRevenue: 18750,
  activeTrials: 23,
  churned30d: 3,
  newGyms30d: 12,
};

export default function SuperAdminDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredGyms = demoGyms.filter(gym => {
    const matchesSearch = gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         gym.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'all' || gym.tier === filterTier;
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'trial' && gym.is_trial) ||
                         (filterStatus === 'active' && !gym.is_trial && gym.stripe_status === 'active') ||
                         (filterStatus === 'past_due' && gym.stripe_status === 'past_due');
    return matchesSearch && matchesTier && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-gray-400 mt-1">
          Monitor all gyms, manage features, and track platform health
        </p>
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
            <p className="text-gray-500">No gyms found matching your filters</p>
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
