'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import {
  Users,
  Plus,
  Search,
  Mail,
  MoreVertical,
  Shield,
  ShieldCheck,
  UserCircle,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Loader2,
  Send,
} from 'lucide-react';

type StaffRole = 'gym_owner' | 'gym_manager' | 'gym_staff';

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  role: StaffRole;
  avatar_url?: string;
  created_at: string;
  is_active?: boolean;
}

const ROLE_LABELS: Record<StaffRole, string> = {
  gym_owner: 'Owner',
  gym_manager: 'Manager',
  gym_staff: 'Staff',
};

const ROLE_COLORS: Record<StaffRole, string> = {
  gym_owner: 'bg-amber-500/20 text-amber-400',
  gym_manager: 'bg-purple-500/20 text-purple-400',
  gym_staff: 'bg-blue-500/20 text-blue-400',
};

export default function StaffPage() {
  const { getEffectiveGymId } = useAuthStore();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'gym_staff' as StaffRole,
  });
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      const gymId = getEffectiveGymId();

      if (!gymId) {
        setStaff([]);
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Fetch staff members (profiles with staff roles)
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          role,
          avatar_url,
          created_at
        `)
        .eq('gym_id', gymId)
        .in('role', ['gym_owner', 'gym_manager', 'gym_staff'])
        .order('role', { ascending: true })
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching staff:', error);
        setStaff([]);
      } else {
        setStaff(data || []);
      }

      setLoading(false);
    };

    fetchStaff();
  }, [getEffectiveGymId]);

  const filteredStaff = staff.filter((member) =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInviteStaff = async () => {
    if (!inviteForm.email || !inviteForm.first_name) return;

    setIsInviting(true);
    // In a real implementation, this would send an invite email
    // For now, we'll just show a success message

    setTimeout(() => {
      setIsInviting(false);
      setShowInviteModal(false);
      setInviteForm({ email: '', first_name: '', last_name: '', role: 'gym_staff' });
      alert('Invite sent! (Demo - actual email would be sent in production)');
    }, 1000);
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ gym_id: null, role: 'member' })
      .eq('id', staffId);

    if (!error) {
      setStaff(prev => prev.filter(s => s.id !== staffId));
    } else {
      console.error('Failed to remove staff:', error);
      alert('Failed to remove staff member');
    }

    setOpenMenuId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff</h1>
          <p className="text-gray-400 mt-1">Manage your gym's team members</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Invite Staff
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search staff..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {staff.filter(s => s.role === 'gym_owner').length}
              </p>
              <p className="text-sm text-gray-400">Owners</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {staff.filter(s => s.role === 'gym_manager').length}
              </p>
              <p className="text-sm text-gray-400">Managers</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {staff.filter(s => s.role === 'gym_staff').length}
              </p>
              <p className="text-sm text-gray-400">Staff</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Team Members</h2>
        </div>

        {filteredStaff.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No staff members yet</h3>
            <p className="text-gray-400 mb-6">Invite your first team member to get started</p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Invite Staff
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredStaff.map((member) => (
              <div
                key={member.id}
                className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors"
              >
                {/* Avatar */}
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={`${member.first_name} ${member.last_name}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-400">
                      {member.first_name?.[0]}{member.last_name?.[0]}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">
                      {member.first_name} {member.last_name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                      {ROLE_LABELS[member.role]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Joined {new Date(member.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {openMenuId === member.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a24] border border-white/10 rounded-xl shadow-xl z-10 py-1">
                      <button className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/5 flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Edit Role
                      </button>
                      <button className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/5 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Send Message
                      </button>
                      {member.role !== 'gym_owner' && (
                        <button
                          onClick={() => handleRemoveStaff(member.id)}
                          className="w-full px-4 py-2 text-left text-red-400 hover:bg-white/5 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Invite Staff Member</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="staff@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={inviteForm.first_name}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="John"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={inviteForm.last_name}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Doe"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as StaffRole }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50 [&>option]:bg-gray-900"
                >
                  <option value="gym_staff">Staff - Basic access</option>
                  <option value="gym_manager">Manager - Limited admin</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2.5 border border-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteStaff}
                disabled={isInviting || !inviteForm.email || !inviteForm.first_name}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {isInviting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invite
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
