import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware: refreshes the Supabase session on every request and gates the
 * /admin area at the authentication layer.
 *
 * IMPORTANT: this is only the FIRST line of defence (authentication). Staff
 * ROLE authorisation is enforced independently in src/app/admin/layout.tsx via
 * requireStaffRole(...), so hiding routes here is never the only protection.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the auth token and keeps cookies in sync.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === '/admin/login';
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  // Unauthenticated visitor to any /admin route (except the login page) ->
  // redirect to login.
  if (isAdminRoute && !isLoginRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  // Already signed in and visiting the login page -> send to dashboard.
  if (isLoginRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
