'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import { Users, Calendar, DollarSign, TrendingUp, Eye, Zap, Mail, UserPlus, Building2, Plus } from 'lucide-react';

interface DashboardStats {
  totalMembers: number;
  activeClasses: number;
  monthlyRevenue: number;
  pageViews: number;
}

interface RecentActivity {
  type: 'signup' | 'class' | 'payment' | 'booking';
  message: string;
  time: string;
}

interface PopularClass {
  name: string;
  bookings: number;
  capacity: number;
  time: string;
}

export default function OwnerDashboard() {
  const { user, gym } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeClasses: 0,
    monthlyRevenue: 0,
    pageViews: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [popularClasses, setPopularClasses] = useState<PopularClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!gym?.id) {
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Fetch member count
      const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gym.id)
        .eq('role', 'member');

      // Fetch class count
      const { count: classCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gym.id);

      // Fetch popular classes with booking counts
      const { data: classesData } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          capacity,
          class_schedules (
            id,
            day_of_week,
            start_time
          )
        `)
        .eq('gym_id', gym.id)
        .limit(4);

      // Format popular classes
      const formattedClasses: PopularClass[] = (classesData || []).map((cls: Record<string, unknown>) => ({
        name: cls.name as string,
        bookings: 0, // TODO: Count actual bookings
        capacity: (cls.capacity as number) || 20,
        time: 'Schedule TBD', // TODO: Format from class_schedules
      }));

      setStats({
        totalMembers: memberCount || 0,
        activeClasses: classCount || 0,
        monthlyRevenue: 0, // TODO: Integrate with Stripe
        pageViews: 0, // TODO: Implement page view tracking
      });
      setPopularClasses(formattedClasses);
      setRecentActivity([]); // TODO: Implement activity tracking
      setLoading(false);
    }

    fetchDashboardData();
  }, [gym?.id]);

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Loading...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
              <div className="h-10 w-10 bg-white/10 rounded-xl mb-4" />
              <div className="h-8 bg-white/10 rounded w-1/2 mb-2" />
              <div className="h-4 bg-white/10 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show no-gym state for super_admin or users without a gym
  if (!gym?.id) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Owner Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage your gym</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Gym Associated</h2>
          <p className="text-gray-400 mb-6">
            {user?.role === 'super_admin'
              ? 'As a super admin, use the Testing page to create a demo gym and impersonate an owner.'
              : 'You need to be associated with a gym to access this dashboard.'}
          </p>
          {user?.role === 'super_admin' && (
            <Link
              href="/super-admin/testing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Test Gym
            </Link>
          )}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Members', value: stats.totalMembers.toString(), icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'Active Classes', value: stats.activeClasses.toString(), icon: Calendar, color: 'from-green-500 to-green-600' },
    { label: 'Monthly Revenue', value: `$${stats.monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: 'from-purple-500 to-purple-600' },
    { label: 'Page Views (Today)', value: stats.pageViews.toString(), icon: Eye, color: 'from-orange-500 to-amber-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}!
        </h1>
        <p className="text-gray-400 mt-1">
          Here&apos;s what&apos;s happening at {gym.name} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 bg-linear-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          </div>
          {recentActivity.length > 0 ? (
            <>
              <div className="divide-y divide-white/5">
                {recentActivity.map((activity, i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'signup' ? 'bg-green-400' :
                      activity.type === 'payment' ? 'bg-purple-400' :
                      activity.type === 'class' ? 'bg-orange-400' : 'bg-blue-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-gray-200">{activity.message}</p>
                      <p className="text-gray-500 text-sm">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-white/10">
                <button className="text-orange-400 text-sm font-medium hover:text-orange-300 transition-colors">
                  View all activity →
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No recent activity yet</p>
              <p className="text-gray-600 text-sm mt-1">Activity will appear here as members sign up and book classes</p>
            </div>
          )}
        </div>

        {/* Popular Classes */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Popular Classes</h2>
            <p className="text-gray-400 text-sm mt-1">This week&apos;s trending</p>
          </div>
          {popularClasses.length > 0 ? (
            <div className="p-4 space-y-4">
              {popularClasses.map((cls) => (
                <div key={cls.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-200">{cls.name}</span>
                    <span className="text-sm text-gray-500">
                      {cls.bookings}/{cls.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-linear-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${(cls.bookings / cls.capacity) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{cls.time}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">No classes yet</p>
              <Link href="/owner/classes" className="text-orange-400 text-sm hover:text-orange-300 mt-2 inline-block">
                Create your first class →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <button className="flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-orange-500/30 transition-all group">
            <div className="w-12 h-12 bg-linear-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center group-hover:from-orange-500/30 group-hover:to-amber-500/30 transition-all">
              <Users className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors text-center">Add Member</span>
          </button>
          <button className="flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-orange-500/30 transition-all group">
            <div className="w-12 h-12 bg-linear-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center group-hover:from-orange-500/30 group-hover:to-amber-500/30 transition-all">
              <Calendar className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors text-center">Create Class</span>
          </button>
          <button className="flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-orange-500/30 transition-all group">
            <div className="w-12 h-12 bg-linear-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center group-hover:from-orange-500/30 group-hover:to-amber-500/30 transition-all">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors text-center">Flash Sale</span>
          </button>
          <button className="flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-orange-500/30 transition-all group">
            <div className="w-12 h-12 bg-linear-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center group-hover:from-orange-500/30 group-hover:to-amber-500/30 transition-all">
              <Eye className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors text-center">Edit Landing Page</span>
          </button>
          <Link href="/owner/messaging?recipients=all_members" className="flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-blue-500/30 transition-all group">
            <div className="w-12 h-12 bg-linear-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all">
              <Mail className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors text-center">Message All Members</span>
          </Link>
          <Link href="/owner/messaging?recipients=trial_users" className="flex flex-col items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-green-500/30 transition-all group">
            <div className="w-12 h-12 bg-linear-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center group-hover:from-green-500/30 group-hover:to-emerald-500/30 transition-all">
              <UserPlus className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors text-center">Message Trial Users</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
