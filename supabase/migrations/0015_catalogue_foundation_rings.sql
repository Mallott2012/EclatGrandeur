-- ─────────────────────────────────────────────────────────────────────────────
-- 0015_catalogue_foundation_rings.sql
--
-- Phase: D2C catalogue (additive). Establishes the shared enum vocabulary for the
-- storefront catalogue (rings / necklaces / bracelets / earrings) and creates the
-- first category — ring settings + their media.
--
-- DESIGN NOTE — enum namespacing.
-- The existing diamond-inventory module (migrations 0004–0014) already defines
-- types named `diamond_cut`, `diamond_clarity`, `diamond_fluorescence` whose
-- VALUES and MEANING differ from this catalogue (e.g. `diamond_cut` there is a
-- quality grade, here "cut" means SHAPE). To avoid mutating live types, the
-- catalogue grading vocabulary is namespaced under `gem_*`. Non-colliding names
-- (`ring_metal`, `product_status`, `media_type`, `gemstone_type`) are created
-- fresh. NOTHING in the diamond-inventory module is altered by this migration.
--
-- DESIGN NOTE — identity.
-- Settings are identified by a unique `slug` (no SKU). Only the sellable graded
-- stones (diamonds / necklace_stones / …) carry auto-assigned SKUs.
--
-- RLS: public (anon) may SELECT only published + available rows. All writes go
-- through the service role, which bypasses RLS.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Shared catalogue enums (idempotent) ──────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'ring_metal' and n.nspname = 'public') then
    create type public.ring_metal as enum (
      'platinum',
      'white_gold_18ct', 'white_gold_9ct',
      'yellow_gold_18ct', 'yellow_gold_9ct',
      'rose_gold_18ct', 'rose_gold_9ct'
    );
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'product_status' and n.nspname = 'public') then
    create type public.product_status as enum ('available', 'reserved', 'sold', 'discontinued');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'media_type' and n.nspname = 'public') then
    create type public.media_type as enum ('image', 'video_360', 'model_video', 'certificate_pdf');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'gemstone_type' and n.nspname = 'public') then
    create type public.gemstone_type as enum (
      'diamond', 'ruby', 'sapphire', 'emerald', 'pearl',
      'morganite', 'aquamarine', 'tanzanite', 'opal', 'other'
    );
  end if;

  -- "Shape" of a faceted stone (the spec calls this `cut`; namespaced to avoid
  -- the live `diamond_cut` quality-grade enum).
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'gem_shape' and n.nspname = 'public') then
    create type public.gem_shape as enum (
      'round_brilliant', 'princess', 'oval', 'cushion', 'emerald',
      'pear', 'marquise', 'radiant', 'asscher', 'heart', 'trillion'
    );
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'gem_colour' and n.nspname = 'public') then
    create type public.gem_colour as enum ('D','E','F','G','H','I','J','K','L','M');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'gem_clarity' and n.nspname = 'public') then
    create type public.gem_clarity as enum (
      'FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2','I1','I2','I3'
    );
  end if;

  -- Cut/polish/symmetry grade (the spec calls this `diamond_grade`).
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'gem_grade' and n.nspname = 'public') then
    create type public.gem_grade as enum ('Excellent','Very Good','Good','Fair','Poor');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                 where t.typname = 'gem_fluorescence' and n.nspname = 'public') then
    create type public.gem_fluorescence as enum ('none','faint','medium','strong','very_strong');
  end if;
end;
$$;

-- ── ring_settings ─────────────────────────────────────────────────────────────
create table if not exists public.ring_settings (
  id                uuid              primary key default gen_random_uuid(),
  name              text              not null,
  slug              text              not null unique,
  collection        text,
  metals            public.ring_metal[] not null default '{}',
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

comment on table public.ring_settings is
  'Ring design/mounting. Identified by slug. Sellable stones link via diamonds.ring_setting_id.';

create index if not exists idx_ring_settings_published
  on public.ring_settings (is_published, status);
create index if not exists idx_ring_settings_collection
  on public.ring_settings (collection);
create index if not exists idx_ring_settings_sort
  on public.ring_settings (sort_order);

create trigger trg_ring_settings_updated_at
  before update on public.ring_settings
  for each row execute function public.set_updated_at();

-- ── ring_setting_media ────────────────────────────────────────────────────────
create table if not exists public.ring_setting_media (
  id              uuid              primary key default gen_random_uuid(),
  ring_setting_id uuid              not null references public.ring_settings(id) on delete cascade,
  media_type      public.media_type not null,
  storage_path    text              not null unique,
  display_order   smallint          not null default 0,
  is_primary      boolean           not null default false,
  alt_text        text,
  created_at      timestamptz       not null default now()
);

create index if not exists idx_ring_setting_media_setting
  on public.ring_setting_media (ring_setting_id, display_order);

-- One primary image per setting.
create unique index if not exists uq_ring_setting_media_primary
  on public.ring_setting_media (ring_setting_id)
  where is_primary;

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.ring_settings      enable row level security;
alter table public.ring_setting_media enable row level security;

-- Public storefront read: only published + available settings.
create policy "ring_settings: public read published"
  on public.ring_settings
  for select
  using (is_published = true and status = 'available');

-- Public storefront read of media belonging to a published + available setting.
create policy "ring_setting_media: public read published"
  on public.ring_setting_media
  for select
  using (exists (
    select 1 from public.ring_settings s
    where s.id = ring_setting_media.ring_setting_id
      and s.is_published = true
      and s.status = 'available'
  ));
