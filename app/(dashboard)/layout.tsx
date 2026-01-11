'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  FileEdit,
  Gift,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Zap,
  Mail,
  Puzzle,
  Shield,
  Building2,
  PlayCircle,
} from 'lucide-react';

const ownerNavItems = [
  { href: '/owner', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/owner/members', label: 'Members', icon: Users },
  { href: '/owner/classes', label: 'Classes', icon: Calendar },
  { href: '/owner/payments', label: 'Payments', icon: CreditCard },
  { href: '/owner/messaging', label: 'Messaging', icon: Mail },
  { href: '/owner/pages', label: 'Landing Pages', icon: FileEdit },
  { href: '/owner/engagement', label: 'Engagement', icon: Gift },
  { href: '/owner/addons', label: 'Add-ons', icon: Puzzle },
  { href: '/owner/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/owner/settings', label: 'Settings', icon: Settings },
];

const memberNavItems = [
  { href: '/member', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/member/classes', label: 'My Classes', icon: Calendar },
  { href: '/member/payments', label: 'Payments', icon: CreditCard },
  { href: '/member/rewards', label: 'Rewards', icon: Gift },
  { href: '/member/settings', label: 'Settings', icon: Settings },
];

const superAdminNavItems = [
  { href: '/super-admin', label: 'Platform Overview', icon: LayoutDashboard },
  { href: '/super-admin/gyms', label: 'All Gyms', icon: Building2 },
  { href: '/super-admin/testing', label: 'Testing Mode', icon: PlayCircle },
  { href: '/super-admin/test-routes', label: 'Security Tests', icon: Shield },
  { href: '/super-admin/settings', label: 'Platform Settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, gym, isImpersonating, stopImpersonation, setUser, setGym, setLoading } = useAuthStore();

  const isMemberView = pathname.startsWith('/member');
  const isSuperAdminView = pathname.startsWith('/super-admin');
  const navItems = isSuperAdminView
    ? superAdminNavItems
    : isMemberView
      ? memberNavItems
      : ownerNavItems;

  useEffect(() => {
    const fetchUserData = async () => {
      // Check if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        // Demo mode - use mock data
        setUser({
          id: 'demo-user',
          gym_id: 'demo-gym',
          role: 'super_admin', // Change to 'gym_owner' or 'member' to test other views
          first_name: 'Demo',
          last_name: 'Owner',
          avatar_url: null,
          email_encrypted: null,
          phone_encrypted: null,
          login_streak: 7,
          total_logins: 42,
          loyalty_points: 350,
          last_login_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
        setGym({
          id: 'demo-gym',
          name: 'Iron Temple MMA',
          slug: 'iron-temple-mma',
          logo_url: null,
          custom_domain: null,
          domain_verified: false,
          stripe_account_id: null,
          settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      const supabase = createClient();

      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser(profile);

        // Fetch gym if user has one
        if (profile.gym_id) {
          const { data: gymData } = await supabase
            .from('gyms')
            .select('*')
            .eq('id', profile.gym_id)
            .single();

          if (gymData) {
            setGym(gymData);
          }
        }
      }

      setLoading(false);
    };

    fetchUserData();
  }, [router, setUser, setGym, setLoading]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    useAuthStore.getState().reset();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#12121a] border-r border-white/10 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-br from-orange-500 to-amber-500 rounded-lg" />
            <span className="font-bold text-lg text-white">GymTech</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Impersonation Banner */}
        {isImpersonating() && (
          <div className="mx-4 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
              <Zap className="w-4 h-4" />
              Impersonating
            </div>
            <button
              onClick={stopImpersonation}
              className="mt-2 text-xs text-amber-500 hover:text-amber-400 underline"
            >
              Exit impersonation
            </button>
          </div>
        )}

        {/* Gym Selector (for super admin) */}
        {gym && (
          <div className="mx-4 mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Current Gym</p>
            <button className="flex items-center justify-between w-full mt-1">
              <span className="font-medium text-white truncate">{gym.name}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-linear-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Menu */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#12121a]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-sm text-gray-500 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#12121a]/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          {/* Login streak badge (for members) */}
          {user?.role === 'member' && user.login_streak > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-sm">
              <Zap className="w-4 h-4" />
              <span>{user.login_streak} day streak</span>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
