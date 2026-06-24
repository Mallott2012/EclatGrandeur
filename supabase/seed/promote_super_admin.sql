-- ─────────────────────────────────────────────────────────────────────────────
-- promote_super_admin.sql
--
-- Run this ONCE after creating the first Auth user in the Supabase dashboard.
--
-- Usage:
--   1. Create a user in: Supabase Dashboard → Authentication → Users → Add User
--      (enable "Auto Confirm User")
--   2. Replace the placeholder email below with that user's email address.
--   3. Run this file against your project:
--        supabase db execute --file supabase/seed/promote_super_admin.sql
--      Or paste it into the Supabase SQL Editor.
--
-- This script is safe to run multiple times — it uses ON CONFLICT DO NOTHING.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  v_user_id uuid;
begin
  -- ── Step 1: resolve the user ID from email ──────────────────────────────────
  select id
  into v_user_id
  from auth.users
  where email = 'REPLACE_WITH_ADMIN_EMAIL@example.com'  -- ← replace this
  limit 1;

  if v_user_id is null then
    raise exception
      'No user found with that email. '
      'Create the user in the Supabase dashboard first, then re-run this script.';
  end if;

  -- ── Step 2: ensure a profile row exists ────────────────────────────────────
  -- The handle_new_user trigger normally creates this automatically.
  -- This is a safety net in case the trigger ran before the migration existed.
  insert into public.profiles (id, email)
  values (v_user_id, 'REPLACE_WITH_ADMIN_EMAIL@example.com')  -- ← replace this
  on conflict (id) do nothing;

  -- ── Step 3: grant super_admin role ─────────────────────────────────────────
  insert into public.staff_roles (user_id, role)
  values (v_user_id, 'super_admin')
  on conflict (user_id, role) do nothing;

  raise notice 'super_admin role granted to user %', v_user_id;
end;
$$;
