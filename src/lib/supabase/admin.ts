import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Server-only admin Supabase client (service role).
 *
 * SECURITY: This client bypasses Row Level Security entirely. The
 * `import 'server-only'` guard above makes the build fail if this module is
 * ever imported into a client component or browser bundle, ensuring the
 * service-role key cannot leak.
 *
 * Use this ONLY for trusted server-side operations that legitimately need to
 * bypass RLS — currently just writing audit logs. Every caller must
 * independently verify the current user and their staff role BEFORE using it.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
