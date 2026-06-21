-- =============================================================================
-- Éclat Grandeur — Phase 0 seed: promote the first user to super_admin
-- =============================================================================
-- HOW TO USE
--   1. In the Supabase dashboard: Authentication -> Users -> "Add user".
--      Create the user with an email + password and tick "Auto Confirm User".
--      (The handle_new_user trigger from 0001 creates their profile row.)
--   2. Edit the email below to match that user.
--   3. Run this script in the Supabase SQL Editor.
--
-- Idempotent: re-running it will not create duplicate role rows.
-- =============================================================================

do $$
declare
  target_email text := 'CHANGE_ME@example.com';  -- <-- EDIT THIS
  target_id    uuid;
begin
  select id into target_id from auth.users where email = target_email;

  if target_id is null then
    raise exception 'No auth user found with email %. Create them in Auth -> Users first.', target_email;
  end if;

  -- Ensure the profile exists (in case the trigger was added after the user).
  insert into public.profiles (id, email)
  values (target_id, target_email)
  on conflict (id) do nothing;

  -- Grant super_admin.
  insert into public.staff_roles (user_id, role)
  values (target_id, 'super_admin')
  on conflict (user_id, role) do nothing;

  raise notice 'Promoted % (%) to super_admin', target_email, target_id;
end
$$;
