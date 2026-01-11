'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Clock,
  Users,
  Calendar,
  AlertCircle,
  Check,
} from 'lucide-react';

type NewSchedule = {
  id: string;
  day_of_week: number;
  start_time: string;
  recurring: boolean;
};

type Instructor = {
  id: string;
  first_name: string;
  last_name: string;
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const categories = ['BJJ', 'Muay Thai', 'Wrestling', 'MMA', 'Boxing', 'Kickboxing', 'Fitness', 'Yoga', 'Other'];
const difficultyLevels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

export default function NewClassPage() {
  const router = useRouter();
  const { gym } = useAuthStore();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [classData, setClassData] = useState({
    name: '',
    description: '',
    instructor_id: '',
    capacity: 20,
    duration_minutes: 60,
    category: 'BJJ',
    difficulty_level: 'All Levels',
    is_active: true,
  });

  const [schedules, setSchedules] = useState<NewSchedule[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [newSchedule, setNewSchedule] = useState<Partial<NewSchedule>>({
    day_of_week: 1,
    start_time: '18:00',
    recurring: true,
  });

  useEffect(() => {
    const fetchInstructors = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl) {
        // Demo mode
        setInstructors([
          { id: '1', first_name: 'Marcus', last_name: 'Silva' },
          { id: '2', first_name: 'Sarah', last_name: 'Johnson' },
          { id: '3', first_name: 'Mike', last_name: 'Rodriguez' },
        ]);
        return;
      }

      const supabase = createClient();

      // Fetch instructors (staff members)
      const { data: staff } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('gym_id', gym?.id)
        .in('role', ['gym_owner', 'gym_manager', 'gym_staff']);

      setInstructors(staff || []);
    };

    fetchInstructors();
  }, [gym?.id]);

  const handleSave = async () => {
    if (!classData.name.trim()) {
      setError('Class name is required');
      return;
    }

    setSaving(true);
    setError(null);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      // Demo mode
      setTimeout(() => {
        router.push('/owner/classes');
      }, 500);
      return;
    }

    const supabase = createClient();

    // Create the class
    const { data: newClass, error: classError } = await supabase
      .from('classes')
      .insert({
        gym_id: gym?.id,
        name: classData.name,
        description: classData.description || null,
        instructor_id: classData.instructor_id || null,
        capacity: classData.capacity,
        duration_minutes: classData.duration_minutes,
        category: classData.category,
        difficulty_level: classData.difficulty_level,
        is_active: classData.is_active,
      })
      .select()
      .single();

    if (classError) {
      setError(classError.message);
      setSaving(false);
      return;
    }

    // Add schedules if any
    if (schedules.length > 0 && newClass) {
      const schedulesToInsert = schedules.map((s) => ({
        class_id: newClass.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        recurring: s.recurring,
      }));

      await supabase.from('class_schedules').insert(schedulesToInsert);
    }

    router.push('/owner/classes');
  };

  const addSchedule = () => {
    if (newSchedule.day_of_week === undefined || !newSchedule.start_time) return;

    const sched: NewSchedule = {
      id: `temp-${Date.now()}`,
      day_of_week: newSchedule.day_of_week!,
      start_time: newSchedule.start_time!,
      recurring: newSchedule.recurring ?? true,
    };

    setSchedules([...schedules, sched]);
    setNewSchedule({ day_of_week: 1, start_time: '18:00', recurring: true });
  };

  const removeSchedule = (scheduleId: string) => {
    setSchedules(schedules.filter((s) => s.id !== scheduleId));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/owner/classes"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Create New Class</h1>
          <p className="text-gray-400 mt-1">Add a new class offering to your gym</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Create Class
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Class Details Form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Class Details</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Class Name *
            </label>
            <input
              type="text"
              value={classData.name}
              onChange={(e) => setClassData({ ...classData, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-colors"
              placeholder="e.g., BJJ Fundamentals"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={classData.description}
              onChange={(e) => setClassData({ ...classData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-colors resize-none"
              placeholder="Describe what members will learn in this class..."
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <select
              value={classData.category}
              onChange={(e) => setClassData({ ...classData, category: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50 transition-colors"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#12121a]">{cat}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Difficulty Level
            </label>
            <select
              value={classData.difficulty_level}
              onChange={(e) => setClassData({ ...classData, difficulty_level: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50 transition-colors"
            >
              {difficultyLevels.map((level) => (
                <option key={level} value={level} className="bg-[#12121a]">{level}</option>
              ))}
            </select>
          </div>

          {/* Instructor */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Instructor
            </label>
            <select
              value={classData.instructor_id}
              onChange={(e) => setClassData({ ...classData, instructor_id: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50 transition-colors"
            >
              <option value="" className="bg-[#12121a]">Select instructor</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id} className="bg-[#12121a]">
                  {instructor.first_name} {instructor.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Capacity
            </label>
            <input
              type="number"
              min="1"
              value={classData.capacity}
              onChange={(e) => setClassData({ ...classData, capacity: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-colors"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Duration (minutes)
            </label>
            <input
              type="number"
              min="15"
              step="15"
              value={classData.duration_minutes}
              onChange={(e) => setClassData({ ...classData, duration_minutes: parseInt(e.target.value) || 60 })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-colors"
            />
          </div>

          {/* Active Status */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={classData.is_active}
                  onChange={(e) => setClassData({ ...classData, is_active: e.target.checked })}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  classData.is_active ? 'bg-orange-500' : 'bg-gray-600'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    classData.is_active ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`} />
                </div>
              </div>
              <span className="text-gray-300">Class is active and visible to members</span>
            </label>
          </div>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-400" />
            Weekly Schedule
          </h2>
          <p className="text-sm text-gray-500">Optional - can be added later</p>
        </div>

        {/* Added Schedules */}
        {schedules.length > 0 && (
          <div className="space-y-3 mb-6">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-24 font-medium text-white">
                    {dayNames[schedule.day_of_week]}
                  </div>
                  <div className="text-gray-400">
                    {schedule.start_time}
                  </div>
                  {schedule.recurring && (
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                      Weekly
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeSchedule(schedule.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Schedule */}
        <div className={schedules.length > 0 ? 'pt-6 border-t border-white/10' : ''}>
          <h3 className="text-sm font-medium text-gray-300 mb-4">Add Schedule</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs text-gray-500 mb-1">Day</label>
              <select
                value={newSchedule.day_of_week}
                onChange={(e) => setNewSchedule({ ...newSchedule, day_of_week: parseInt(e.target.value) })}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              >
                {dayNames.map((day, index) => (
                  <option key={day} value={index} className="bg-[#12121a]">{day}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="block text-xs text-gray-500 mb-1">Time</label>
              <input
                type="time"
                value={newSchedule.start_time}
                onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newSchedule.recurring}
                onChange={(e) => setNewSchedule({ ...newSchedule, recurring: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-white/5 text-orange-500 focus:ring-orange-500/50"
              />
              <span className="text-sm text-gray-400">Weekly</span>
            </label>
            <button
              onClick={addSchedule}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
          <Check className="w-4 h-4" />
          Tips for a Great Class
        </h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• Use a clear, descriptive name that members will recognize</li>
          <li>• Include what members will learn in the description</li>
          <li>• Set appropriate capacity to ensure a good instructor-to-student ratio</li>
          <li>• Consider offering classes at different skill levels</li>
        </ul>
      </div>
    </div>
  );
}
