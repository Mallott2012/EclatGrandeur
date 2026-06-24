-- ─────────────────────────────────────────────────────────────────────────────
-- 0016_catalogue_necklaces.sql
--
-- D2C catalogue (additive) — Necklaces. Follows the ring pattern from 0015:
--   necklace_settings  (the chain/pendant mounting, identified by slug)
--   necklace_stones    (graded stones set in the necklace, auto-SKU EGN-…)
--   necklace_media     (images / 360 / model video for a setting)
--
-- Introduces a DRY, reusable SKU generator for the catalogue stone tables
-- (necklace/bracelet/earring), mirroring the per-year advisory-locked counter
-- from migration 0013 but keyed by (prefix, year) so one function serves all.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Generic catalogue SKU counter + trigger function ──────────────────────────
-- One row per (prefix, year). Written exclusively by the SECURITY DEFINER
-- trigger function below; no RLS policies (service-role / definer access only).
create table if not exists public.catalogue_sku_counters (
  prefix       text    not null,
  year         integer not null,
  last_counter integer not null default 0,
  primary key (prefix, year)
);
alter table public.catalogue_sku_counters enable row level security;

-- Trigger function. The SKU prefix is passed as a trigger argument: TG_ARGV[0].
-- SECURITY DEFINER + fixed search_path: consistent write access, injection-safe.
create or replace function public.assign_catalogue_sku()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix  text := tg_argv[0];
  v_year    integer;
  v_counter integer;
begin
  -- Idempotency guard: leave an explicitly-provided SKU untouched.
  if new.sku is not null and new.sku <> '' then
    return new;
  end if;

  v_year := extract(year from (now() at time zone 'utc'))::integer;

  -- Serialise concurrent inserts within the same (prefix, year).
  perform pg_advisory_xact_lock(hashtext('catalogue_sku_' || v_prefix)::integer, v_year);

  insert into public.catalogue_sku_counters (prefix, year, last_counter)
  values (v_prefix, v_year, 1)
  on conflict (prefix, year) do update
    set last_counter = public.catalogue_sku_counters.last_counter + 1
  returning last_counter into v_counter;

  new.sku := v_prefix || '-' || v_year::text || '-' || lpad(v_counter::text, 6, '0');
  return new;
end;
$$;

-- ── necklace_settings ─────────────────────────────────────────────────────────
create table if not exists public.necklace_settings (
  id                uuid              primary key default gen_random_uuid(),
  name              text              not null,
  slug              text              not null unique,
  collection        text,
  style             text,                         -- pendant | chain | collar | choker | station | lariat
  metals            public.ring_metal[] not null default '{}',
  chain_lengths_cm  integer[]         not null default '{}',
  base_price_gbp    numeric(12,2)     check (base_price_gbp is null or base_price_gbp >= 0),
  short_description text              check (short_description is null or char_length(short_description) <= 160),
  description       text,
  status            public.product_status not null default 'available',
  is_published      boolean           not null default false,
  sort_order        smallint          not null default 0,
  created_at        timestamptz       not null default now(),
  updated_at        timestamptz       not null default now(),
  created_by        uuid              references auth.users(id) on delete set null,
  updated_by        uuid              references auth.users(id) on delete set null
);

comment on table public.necklace_settings is
  'Necklace chain/pendant mounting. Identified by slug. Stones link via necklace_stones.';

create index if not exists idx_necklace_settings_published on public.necklace_settings (is_published, status);
create index if not exists idx_necklace_settings_collection on public.necklace_settings (collection);
create index if not exists idx_necklace_settings_sort on public.necklace_settings (sort_order);

create trigger trg_necklace_settings_updated_at
  before update on public.necklace_settings
  for each row execute function public.set_updated_at();

-- ── necklace_stones ───────────────────────────────────────────────────────────
create table if not exists public.necklace_stones (
  id                  uuid                primary key default gen_random_uuid(),
  sku                 text                not null unique,
  necklace_setting_id uuid                references public.necklace_settings(id) on delete set null,
  stone_type          public.gemstone_type not null default 'diamond',

  -- 4Cs (diamond fields nullable; coloured stones use *_description free text)
  shape               public.gem_shape,             -- spec calls this "cut" (shape)
  carat               numeric(6,3)        check (carat is null or carat > 0),
  colour              public.gem_colour,            -- diamonds
  colour_description  text,                          -- coloured stones, e.g. "Pigeon Blood Red"
  clarity             public.gem_clarity,           -- diamonds
  clarity_description text,                          -- coloured stones

  -- Cut-quality grades
  cut_grade           public.gem_grade,
  polish              public.gem_grade,
  symmetry            public.gem_grade,
  fluorescence        public.gem_fluorescence,

  -- Certification
  gia_report_number   text,
  gia_report_date     date,
  gia_report_url      text,

  -- Pricing & visibility
  price_gbp           numeric(12,2)       check (price_gbp is null or price_gbp >= 0),
  status              public.product_status not null default 'available',
  is_published        boolean             not null default false,

  notes               text,                          -- internal only, never shown publicly

  created_at          timestamptz         not null default now(),
  updated_at          timestamptz         not null default now(),
  created_by          uuid                references auth.users(id) on delete set null,
  updated_by          uuid                references auth.users(id) on delete set null
);

comment on table public.necklace_stones is
  'Graded stone set in a necklace. SKU auto-assigned EGN-YYYY-NNNNNN.';

create index if not exists idx_necklace_stones_setting on public.necklace_stones (necklace_setting_id);
create index if not exists idx_necklace_stones_published on public.necklace_stones (is_published, status);
create index if not exists idx_necklace_stones_type on public.necklace_stones (stone_type);

create trigger trg_necklace_stones_sku
  before insert on public.necklace_stones
  for each row execute function public.assign_catalogue_sku('EGN');

create trigger trg_necklace_stones_updated_at
  before update on public.necklace_stones
  for each row execute function public.set_updated_at();

-- ── necklace_media ────────────────────────────────────────────────────────────
create table if not exists public.necklace_media (
  id                  uuid              primary key default gen_random_uuid(),
  necklace_setting_id uuid              not null references public.necklace_settings(id) on delete cascade,
  media_type          public.media_type not null,
  storage_path        text              not null unique,
  display_order       smallint          not null default 0,
  is_primary          boolean           not null default false,
  alt_text            text,
  created_at          timestamptz       not null default now()
);

create index if not exists idx_necklace_media_setting on public.necklace_media (necklace_setting_id, display_order);
create unique index if not exists uq_necklace_media_primary
  on public.necklace_media (necklace_setting_id) where is_primary;

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.necklace_settings enable row level security;
alter table public.necklace_stones   enable row level security;
alter table public.necklace_media    enable row level security;

create policy "necklace_settings: public read published"
  on public.necklace_settings for select
  using (is_published = true and status = 'available');

create policy "necklace_stones: public read published"
  on public.necklace_stones for select
  using (is_published = true and status = 'available');

create policy "necklace_media: public read published"
  on public.necklace_media for select
  using (exists (
    select 1 from public.necklace_settings s
    where s.id = necklace_media.necklace_setting_id
      and s.is_published = true and s.status = 'available'
  ));
