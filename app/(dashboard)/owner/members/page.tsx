'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  Filter,
  Users,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Zap,
  Star,
  UserCheck,
  UserX,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
} from 'lucide-react';

type Member = {
  id: string;
  member_number: string | null;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: string;
  is_trial: boolean;
  login_streak: number;
  class_streak: number;
  loyalty_points: number;
  created_at: string;
  last_login_at: string | null;
  subscription?: {
    status: string;
    plan_name: string;
  } | null;
};

// Demo data
const demoMembers: Member[] = [
  {
    id: '1',
    member_number: 'MEM-001',
    first_name: 'John',
    last_name: 'Smith',
    avatar_url: null,
    role: 'member',
    is_trial: false,
    login_streak: 12,
    class_streak: 8,
    loyalty_points: 450,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    subscription: { status: 'active', plan_name: 'Pro' },
  },
  {
    id: '2',
    member_number: 'MEM-002',
    first_name: 'Sarah',
    last_name: 'Johnson',
    avatar_url: null,
    role: 'member',
    is_trial: false,
    login_streak: 7,
    class_streak: 5,
    loyalty_points: 280,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    subscription: { status: 'active', plan_name: 'Elite' },
  },
  {
    id: '3',
    member_number: 'MEM-003',
    first_name: 'Mike',
    last_name: 'Lee',
    avatar_url: null,
    role: 'member',
    is_trial: true,
    login_streak: 3,
    class_streak: 2,
    loyalty_points: 30,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    subscription: null,
  },
  {
    id: '4',
    member_number: 'MEM-004',
    first_name: 'Emily',
    last_name: 'Davis',
    avatar_url: null,
    role: 'member',
    is_trial: false,
    login_streak: 0,
    class_streak: 0,
    loyalty_points: 120,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    subscription: { status: 'past_due', plan_name: 'Basic' },
  },
  {
    id: '5',
    member_number: 'MEM-005',
    first_name: 'James',
    last_name: 'Wilson',
    avatar_url: null,
    role: 'member',
    is_trial: false,
    login_streak: 21,
    class_streak: 15,
    loyalty_points: 890,
    created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date().toISOString(),
    subscription: { status: 'active', plan_name: 'Elite' },
  },
  {
    id: '6',
    member_number: 'MEM-006',
    first_name: 'Lisa',
    last_name: 'Brown',
    avatar_url: null,
    role: 'member',
    is_trial: true,
    login_streak: 1,
    class_streak: 1,
    loyalty_points: 10,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    last_login_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    subscription: null,
  },
];

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  trialing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  past_due: 'bg-red-500/20 text-red-400 border-red-500/30',
  canceled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  trial: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export default function MembersPage() {
  const { gym } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const pageSize = 10;

  useEffect(() => {
    const fetchMembers = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl || !gym?.id) {
        // Demo mode
        setMembers(demoMembers);
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Fetch members (profiles with role = 'member')
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          member_number,
          first_name,
          last_name,
          avatar_url,
          role,
          is_trial,
          login_streak,
          class_streak,
          loyalty_points,
          created_at,
          last_login_at
        `)
        .eq('gym_id', gym.id)
        .eq('role', 'member')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching members:', error);
        setMembers(demoMembers);
      } else {
        // TODO: Join with subscriptions to get plan info
        setMembers(data || []);
      }

      setLoading(false);
    };

    fetchMembers();
  }, [gym?.id]);

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.member_number?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'trial' && member.is_trial) ||
      (statusFilter === 'active' && member.subscription?.status === 'active') ||
      (statusFilter === 'past_due' && member.subscription?.status === 'past_due') ||
      (statusFilter === 'inactive' && !member.subscription && !member.is_trial);

    return matchesSearch && matchesStatus;
  });

  const paginatedMembers = filteredMembers.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredMembers.length / pageSize);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  const getMemberStatus = (member: Member) => {
    if (member.is_trial) return 'trial';
    return member.subscription?.status || 'inactive';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Members</h1>
          <p className="text-gray-400 mt-1">
            {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-colors">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl hover:bg-white/10 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25">
            <Plus className="w-5 h-5" />
            Add Member
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {members.filter((m) => m.subscription?.status === 'active').length}
              </p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {members.filter((m) => m.is_trial).length}
              </p>
              <p className="text-sm text-gray-500">On Trial</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {members.filter((m) => m.subscription?.status === 'past_due').length}
              </p>
              <p className="text-sm text-gray-500">Past Due</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {members.filter((m) => m.login_streak >= 7).length}
              </p>
              <p className="text-sm text-gray-500">7+ Day Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or member number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-orange-500/50 transition-colors"
          >
            <option value="all" className="bg-[#12121a]">All Status</option>
            <option value="active" className="bg-[#12121a]">Active</option>
            <option value="trial" className="bg-[#12121a]">Trial</option>
            <option value="past_due" className="bg-[#12121a]">Past Due</option>
            <option value="inactive" className="bg-[#12121a]">Inactive</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Member</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Plan</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Streaks</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Points</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Last Active</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedMembers.map((member) => (
                <tr key={member.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium text-white">
                            {getInitials(member.first_name, member.last_name)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{member.member_number || 'No ID'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      statusColors[getMemberStatus(member)] || statusColors.canceled
                    }`}>
                      {getMemberStatus(member).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-300">
                      {member.subscription?.plan_name || (member.is_trial ? 'Trial' : '-')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {member.login_streak > 0 && (
                        <div className="flex items-center gap-1 text-amber-400">
                          <Zap className="w-4 h-4" />
                          <span className="text-sm">{member.login_streak}</span>
                        </div>
                      )}
                      {member.class_streak > 0 && (
                        <div className="flex items-center gap-1 text-green-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">{member.class_streak}</span>
                        </div>
                      )}
                      {member.login_streak === 0 && member.class_streak === 0 && (
                        <span className="text-gray-500">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-purple-400">
                      <Star className="w-4 h-4" />
                      <span className="text-sm">{member.loyalty_points}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-400">
                      {formatRelativeTime(member.last_login_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>

                      {openMenuId === member.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-48 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                            <Link
                              href={`/owner/members/${member.id}`}
                              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 transition-colors"
                            >
                              <Users className="w-4 h-4" />
                              View Profile
                            </Link>
                            <Link
                              href={`/owner/messaging?to=${member.id}`}
                              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                              Send Message
                            </Link>
                            <button className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-white/5 transition-colors">
                              <Phone className="w-4 h-4" />
                              Contact Info
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {paginatedMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No members found</h3>
            <p className="text-gray-400">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add your first member to get started'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredMembers.length)} of {filteredMembers.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, i, arr) => (
                  <span key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="text-gray-500 px-2">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                        p === page
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
