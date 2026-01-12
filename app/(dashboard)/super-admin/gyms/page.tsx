'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Gym } from '@/types/database';
import {
  Building2,
  Search,
  Filter,
  Plus,
  Crown,
  Users,
  ExternalLink,
  MoreVertical,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

type FilterType = 'all' | 'active' | 'trial' | 'issues' | 'expiring';

export default function SuperAdminGymsPage() {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get('filter') as FilterType) || 'all';

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>(initialFilter);

  useEffect(() => {
    async function fetchGyms() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setGyms(data);
      }
      setLoading(false);
    }
    fetchGyms();
  }, []);

  // Filter gyms based on search and filter type
  const filteredGyms = gyms.filter((gym) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !gym.name.toLowerCase().includes(query) &&
        !gym.slug.toLowerCase().includes(query) &&
        !(gym.custom_domain?.toLowerCase().includes(query))
      ) {
        return false;
      }
    }

    // Type filter
    switch (filter) {
      case 'trial':
        return gym.is_trial;
      case 'issues':
        return gym.stripe_subscription_id === null && !gym.is_trial;
      case 'expiring':
        if (!gym.is_trial || !gym.trial_ends_at) return false;
        const daysLeft = Math.ceil(
          (new Date(gym.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysLeft <= 7 && daysLeft > 0;
      case 'active':
        return !gym.is_trial && gym.stripe_subscription_id;
      default:
        return true;
    }
  });

  const tierStyles: Record<string, string> = {
    starter: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    pro: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    enterprise: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">All Gyms</h1>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="w-7 h-7 text-orange-400" />
            All Gyms
          </h1>
          <p className="text-gray-400 mt-1">
            {gyms.length} total gym{gyms.length !== 1 ? 's' : ''} on the platform
          </p>
        </div>
        <Link
          href="/super-admin/testing"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-linear-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25"
        >
          <Plus className="w-5 h-5" />
          Create Test Gym
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search gyms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'trial', label: 'Trial' },
            { value: 'expiring', label: 'Expiring' },
            { value: 'issues', label: 'Issues' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as FilterType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gyms List */}
      {filteredGyms.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            {gyms.length === 0 ? 'No gyms yet' : 'No gyms match your filters'}
          </h2>
          <p className="text-gray-400 mb-6">
            {gyms.length === 0
              ? 'Create a test gym to get started with development.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
          {gyms.length === 0 && (
            <Link
              href="/super-admin/testing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Test Gym
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Gym</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Tier</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Domain</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Created</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredGyms.map((gym) => {
                const isExpiring = gym.is_trial && gym.trial_ends_at &&
                  Math.ceil((new Date(gym.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 7;

                return (
                  <tr key={gym.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold">
                            {gym.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <Link
                            href={`/super-admin/gyms/${gym.id}`}
                            className="font-medium text-white hover:text-orange-400 transition-colors"
                          >
                            {gym.name}
                          </Link>
                          <p className="text-sm text-gray-500">{gym.slug}.techforgyms.shop</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${tierStyles[gym.tier] || tierStyles.starter}`}>
                        {gym.tier === 'enterprise' && <Crown className="w-3 h-3" />}
                        {gym.tier.charAt(0).toUpperCase() + gym.tier.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {gym.is_trial ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          isExpiring
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {isExpiring ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          Trial
                          {gym.trial_ends_at && (
                            <span className="ml-1">
                              ({Math.ceil((new Date(gym.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d left)
                            </span>
                          )}
                        </span>
                      ) : gym.stripe_subscription_id ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <AlertCircle className="w-3 h-3" />
                          No Subscription
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {gym.custom_domain ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-300">{gym.custom_domain}</span>
                          {gym.domain_verified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(gym.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`https://${gym.slug}.techforgyms.shop`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Visit site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <Link
                          href={`/super-admin/gyms/${gym.id}`}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Manage"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
