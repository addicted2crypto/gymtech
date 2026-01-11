'use client';

import { useState } from 'react';
import {
  Zap,
  Trophy,
  Gift,
  Percent,
  TrendingUp,
  Users,
  Calendar,
  Settings,
  Plus,
  Edit2,
  Trash2,
  ChevronRight
} from 'lucide-react';

interface ConsistencyLevel {
  id: string;
  name: string;
  minAttendance: number;
  color: string;
  discountPercent: number;
  perks: string[];
}

interface FlashSale {
  id: string;
  name: string;
  discountPercent: number;
  minStreak: number;
  minAttendance: number;
  validUntil: string;
  isActive: boolean;
}

const defaultLevels: ConsistencyLevel[] = [
  { id: '1', name: 'Bronze', minAttendance: 50, color: 'amber', discountPercent: 0, perks: ['Priority class booking'] },
  { id: '2', name: 'Silver', minAttendance: 70, color: 'gray', discountPercent: 5, perks: ['Priority class booking', '5% off merchandise'] },
  { id: '3', name: 'Gold', minAttendance: 85, color: 'yellow', discountPercent: 10, perks: ['Priority class booking', '10% off merchandise', 'Free guest pass/month'] },
  { id: '4', name: 'Platinum', minAttendance: 95, color: 'cyan', discountPercent: 15, perks: ['Priority class booking', '15% off everything', 'Unlimited guest passes', 'VIP events access'] },
];

const defaultFlashSales: FlashSale[] = [
  { id: '1', name: '7-Day Streak Reward', discountPercent: 15, minStreak: 7, minAttendance: 0, validUntil: 'Always', isActive: true },
  { id: '2', name: 'Perfect Attendance', discountPercent: 20, minStreak: 0, minAttendance: 100, validUntil: 'Monthly', isActive: true },
];

