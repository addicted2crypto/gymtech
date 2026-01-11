'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Users, Calendar, DollarSign, TrendingUp, Eye, Zap, Mail, UserPlus } from 'lucide-react';

// Placeholder stats - these will come from the database
const stats = [
  { label: 'Total Members', value: '248', change: '+12%', icon: Users, color: 'from-blue-500 to-blue-600' },
  { label: 'Active Classes', value: '18', change: '+3', icon: Calendar, color: 'from-green-500 to-green-600' },
  { label: 'Monthly Revenue', value: '$12,450', change: '+8%', icon: DollarSign, color: 'from-purple-500 to-purple-600' },
  { label: 'Page Views (Today)', value: '342', change: '+24%', icon: Eye, color: 'from-orange-500 to-amber-500' },
];

const recentActivity = [
  { type: 'signup', message: 'New member: John Smith signed up', time: '5 min ago' },
  { type: 'class', message: 'BJJ Fundamentals class is now full', time: '12 min ago' },
  { type: 'payment', message: 'Payment received from Sarah Johnson', time: '25 min ago' },
  { type: 'booking', message: 'Mike Lee booked Muay Thai (6:00 PM)', time: '1 hour ago' },
];

const popularClasses = [
  { name: 'BJJ Fundamentals', bookings: 45, capacity: 50, time: 'Mon/Wed/Fri 7:00 PM' },
  { name: 'Muay Thai', bookings: 38, capacity: 40, time: 'Tue/Thu 6:00 PM' },
  { name: 'Wrestling', bookings: 22, capacity: 30, time: 'Sat 10:00 AM' },
  { name: 'MMA Sparring', bookings: 15, capacity: 20, time: 'Fri 8:00 PM' },
];

export default function OwnerDashboard() {
  const { user, gym } = useAuthStore();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-gray-400 mt-1">
          Here&apos;s what&apos;s happening at {gym?.name || 'your gym'} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 bg-linear-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {stat.change}
              </span>
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
        </div>

        {/* Popular Classes */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Popular Classes</h2>
            <p className="text-gray-400 text-sm mt-1">This week&apos;s trending</p>
          </div>
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
