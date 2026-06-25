-- ─────────────────────────────────────────────────────────────────────────────
-- 0028_grant_and_notify.sql
--
-- Ensures PostgREST picks up the columns added in migrations 0026 and 0027.
-- The COMMENT ON TABLE DDL forces the supabase reload-schema NOTIFY, and the
-- explicit GRANT ensures anon/authenticated can SELECT the new columns even in
-- projects that use column-level privileges.
-- ─────────────────────────────────────────────────────────────────────────────

-- Re-grant table-level SELECT so new columns are accessible to PostgREST roles
GRANT SELECT ON public.diamonds  TO anon, authenticated;
GRANT SELECT ON public.enquiries TO anon, authenticated;

-- service_role needs full access for the admin client
GRANT INSERT, UPDATE, DELETE ON public.diamonds  TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.enquiries TO service_role;

-- DDL change to trigger PostgREST schema-cache reload via NOTIFY
COMMENT ON TABLE public.diamonds IS
  'Natural diamond inventory (White, Yellow, and Pink only). Managed by Éclat Grandeur.';
