import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/owner';

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user to determine redirect
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Get profile to check role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // Redirect based on role
        if (profile?.role === 'member') {
          return NextResponse.redirect(new URL('/member', requestUrl.origin));
        } else if (profile?.role === 'super_admin') {
          return NextResponse.redirect(new URL('/super-admin', requestUrl.origin));
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Return to login on error
  return NextResponse.redirect(new URL('/login?error=auth', requestUrl.origin));
}
