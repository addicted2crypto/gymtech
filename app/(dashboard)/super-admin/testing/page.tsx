'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import {
  PlayCircle,
  Building2,
  Users,
  UserCircle,
  Crown,
  Zap,
  Eye,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Globe,
  CreditCard,
  Calendar,
  Gift,
  Target,
  Settings,
  Copy,
  ExternalLink,
} from 'lucide-react';

type Tier = 'starter' | 'pro' | 'enterprise';
type Role = 'gym_owner' | 'gym_manager' | 'gym_staff' | 'member';

interface DemoGym {
  id: string;
  name: string;
  slug: string;
  tier: Tier;
  createdAt: string;
}

const CUSTOMER_JOURNEY_STEPS = [
  { id: 'signup', label: 'Sign Up', description: 'Create account & gym', route: '/signup' },
  { id: 'payment', label: 'Payment', description: 'Choose plan (or bypass)', route: '/pricing' },
  { id: 'onboarding', label: 'Onboarding', description: 'Initial gym setup', route: '/owner/onboarding' },
  { id: 'settings', label: 'Settings', description: 'Configure gym details', route: '/owner/settings' },
  { id: 'landing', label: 'Landing Page', description: 'Build public website', route: '/owner/website' },
  { id: 'classes', label: 'Classes', description: 'Create class schedule', route: '/owner/classes' },
  { id: 'staff', label: 'Staff', description: 'Add employees', route: '/owner/staff' },
  { id: 'members', label: 'Members', description: 'Add gym members', route: '/owner/members' },
  { id: 'analytics', label: 'Analytics', description: 'View reports', route: '/owner/analytics' },
];

