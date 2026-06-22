-- ─────────────────────────────────────────────────────────────────────────────
-- 0002_staff_roles.sql
-- Staff role assignments. Depends on 0001_profiles.sql.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Role enum ────────────────────────────────────────────────────────────────

do $$ begin
  create type public.staff_role_type as enum (
    'super_admin',
    'sales_adviser',
    'diamond_buyer',
    'content_editor'
  );
exception
  when duplicate_object then null;
end $$;

-- ── Table ────────────────────────────────────────────────────────────────────

create table if not exists public.staff_roles (
  id          uuid                    primary key default gen_random_uuid(),
  user_id     uuid                    not null references public.profiles(id) on delete cascade,
  role        public.staff_role_type  not null,
  created_at  timestamptz             not null default now(),
  updated_at  timestamptz             not null default now(),

  constraint staff_roles_user_role_unique unique (user_id, role)
);

comment on table public.staff_roles is
  'Staff role assignments. A user may hold multiple roles. '
  'Only super_admin may manage entries in this table.';

create index if not exists idx_staff_roles_user_id on public.staff_roles(user_id);

-- ── Trigger: updated_at ───────────────────────────────────────────────────────

create trigger trg_staff_roles_updated_at
  before update on public.staff_roles
  for each row execute function public.set_updated_at();

-- ── Helper: get current user's roles ─────────────────────────────────────────
-- Returns the set of role values for the currently authenticated user.
-- SECURITY INVOKER: runs as the calling user; auth.uid() is always correct.

create or replace function public.get_my_staff_roles()
  returns setof public.staff_role_type
  language sql
  security invoker
  stable
  set search_path = ''
as $$
  select role
  from public.staff_roles
  where user_id = auth.uid();
$$;

-- ── Helper: is the current user a super_admin? ────────────────────────────────
-- Convenience boolean check. Same security model as get_my_staff_roles().

create or replace function public.is_super_admin()
  returns boolean
  language sql
  security invoker
  stable
  set search_path = ''
as $$
  select exists (
    select 1
    from public.staff_roles
    where user_id = auth.uid()
      and role = 'super_admin'
  );
$$;

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.staff_roles enable row level security;

-- Staff members may read their own role rows.
create policy "staff_roles: owner read"
  on public.staff_roles
  for select
  using (auth.uid() = user_id);

-- Only super_admin may insert new role assignments.
create policy "staff_roles: super_admin insert"
  on public.staff_roles
  for insert
  with check (public.is_super_admin());

-- Only super_admin may update role assignments.
create policy "staff_roles: super_admin update"
  on public.staff_roles
  for update
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Only super_admin may delete role assignments.
create policy "staff_roles: super_admin delete"
  on public.staff_roles
  for delete
  using (public.is_super_admin());
