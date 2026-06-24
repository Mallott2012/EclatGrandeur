import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseServiceRoleKey } from './env';

/**
 * Server-only Supabase admin client using the service-role key.
 *
 * IMPORTANT:
 * - Bypasses Row Level Security entirely.
 * - Must never be imported by Client Components or public storefront routes.
 * - Use only for: audit log writes, super_admin management, server-side seeds.
 * - Every call site must perform its own authorization check before invoking.
 */
export function createAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
