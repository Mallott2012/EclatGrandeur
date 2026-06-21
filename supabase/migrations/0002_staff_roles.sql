-- =============================================================================
-- Éclat Grandeur — Phase 0 migration 0002: staff_roles
-- =============================================================================
-- Staff role assignments. Structured as one row per (user, role) so a single
-- user can hold multiple roles in later phases. Only super_admin may manage
-- assignments; users cannot read or edit their own role rows directly through
-- table policies (they use the get_my_roles() helper instead).
-- =============================================================================

-- Constrained enum for roles.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'staff_role') then
    create type public.staff_role as enum (
      'super_admin',
      'sales_adviser',
      'diamond_buyer',
      'content_editor'
    );
  end if;
end
$$;

create table if not exists public.staff_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.staff_role not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, role)
);

create index if not exists staff_roles_user_id_idx on public.staff_roles (user_id);

drop trigger if exists staff_roles_set_updated_at on public.staff_roles;
create trigger staff_roles_set_updated_at
  before update on public.staff_roles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper: is the current user a super_admin?
-- SECURITY DEFINER avoids RLS recursion when policies reference this table.
-- ---------------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.staff_roles
    where user_id = auth.uid()
      and role = 'super_admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Helper: return the current user's own roles.
-- Lets the app resolve roles without a permissive RLS read policy and without
-- using the service-role key in the request path.
-- ---------------------------------------------------------------------------
create or replace function public.get_my_roles()
returns table (role public.staff_role)
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.staff_roles
  where user_id = auth.uid();
$$;

revoke all on function public.get_my_roles() from public;
grant execute on function public.get_my_roles() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security — only super_admin may read/manage assignments.
-- ---------------------------------------------------------------------------
alter table public.staff_roles enable row level security;

drop policy if exists "staff_roles_select_super_admin" on public.staff_roles;
create policy "staff_roles_select_super_admin"
  on public.staff_roles
  for select
  to authenticated
  using (public.is_super_admin());

drop policy if exists "staff_roles_insert_super_admin" on public.staff_roles;
create policy "staff_roles_insert_super_admin"
  on public.staff_roles
  for insert
  to authenticated
  with check (public.is_super_admin());

drop policy if exists "staff_roles_update_super_admin" on public.staff_roles;
create policy "staff_roles_update_super_admin"
  on public.staff_roles
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "staff_roles_delete_super_admin" on public.staff_roles;
create policy "staff_roles_delete_super_admin"
  on public.staff_roles
  for delete
  to authenticated
  using (public.is_super_admin());

-- Anonymous users have no access at all (no policies for the anon role).
