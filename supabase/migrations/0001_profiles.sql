-- ─────────────────────────────────────────────────────────────────────────────
-- 0001_profiles.sql
-- User profiles, auto-created on Auth sign-up.
-- ─────────────────────────────────────────────────────────────────────────────

-- Shared updated_at trigger function (idempotent, used by all tables).
create or replace function public.set_updated_at()
  returns trigger
  language plpgsql
  security invoker
  set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Table ────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One profile per Auth user. Created automatically via handle_new_user trigger.';

-- ── Trigger: updated_at ───────────────────────────────────────────────────────

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Trigger: auto-create profile on new Auth user ────────────────────────────

create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

-- Users may read their own profile only.
create policy "profiles: owner read"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users may update their own name/email only.
-- They cannot assign or read roles through this table (roles live in staff_roles).
create policy "profiles: owner update"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
