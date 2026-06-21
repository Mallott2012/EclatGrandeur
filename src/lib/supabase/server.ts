import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Server Supabase client (Server Components, Server Actions, Route Handlers).
 *
 * Reads/writes the session via HTTP-only cookies and uses the anon key, so all
 * queries run under the signed-in user's RLS context. Use this for any
 * user-scoped read/write. For privileged operations that must bypass RLS (e.g.
 * writing audit logs), use ./admin.ts instead.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` is called from a Server Component where cookies are
            // read-only. The middleware refreshes the session, so this is safe
            // to ignore here.
          }
        },
      },
    },
  );
}
