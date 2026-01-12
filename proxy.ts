import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Main platform domains - these should ALWAYS show the marketing site
const PLATFORM_HOSTNAMES = [
  'techforgyms.shop',
  'www.techforgyms.shop',
  'gymtech-delta.vercel.app',
  'localhost',
];

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0] || '';
  const pathname = request.nextUrl.pathname;

  // ============================================
  // CUSTOM DOMAIN / SUBDOMAIN ROUTING
  // ============================================
  const isPlatformDomain = PLATFORM_HOSTNAMES.includes(hostname);

  // If it's NOT the platform domain, route to gym landing page
  if (!isPlatformDomain &&
      !pathname.startsWith('/sites/') &&
      !pathname.startsWith('/api/') &&
      !pathname.startsWith('/_next/') &&
      !pathname.startsWith('/login') &&
      !pathname.startsWith('/signup')) {

    const gymDomain = hostname.endsWith('.techforgyms.shop')
      ? hostname.replace('.techforgyms.shop', '')
      : hostname;

    const url = request.nextUrl.clone();
    url.pathname = `/sites/${gymDomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // ============================================
  // SUPABASE SESSION HANDLING
  // ============================================
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, block protected routes
  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname.startsWith('/super-admin') ||
        pathname.startsWith('/owner') ||
        pathname.startsWith('/member') ||
        pathname.startsWith('/api/admin')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  // ============================================
  // SUPER ADMIN ROUTE PROTECTION
  // ============================================
  if (pathname.startsWith('/super-admin') || pathname.startsWith('/api/admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Forbidden: Super admin access required' },
          { status: 403 }
        );
      }
      const redirectPath = profile?.role === 'member' ? '/member' : '/owner';
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  // ============================================
  // OWNER ROUTE PROTECTION
  // ============================================
  if (pathname.startsWith('/owner')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const allowedRoles = ['super_admin', 'gym_owner', 'gym_staff'];
    if (!profile || !allowedRoles.includes(profile.role)) {
      if (profile?.role === 'member') {
        return NextResponse.redirect(new URL('/member', request.url));
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // ============================================
  // MEMBER ROUTE PROTECTION
  // ============================================
  if (pathname.startsWith('/member')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // ============================================
  // AUTH ROUTES - Redirect if already logged in
  // ============================================
  if (pathname === '/login' || pathname === '/signup') {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Only redirect if user has a valid profile with a role
      // If no profile exists, let them stay on login (they need onboarding)
      if (profile?.role === 'super_admin') {
        return NextResponse.redirect(new URL('/super-admin', request.url));
      } else if (profile?.role === 'member') {
        return NextResponse.redirect(new URL('/member', request.url));
      } else if (profile?.role === 'gym_owner' || profile?.role === 'gym_staff') {
        return NextResponse.redirect(new URL('/owner', request.url));
      }
      // If no profile or unknown role, don't redirect - let them see login/signup
      // This prevents redirect loops for new users without profiles
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
