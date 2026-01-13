'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Eye,
  Clock,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
} from 'lucide-react';

interface AnalyticsStats {
  totalMembers: number;
  memberGrowth: number;
  activeMembers: number;
  classAttendance: number;
  avgClassSize: number;
  pageViews: number;
  conversionRate: number;
  retentionRate: number;
}

interface ClassPopularity {
  name: string;
  totalBookings: number;
  avgAttendance: number;
  trend: 'up' | 'down' | 'stable';
}

interface TimeSlotData {
  time: string;
  bookings: number;
}

export default function AnalyticsPage() {
  const { gym } = useAuthStore();
  const [stats, setStats] = useState<AnalyticsStats>({
    totalMembers: 0,
    memberGrowth: 0,
    activeMembers: 0,
    classAttendance: 0,
    avgClassSize: 0,
    pageViews: 0,
    conversionRate: 0,
    retentionRate: 0,
  });
  const [classPopularity, setClassPopularity] = useState<ClassPopularity[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    async function fetchAnalytics() {
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

      // Fetch classes for popularity data
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name, capacity')
        .eq('gym_id', gym.id)
        .eq('is_active', true)
        .limit(10);

      // Format class popularity (placeholder data for now)
      const formattedClasses: ClassPopularity[] = (classesData || []).map((cls) => ({
        name: cls.name,
        totalBookings: 0, // TODO: Calculate from bookings
        avgAttendance: 0,
        trend: 'stable' as const,
      }));

      // Time slot popularity (placeholder)
      const slots: TimeSlotData[] = [
        { time: '6:00 AM', bookings: 0 },
        { time: '7:00 AM', bookings: 0 },
        { time: '8:00 AM', bookings: 0 },
        { time: '9:00 AM', bookings: 0 },
        { time: '12:00 PM', bookings: 0 },
        { time: '5:00 PM', bookings: 0 },
        { time: '6:00 PM', bookings: 0 },
        { time: '7:00 PM', bookings: 0 },
        { time: '8:00 PM', bookings: 0 },
      ];

      setStats({
        totalMembers: memberCount || 0,
        memberGrowth: 0, // TODO: Calculate growth
        activeMembers: 0, // TODO: Calculate active based on recent logins
        classAttendance: 0,
        avgClassSize: 0,
        pageViews: 0, // TODO: Implement page tracking
        conversionRate: 0,
        retentionRate: 0,
      });

      setClassPopularity(formattedClasses);
      setTimeSlots(slots);
      setLoading(false);
    }

    fetchAnalytics();
  }, [gym?.id, dateRange]);

  const maxBookings = Math.max(...timeSlots.map((s) => s.bookings), 1);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
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

  if (!gym?.id) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Track your gym&apos;s performance</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Gym Associated</h2>
          <p className="text-gray-400">You need to be associated with a gym to view analytics.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Members',
      value: stats.totalMembers,
      change: stats.memberGrowth,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Active Members',
      value: stats.activeMembers,
      change: 0,
      icon: Zap,
      color: 'from-green-500 to-green-600',
    },
    {
      label: 'Page Views',
      value: stats.pageViews,
      change: 0,
      icon: Eye,
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Retention Rate',
      value: `${stats.retentionRate}%`,
      change: 0,
      icon: Target,
      color: 'from-orange-500 to-amber-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Track performance and member engagement</p>
        </div>
        <div className="relative">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-orange-500/50 transition-colors pr-10 [&>option]:text-gray-900 [&>option]:bg-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 bg-linear-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              {stat.change !== 0 && (
                <div className={`flex items-center gap-1 text-sm ${stat.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {Math.abs(stat.change)}%
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Class Popularity */}
        <div className="bg-white/5 border border-white/10 rounded-2xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Class Popularity</h2>
            <p className="text-gray-400 text-sm mt-1">Most booked classes this period</p>
          </div>
          {classPopularity.length > 0 ? (
            <div className="p-4 space-y-4">
              {classPopularity.map((cls) => (
                <div key={cls.name} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{cls.name}</span>
                      <span className="text-sm text-gray-400">{cls.totalBookings} bookings</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-linear-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((cls.totalBookings / 100) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    cls.trend === 'up' ? 'text-green-400' :
                    cls.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {cls.trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                     cls.trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
                     <span className="w-4 h-4 text-center">-</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500">No class data yet</p>
              <p className="text-gray-600 text-sm mt-1">Create classes to see popularity stats</p>
            </div>
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-white/5 border border-white/10 rounded-2xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Peak Hours</h2>
            <p className="text-gray-400 text-sm mt-1">Most popular class times</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {timeSlots.map((slot) => (
                <div key={slot.time} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-gray-400">{slot.time}</div>
                  <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-linear-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all flex items-center justify-end pr-2"
                      style={{ width: `${maxBookings > 0 ? (slot.bookings / maxBookings) * 100 : 0}%` }}
                    >
                      {slot.bookings > 0 && (
                        <span className="text-xs text-white font-medium">{slot.bookings}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {timeSlots.every((s) => s.bookings === 0) && (
              <div className="text-center py-4 mt-4 border-t border-white/10">
                <p className="text-gray-500 text-sm">No booking data yet</p>
                <p className="text-gray-600 text-xs mt-1">Peak hours will appear once members start booking classes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stats.classAttendance}%</p>
              <p className="text-sm text-gray-500">Class Attendance</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stats.avgClassSize}</p>
              <p className="text-sm text-gray-500">Avg Class Size</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stats.conversionRate}%</p>
              <p className="text-sm text-gray-500">Trial Conversion</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">0</p>
              <p className="text-sm text-gray-500">Avg Session (mins)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">More Analytics Coming Soon</h3>
            <p className="text-gray-400 mt-1 text-sm">
              We&apos;re working on detailed charts, member engagement tracking, revenue analytics, and custom reports. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
