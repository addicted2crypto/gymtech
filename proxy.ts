import { NextResponse, type NextRequest } from 'next/server';

// Main app domain - update this for production
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000';

// Protected routes that require authentication
const protectedRoutes = ['/owner', '/member', '/staff', '/super-admin'];

// Auth routes (redirect if already logged in)
const authRoutes = ['/login', '/signup', '/reset-password'];

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

  // If Supabase is not configured, allow all routes (dev mode preview)
  if (!isSupabaseConfigured) {
    return NextResponse.next();
  }

  // Update Supabase session (only if configured)
  const { updateSession } = await import('@/lib/supabase/middleware');
  const response = await updateSession(request);

  // Check if this is a custom gym domain
  const isMainDomain = hostname.includes('localhost') ||
                       hostname.includes(MAIN_DOMAIN) ||
                       hostname.includes('vercel.app');

  if (!isMainDomain) {
    // This is a gym's custom domain - rewrite to /sites/[domain]
    const url = request.nextUrl.clone();
    url.pathname = `/sites/${hostname}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Handle protected routes - check for auth
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // Check for auth cookie (Supabase stores session in cookies)
    const authCookie = request.cookies.getAll().find(c =>
      c.name.includes('sb-') && c.name.includes('-auth-token')
    );

    if (!authCookie) {
      // No auth, redirect to login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Handle auth routes - redirect if already logged in
  if (authRoutes.some(route => pathname.startsWith(route))) {
    const authCookie = request.cookies.getAll().find(c =>
      c.name.includes('sb-') && c.name.includes('-auth-token')
    );

    if (authCookie) {
      // Already logged in, redirect to dashboard
      const url = request.nextUrl.clone();
      url.pathname = '/owner';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
