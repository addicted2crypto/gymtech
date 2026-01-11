'use client';

import { useAuthStore } from '@/stores/authStore';
import { Calendar, Gift, Zap, Trophy, Clock, CreditCard, TrendingUp, CheckCircle2, Star } from 'lucide-react';

// Placeholder data - will come from database
const upcomingClasses = [
  { name: 'BJJ Fundamentals', instructor: 'Coach Mike', time: 'Today, 7:00 PM', spotsLeft: 5 },
  { name: 'Muay Thai', instructor: 'Coach Sarah', time: 'Tomorrow, 6:00 PM', spotsLeft: 8 },
  { name: 'Wrestling', instructor: 'Coach Dan', time: 'Saturday, 10:00 AM', spotsLeft: 12 },
];

const availableRewards = [
  { name: 'Free Class Pass', points: 100, description: 'One free drop-in class' },
  { name: '10% Off Merch', points: 50, description: 'Discount on any gear' },
  { name: 'Private Lesson', points: 500, description: '1-hour private training' },
];

const recentClasses = [
  { name: 'BJJ Fundamentals', date: 'Jan 2', attended: true },
  { name: 'Muay Thai', date: 'Jan 1', attended: true },
  { name: 'Wrestling', date: 'Dec 30', attended: true },
  { name: 'BJJ Fundamentals', date: 'Dec 28', attended: false },
  { name: 'Muay Thai', date: 'Dec 27', attended: true },
];

// Member consistency levels
const consistencyLevels = [
  { name: 'Bronze', minAttendance: 50, color: 'amber', icon: '🥉' },
  { name: 'Silver', minAttendance: 70, color: 'gray', icon: '🥈' },
  { name: 'Gold', minAttendance: 85, color: 'yellow', icon: '🥇' },
  { name: 'Platinum', minAttendance: 95, color: 'cyan', icon: '💎' },
];

function getConsistencyLevel(attendance: number) {
  for (let i = consistencyLevels.length - 1; i >= 0; i--) {
    if (attendance >= consistencyLevels[i].minAttendance) {
      return { ...consistencyLevels[i], nextLevel: consistencyLevels[i + 1] || null };
    }
  }
  return { name: 'New', minAttendance: 0, color: 'gray', icon: '🌱', nextLevel: consistencyLevels[0] };
}

