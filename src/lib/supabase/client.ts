import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseUrl, getSupabaseAnonKey } from './env';

/**
 * Browser Supabase client — safe for use in Client Components.
 * Uses the public anon key only; RLS enforces data access rules.
 */
export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