export default function EngagementPage() {
  const [activeTab, setActiveTab] = useState<'levels' | 'sales' | 'rewards'>('levels');
  const [levels, setLevels] = useState(defaultLevels);
  const [flashSales, setFlashSales] = useState(defaultFlashSales);
  const [editingLevel, setEditingLevel] = useState<ConsistencyLevel | null>(null);

  // Demo stats
  const stats = {
    avgAttendance: 72,
    totalMembers: 248,
    consistentMembers: 89,
    rewardsRedeemed: 156
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Member Engagement</h1>
        <p className="text-gray-400 mt-1">
          Reward consistent members and drive attendance with automated incentives
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Avg Attendance"
          value={`${stats.avgAttendance}%`}
          color="from-green-500 to-emerald-500"
        />
        <StatCard
          icon={Users}
          label="Consistent Members"
          value={stats.consistentMembers.toString()}
          subtext={`of ${stats.totalMembers} total`}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={Trophy}
          label="Gold+ Members"
          value="34"
          subtext="85%+ attendance"
          color="from-yellow-500 to-amber-500"
        />
        <StatCard
          icon={Gift}
          label="Rewards Redeemed"
          value={stats.rewardsRedeemed.toString()}
          subtext="this month"
          color="from-purple-500 to-pink-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-px">
        <TabButton active={activeTab === 'levels'} onClick={() => setActiveTab('levels')}>
          <Trophy className="w-4 h-4" />
          Consistency Levels
        </TabButton>
        <TabButton active={activeTab === 'sales'} onClick={() => setActiveTab('sales')}>
          <Zap className="w-4 h-4" />
          Flash Sales
        </TabButton>
        <TabButton active={activeTab === 'rewards'} onClick={() => setActiveTab('rewards')}>
          <Gift className="w-4 h-4" />
          Rewards Catalog
        </TabButton>
      </div>

      {/* Content */}
      {activeTab === 'levels' && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Consistency Levels</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Members automatically earn levels based on their class attendance percentage
                </p>
              </div>
              <button className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-all">
                <Plus className="w-4 h-4" />
                Add Level
              </button>
            </div>

            <div className="space-y-4">
              {levels.map((level) => (
                <LevelCard
                  key={level.id}
                  level={level}
                  onEdit={() => setEditingLevel(level)}
                  onDelete={() => setLevels(levels.filter(l => l.id !== level.id))}
                />
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">How Attendance is Calculated</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Booked Classes</p>
                  <p className="text-gray-500 text-sm">Only classes member books count toward attendance</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Rolling 30 Days</p>
                  <p className="text-gray-500 text-sm">Percentage calculated over last 30 days</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Automatic Updates</p>
                  <p className="text-gray-500 text-sm">Levels update daily based on check-ins</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">Flash Sales & Streak Rewards</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Automatic discounts for members who hit attendance or streak milestones
                </p>
              </div>
              <button className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-all">
                <Plus className="w-4 h-4" />
                Create Sale
              </button>
            </div>

            <div className="space-y-4">
              {flashSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    sale.isActive ? 'bg-amber-500/20' : 'bg-gray-500/20'
                  }`}>
                    <Zap className={`w-6 h-6 ${sale.isActive ? 'text-amber-400' : 'text-gray-400'}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-white">{sale.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        sale.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {sale.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-0.5">
                      {sale.minStreak > 0 && `${sale.minStreak}+ day streak`}
                      {sale.minStreak > 0 && sale.minAttendance > 0 && ' or '}
                      {sale.minAttendance > 0 && `${sale.minAttendance}%+ attendance`}
                      {' • '}{sale.validUntil}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-400">{sale.discountPercent}%</p>
                    <p className="text-gray-500 text-xs">discount</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4">
            <Zap className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-300">Pro Tip</h3>
              <p className="text-amber-400/80 text-sm mt-1">
                Flash sales appear on member dashboards when they log in. Members with 7+ day streaks
                are 3x more likely to renew their membership!
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Rewards Catalog</h2>
              <p className="text-gray-400 text-sm mt-1">
                Rewards members can redeem with their loyalty points
              </p>
            </div>
            <button className="flex items-center gap-2 bg-linear-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-all">
              <Plus className="w-4 h-4" />
              Add Reward
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <RewardCard
              name="Free Class Pass"
              points={100}
              description="One free drop-in class"
              redeemed={45}
            />
            <RewardCard
              name="10% Off Merch"
              points={50}
              description="Discount on any gear"
              redeemed={89}
            />
            <RewardCard
              name="Private Lesson"
              points={500}
              description="1-hour with any coach"
              redeemed={12}
            />
            <RewardCard
              name="Month Free"
              points={1000}
              description="Next month on us"
              redeemed={3}
            />
          </div>
        </div>
      )}

      {/* Edit Level Modal */}
      {editingLevel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Edit {editingLevel.name} Level</h2>
              <button onClick={() => setEditingLevel(null)} className="text-gray-400 hover:text-white">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Level Name</label>
                <input
                  type="text"
                  value={editingLevel.name}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Attendance %</label>
                <input
                  type="number"
                  value={editingLevel.minAttendance}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Discount Percent</label>
                <input
                  type="number"
                  value={editingLevel.discountPercent}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setEditingLevel(null)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-linear-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-all">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext?: string;
  color: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className={`w-10 h-10 bg-linear-to-br ${color} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-400 text-sm">{label}</p>
      {subtext && <p className="text-gray-500 text-xs mt-0.5">{subtext}</p>}
    </div>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
        active
          ? 'text-orange-400 border-b-2 border-orange-400 -mb-px'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function LevelCard({ level, onEdit, onDelete }: {
  level: ConsistencyLevel;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colorClasses: Record<string, string> = {
    amber: 'from-amber-600 to-amber-700 text-amber-100',
    gray: 'from-gray-400 to-gray-500 text-gray-100',
    yellow: 'from-yellow-500 to-amber-500 text-yellow-100',
    cyan: 'from-cyan-400 to-blue-500 text-cyan-100',
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
      <div className={`w-12 h-12 bg-linear-to-br ${colorClasses[level.color] || colorClasses.gray} rounded-xl flex items-center justify-center`}>
        <Trophy className="w-6 h-6" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-white">{level.name}</h3>
          <span className="text-gray-500 text-sm">{level.minAttendance}%+ attendance</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {level.perks.map((perk, i) => (
            <span key={i} className="px-2 py-0.5 bg-white/10 text-gray-300 text-xs rounded-full">
              {perk}
            </span>
          ))}
        </div>
      </div>

      {level.discountPercent > 0 && (
        <div className="text-right">
          <p className="text-xl font-bold text-green-400">{level.discountPercent}%</p>
          <p className="text-gray-500 text-xs">discount</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function RewardCard({ name, points, description, redeemed }: {
  name: string;
  points: number;
  description: string;
  redeemed: number;
}) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-orange-500/30 transition-all cursor-pointer group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-orange-400 font-semibold">{points} pts</span>
        <span className="text-gray-500 text-xs">{redeemed} redeemed</span>
      </div>
      <h3 className="font-medium text-white group-hover:text-orange-400 transition-colors">{name}</h3>
      <p className="text-gray-500 text-sm mt-1">{description}</p>
    </div>
  );
}
