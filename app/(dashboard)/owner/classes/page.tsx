'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  Dumbbell,
} from 'lucide-react';

type ClassWithSchedules = {
  id: string;
  name: string;
  description: string | null;
  instructor_id: string | null;
  capacity: number;
  duration_minutes: number;
  category: string;
  difficulty_level: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  instructor?: { first_name: string; last_name: string } | null;
  schedules?: { id: string; day_of_week: number; start_time: string }[];
  _count?: { bookings: number };
};

// Demo data for when Supabase is not configured
const demoClasses: ClassWithSchedules[] = [
  {
    id: '1',
    name: 'BJJ Fundamentals',
    description: 'Learn the basics of Brazilian Jiu-Jitsu',
    instructor_id: '1',
    capacity: 20,
    duration_minutes: 60,
    category: 'BJJ',
    difficulty_level: 'Beginner',
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    instructor: { first_name: 'Marcus', last_name: 'Silva' },
    schedules: [
      { id: 's1', day_of_week: 1, start_time: '19:00' },
      { id: 's2', day_of_week: 3, start_time: '19:00' },
      { id: 's3', day_of_week: 5, start_time: '19:00' },
    ],
    _count: { bookings: 45 },
  },
  {
    id: '2',
    name: 'Muay Thai',
    description: 'Traditional Thai boxing techniques',
    instructor_id: '2',
    capacity: 25,
    duration_minutes: 90,
    category: 'Striking',
    difficulty_level: 'Intermediate',
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    instructor: { first_name: 'Sarah', last_name: 'Johnson' },
    schedules: [
      { id: 's4', day_of_week: 2, start_time: '18:00' },
      { id: 's5', day_of_week: 4, start_time: '18:00' },
    ],
    _count: { bookings: 38 },
  },
  {
    id: '3',
    name: 'Wrestling',
    description: 'Greco-Roman and freestyle wrestling',
    instructor_id: '3',
    capacity: 15,
    duration_minutes: 60,
    category: 'Wrestling',
    difficulty_level: 'All Levels',
    image_url: null,
    is_active: true,
    created_at: new Date().toISOString(),
    instructor: { first_name: 'Mike', last_name: 'Rodriguez' },
    schedules: [
      { id: 's6', day_of_week: 6, start_time: '10:00' },
    ],
    _count: { bookings: 22 },
  },
  {
    id: '4',
    name: 'MMA Sparring',
    description: 'Controlled sparring for advanced students',
    instructor_id: '1',
    capacity: 12,
    duration_minutes: 90,
    category: 'MMA',
    difficulty_level: 'Advanced',
    image_url: null,
    is_active: false,
    created_at: new Date().toISOString(),
    instructor: { first_name: 'Marcus', last_name: 'Silva' },
    schedules: [
      { id: 's7', day_of_week: 5, start_time: '20:00' },
    ],
    _count: { bookings: 8 },
  },
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const difficultyColors: Record<string, string> = {
  'Beginner': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Intermediate': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Advanced': 'bg-red-500/20 text-red-400 border-red-500/30',
  'All Levels': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const categoryColors: Record<string, string> = {
  'BJJ': 'from-purple-500 to-indigo-500',
  'Striking': 'from-red-500 to-orange-500',
  'Wrestling': 'from-blue-500 to-cyan-500',
  'MMA': 'from-orange-500 to-amber-500',
  'Fitness': 'from-green-500 to-emerald-500',
};

export default function ClassesPage() {
  const { gym } = useAuthStore();
  const [classes, setClasses] = useState<ClassWithSchedules[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl || !gym?.id) {
        // Demo mode
        setClasses(demoClasses);
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          instructor:profiles!classes_instructor_id_fkey(first_name, last_name),
          schedules:class_schedules(id, day_of_week, start_time)
        `)
        .eq('gym_id', gym.id)
        .order('name');

      if (error) {
        console.error('Error fetching classes:', error);
        setClasses(demoClasses);
      } else {
        setClasses(data || []);
      }

      setLoading(false);
    };

    fetchClasses();
  }, [gym?.id]);

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || cls.category === categoryFilter;
    const matchesActive = showInactive || cls.is_active;
    return matchesSearch && matchesCategory && matchesActive;
  });

  const categories = [...new Set(classes.map((c) => c.category))];

  const toggleClassStatus = async (classId: string, currentStatus: boolean) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      // Demo mode - just update local state
      setClasses(classes.map((c) =>
        c.id === classId ? { ...c, is_active: !currentStatus } : c
      ));
      setOpenMenuId(null);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from('classes')
      .update({ is_active: !currentStatus })
      .eq('id', classId);

    if (!error) {
      setClasses(classes.map((c) =>
        c.id === classId ? { ...c, is_active: !currentStatus } : c
      ));
    }
    setOpenMenuId(null);
  };

  const formatSchedule = (schedules?: { day_of_week: number; start_time: string }[]) => {
    if (!schedules || schedules.length === 0) return 'No schedule';

    const grouped = schedules.reduce((acc, s) => {
      const time = s.start_time.slice(0, 5);
      if (!acc[time]) acc[time] = [];
      acc[time].push(dayNames[s.day_of_week]);
      return acc;
    }, {} as Record<string, string[]>);

    return Object.entries(grouped)
      .map(([time, days]) => `${days.join('/')} ${time}`)
      .join(', ');
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
          <h1 className="text-2xl font-bold text-white">Classes</h1>
          <p className="text-gray-400 mt-1">
            Manage your gym&apos;s class offerings and schedules
          </p>
        </div>
        <Link
          href="/owner/classes/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25"
        >
          <Plus className="w-5 h-5" />
          Add Class
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-orange-500/50 transition-colors"
            >
              <option value="all" className="bg-[#12121a]">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#12121a]">{cat}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`px-4 py-2.5 rounded-xl border transition-colors ${
              showInactive
                ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
          >
            {showInactive ? 'Hide' : 'Show'} Inactive
          </button>
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No classes found</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first class'}
          </p>
          {!searchQuery && categoryFilter === 'all' && (
            <Link
              href="/owner/classes/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Your First Class
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className={`bg-white/5 border rounded-2xl overflow-hidden transition-all hover:border-white/20 ${
                cls.is_active ? 'border-white/10' : 'border-white/5 opacity-60'
              }`}
            >
              {/* Category Header */}
              <div className={`h-2 bg-gradient-to-r ${categoryColors[cls.category] || 'from-gray-500 to-gray-600'}`} />

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">{cls.name}</h3>
                      {!cls.is_active && (
                        <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{cls.category}</p>
                  </div>

                  {/* Actions Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === cls.id ? null : cls.id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>

                    {openMenuId === cls.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 mt-1 w-48 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                          <Link
                            href={`/owner/classes/${cls.id}`}
                            className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/5 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Class
                          </Link>
                          <button
                            onClick={() => toggleClassStatus(cls.id, cls.is_active)}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-white/5 transition-colors"
                          >
                            {cls.is_active ? (
                              <>
                                <EyeOff className="w-4 h-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                Activate
                              </>
                            )}
                          </button>
                          <button
                            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {cls.description && (
                  <p className="text-sm text-gray-400 mt-3 line-clamp-2">{cls.description}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>{cls.capacity}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{cls.duration_minutes} min</span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded border ${difficultyColors[cls.difficulty_level] || 'bg-gray-500/20 text-gray-400'}`}>
                    {cls.difficulty_level}
                  </span>
                </div>

                {/* Schedule */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-400">{formatSchedule(cls.schedules)}</span>
                  </div>
                  {cls.instructor && (
                    <p className="text-sm text-gray-500 mt-2">
                      Instructor: {cls.instructor.first_name} {cls.instructor.last_name}
                    </p>
                  )}
                </div>

                {/* View Details Link */}
                <Link
                  href={`/owner/classes/${cls.id}`}
                  className="flex items-center justify-center gap-2 mt-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