export default function AdminTestingPage() {
  const router = useRouter();
  const { user, startImpersonation, setGym } = useAuthStore();
  const [demoGyms, setDemoGyms] = useState<DemoGym[]>([]);
  const [selectedGym, setSelectedGym] = useState<DemoGym | null>(null);
  const [impersonateRole, setImpersonateRole] = useState<Role>('gym_owner');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newGymForm, setNewGymForm] = useState({ name: '', slug: '', tier: 'pro' as Tier });
  const [activeMode, setActiveMode] = useState<'gyms' | 'journey' | 'impersonate'>('journey');

  // Fetch real gyms from Supabase
  useEffect(() => {
    async function fetchGyms() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const gyms: DemoGym[] = data.map((g: Record<string, unknown>) => ({
          id: g.id as string,
          name: g.name as string,
          slug: g.slug as string,
          tier: (g.tier as Tier) || 'starter',
          createdAt: g.created_at as string,
        }));
        setDemoGyms(gyms);
      }
      setIsLoading(false);
    }
    fetchGyms();
  }, []);

  const handleCreateDemoGym = async () => {
    if (!newGymForm.name || !newGymForm.slug) return;

    setIsCreating(true);

    const supabase = createClient();
    const slug = newGymForm.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const { data, error } = await supabase
      .from('gyms')
      .insert({
        name: newGymForm.name,
        slug: slug,
        tier: newGymForm.tier,
        is_trial: true,
      })
      .select()
      .single();

    if (!error && data) {
      const newGym: DemoGym = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        tier: (data as Record<string, unknown>).tier as Tier || 'starter',
        createdAt: data.created_at,
      };
      setDemoGyms(prev => [...prev, newGym]);
      setNewGymForm({ name: '', slug: '', tier: 'pro' });
    } else {
      console.error('Failed to create gym:', error);
      alert('Failed to create gym: ' + (error?.message || 'Unknown error'));
    }

    setIsCreating(false);
  };

  const handleDeleteDemoGym = async (gymId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('gyms')
      .delete()
      .eq('id', gymId);

    if (!error) {
      setDemoGyms(prev => prev.filter(g => g.id !== gymId));
      if (selectedGym?.id === gymId) {
        setSelectedGym(null);
      }
    } else {
      console.error('Failed to delete gym:', error);
      alert('Failed to delete gym: ' + error.message);
    }
  };

  const handleStartImpersonation = async () => {
    if (!selectedGym || !user) return;

    // Fetch the full gym data
    const supabase = createClient();
    const { data: gymData } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', selectedGym.id)
      .single();

    if (gymData) {
      // Set the gym in auth store
      setGym(gymData);
    }

    // Use auth store impersonation
    const roleMap: Record<Role, 'gym_owner' | 'gym_staff' | 'member'> = {
      gym_owner: 'gym_owner',
      gym_manager: 'gym_owner', // managers see owner view
      gym_staff: 'gym_staff',
      member: 'member',
    };

    startImpersonation(selectedGym.id, roleMap[impersonateRole], user.id);

    // Redirect to appropriate dashboard
    const routes: Record<Role, string> = {
      gym_owner: '/owner',
      gym_manager: '/owner',
      gym_staff: '/owner', // staff use owner dashboard with limited access
      member: '/member',
    };

    router.push(routes[impersonateRole]);
  };

  const handleChangeTier = async (gymId: string, newTier: Tier) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('gyms')
      .update({ tier: newTier })
      .eq('id', gymId);

    if (!error) {
      setDemoGyms(prev => prev.map(g =>
        g.id === gymId ? { ...g, tier: newTier } : g
      ));
    } else {
      console.error('Failed to update tier:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <PlayCircle className="w-7 h-7 text-orange-400" />
            Admin Testing Mode
          </h1>
          <p className="text-gray-400 mt-1">
            Test the complete customer journey without payment. Create demo gyms, impersonate users, and walk through all features.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          Test Mode Active
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
        {[
          { id: 'journey', label: 'Customer Journey', icon: Target },
          { id: 'gyms', label: 'Demo Gyms', icon: Building2 },
          { id: 'impersonate', label: 'Impersonate User', icon: UserCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMode(tab.id as typeof activeMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeMode === tab.id
                ? 'bg-orange-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Customer Journey Walkthrough */}
      {activeMode === 'journey' && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Customer Journey Walkthrough</h2>
            <p className="text-gray-400 text-sm mb-6">
              Walk through each step of the customer experience. Select a demo gym first to test with that gym's tier and settings.
            </p>

            {/* Gym Selection for Journey */}
            <div className="mb-6 p-4 bg-white/5 rounded-xl">
              <label className="block text-sm text-gray-400 mb-2">Select Demo Gym to Test</label>
              <div className="flex gap-3 flex-wrap">
                {demoGyms.map((gym) => (
                  <button
                    key={gym.id}
                    onClick={() => setSelectedGym(gym)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      selectedGym?.id === gym.id
                        ? 'bg-orange-500/20 border-orange-500 text-white'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    {gym.name}
                    <TierBadge tier={gym.tier} size="sm" />
                  </button>
                ))}
                {demoGyms.length === 0 && (
                  <p className="text-gray-500 text-sm">No demo gyms. Create one in the "Demo Gyms" tab.</p>
                )}
              </div>
            </div>

            {/* Journey Steps */}
            <div className="grid gap-3">
              {CUSTOMER_JOURNEY_STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 font-medium text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{step.label}</h3>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                  <Link
                    href={selectedGym ? step.route : '#'}
                    onClick={(e) => {
                      if (!selectedGym) {
                        e.preventDefault();
                        alert('Please select a demo gym first');
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedGym
                        ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                        : 'bg-white/5 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Test Step
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Test Scenarios */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Test Scenarios</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ScenarioCard
                title="New Customer Signup"
                description="Full signup flow → payment → onboarding"
                icon={Users}
                onClick={() => router.push('/signup?test=true')}
              />
              <ScenarioCard
                title="Upgrade Flow"
                description="Test tier upgrade from Starter → Pro"
                icon={Crown}
                onClick={() => selectedGym && router.push('/owner/settings?tab=billing')}
                disabled={!selectedGym}
              />
              <ScenarioCard
                title="Build Landing Page"
                description="Create and publish gym website"
                icon={Globe}
                onClick={() => selectedGym && router.push('/owner/website/builder')}
                disabled={!selectedGym}
              />
              <ScenarioCard
                title="Add Staff Member"
                description="Invite and set up employee account"
                icon={UserCircle}
                onClick={() => selectedGym && router.push('/owner/staff')}
                disabled={!selectedGym}
              />
              <ScenarioCard
                title="Create Class Schedule"
                description="Set up classes and booking"
                icon={Calendar}
                onClick={() => selectedGym && router.push('/owner/classes')}
                disabled={!selectedGym}
              />
              <ScenarioCard
                title="Test Member Portal"
                description="View app as gym member"
                icon={Eye}
                onClick={() => {
                  if (selectedGym) {
                    setImpersonateRole('member');
                    setActiveMode('impersonate');
                  }
                }}
                disabled={!selectedGym}
              />
            </div>
          </div>
        </div>
      )}

      {/* Demo Gyms Management */}
      {activeMode === 'gyms' && (
        <div className="space-y-6">
          {/* Create New Demo Gym */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Create Demo Gym</h2>
            <p className="text-gray-400 text-sm mb-4">
              Create a gym without payment for testing. You can set any tier immediately.
            </p>

            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Gym Name</label>
                <input
                  type="text"
                  value={newGymForm.name}
                  onChange={(e) => setNewGymForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Test Gym"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Slug (URL)</label>
                <input
                  type="text"
                  value={newGymForm.slug}
                  onChange={(e) => setNewGymForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="my-test-gym"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tier</label>
                <select
                  value={newGymForm.tier}
                  onChange={(e) => setNewGymForm(prev => ({ ...prev, tier: e.target.value as Tier }))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
                >
                  <option value="starter">Starter ($79/mo)</option>
                  <option value="pro">Pro ($149/mo)</option>
                  <option value="enterprise">Enterprise ($299/mo)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCreateDemoGym}
                  disabled={isCreating || !newGymForm.name || !newGymForm.slug}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Create Demo Gym
                </button>
              </div>
            </div>
          </div>

          {/* Existing Demo Gyms */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Demo Gyms</h2>
              <p className="text-gray-400 text-sm">Manage test gyms. Change tiers instantly to test different feature sets.</p>
            </div>

            {demoGyms.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">No demo gyms created yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {demoGyms.map((gym) => (
                  <div key={gym.id} className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-linear-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center text-orange-400 font-bold text-lg">
                      {gym.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{gym.name}</h3>
                      <p className="text-sm text-gray-500">{gym.slug}.techforgyms.shop</p>
                    </div>

                    {/* Tier Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Tier:</span>
                      <select
                        value={gym.tier}
                        onChange={(e) => handleChangeTier(gym.id, e.target.value as Tier)}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500/50"
                      >
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedGym(gym)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Select for testing"
                      >
                        <CheckCircle2 className={`w-5 h-5 ${selectedGym?.id === gym.id ? 'text-green-400' : ''}`} />
                      </button>
                      <a
                        href={`/sites/${gym.slug}`}
                        target="_blank"
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="View public site"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => handleDeleteDemoGym(gym.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete demo gym"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Impersonate User */}
      {activeMode === 'impersonate' && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Impersonate User</h2>
            <p className="text-gray-400 text-sm mb-6">
              View the app exactly as a customer would see it. Great for debugging issues or walking through support requests.
            </p>

            {/* Select Gym */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">1. Select Gym</label>
                <div className="flex gap-3 flex-wrap">
                  {demoGyms.map((gym) => (
                    <button
                      key={gym.id}
                      onClick={() => setSelectedGym(gym)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        selectedGym?.id === gym.id
                          ? 'bg-orange-500/20 border-orange-500 text-white'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      {gym.name}
                      <TierBadge tier={gym.tier} size="sm" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Role */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">2. Select Role</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { role: 'gym_owner', label: 'Gym Owner', description: 'Full admin access', icon: Crown },
                    { role: 'gym_manager', label: 'Manager', description: 'Limited admin', icon: Settings },
                    { role: 'gym_staff', label: 'Staff', description: 'Check-ins & classes', icon: Users },
                    { role: 'member', label: 'Member', description: 'Member portal', icon: UserCircle },
                  ].map((item) => (
                    <button
                      key={item.role}
                      onClick={() => setImpersonateRole(item.role as Role)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        impersonateRole === item.role
                          ? 'bg-orange-500/20 border-orange-500 text-white'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                      }`}
                    >
                      <item.icon className="w-6 h-6" />
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-gray-500">{item.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartImpersonation}
              disabled={!selectedGym}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-5 h-5" />
              Start Impersonation as {impersonateRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>

            {selectedGym && (
              <p className="text-center text-gray-500 text-sm mt-3">
                You'll view <strong className="text-white">{selectedGym.name}</strong> as a {impersonateRole.replace('_', ' ')}
              </p>
            )}
          </div>

          {/* Impersonation Info */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-400">Impersonation Mode</h3>
                <p className="text-sm text-amber-400/80 mt-1">
                  While impersonating, a banner will show at the top of the screen. Click "Exit Impersonation" to return to super admin view.
                  All actions are logged for audit purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TierBadge({ tier, size = 'md' }: { tier: Tier; size?: 'sm' | 'md' }) {
  const styles = {
    starter: 'bg-gray-500/20 text-gray-400',
    pro: 'bg-purple-500/20 text-purple-400',
    enterprise: 'bg-amber-500/20 text-amber-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${styles[tier]} ${sizes[size]}`}>
      {tier === 'enterprise' && <Crown className="w-3 h-3" />}
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
}

function ScenarioCard({
  title,
  description,
  icon: Icon,
  onClick,
  disabled
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left p-4 rounded-xl border transition-all ${
        disabled
          ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-medium text-white">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </button>
  );
}
