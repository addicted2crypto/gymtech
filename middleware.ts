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
  // Check if this is the main platform domain
  const isPlatformDomain = PLATFORM_HOSTNAMES.includes(hostname);

  // If it's NOT the platform domain and NOT already a /sites/ path,
  // this must be a gym subdomain or custom domain - rewrite to /sites/[domain]
  if (!isPlatformDomain &&
      !pathname.startsWith('/sites/') &&
      !pathname.startsWith('/api/') &&
      !pathname.startsWith('/_next/') &&
      !pathname.startsWith('/login') &&
      !pathname.startsWith('/signup')) {

    // For gym subdomains (e.g., ironmma.techforgyms.shop)
    // Extract the subdomain part
    const gymDomain = hostname.endsWith('.techforgyms.shop')
      ? hostname.replace('.techforgyms.shop', '')
      : hostname; // Custom domain like ironmma.com

    const url = request.nextUrl.clone();
    url.pathname = `/sites/${gymDomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured, block all protected routes
  if (!supabaseUrl || !supabaseAnonKey) {
    // In development without Supabase, redirect to home
    if (request.nextUrl.pathname.startsWith('/super-admin') ||
        request.nextUrl.pathname.startsWith('/owner') ||
        request.nextUrl.pathname.startsWith('/member') ||
        request.nextUrl.pathname.startsWith('/api/admin')) {
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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ============================================
  // SUPER ADMIN ROUTE PROTECTION
  // ============================================
  if (pathname.startsWith('/super-admin') || pathname.startsWith('/api/admin')) {
    // Not logged in - redirect to login
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Check if user is super_admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'super_admin') {
      // Not a super admin - return 403 for API, redirect for pages
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Forbidden: Super admin access required' },
          { status: 403 }
        );
      }
      // Redirect non-admins to their appropriate dashboard
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

    // Allow super_admin, gym_owner, and gym_staff to access owner routes
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

    // All authenticated users can view member routes
    // (super_admin for testing, gym_owner/staff for support, members for their portal)
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

      // Redirect to appropriate dashboard based on role
      if (profile?.role === 'super_admin') {
        return NextResponse.redirect(new URL('/super-admin', request.url));
      } else if (profile?.role === 'member') {
        return NextResponse.redirect(new URL('/member', request.url));
      } else {
        return NextResponse.redirect(new URL('/owner', request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images folder)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
