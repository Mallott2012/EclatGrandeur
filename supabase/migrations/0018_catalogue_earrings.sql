-- ─────────────────────────────────────────────────────────────────────────────
-- 0018_catalogue_earrings.sql
--
-- D2C catalogue (additive) — Earrings. Mirrors necklaces (0016):
--   earring_settings (is_pair flag; styles stud/drop/hoop/huggie/chandelier/ear_cuff/cluster)
--   earring_stones   (auto-SKU EGE-… via the shared assign_catalogue_sku)
--   earring_media
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.earring_settings (
  id                uuid              primary key default gen_random_uuid(),
  name              text              not null,
  slug              text              not null unique,
  collection        text,
  style             text,                         -- stud | drop | hoop | huggie | chandelier | ear_cuff | cluster
  metals            public.ring_metal[] not null default '{}',
  is_pair           boolean           not null default true,
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

create index if not exists idx_earring_settings_published on public.earring_settings (is_published, status);
create index if not exists idx_earring_settings_collection on public.earring_settings (collection);
create index if not exists idx_earring_settings_sort on public.earring_settings (sort_order);

create trigger trg_earring_settings_updated_at
  before update on public.earring_settings
  for each row execute function public.set_updated_at();

create table if not exists public.earring_stones (
  id                 uuid                primary key default gen_random_uuid(),
  sku                text                not null unique,
  earring_setting_id uuid                references public.earring_settings(id) on delete set null,
  stone_type         public.gemstone_type not null default 'diamond',
  shape              public.gem_shape,
  carat              numeric(6,3)        check (carat is null or carat > 0),
  colour             public.gem_colour,
  colour_description text,
  clarity            public.gem_clarity,
  clarity_description text,
  cut_grade          public.gem_grade,
  polish             public.gem_grade,
  symmetry           public.gem_grade,
  fluorescence       public.gem_fluorescence,
  gia_report_number  text,
  gia_report_date    date,
  gia_report_url     text,
  price_gbp          numeric(12,2)       check (price_gbp is null or price_gbp >= 0),
  status             public.product_status not null default 'available',
  is_published       boolean             not null default false,
  notes              text,
  created_at         timestamptz         not null default now(),
  updated_at         timestamptz         not null default now(),
  created_by         uuid                references auth.users(id) on delete set null,
  updated_by         uuid                references auth.users(id) on delete set null
);

create index if not exists idx_earring_stones_setting on public.earring_stones (earring_setting_id);
create index if not exists idx_earring_stones_published on public.earring_stones (is_published, status);
create index if not exists idx_earring_stones_type on public.earring_stones (stone_type);

create trigger trg_earring_stones_sku
  before insert on public.earring_stones
  for each row execute function public.assign_catalogue_sku('EGE');

create trigger trg_earring_stones_updated_at
  before update on public.earring_stones
  for each row execute function public.set_updated_at();

create table if not exists public.earring_media (
  id                 uuid              primary key default gen_random_uuid(),
  earring_setting_id uuid              not null references public.earring_settings(id) on delete cascade,
  media_type         public.media_type not null,
  storage_path       text              not null unique,
  display_order      smallint          not null default 0,
  is_primary         boolean           not null default false,
  alt_text           text,
  created_at         timestamptz       not null default now()
);

create index if not exists idx_earring_media_setting on public.earring_media (earring_setting_id, display_order);
create unique index if not exists uq_earring_media_primary
  on public.earring_media (earring_setting_id) where is_primary;

alter table public.earring_settings enable row level security;
alter table public.earring_stones   enable row level security;
alter table public.earring_media    enable row level security;

create policy "earring_settings: public read published"
  on public.earring_settings for select
  using (is_published = true and status = 'available');

create policy "earring_stones: public read published"
  on public.earring_stones for select
  using (is_published = true and status = 'available');

create policy "earring_media: public read published"
  on public.earring_media for select
  using (exists (
    select 1 from public.earring_settings s
    where s.id = earring_media.earring_setting_id
      and s.is_published = true and s.status = 'available'
  ));