export default function MemberDashboard() {
  const { user } = useAuthStore();

  // Demo attendance data
  const attendanceStats = {
    percentage: 82,
    classesBooked: 22,
    classesAttended: 18,
    currentStreak: user?.login_streak || 7,
    bestStreak: 14,
  };

  const currentLevel = getConsistencyLevel(attendanceStats.percentage);
  const progressToNext = currentLevel.nextLevel
    ? ((attendanceStats.percentage - currentLevel.minAttendance) / (currentLevel.nextLevel.minAttendance - currentLevel.minAttendance)) * 100
    : 100;

  return (
    <div className="space-y-8">
      {/* Header with Streak & Level */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Streak Card */}
        <div className="bg-linear-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full" />
            <div className="absolute -right-5 -bottom-10 w-32 h-32 bg-white rounded-full" />
          </div>

          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user?.first_name}!
              </h1>
              <p className="text-orange-100 mt-1">
                Keep up the great work on your training journey.
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-white">
                <Zap className="w-6 h-6" />
                <span className="text-3xl font-bold">{attendanceStats.currentStreak}</span>
              </div>
              <p className="text-orange-100 text-sm">day streak</p>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-bold">{user?.loyalty_points || 0}</p>
              <p className="text-orange-100 text-sm">Loyalty Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{user?.total_logins || 0}</p>
              <p className="text-orange-100 text-sm">Total Check-ins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{attendanceStats.classesAttended}</p>
              <p className="text-orange-100 text-sm">Classes This Month</p>
            </div>
          </div>
        </div>

        {/* Consistency Level Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                currentLevel.color === 'amber' ? 'bg-amber-500/20' :
                currentLevel.color === 'gray' ? 'bg-gray-400/20' :
                currentLevel.color === 'yellow' ? 'bg-yellow-500/20' :
                currentLevel.color === 'cyan' ? 'bg-cyan-400/20' : 'bg-gray-500/20'
              }`}>
                {currentLevel.icon}
              </div>
              <div>
                <p className="text-gray-400 text-sm">Your Level</p>
                <h2 className="text-xl font-bold text-white">{currentLevel.name}</h2>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${
                currentLevel.color === 'amber' ? 'text-amber-400' :
                currentLevel.color === 'gray' ? 'text-gray-300' :
                currentLevel.color === 'yellow' ? 'text-yellow-400' :
                currentLevel.color === 'cyan' ? 'text-cyan-400' : 'text-gray-400'
              }`}>
                {attendanceStats.percentage}%
              </p>
              <p className="text-gray-500 text-sm">attendance</p>
            </div>
          </div>

          {/* Progress to next level */}
          {currentLevel.nextLevel && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Progress to {currentLevel.nextLevel.name}</span>
                <span className="text-gray-500">{currentLevel.nextLevel.minAttendance}% needed</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    currentLevel.color === 'amber' ? 'bg-linear-to-r from-amber-500 to-amber-600' :
                    currentLevel.color === 'gray' ? 'bg-linear-to-r from-gray-400 to-gray-500' :
                    currentLevel.color === 'yellow' ? 'bg-linear-to-r from-yellow-500 to-amber-500' :
                    'bg-linear-to-r from-orange-500 to-amber-500'
                  }`}
                  style={{ width: `${Math.min(progressToNext, 100)}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Attend {Math.max(0, Math.ceil((currentLevel.nextLevel.minAttendance - attendanceStats.percentage) / 100 * attendanceStats.classesBooked))} more classes to level up!
              </p>
            </div>
          )}

          {/* Level Perks */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-gray-400 text-sm mb-2">Your {currentLevel.name} Perks:</p>
            <div className="flex flex-wrap gap-2">
              {currentLevel.name === 'Gold' || currentLevel.name === 'Platinum' ? (
                <>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    10% Off Membership
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Priority Booking
                  </span>
                </>
              ) : currentLevel.name === 'Silver' ? (
                <>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    5% Off Merch
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Priority Booking
                  </span>
                </>
              ) : (
                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                  Hit 50% attendance to unlock perks!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Flash Sale Banner (if eligible) */}
      {(user?.login_streak ?? 0) >= 7 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-300">7-Day Streak Reward!</h3>
            <p className="text-amber-400/80 text-sm">You&apos;ve unlocked 15% off your next month. Use code: STREAK15</p>
          </div>
          <button className="px-4 py-2 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25">
            Claim
          </button>
        </div>
      )}

      {/* Attendance History Mini */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            Recent Attendance
          </h2>
          <button className="text-orange-400 text-sm font-medium hover:text-orange-300 transition-colors">
            View All →
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {recentClasses.map((cls, i) => (
            <div
              key={i}
              className={`shrink-0 w-24 p-3 rounded-xl text-center ${
                cls.attended
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}
            >
              <p className={`text-xs font-medium ${cls.attended ? 'text-green-400' : 'text-red-400'}`}>
                {cls.attended ? '✓ Attended' : '✗ Missed'}
              </p>
              <p className="text-white font-medium text-sm mt-1 truncate">{cls.name}</p>
              <p className="text-gray-500 text-xs">{cls.date}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upcoming Classes */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Upcoming Classes</h2>
              <p className="text-gray-400 text-sm">Your scheduled training sessions</p>
            </div>
            <button className="text-orange-400 text-sm font-medium hover:text-orange-300 transition-colors">
              View Schedule →
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {upcomingClasses.map((cls, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-200">{cls.name}</p>
                  <p className="text-gray-500 text-sm">{cls.instructor}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-200 font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {cls.time}
                  </p>
                  <p className="text-gray-500 text-sm">{cls.spotsLeft} spots left</p>
                </div>
                <button className="px-4 py-2 border border-orange-500/50 text-orange-400 rounded-xl font-medium hover:bg-orange-500/10 transition-all">
                  Book
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rewards Panel */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Rewards</h2>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              You have <span className="font-semibold text-orange-400">{user?.loyalty_points || 0} points</span>
            </p>
          </div>
          <div className="p-4 space-y-3">
            {availableRewards.map((reward, i) => (
              <div
                key={i}
                className={`p-3 border rounded-xl ${
                  (user?.loyalty_points ?? 0) >= reward.points
                    ? 'border-orange-500/30 bg-orange-500/10'
                    : 'border-white/10 bg-white/5 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-200">{reward.name}</span>
                  <span className="text-sm font-medium text-orange-400">{reward.points} pts</span>
                </div>
                <p className="text-gray-400 text-sm">{reward.description}</p>
                {(user?.loyalty_points ?? 0) >= reward.points && (
                  <button className="mt-2 w-full py-1.5 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-amber-600 transition-all">
                    Redeem
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Membership</h2>
          </div>
          <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-sm font-medium">
            Active
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-200 font-medium">Unlimited Monthly</p>
            <p className="text-gray-500 text-sm">Renews on January 15, 2026</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">$149</p>
            <p className="text-gray-500 text-sm">per month</p>
          </div>
        </div>
      </div>
    </div>
  );
}
