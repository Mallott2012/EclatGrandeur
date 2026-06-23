import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware — runs on every matched request.
 *
 * Responsibilities:
 *  1. Refresh the Supabase auth session cookie so it never expires mid-visit.
 *  2. Protect /admin/* — redirect unauthenticated requests to /admin/login.
 *
 * Note: middleware is the first line of defence, not the only one.
 * The admin layout (src/app/admin/(console)/layout.tsx) also calls
 * requireStaffRole() server-side, so a bypass of middleware still cannot
 * grant access to protected data.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Env vars are read directly here — the env.ts helpers use process.env which
  // is available in the middleware edge runtime.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured yet (e.g. local dev without .env.local),
  // skip auth logic entirely so the public storefront still loads.
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the session. Must be called before any redirect checks.
  // Do not remove: this keeps auth cookies fresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminPath  = pathname.startsWith('/admin');
  const isLoginPath  = pathname.startsWith('/admin/login');
  const isSetupPath  = pathname.startsWith('/admin/setup');

  // Redirect unauthenticated users away from /admin/* (but not /admin/login or /admin/setup).
  if (isAdminPath && !isLoginPath && !isSetupPath && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (Next.js static assets)
     * - _next/image   (Next.js image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets with a file extension
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
