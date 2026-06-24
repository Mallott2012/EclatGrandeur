/**
 * Safe environment variable accessors for Supabase configuration.
 *
 * Public variables (NEXT_PUBLIC_*) are validated lazily — the error only
 * surfaces when Supabase functionality is first invoked, so purely static
 * storefront pages that never call Supabase are unaffected.
 *
 * The service-role key is server-only and must never appear in client bundles
 * or NEXT_PUBLIC_* variables.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `[Éclat Grandeur] Missing required environment variable: ${name}\n` +
        `  Copy .env.example to .env.local and fill in your Supabase project values.\n` +
        `  Dashboard → Project Settings → API`,
    );
  }
  return value;
}

/** NEXT_PUBLIC_SUPABASE_URL — required by browser and server Supabase clients. */
export function getSupabaseUrl(): string {
  return requireEnv('NEXT_PUBLIC_SUPABASE_URL');
}

/** NEXT_PUBLIC_SUPABASE_ANON_KEY — safe for browser use. */
export function getSupabaseAnonKey(): string {
  return requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * SUPABASE_SERVICE_ROLE_KEY — server-only, bypasses RLS.
 * Never call this from a client component or a NEXT_PUBLIC_* path.
 */
export function getSupabaseServiceRoleKey(): string {
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY');
}
