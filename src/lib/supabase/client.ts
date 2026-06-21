'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Browser Supabase client.
 *
 * Uses ONLY the public anon key, which is safe to ship to the browser because
 * every table is protected by Row Level Security. The service-role key must
 * never be referenced here. See ./admin.ts for the privileged server client.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
