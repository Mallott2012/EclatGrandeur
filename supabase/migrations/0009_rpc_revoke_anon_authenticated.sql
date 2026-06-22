-- Phase 1A correction: explicitly revoke EXECUTE from anon and authenticated
-- on both hold RPCs.
--
-- Why this is a separate migration:
--   Migration 0008 applied REVOKE FROM PUBLIC but Supabase's default privilege
--   setup (ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO anon,
--   authenticated) adds explicit per-role grants to every new function.
--   REVOKE FROM PUBLIC does not remove those explicit per-role grants, so
--   PostgREST could still expose the functions via /rpc/. This migration
--   removes those grants from the already-applied functions.
--
--   Migration 0008 on disk has been updated to include these revokes so that
--   fresh database setups (local dev, new Supabase projects) apply them
--   correctly in a single pass.

REVOKE EXECUTE ON FUNCTION public.transition_diamond_status(
  uuid, uuid, public.diamond_status, timestamptz, text
) FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.extend_diamond_hold(
  uuid, uuid, timestamptz, text
) FROM anon, authenticated;
