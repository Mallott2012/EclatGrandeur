import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseUrl, getSupabaseAnonKey } from './env';

/**
 * Server-side Supabase client for Route Handlers, Server Components, and
 * Server Actions. Uses cookie-based session management via @supabase/ssr.
 *
 * Uses the anon key — RLS policies control data access.
 * For privileged admin operations use the admin client in admin.ts instead.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
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
          // setAll is called from a Server Component where cookies cannot be
          // mutated. Safe to ignore — middleware handles session refresh.
        }
      },
    },
  });
}
