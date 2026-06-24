-- ─────────────────────────────────────────────────────────────────────────────
-- 0019_reshape_diamonds_customer_model.sql
--
-- Reshapes `diamonds` from the orphaned B2B inventory model (migrations 0006–0014:
-- suppliers/holds/AED minor-units/fancy-colour/is_visible) to the simple D2C
-- "customer catalogue" model that the application code (src/lib/diamonds/* and the
-- storefront) already expects: a loose graded diamond that can be paired with a
-- ring setting, priced in GBP, with is_published visibility.
--
-- SAFE: `diamonds`, `diamond_media`, `suppliers` are all EMPTY (verified) — zero
-- data loss. This is the diamonds equivalent of what 0015 did for ring_settings.
--
-- The deployed inventory model was never used by the app code; both the admin
-- (/admin/diamonds → src/lib/diamonds/service.ts) and the storefront speak this
-- simpler model. Reshaping un-breaks /admin/diamonds.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Tear down legacy diamond inventory infrastructure ──────────────────────
-- diamond_media FK → diamonds; drop it first. Both empty.
drop table if exists public.diamond_media cascade;
-- DROP ... CASCADE removes the table's triggers, indexes, FK constraints, and the
-- BEFORE UPDATE sku-immutability / updated_at / assign-sku triggers attached to it.
drop table if exists public.diamonds cascade;
-- Per-year diamond SKU counter (0013) — superseded by shared catalogue_sku_counters.
drop table if exists public.diamond_sku_counters cascade;

-- Standalone functions from 0008–0014 (not auto-dropped: plpgsql bodies are not
-- tracked dependencies). Drop by discovered signature, regardless of argument list.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'transition_diamond_status',
        'extend_diamond_hold',
        'assign_diamond_sku',
        'generate_diamond_sku',
        'reject_diamond_sku_change'
      )
  loop
    execute 'drop function if exists ' || r.sig || ' cascade';
  end loop;
end $$;

-- ── 2. New enum for cut/polish/symmetry grade (lowercase, matches code) ────────
-- (cut→public.diamond_shape, colour→public.diamond_colour_grade,
--  clarity→public.diamond_clarity, fluorescence→public.gem_fluorescence,
--  status→public.diamond_status are all reused from existing enums.)
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'diamond_grade' and n.nspname = 'public') then
    create type public.diamond_grade as enum ('excellent', 'very_good', 'good', 'fair', 'poor');
  end if;
end $$;

-- ── 3. diamonds (customer catalogue model) ────────────────────────────────────
create table public.diamonds (
  id                  uuid                primary key default gen_random_uuid(),
  sku                 text                not null unique,
  ring_setting_id     uuid                references public.ring_settings(id) on delete set null,

  -- `cut` here means SHAPE (round/oval/…); typed with the existing diamond_shape
  -- enum (a superset of the 10 shapes the admin form offers).
  cut                 public.diamond_shape         not null,
  carat               numeric(6,3)        not null check (carat > 0),
  colour              public.diamond_colour_grade  not null,   -- D–M enum; form offers D–J
  clarity             public.diamond_clarity       not null,   -- FL–SI2

  cut_grade           public.diamond_grade,
  polish              public.diamond_grade,
  symmetry            public.diamond_grade,
  fluorescence        public.gem_fluorescence      not null default 'none',

  gia_report_number   text,
  gia_report_date     date,
  gia_report_url      text,

  measurement_length  numeric(6,2),
  measurement_width   numeric(6,2),
  measurement_depth   numeric(6,2),
  depth_pct           numeric(5,2),
  table_pct           numeric(5,2),

  price_gbp           numeric(12,2)       not null check (price_gbp >= 0),
  status              public.diamond_status        not null default 'available',  -- only available/sold used
  is_published        boolean             not null default false,
  notes               text,

  created_at          timestamptz         not null default now(),
  updated_at          timestamptz         not null default now(),
  created_by          uuid                references auth.users(id) on delete set null,
  updated_by          uuid                references auth.users(id) on delete set null
);

comment on table public.diamonds is
  'Loose graded diamond (ring centre stone). Customer catalogue model. SKU EGD-YYYY-NNNNNN.';
comment on column public.diamonds.cut is
  'Diamond SHAPE (round/oval/…). Named `cut` to match application code; typed with diamond_shape enum.';

create index idx_diamonds_setting     on public.diamonds (ring_setting_id);
create index idx_diamonds_published   on public.diamonds (is_published, status);
create index idx_diamonds_carat       on public.diamonds (carat);
create index idx_diamonds_price       on public.diamonds (price_gbp);
create index idx_diamonds_shape       on public.diamonds (cut);

create trigger trg_diamonds_sku
  before insert on public.diamonds
  for each row execute function public.assign_catalogue_sku('EGD');

create trigger trg_diamonds_updated_at
  before update on public.diamonds
  for each row execute function public.set_updated_at();

-- ── 4. diamond_media ──────────────────────────────────────────────────────────
create table public.diamond_media (
  id            uuid              primary key default gen_random_uuid(),
  diamond_id    uuid              not null references public.diamonds(id) on delete cascade,
  media_type    public.media_type not null,
  storage_path  text              not null unique,
  display_order smallint          not null default 0,
  is_primary    boolean           not null default false,
  alt_text      text,
  created_at    timestamptz       not null default now()
);

create index idx_diamond_media_diamond on public.diamond_media (diamond_id, display_order);
create unique index uq_diamond_media_primary on public.diamond_media (diamond_id) where is_primary;

-- ── 5. Row Level Security ─────────────────────────────────────────────────────
alter table public.diamonds      enable row level security;
alter table public.diamond_media enable row level security;

-- Public storefront read: published + available loose diamonds.
create policy "diamonds: public read published"
  on public.diamonds for select
  using (is_published = true and status = 'available');

create policy "diamond_media: public read published"
  on public.diamond_media for select
  using (exists (
    select 1 from public.diamonds d
    where d.id = diamond_media.diamond_id
      and d.is_published = true and d.status = 'available'
  ));
