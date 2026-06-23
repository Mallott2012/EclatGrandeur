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
  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase env vars are missing, skip auth — storefront still loads.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  // ── Exact pattern from Supabase SSR docs ──────────────────────────────────
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: call getUser() — do NOT use getSession().
  // getUser() validates the token server-side; getSession() trusts the cookie.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith('/admin');
  const isLoginPath = pathname.startsWith('/admin/login');
  const isSetupPath = pathname.startsWith('/admin/setup');

  if (isAdminPath && !isLoginPath && !isSetupPath && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/login';
    // IMPORTANT: copy cookies from supabaseResponse onto the redirect so
    // any refreshed tokens are not lost.
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // IMPORTANT: always return supabaseResponse — never a new NextResponse.
  // supabaseResponse carries the refreshed session cookies.
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
