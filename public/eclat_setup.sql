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
-- ─────────────────────────────────────────────────────────────────────────────
-- 0003_audit_logs.sql
-- Append-only audit trail. Written exclusively by server-side service-role
-- operations — no browser client or authenticated user can write directly.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.audit_logs (
  id              uuid        primary key default gen_random_uuid(),
  actor_user_id   uuid        references auth.users(id) on delete set null,
  action          text        not null,
  entity_type     text,
  entity_id       uuid,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

comment on table public.audit_logs is
  'Append-only audit trail. Written only by the service-role server client. '
  'No RLS read or write policy is granted to authenticated users or anon.';

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists idx_audit_logs_actor      on public.audit_logs(actor_user_id);
create index if not exists idx_audit_logs_entity     on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- RLS is enabled but NO policies are granted to authenticated users or anon.
-- All reads and writes must go through the service-role admin client
-- (src/lib/supabase/admin.ts), which bypasses RLS entirely.

alter table public.audit_logs enable row level security;

-- Intentionally no SELECT, INSERT, UPDATE, or DELETE policies for authenticated
-- or anon roles. Only the service-role key (used server-side only) can access
-- this table.
-- Phase 1A: diamond inventory enums and fancy-colour hue reference table.
-- Enums created idempotently; migration is safe to re-run.
--
-- SECURITY: fancy_colour_hues has RLS enabled with zero policies.
-- Consistent with Phase 1A principle: all raw inventory-related tables
-- are server-only operational data. No authenticated SELECT policy granted.

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_origin' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_origin AS ENUM ('natural', 'lab_grown');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_colour_category' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_colour_category AS ENUM ('standard', 'fancy');
  END IF;

  -- D-M covers all realistic luxury white-diamond stock.
  -- Fancy stones use fancy_colour_hue + fancy_colour_intensity instead.
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_colour_grade' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_colour_grade AS ENUM (
      'D','E','F','G','H','I','J','K','L','M'
    );
  END IF;

  -- GIA official fancy-colour intensity scale.
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'fancy_colour_intensity' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.fancy_colour_intensity AS ENUM (
      'Faint', 'Very Light', 'Light',
      'Fancy Light', 'Fancy', 'Fancy Intense',
      'Fancy Vivid', 'Fancy Deep', 'Fancy Dark'
    );
  END IF;

  -- Shape enum. New cuts added via ALTER TYPE ... ADD VALUE in future migrations.
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_shape' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_shape AS ENUM (
      'round', 'oval', 'princess', 'emerald', 'cushion',
      'pear', 'marquise', 'radiant', 'asscher', 'heart',
      'trilliant', 'baguette', 'old_european', 'old_mine'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_clarity' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_clarity AS ENUM (
      'FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'
    );
  END IF;

  -- 'Ideal' retained for AGS-certified stones; GIA's highest formal grade is 'Excellent'.
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_cut' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_cut AS ENUM (
      'Ideal', 'Excellent', 'Very Good', 'Good', 'Fair'
    );
  END IF;

  -- Shared grade set for polish and symmetry.
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_finish' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_finish AS ENUM (
      'Excellent', 'Very Good', 'Good', 'Fair'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_fluorescence' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_fluorescence AS ENUM (
      'None', 'Faint', 'Medium', 'Strong', 'Very Strong'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'certificate_lab' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.certificate_lab AS ENUM (
      'GIA', 'IGI', 'HRD', 'AGS', 'GCAL'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_status AS ENUM (
      'available', 'on_hold', 'reserved', 'sold', 'removed'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_media_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_media_type AS ENUM ('image', 'video_360');
  END IF;

END;
$$;

-- Fancy-colour hue reference table.
-- Text primary key, not an enum: new hues need only an INSERT, not a migration.
-- diamonds.fancy_colour_hue FKs to this table for referential integrity.
-- Application-layer Zod validation also guards approved values.
CREATE TABLE IF NOT EXISTS public.fancy_colour_hues (
  hue text PRIMARY KEY
);

INSERT INTO public.fancy_colour_hues (hue) VALUES
  ('yellow'), ('pink'),   ('blue'),  ('green'),
  ('brown'),  ('grey'),   ('black'), ('orange'),
  ('red'),    ('violet')
ON CONFLICT DO NOTHING;

-- RLS enabled; zero policies.
-- All access via service-role server functions only.
ALTER TABLE public.fancy_colour_hues ENABLE ROW LEVEL SECURITY;
-- Phase 1A: suppliers table.
-- No hard delete permitted. Use is_active = false for deactivation.
-- Server layer must prevent deactivation while active diamonds (available,
-- on_hold, reserved) reference this supplier.
-- diamonds.supplier_id ON DELETE RESTRICT means a supplier record cannot be
-- hard-deleted while any diamond row references it.

CREATE TABLE IF NOT EXISTS public.suppliers (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  -- Short code used for CSV import supplier matching (e.g. 'RAPNET', 'IDEX').
  code          text        NOT NULL,
  contact_name  text,
  email         text,
  phone         text,
  country       text,
  -- Primary invoicing currency for this supplier.
  currency      text        NOT NULL DEFAULT 'USD',
  notes         text,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT suppliers_code_unique UNIQUE (code),
  CONSTRAINT chk_supplier_currency CHECK (currency ~ '^[A-Z]{3}$')
);

-- Reuses set_updated_at() created in migration 0001.
CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS enabled; zero policies.
-- All access via server-only repository functions using the service-role client.
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
-- Phase 1A: diamonds table.
-- No DELETE policy. 'removed' is the only terminal archival state.
--
-- Key design decisions documented here for future maintainers:
--   held_by_user_id ON DELETE RESTRICT: deleting a user who owns a live hold
--     is blocked at the database level. The server must release the hold first.
--     created_by / updated_by use ON DELETE SET NULL (audit trail preserved,
--     actor anonymised on account deletion).
--   Fancy-colour hue validated by FK to fancy_colour_hues (not a CHECK subquery,
--     which PostgreSQL does not permit).
--   Certificate uniqueness via partial unique index (NULLs excluded so multiple
--     draft stones without cert are permitted).
--   Visibility gate enforced both as a CHECK constraint (database backstop) and
--     in the transition RPC / update server action (user-facing error messages).

-- SKU sequence: global, non-resetting.
-- Year in the SKU reflects when the stone was entered, not a per-year counter.
-- Format: EGD-{YYYY}-{NNNN}  e.g. EGD-2026-0001
CREATE SEQUENCE IF NOT EXISTS public.diamonds_sku_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_diamond_sku()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := 'EGD-'
      || to_char(now(), 'YYYY')
      || '-'
      || lpad(nextval('public.diamonds_sku_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.diamonds (
  id                      uuid                           PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifiers
  sku                     text                           NOT NULL,
  supplier_id             uuid                           REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  supplier_sku            text,

  -- Origin
  origin                  public.diamond_origin          NOT NULL DEFAULT 'natural',

  -- Colour model
  colour_category         public.diamond_colour_category NOT NULL DEFAULT 'standard',
  colour_grade            public.diamond_colour_grade,    -- NULL for fancy stones
  fancy_colour_hue        text                           REFERENCES public.fancy_colour_hues(hue),
  fancy_colour_intensity  public.fancy_colour_intensity,  -- NULL for standard stones
  fancy_colour_overtone   text,                           -- free text, e.g. "Pinkish"; nullable

  -- Shape and 4Cs
  shape                   public.diamond_shape           NOT NULL,
  carat                   numeric(8,3)                   NOT NULL CHECK (carat > 0),
  clarity                 public.diamond_clarity         NOT NULL,
  cut                     public.diamond_cut,             -- NULL valid for fancy/non-round shapes

  -- Extended grading
  polish                  public.diamond_finish          NOT NULL,
  symmetry                public.diamond_finish          NOT NULL,
  fluorescence            public.diamond_fluorescence    NOT NULL DEFAULT 'None',

  -- Measurements
  meas_length_mm          numeric(6,2),
  meas_width_mm           numeric(6,2),
  meas_depth_mm           numeric(6,2),
  table_pct               numeric(5,1),
  depth_pct               numeric(5,1),
  girdle                  text,
  culet                   text,

  -- Certification (nullable for internal draft stock).
  -- cert_lab + cert_number must be set and meaningful before is_visible = true.
  cert_lab                public.certificate_lab,
  cert_number             text,
  cert_pdf_path           text,

  -- Pricing (minor units: fils for AED, pence for GBP, cents for USD/EUR).
  retail_price_amount     bigint,
  retail_price_currency   text                           NOT NULL DEFAULT 'AED',
  supplier_cost_amount    bigint,
  supplier_cost_currency  text                           NOT NULL DEFAULT 'USD',

  -- Status and public visibility
  status                  public.diamond_status          NOT NULL DEFAULT 'available',
  is_visible              boolean                        NOT NULL DEFAULT false,

  -- Hold fields: all populated when status = on_hold; all NULL otherwise.
  -- ON DELETE RESTRICT: prevents deleting a user who owns a live hold.
  -- Server must release or reassign the hold before deleting the user account.
  held_by_user_id         uuid                           REFERENCES auth.users(id) ON DELETE RESTRICT,
  held_at                 timestamptz,
  hold_expires_at         timestamptz,
  hold_reason             text,

  -- Content
  selection_note          text,
  internal_notes          text,

  -- Availability tracking
  last_availability_check timestamptz,

  -- Provenance
  created_at              timestamptz                    NOT NULL DEFAULT now(),
  updated_at              timestamptz                    NOT NULL DEFAULT now(),
  created_by              uuid                           REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by              uuid                           REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT diamonds_sku_unique UNIQUE (sku),

  -- Standard colour: grade required; fancy fields must be absent.
  CONSTRAINT chk_colour_standard CHECK (
    colour_category <> 'standard'
    OR (
      colour_grade IS NOT NULL
      AND fancy_colour_hue IS NULL
      AND fancy_colour_intensity IS NULL
    )
  ),

  -- Fancy colour: grade must be absent; hue and intensity required.
  CONSTRAINT chk_colour_fancy CHECK (
    colour_category <> 'fancy'
    OR (
      colour_grade IS NULL
      AND fancy_colour_hue IS NOT NULL
      AND fancy_colour_intensity IS NOT NULL
    )
  ),

  -- Pricing: amounts must be meaningful when present.
  CONSTRAINT chk_retail_price_positive CHECK (
    retail_price_amount IS NULL OR retail_price_amount > 0
  ),
  CONSTRAINT chk_supplier_cost_non_negative CHECK (
    supplier_cost_amount IS NULL OR supplier_cost_amount >= 0
  ),

  -- Currency codes must be 3-character uppercase ISO-style strings.
  CONSTRAINT chk_retail_price_currency  CHECK (retail_price_currency  ~ '^[A-Z]{3}$'),
  CONSTRAINT chk_supplier_cost_currency CHECK (supplier_cost_currency  ~ '^[A-Z]{3}$'),

  -- Hold fields: fully populated when on_hold; fully NULL otherwise.
  CONSTRAINT chk_hold_fields CHECK (
    (
      status = 'on_hold'
      AND held_by_user_id IS NOT NULL
      AND held_at IS NOT NULL
      AND hold_expires_at IS NOT NULL
      AND hold_reason IS NOT NULL
      AND length(trim(hold_reason)) > 0
    )
    OR (
      status <> 'on_hold'
      AND held_by_user_id IS NULL
      AND held_at IS NULL
      AND hold_expires_at IS NULL
      AND hold_reason IS NULL
    )
  ),

  -- Visibility gate (database backstop; primary enforcement in server actions).
  -- is_visible = true requires a meaningful cert, a positive retail price,
  -- and the stone to be in 'available' status only.
  CONSTRAINT chk_visibility_gate CHECK (
    is_visible = false
    OR (
      cert_lab IS NOT NULL
      AND cert_number IS NOT NULL
      AND length(trim(cert_number)) > 0
      AND retail_price_amount IS NOT NULL
      AND retail_price_amount > 0
      AND status = 'available'
    )
  )
);

-- Certificate partial unique index.
-- Prevents two diamonds with identical cert lab + number.
-- Rows with NULL cert fields are excluded: multiple draft stones permitted.
CREATE UNIQUE INDEX IF NOT EXISTS diamonds_cert_unique_when_present
  ON public.diamonds (cert_lab, cert_number)
  WHERE cert_lab IS NOT NULL AND cert_number IS NOT NULL;

-- Operational indexes
CREATE INDEX IF NOT EXISTS idx_diamonds_status
  ON public.diamonds (status);
CREATE INDEX IF NOT EXISTS idx_diamonds_supplier_id
  ON public.diamonds (supplier_id);
CREATE INDEX IF NOT EXISTS idx_diamonds_shape
  ON public.diamonds (shape);
CREATE INDEX IF NOT EXISTS idx_diamonds_carat
  ON public.diamonds (carat);
CREATE INDEX IF NOT EXISTS idx_diamonds_colour_grade
  ON public.diamonds (colour_grade) WHERE colour_grade IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_diamonds_is_visible
  ON public.diamonds (is_visible);
CREATE INDEX IF NOT EXISTS idx_diamonds_created_at
  ON public.diamonds (created_at DESC);
-- Partial index for expired-hold sweep queries and list-screen filters.
CREATE INDEX IF NOT EXISTS idx_diamonds_hold_expires
  ON public.diamonds (hold_expires_at) WHERE status = 'on_hold';

-- Triggers
CREATE TRIGGER trg_diamonds_generate_sku
  BEFORE INSERT ON public.diamonds
  FOR EACH ROW EXECUTE FUNCTION public.generate_diamond_sku();

CREATE TRIGGER trg_diamonds_updated_at
  BEFORE UPDATE ON public.diamonds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS enabled; zero policies.
-- All access via service-role server functions only.
ALTER TABLE public.diamonds ENABLE ROW LEVEL SECURITY;
-- Phase 1A: diamond media table (images and 360 videos only).
-- Certificate PDFs are referenced via diamonds.cert_pdf_path, not here.
-- Both managed through the diamond-certificates and diamond-media private
-- storage buckets configured in T2.

CREATE TABLE IF NOT EXISTS public.diamond_media (
  id             uuid                       PRIMARY KEY DEFAULT gen_random_uuid(),
  diamond_id     uuid                       NOT NULL REFERENCES public.diamonds(id) ON DELETE CASCADE,
  media_type     public.diamond_media_type  NOT NULL,
  storage_path   text                       NOT NULL,
  display_order  smallint                   NOT NULL DEFAULT 0,
  alt_text       text,
  is_primary     boolean                    NOT NULL DEFAULT false,
  created_at     timestamptz                NOT NULL DEFAULT now(),

  CONSTRAINT diamond_media_storage_path_unique UNIQUE (storage_path)
);

-- At most one primary image per diamond.
CREATE UNIQUE INDEX IF NOT EXISTS idx_diamond_media_one_primary
  ON public.diamond_media (diamond_id)
  WHERE is_primary = true AND media_type = 'image';

CREATE INDEX IF NOT EXISTS idx_diamond_media_diamond_id
  ON public.diamond_media (diamond_id);

-- RLS enabled; zero policies.
-- All access via service-role server functions only.
ALTER TABLE public.diamond_media ENABLE ROW LEVEL SECURITY;
-- Phase 1A: atomic hold and status transition RPCs.
--
-- TWO FUNCTIONS in this migration:
--   transition_diamond_status  handles all status changes including placing /
--     releasing holds, progressing to reserved/sold, and archiving. Also
--     atomically resolves expired holds when a new action is requested.
--   extend_diamond_hold  dedicated extension path; preserves original held_at;
--     enforces per-role duration limits anchored to that timestamp.
--
-- SECURITY MODEL (both functions):
--   SECURITY DEFINER, SET search_path = '': runs with definer privileges,
--     immune to search_path manipulation.
--   EXECUTE revoked from PUBLIC (covers anon + authenticated): PostgREST
--     cannot expose either function via /rpc/.
--   GRANT EXECUTE TO service_role only: callable exclusively from the
--     server-side admin client (import 'server-only').
--
-- CALLER INTEGRITY (enforced in T3 server wrappers, documented here):
--   p_actor_id MUST be resolved from requireStaffRole() on the server.
--   It MUST NOT be accepted from form data, route parameters, URL params,
--   or any other browser-controlled input. The server wrapper calls
--   requireStaffRole() first; only on success does it pass user.id as
--   p_actor_id to the RPC.
--
-- ATOMICITY:
--   Each function acquires FOR UPDATE on the target row before any check or
--   write. All checks, the UPDATE, and every audit INSERT execute in one
--   transaction. A raised exception rolls back the entire transaction and
--   leaves the diamond row unchanged.

-- =============================================================================
-- FUNCTION 1: transition_diamond_status
-- =============================================================================

CREATE OR REPLACE FUNCTION public.transition_diamond_status(
  p_actor_id        uuid,
  p_diamond_id      uuid,
  p_new_status      public.diamond_status,
  p_hold_expires_at timestamptz DEFAULT NULL,
  p_hold_reason     text        DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_diamond           public.diamonds%ROWTYPE;
  v_actor_roles       text[];
  v_is_super_admin    boolean;
  v_is_buyer          boolean;
  v_is_adviser        boolean;
  v_now               timestamptz            := now();
  v_original_status   public.diamond_status;
  v_effective_status  public.diamond_status;
  v_hold_was_expired  boolean                := false;
  v_expired_held_by   uuid;
  v_expired_at        timestamptz;
  v_expired_reason    text;
  v_audit_event       text;
BEGIN

  -- 1. Resolve actor roles from staff_roles.
  --    Queried inside the function so role state is current at call time.
  SELECT array_agg(sr.role::text) INTO v_actor_roles
  FROM public.staff_roles sr
  WHERE sr.user_id = p_actor_id;

  IF v_actor_roles IS NULL OR array_length(v_actor_roles, 1) IS NULL THEN
    RAISE EXCEPTION 'actor_not_staff' USING ERRCODE = 'P0001';
  END IF;

  v_is_super_admin := 'super_admin'   = ANY(v_actor_roles);
  v_is_buyer       := 'diamond_buyer' = ANY(v_actor_roles);
  v_is_adviser     := 'sales_adviser' = ANY(v_actor_roles);

  -- 2. Lock the target row before any check or write.
  SELECT * INTO v_diamond
  FROM public.diamonds
  WHERE id = p_diamond_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'diamond_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_original_status  := v_diamond.status;
  v_effective_status := v_diamond.status;

  -- 3. Reject terminal sources.
  IF v_original_status = 'sold' THEN
    RAISE EXCEPTION 'diamond_already_sold' USING ERRCODE = 'P0003';
  END IF;
  IF v_original_status = 'removed' THEN
    RAISE EXCEPTION 'diamond_already_removed' USING ERRCODE = 'P0003';
  END IF;

  -- 4. Expired-hold detection.
  --    Runs after FOR UPDATE lock; no other session can modify the row
  --    concurrently. An expired hold is treated as effective status 'available'
  --    for transition purposes. Only 'available', 'on_hold', and 'removed'
  --    are permitted from an expired hold; 'reserved' and 'sold' are blocked
  --    to force explicit expiry resolution before progression.
  IF v_original_status = 'on_hold' AND v_diamond.hold_expires_at <= v_now THEN
    v_hold_was_expired := true;
    v_expired_held_by  := v_diamond.held_by_user_id;
    v_expired_at       := v_diamond.hold_expires_at;
    v_expired_reason   := v_diamond.hold_reason;

    IF p_new_status NOT IN ('available', 'on_hold', 'removed') THEN
      RAISE EXCEPTION
        'expired_hold_must_be_released_first: cannot transition to % from an expired hold; use available or on_hold first',
        p_new_status::text
        USING ERRCODE = 'P0014';
    END IF;

    v_effective_status := 'available';
  END IF;

  -- 5. Same-status guard.
  --    Skipped when the hold was expired and the target is 'available', because
  --    effective status and target both read 'available' but the action is valid:
  --    it atomically expires the hold and confirms the stone as available.
  IF v_effective_status = p_new_status AND NOT v_hold_was_expired THEN
    RAISE EXCEPTION 'already_in_target_status' USING ERRCODE = 'P0004';
  END IF;

  -- 6. Transition matrix and role verification.

  IF p_new_status = 'on_hold' THEN
    -- Source: available (including effective-available from expired hold).
    IF v_effective_status <> 'available' THEN
      RAISE EXCEPTION 'invalid_transition: on_hold requires available source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF NOT (v_is_super_admin OR v_is_buyer OR v_is_adviser) THEN
      RAISE EXCEPTION 'insufficient_role_for_hold' USING ERRCODE = 'P0006';
    END IF;
    IF p_hold_expires_at IS NULL THEN
      RAISE EXCEPTION 'hold_expiry_required' USING ERRCODE = 'P0007';
    END IF;
    IF p_hold_reason IS NULL OR length(trim(p_hold_reason)) = 0 THEN
      RAISE EXCEPTION 'hold_reason_required' USING ERRCODE = 'P0008';
    END IF;
    IF p_hold_expires_at <= v_now THEN
      RAISE EXCEPTION 'hold_expiry_must_be_future' USING ERRCODE = 'P0009';
    END IF;
    -- Duration limits. super_admin checked first; a user may hold multiple roles.
    IF v_is_super_admin THEN
      NULL; -- No cap.
    ELSIF v_is_buyer THEN
      IF p_hold_expires_at > v_now + interval '7 days' THEN
        RAISE EXCEPTION 'hold_exceeds_7_day_buyer_limit' USING ERRCODE = 'P0010';
      END IF;
    ELSIF v_is_adviser THEN
      IF p_hold_expires_at > v_now + interval '48 hours' THEN
        RAISE EXCEPTION 'hold_exceeds_48_hour_adviser_limit' USING ERRCODE = 'P0011';
      END IF;
    END IF;

  ELSIF p_new_status = 'available' THEN
    -- Source: on_hold (live or expired; expired already corrected v_effective_status).
    IF v_original_status <> 'on_hold' THEN
      RAISE EXCEPTION 'invalid_transition: available requires on_hold source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF v_is_super_admin OR v_is_buyer THEN
      NULL; -- May release any hold.
    ELSIF v_is_adviser THEN
      -- Sales adviser may release only their own hold.
      IF v_diamond.held_by_user_id IS DISTINCT FROM p_actor_id THEN
        RAISE EXCEPTION 'cannot_release_others_hold' USING ERRCODE = 'P0012';
      END IF;
    ELSE
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'reserved' THEN
    -- Source: on_hold (live only; expired hold is blocked at step 4).
    IF v_original_status <> 'on_hold' THEN
      RAISE EXCEPTION 'invalid_transition: reserved requires on_hold source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'sold' THEN
    -- Source: reserved only.
    IF v_original_status <> 'reserved' THEN
      RAISE EXCEPTION 'invalid_transition: sold requires reserved source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'removed' THEN
    -- Source: any non-terminal status, including an expired on_hold stone.
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSE
    RAISE EXCEPTION 'unknown_target_status: %', p_new_status::text
      USING ERRCODE = 'P0013';
  END IF;

  -- 7. Write expired-hold audit event first (if applicable).
  --    Even though this INSERT and the status UPDATE share a transaction,
  --    logging the expiry before the new action makes the audit timeline clear.
  IF v_hold_was_expired THEN
    INSERT INTO public.audit_logs (actor_user_id, event, entity_type, entity_id, metadata)
    VALUES (
      p_actor_id,
      'diamond.hold_expired',
      'diamond',
      p_diamond_id,
      jsonb_build_object(
        'original_held_by', v_expired_held_by,
        'hold_expires_at',  v_expired_at,
        'hold_reason',      v_expired_reason,
        'resolved_by',      p_actor_id,
        'resolved_action',  p_new_status::text
      )
    );
  END IF;

  -- 8. Apply the status update.
  IF p_new_status = 'on_hold' THEN
    -- is_visible set to false: a held diamond is not publicly available.
    -- Visibility is never auto-restored after a hold ends; re-publication
    -- requires an explicit visibility update server action.
    UPDATE public.diamonds
    SET
      status          = 'on_hold',
      is_visible      = false,
      held_by_user_id = p_actor_id,
      held_at         = v_now,
      hold_expires_at = p_hold_expires_at,
      hold_reason     = p_hold_reason,
      updated_by      = p_actor_id,
      updated_at      = v_now
    WHERE id = p_diamond_id;

  ELSE
    -- All other transitions: clear hold fields.
    -- is_visible set to false for every non-'available' terminal/progression
    -- status. For 'available' the stone remains invisible until explicitly
    -- re-published; for sold/removed visibility is permanently ended.
    UPDATE public.diamonds
    SET
      status          = p_new_status,
      is_visible      = false,
      held_by_user_id = NULL,
      held_at         = NULL,
      hold_expires_at = NULL,
      hold_reason     = NULL,
      updated_by      = p_actor_id,
      updated_at      = v_now
    WHERE id = p_diamond_id;
  END IF;

  -- 9. Write primary action audit event.
  v_audit_event := CASE p_new_status
    WHEN 'on_hold'   THEN 'diamond.hold_created'
    WHEN 'available' THEN 'diamond.hold_released'
    ELSE                  'diamond.status_changed'
  END;

  INSERT INTO public.audit_logs (actor_user_id, event, entity_type, entity_id, metadata)
  VALUES (
    p_actor_id,
    v_audit_event,
    'diamond',
    p_diamond_id,
    jsonb_build_object(
      'old_status',       v_original_status::text,
      'new_status',       p_new_status::text,
      'hold_expires_at',  p_hold_expires_at,
      'hold_reason',      p_hold_reason,
      'was_expired_hold', v_hold_was_expired
    )
  );

  -- 10. Return role-safe result (no cost or internal fields).
  RETURN jsonb_build_object(
    'id',               p_diamond_id,
    'old_status',       v_original_status::text,
    'new_status',       p_new_status::text,
    'held_at',          CASE WHEN p_new_status = 'on_hold' THEN v_now     ELSE NULL END,
    'hold_expires_at',  CASE WHEN p_new_status = 'on_hold' THEN p_hold_expires_at ELSE NULL END,
    'was_expired_hold', v_hold_was_expired
  );

END;
$$;

-- =============================================================================
-- FUNCTION 2: extend_diamond_hold
-- =============================================================================
-- Dedicated extension path. Status remains 'on_hold'; only hold_expires_at
-- (and optionally hold_reason) changes. Separate from transition_diamond_status
-- because extension is not a status change and has distinct role rules and
-- parameters.
--
-- Duration limits are anchored to the ORIGINAL held_at, not the current time.
-- A sales adviser who placed a hold at T+0 has a ceiling of T+48 h regardless
-- of when they attempt to extend. Same principle applies to diamond_buyer (T+7d).
--
-- p_hold_reason: if non-null and non-empty, replaces the existing reason.
--   If null or blank, the existing hold_reason is preserved.
--   Super admins extending a hold beyond 7 days from original held_at must
--   ensure a reason is present (existing or newly provided).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.extend_diamond_hold(
  p_actor_id       uuid,
  p_diamond_id     uuid,
  p_new_expires_at timestamptz,
  p_hold_reason    text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_diamond          public.diamonds%ROWTYPE;
  v_actor_roles      text[];
  v_is_super_admin   boolean;
  v_is_buyer         boolean;
  v_is_adviser       boolean;
  v_now              timestamptz := now();
  v_final_reason     text;
  v_previous_expires timestamptz;
BEGIN

  -- 1. Resolve actor roles.
  SELECT array_agg(sr.role::text) INTO v_actor_roles
  FROM public.staff_roles sr
  WHERE sr.user_id = p_actor_id;

  IF v_actor_roles IS NULL OR array_length(v_actor_roles, 1) IS NULL THEN
    RAISE EXCEPTION 'actor_not_staff' USING ERRCODE = 'P0001';
  END IF;

  v_is_super_admin := 'super_admin'   = ANY(v_actor_roles);
  v_is_buyer       := 'diamond_buyer' = ANY(v_actor_roles);
  v_is_adviser     := 'sales_adviser' = ANY(v_actor_roles);

  -- 2. Lock the target row.
  SELECT * INTO v_diamond
  FROM public.diamonds
  WHERE id = p_diamond_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'diamond_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Verify the stone is on an active (non-expired) hold.
  IF v_diamond.status <> 'on_hold' THEN
    RAISE EXCEPTION 'diamond_not_on_hold: current status is %', v_diamond.status::text
      USING ERRCODE = 'P0015';
  END IF;
  IF v_diamond.hold_expires_at <= v_now THEN
    RAISE EXCEPTION
      'hold_already_expired: use transition_diamond_status to release or re-hold'
      USING ERRCODE = 'P0016';
  END IF;

  -- 4. New expiry must be strictly later than current expiry and in the future.
  IF p_new_expires_at IS NULL THEN
    RAISE EXCEPTION 'new_expires_at_required' USING ERRCODE = 'P0017';
  END IF;
  IF p_new_expires_at <= v_diamond.hold_expires_at THEN
    RAISE EXCEPTION 'new_expiry_must_exceed_current_expiry' USING ERRCODE = 'P0018';
  END IF;
  IF p_new_expires_at <= v_now THEN
    RAISE EXCEPTION 'new_expiry_must_be_future' USING ERRCODE = 'P0009';
  END IF;

  -- 5. Determine final reason: prefer new if provided and non-empty;
  --    otherwise preserve existing. chk_hold_fields guarantees the existing
  --    reason is non-empty, so v_final_reason will always be non-null here.
  v_final_reason := CASE
    WHEN p_hold_reason IS NOT NULL AND length(trim(p_hold_reason)) > 0
      THEN trim(p_hold_reason)
    ELSE v_diamond.hold_reason
  END;

  -- 6. Role checks and duration limits (anchored to original held_at).
  IF v_is_super_admin THEN
    -- No duration cap. Reason must be present if extending beyond 7 days.
    IF p_new_expires_at > v_diamond.held_at + interval '7 days'
       AND (v_final_reason IS NULL OR length(trim(v_final_reason)) = 0)
    THEN
      RAISE EXCEPTION 'hold_reason_required_for_super_admin_extended_hold'
        USING ERRCODE = 'P0019';
    END IF;

  ELSIF v_is_buyer THEN
    -- Max 7 days from original held_at.
    IF p_new_expires_at > v_diamond.held_at + interval '7 days' THEN
      RAISE EXCEPTION
        'extension_exceeds_7_day_buyer_limit_from_original_held_at'
        USING ERRCODE = 'P0020';
    END IF;

  ELSIF v_is_adviser THEN
    -- Own hold only; max 48 hours from original held_at.
    IF v_diamond.held_by_user_id IS DISTINCT FROM p_actor_id THEN
      RAISE EXCEPTION 'cannot_extend_others_hold' USING ERRCODE = 'P0021';
    END IF;
    IF p_new_expires_at > v_diamond.held_at + interval '48 hours' THEN
      RAISE EXCEPTION
        'extension_exceeds_48_hour_adviser_limit_from_original_held_at'
        USING ERRCODE = 'P0022';
    END IF;

  ELSE
    RAISE EXCEPTION 'insufficient_role_for_hold_extension' USING ERRCODE = 'P0006';
  END IF;

  -- 7. Snapshot previous expiry for audit trail.
  v_previous_expires := v_diamond.hold_expires_at;

  -- 8. Apply extension. held_at is intentionally NOT updated:
  --    duration limits are always anchored to the original hold timestamp.
  UPDATE public.diamonds
  SET
    hold_expires_at = p_new_expires_at,
    hold_reason     = v_final_reason,
    updated_by      = p_actor_id,
    updated_at      = v_now
  WHERE id = p_diamond_id;

  -- 9. Write audit event.
  INSERT INTO public.audit_logs (actor_user_id, event, entity_type, entity_id, metadata)
  VALUES (
    p_actor_id,
    'diamond.hold_extended',
    'diamond',
    p_diamond_id,
    jsonb_build_object(
      'previous_expires_at', v_previous_expires,
      'new_expires_at',      p_new_expires_at,
      'original_held_at',    v_diamond.held_at,
      'held_by_user_id',     v_diamond.held_by_user_id,
      'hold_reason',         v_final_reason
    )
  );

  -- 10. Return role-safe result.
  RETURN jsonb_build_object(
    'id',                  p_diamond_id,
    'previous_expires_at', v_previous_expires,
    'new_expires_at',      p_new_expires_at,
    'original_held_at',    v_diamond.held_at
  );

END;
$$;

-- =============================================================================
-- Access control for both functions
-- =============================================================================
-- Revoke from PUBLIC covers both the 'anon' and 'authenticated' roles.
-- PostgREST will not expose either function via /rpc/.

REVOKE EXECUTE ON FUNCTION public.transition_diamond_status(
  uuid, uuid, public.diamond_status, timestamptz, text
) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.extend_diamond_hold(
  uuid, uuid, timestamptz, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.transition_diamond_status(
  uuid, uuid, public.diamond_status, timestamptz, text
) TO service_role;

GRANT EXECUTE ON FUNCTION public.extend_diamond_hold(
  uuid, uuid, timestamptz, text
) TO service_role;
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
-- Phase 1A correction: re-deploy both hold RPCs with correct audit_logs column name.
--
-- The audit_logs table (migration 0003) uses 'action' as the event-name column.
-- Migration 0008 incorrectly referenced 'event'. This migration re-creates both
-- functions with the correct column name via CREATE OR REPLACE.
-- Migration 0008 on disk has also been corrected for fresh-environment setups.

CREATE OR REPLACE FUNCTION public.transition_diamond_status(
  p_actor_id        uuid,
  p_diamond_id      uuid,
  p_new_status      public.diamond_status,
  p_hold_expires_at timestamptz DEFAULT NULL,
  p_hold_reason     text        DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_diamond           public.diamonds%ROWTYPE;
  v_actor_roles       text[];
  v_is_super_admin    boolean;
  v_is_buyer          boolean;
  v_is_adviser        boolean;
  v_now               timestamptz            := now();
  v_original_status   public.diamond_status;
  v_effective_status  public.diamond_status;
  v_hold_was_expired  boolean                := false;
  v_expired_held_by   uuid;
  v_expired_at        timestamptz;
  v_expired_reason    text;
  v_audit_event       text;
BEGIN

  -- 1. Resolve actor roles from staff_roles.
  SELECT array_agg(sr.role::text) INTO v_actor_roles
  FROM public.staff_roles sr
  WHERE sr.user_id = p_actor_id;

  IF v_actor_roles IS NULL OR array_length(v_actor_roles, 1) IS NULL THEN
    RAISE EXCEPTION 'actor_not_staff' USING ERRCODE = 'P0001';
  END IF;

  v_is_super_admin := 'super_admin'   = ANY(v_actor_roles);
  v_is_buyer       := 'diamond_buyer' = ANY(v_actor_roles);
  v_is_adviser     := 'sales_adviser' = ANY(v_actor_roles);

  -- 2. Lock the target row before any check or write.
  SELECT * INTO v_diamond
  FROM public.diamonds
  WHERE id = p_diamond_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'diamond_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_original_status  := v_diamond.status;
  v_effective_status := v_diamond.status;

  -- 3. Reject terminal sources.
  IF v_original_status = 'sold' THEN
    RAISE EXCEPTION 'diamond_already_sold' USING ERRCODE = 'P0003';
  END IF;
  IF v_original_status = 'removed' THEN
    RAISE EXCEPTION 'diamond_already_removed' USING ERRCODE = 'P0003';
  END IF;

  -- 4. Expired-hold detection.
  IF v_original_status = 'on_hold' AND v_diamond.hold_expires_at <= v_now THEN
    v_hold_was_expired := true;
    v_expired_held_by  := v_diamond.held_by_user_id;
    v_expired_at       := v_diamond.hold_expires_at;
    v_expired_reason   := v_diamond.hold_reason;

    IF p_new_status NOT IN ('available', 'on_hold', 'removed') THEN
      RAISE EXCEPTION
        'expired_hold_must_be_released_first: cannot transition to % from an expired hold; use available or on_hold first',
        p_new_status::text
        USING ERRCODE = 'P0014';
    END IF;

    v_effective_status := 'available';
  END IF;

  -- 5. Same-status guard.
  IF v_effective_status = p_new_status AND NOT v_hold_was_expired THEN
    RAISE EXCEPTION 'already_in_target_status' USING ERRCODE = 'P0004';
  END IF;

  -- 6. Transition matrix and role verification.
  IF p_new_status = 'on_hold' THEN
    IF v_effective_status <> 'available' THEN
      RAISE EXCEPTION 'invalid_transition: on_hold requires available source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF NOT (v_is_super_admin OR v_is_buyer OR v_is_adviser) THEN
      RAISE EXCEPTION 'insufficient_role_for_hold' USING ERRCODE = 'P0006';
    END IF;
    IF p_hold_expires_at IS NULL THEN
      RAISE EXCEPTION 'hold_expiry_required' USING ERRCODE = 'P0007';
    END IF;
    IF p_hold_reason IS NULL OR length(trim(p_hold_reason)) = 0 THEN
      RAISE EXCEPTION 'hold_reason_required' USING ERRCODE = 'P0008';
    END IF;
    IF p_hold_expires_at <= v_now THEN
      RAISE EXCEPTION 'hold_expiry_must_be_future' USING ERRCODE = 'P0009';
    END IF;
    IF v_is_super_admin THEN
      NULL;
    ELSIF v_is_buyer THEN
      IF p_hold_expires_at > v_now + interval '7 days' THEN
        RAISE EXCEPTION 'hold_exceeds_7_day_buyer_limit' USING ERRCODE = 'P0010';
      END IF;
    ELSIF v_is_adviser THEN
      IF p_hold_expires_at > v_now + interval '48 hours' THEN
        RAISE EXCEPTION 'hold_exceeds_48_hour_adviser_limit' USING ERRCODE = 'P0011';
      END IF;
    END IF;

  ELSIF p_new_status = 'available' THEN
    IF v_original_status <> 'on_hold' THEN
      RAISE EXCEPTION 'invalid_transition: available requires on_hold source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF v_is_super_admin OR v_is_buyer THEN
      NULL;
    ELSIF v_is_adviser THEN
      IF v_diamond.held_by_user_id IS DISTINCT FROM p_actor_id THEN
        RAISE EXCEPTION 'cannot_release_others_hold' USING ERRCODE = 'P0012';
      END IF;
    ELSE
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'reserved' THEN
    IF v_original_status <> 'on_hold' THEN
      RAISE EXCEPTION 'invalid_transition: reserved requires on_hold source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'sold' THEN
    IF v_original_status <> 'reserved' THEN
      RAISE EXCEPTION 'invalid_transition: sold requires reserved source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'removed' THEN
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSE
    RAISE EXCEPTION 'unknown_target_status: %', p_new_status::text
      USING ERRCODE = 'P0013';
  END IF;

  -- 7. Write expired-hold audit action (if applicable).
  IF v_hold_was_expired THEN
    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    VALUES (
      p_actor_id,
      'diamond.hold_expired',
      'diamond',
      p_diamond_id,
      jsonb_build_object(
        'original_held_by', v_expired_held_by,
        'hold_expires_at',  v_expired_at,
        'hold_reason',      v_expired_reason,
        'resolved_by',      p_actor_id,
        'resolved_action',  p_new_status::text
      )
    );
  END IF;

  -- 8. Apply the status update.
  IF p_new_status = 'on_hold' THEN
    UPDATE public.diamonds
    SET
      status          = 'on_hold',
      is_visible      = false,
      held_by_user_id = p_actor_id,
      held_at         = v_now,
      hold_expires_at = p_hold_expires_at,
      hold_reason     = p_hold_reason,
      updated_by      = p_actor_id,
      updated_at      = v_now
    WHERE id = p_diamond_id;
  ELSE
    UPDATE public.diamonds
    SET
      status          = p_new_status,
      is_visible      = false,
      held_by_user_id = NULL,
      held_at         = NULL,
      hold_expires_at = NULL,
      hold_reason     = NULL,
      updated_by      = p_actor_id,
      updated_at      = v_now
    WHERE id = p_diamond_id;
  END IF;

  -- 9. Write primary action audit record.
  v_audit_event := CASE p_new_status
    WHEN 'on_hold'   THEN 'diamond.hold_created'
    WHEN 'available' THEN 'diamond.hold_released'
    ELSE                  'diamond.status_changed'
  END;

  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    p_actor_id,
    v_audit_event,
    'diamond',
    p_diamond_id,
    jsonb_build_object(
      'old_status',       v_original_status::text,
      'new_status',       p_new_status::text,
      'hold_expires_at',  p_hold_expires_at,
      'hold_reason',      p_hold_reason,
      'was_expired_hold', v_hold_was_expired
    )
  );

  -- 10. Return role-safe result.
  RETURN jsonb_build_object(
    'id',               p_diamond_id,
    'old_status',       v_original_status::text,
    'new_status',       p_new_status::text,
    'held_at',          CASE WHEN p_new_status = 'on_hold' THEN v_now     ELSE NULL END,
    'hold_expires_at',  CASE WHEN p_new_status = 'on_hold' THEN p_hold_expires_at ELSE NULL END,
    'was_expired_hold', v_hold_was_expired
  );

END;
$$;

CREATE OR REPLACE FUNCTION public.extend_diamond_hold(
  p_actor_id       uuid,
  p_diamond_id     uuid,
  p_new_expires_at timestamptz,
  p_hold_reason    text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_diamond          public.diamonds%ROWTYPE;
  v_actor_roles      text[];
  v_is_super_admin   boolean;
  v_is_buyer         boolean;
  v_is_adviser       boolean;
  v_now              timestamptz := now();
  v_final_reason     text;
  v_previous_expires timestamptz;
BEGIN

  -- 1. Resolve actor roles.
  SELECT array_agg(sr.role::text) INTO v_actor_roles
  FROM public.staff_roles sr
  WHERE sr.user_id = p_actor_id;

  IF v_actor_roles IS NULL OR array_length(v_actor_roles, 1) IS NULL THEN
    RAISE EXCEPTION 'actor_not_staff' USING ERRCODE = 'P0001';
  END IF;

  v_is_super_admin := 'super_admin'   = ANY(v_actor_roles);
  v_is_buyer       := 'diamond_buyer' = ANY(v_actor_roles);
  v_is_adviser     := 'sales_adviser' = ANY(v_actor_roles);

  -- 2. Lock the target row.
  SELECT * INTO v_diamond
  FROM public.diamonds
  WHERE id = p_diamond_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'diamond_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Verify active (non-expired) hold.
  IF v_diamond.status <> 'on_hold' THEN
    RAISE EXCEPTION 'diamond_not_on_hold: current status is %', v_diamond.status::text
      USING ERRCODE = 'P0015';
  END IF;
  IF v_diamond.hold_expires_at <= v_now THEN
    RAISE EXCEPTION
      'hold_already_expired: use transition_diamond_status to release or re-hold'
      USING ERRCODE = 'P0016';
  END IF;

  -- 4. New expiry must exceed current expiry and be in the future.
  IF p_new_expires_at IS NULL THEN
    RAISE EXCEPTION 'new_expires_at_required' USING ERRCODE = 'P0017';
  END IF;
  IF p_new_expires_at <= v_diamond.hold_expires_at THEN
    RAISE EXCEPTION 'new_expiry_must_exceed_current_expiry' USING ERRCODE = 'P0018';
  END IF;
  IF p_new_expires_at <= v_now THEN
    RAISE EXCEPTION 'new_expiry_must_be_future' USING ERRCODE = 'P0009';
  END IF;

  -- 5. Determine final reason.
  v_final_reason := CASE
    WHEN p_hold_reason IS NOT NULL AND length(trim(p_hold_reason)) > 0
      THEN trim(p_hold_reason)
    ELSE v_diamond.hold_reason
  END;

  -- 6. Role checks and duration limits (anchored to original held_at).
  IF v_is_super_admin THEN
    IF p_new_expires_at > v_diamond.held_at + interval '7 days'
       AND (v_final_reason IS NULL OR length(trim(v_final_reason)) = 0)
    THEN
      RAISE EXCEPTION 'hold_reason_required_for_super_admin_extended_hold'
        USING ERRCODE = 'P0019';
    END IF;

  ELSIF v_is_buyer THEN
    IF p_new_expires_at > v_diamond.held_at + interval '7 days' THEN
      RAISE EXCEPTION 'extension_exceeds_7_day_buyer_limit_from_original_held_at'
        USING ERRCODE = 'P0020';
    END IF;

  ELSIF v_is_adviser THEN
    IF v_diamond.held_by_user_id IS DISTINCT FROM p_actor_id THEN
      RAISE EXCEPTION 'cannot_extend_others_hold' USING ERRCODE = 'P0021';
    END IF;
    IF p_new_expires_at > v_diamond.held_at + interval '48 hours' THEN
      RAISE EXCEPTION 'extension_exceeds_48_hour_adviser_limit_from_original_held_at'
        USING ERRCODE = 'P0022';
    END IF;

  ELSE
    RAISE EXCEPTION 'insufficient_role_for_hold_extension' USING ERRCODE = 'P0006';
  END IF;

  -- 7. Snapshot previous expiry.
  v_previous_expires := v_diamond.hold_expires_at;

  -- 8. Apply extension. held_at intentionally NOT updated.
  UPDATE public.diamonds
  SET
    hold_expires_at = p_new_expires_at,
    hold_reason     = v_final_reason,
    updated_by      = p_actor_id,
    updated_at      = v_now
  WHERE id = p_diamond_id;

  -- 9. Write audit record.
  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    p_actor_id,
    'diamond.hold_extended',
    'diamond',
    p_diamond_id,
    jsonb_build_object(
      'previous_expires_at', v_previous_expires,
      'new_expires_at',      p_new_expires_at,
      'original_held_at',    v_diamond.held_at,
      'held_by_user_id',     v_diamond.held_by_user_id,
      'hold_reason',         v_final_reason
    )
  );

  -- 10. Return role-safe result.
  RETURN jsonb_build_object(
    'id',                  p_diamond_id,
    'previous_expires_at', v_previous_expires,
    'new_expires_at',      p_new_expires_at,
    'original_held_at',    v_diamond.held_at
  );

END;
$$;

-- Re-apply access control after CREATE OR REPLACE.
-- CREATE OR REPLACE resets privileges to defaults; revokes must be re-applied.
REVOKE EXECUTE ON FUNCTION public.transition_diamond_status(
  uuid, uuid, public.diamond_status, timestamptz, text
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.transition_diamond_status(
  uuid, uuid, public.diamond_status, timestamptz, text
) FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.extend_diamond_hold(
  uuid, uuid, timestamptz, text
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.extend_diamond_hold(
  uuid, uuid, timestamptz, text
) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.transition_diamond_status(
  uuid, uuid, public.diamond_status, timestamptz, text
) TO service_role;

GRANT EXECUTE ON FUNCTION public.extend_diamond_hold(
  uuid, uuid, timestamptz, text
) TO service_role;
-- Phase 1A correction: fix conflicting ERRCODE in transition_diamond_status.
--
-- ERRCODE 'P0004' was used for 'already_in_target_status' but P0004 is
-- PostgreSQL's reserved SQLSTATE for assert_failure, which is one of two
-- conditions excluded from WHEN OTHERS THEN. Changed to 'P9004' (user-defined
-- class P9, not reserved by PostgreSQL), which is catchable by WHEN OTHERS.
--
-- All other ERRCODEs (P0005–P0022) are technically user-defined too (only
-- P0000–P0004 are reserved by PostgreSQL) and remain catchable by WHEN OTHERS.
-- This migration only changes P0004 to avoid the assert_failure collision.
--
-- Migration 0008 and 0010 on disk are also updated for fresh-setup correctness.

CREATE OR REPLACE FUNCTION public.transition_diamond_status(
  p_actor_id        uuid,
  p_diamond_id      uuid,
  p_new_status      public.diamond_status,
  p_hold_expires_at timestamptz DEFAULT NULL,
  p_hold_reason     text        DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_diamond           public.diamonds%ROWTYPE;
  v_actor_roles       text[];
  v_is_super_admin    boolean;
  v_is_buyer          boolean;
  v_is_adviser        boolean;
  v_now               timestamptz            := now();
  v_original_status   public.diamond_status;
  v_effective_status  public.diamond_status;
  v_hold_was_expired  boolean                := false;
  v_expired_held_by   uuid;
  v_expired_at        timestamptz;
  v_expired_reason    text;
  v_audit_event       text;
BEGIN

  -- 1. Resolve actor roles from staff_roles.
  SELECT array_agg(sr.role::text) INTO v_actor_roles
  FROM public.staff_roles sr
  WHERE sr.user_id = p_actor_id;

  IF v_actor_roles IS NULL OR array_length(v_actor_roles, 1) IS NULL THEN
    RAISE EXCEPTION 'actor_not_staff' USING ERRCODE = 'P0001';
  END IF;

  v_is_super_admin := 'super_admin'   = ANY(v_actor_roles);
  v_is_buyer       := 'diamond_buyer' = ANY(v_actor_roles);
  v_is_adviser     := 'sales_adviser' = ANY(v_actor_roles);

  -- 2. Lock the target row before any check or write.
  SELECT * INTO v_diamond
  FROM public.diamonds
  WHERE id = p_diamond_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'diamond_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_original_status  := v_diamond.status;
  v_effective_status := v_diamond.status;

  -- 3. Reject terminal sources.
  IF v_original_status = 'sold' THEN
    RAISE EXCEPTION 'diamond_already_sold' USING ERRCODE = 'P0003';
  END IF;
  IF v_original_status = 'removed' THEN
    RAISE EXCEPTION 'diamond_already_removed' USING ERRCODE = 'P0003';
  END IF;

  -- 4. Expired-hold detection.
  IF v_original_status = 'on_hold' AND v_diamond.hold_expires_at <= v_now THEN
    v_hold_was_expired := true;
    v_expired_held_by  := v_diamond.held_by_user_id;
    v_expired_at       := v_diamond.hold_expires_at;
    v_expired_reason   := v_diamond.hold_reason;

    IF p_new_status NOT IN ('available', 'on_hold', 'removed') THEN
      RAISE EXCEPTION
        'expired_hold_must_be_released_first: cannot transition to % from an expired hold; use available or on_hold first',
        p_new_status::text
        USING ERRCODE = 'P0014';
    END IF;

    v_effective_status := 'available';
  END IF;

  -- 5. Same-status guard.
  --    P9004 used (not P0004 which conflicts with PostgreSQL assert_failure).
  IF v_effective_status = p_new_status AND NOT v_hold_was_expired THEN
    RAISE EXCEPTION 'already_in_target_status' USING ERRCODE = 'P9004';
  END IF;

  -- 6. Transition matrix and role verification.
  IF p_new_status = 'on_hold' THEN
    IF v_effective_status <> 'available' THEN
      RAISE EXCEPTION 'invalid_transition: on_hold requires available source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF NOT (v_is_super_admin OR v_is_buyer OR v_is_adviser) THEN
      RAISE EXCEPTION 'insufficient_role_for_hold' USING ERRCODE = 'P0006';
    END IF;
    IF p_hold_expires_at IS NULL THEN
      RAISE EXCEPTION 'hold_expiry_required' USING ERRCODE = 'P0007';
    END IF;
    IF p_hold_reason IS NULL OR length(trim(p_hold_reason)) = 0 THEN
      RAISE EXCEPTION 'hold_reason_required' USING ERRCODE = 'P0008';
    END IF;
    IF p_hold_expires_at <= v_now THEN
      RAISE EXCEPTION 'hold_expiry_must_be_future' USING ERRCODE = 'P0009';
    END IF;
    IF v_is_super_admin THEN
      NULL;
    ELSIF v_is_buyer THEN
      IF p_hold_expires_at > v_now + interval '7 days' THEN
        RAISE EXCEPTION 'hold_exceeds_7_day_buyer_limit' USING ERRCODE = 'P0010';
      END IF;
    ELSIF v_is_adviser THEN
      IF p_hold_expires_at > v_now + interval '48 hours' THEN
        RAISE EXCEPTION 'hold_exceeds_48_hour_adviser_limit' USING ERRCODE = 'P0011';
      END IF;
    END IF;

  ELSIF p_new_status = 'available' THEN
    IF v_original_status <> 'on_hold' THEN
      RAISE EXCEPTION 'invalid_transition: available requires on_hold source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF v_is_super_admin OR v_is_buyer THEN
      NULL;
    ELSIF v_is_adviser THEN
      IF v_diamond.held_by_user_id IS DISTINCT FROM p_actor_id THEN
        RAISE EXCEPTION 'cannot_release_others_hold' USING ERRCODE = 'P0012';
      END IF;
    ELSE
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'reserved' THEN
    IF v_original_status <> 'on_hold' THEN
      RAISE EXCEPTION 'invalid_transition: reserved requires on_hold source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'sold' THEN
    IF v_original_status <> 'reserved' THEN
      RAISE EXCEPTION 'invalid_transition: sold requires reserved source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'removed' THEN
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSE
    RAISE EXCEPTION 'unknown_target_status: %', p_new_status::text
      USING ERRCODE = 'P0013';
  END IF;

  -- 7. Write expired-hold audit action (if applicable).
  IF v_hold_was_expired THEN
    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
    VALUES (
      p_actor_id,
      'diamond.hold_expired',
      'diamond',
      p_diamond_id,
      jsonb_build_object(
        'original_held_by', v_expired_held_by,
        'hold_expires_at',  v_expired_at,
        'hold_reason',      v_expired_reason,
        'resolved_by',      p_actor_id,
        'resolved_action',  p_new_status::text
      )
    );
  END IF;

  -- 8. Apply the status update.
  IF p_new_status = 'on_hold' THEN
    UPDATE public.diamonds
    SET
      status          = 'on_hold',
      is_visible      = false,
      held_by_user_id = p_actor_id,
      held_at         = v_now,
      hold_expires_at = p_hold_expires_at,
      hold_reason     = p_hold_reason,
      updated_by      = p_actor_id,
      updated_at      = v_now
    WHERE id = p_diamond_id;
  ELSE
    UPDATE public.diamonds
    SET
      status          = p_new_status,
      is_visible      = false,
      held_by_user_id = NULL,
      held_at         = NULL,
      hold_expires_at = NULL,
      hold_reason     = NULL,
      updated_by      = p_actor_id,
      updated_at      = v_now
    WHERE id = p_diamond_id;
  END IF;

  -- 9. Write primary action audit record.
  v_audit_event := CASE p_new_status
    WHEN 'on_hold'   THEN 'diamond.hold_created'
    WHEN 'available' THEN 'diamond.hold_released'
    ELSE                  'diamond.status_changed'
  END;

  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    p_actor_id,
    v_audit_event,
    'diamond',
    p_diamond_id,
    jsonb_build_object(
      'old_status',       v_original_status::text,
      'new_status',       p_new_status::text,
      'hold_expires_at',  p_hold_expires_at,
      'hold_reason',      p_hold_reason,
      'was_expired_hold', v_hold_was_expired
    )
  );

  -- 10. Return role-safe result.
  RETURN jsonb_build_object(
    'id',               p_diamond_id,
    'old_status',       v_original_status::text,
    'new_status',       p_new_status::text,
    'held_at',          CASE WHEN p_new_status = 'on_hold' THEN v_now     ELSE NULL END,
    'hold_expires_at',  CASE WHEN p_new_status = 'on_hold' THEN p_hold_expires_at ELSE NULL END,
    'was_expired_hold', v_hold_was_expired
  );

END;
$$;

-- Re-apply access control after CREATE OR REPLACE.
REVOKE EXECUTE ON FUNCTION public.transition_diamond_status(
  uuid, uuid, public.diamond_status, timestamptz, text
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.transition_diamond_status(
  uuid, uuid, public.diamond_status, timestamptz, text
) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_diamond_status(
  uuid, uuid, public.diamond_status, timestamptz, text
) TO service_role;
-- Migration 0013: Replace global SKU sequence with per-year advisory-locked counter.
--
-- Migration 0006 created generate_diamond_sku() (SECURITY INVOKER) using a global
-- non-resetting sequence (diamonds_sku_seq) with 4-digit padding:
--   EGD-{YYYY}-{NNNN}
--
-- This migration replaces it with a per-year counter table for the format:
--   EGD-YYYY-000001
-- (6-digit, zero-padded, resets each calendar year)
--
-- The pg_advisory_xact_lock on (hashtext('diamond_sku_'), year) serialises
-- concurrent inserts within the same year, closing the race window on the
-- first insert of a year (before the counter row exists).
--
-- IMPORTANT: This file drops trg_diamonds_generate_sku and generate_diamond_sku()
-- from migration 0006. Do NOT modify migration 0006 — this file is the correct
-- vehicle for the replacement.

-- Step 1: Remove the old trigger (must be dropped before the function it references).
DROP TRIGGER IF EXISTS trg_diamonds_generate_sku ON public.diamonds;

-- Step 2: Remove the old function.
DROP FUNCTION IF EXISTS public.generate_diamond_sku();

-- Step 3: Remove the now-unused global sequence.
DROP SEQUENCE IF EXISTS public.diamonds_sku_seq;

-- Step 4: Counter table — one row per calendar year, incremented on each insert.
-- No RLS: written exclusively by the SECURITY DEFINER trigger function below.
CREATE TABLE public.diamond_sku_counters (
  year         INTEGER PRIMARY KEY,
  last_counter INTEGER NOT NULL DEFAULT 0
);

-- Step 5: Replacement trigger function.
-- SECURITY DEFINER: runs as the function owner (postgres) regardless of calling role,
--   ensuring consistent write access to diamond_sku_counters.
-- SET search_path = public: prevents search-path injection on SECURITY DEFINER functions.
CREATE OR REPLACE FUNCTION public.assign_diamond_sku()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year    INTEGER;
  v_counter INTEGER;
BEGIN
  -- Idempotency guard: if SKU already set (e.g. data seeding), leave it unchanged.
  IF NEW.sku IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_year := EXTRACT(YEAR FROM NOW())::INTEGER;

  -- Serialise concurrent inserts within the same year.
  -- pg_advisory_xact_lock(int4, int4) acquires a transaction-scoped advisory lock,
  -- released automatically when the inserting transaction commits or rolls back.
  -- Key1 = hashtext('diamond_sku_'), Key2 = year — one distinct lock namespace per year.
  PERFORM pg_advisory_xact_lock(hashtext('diamond_sku_')::integer, v_year::integer);

  -- Atomically increment (or initialise) the counter for this year.
  INSERT INTO public.diamond_sku_counters (year, last_counter)
  VALUES (v_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_counter = public.diamond_sku_counters.last_counter + 1
  RETURNING last_counter INTO v_counter;

  NEW.sku := 'EGD-' || v_year::TEXT || '-' || LPAD(v_counter::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

-- Step 6: Attach the replacement trigger.
-- BEFORE INSERT: NEW.sku is set before the NOT NULL constraint is evaluated,
--   so diamonds.sku remains NOT NULL without requiring a column default.
CREATE TRIGGER trg_assign_diamond_sku
  BEFORE INSERT ON public.diamonds
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_diamond_sku();
-- Migration 0014: Harden SKU generation applied in 0013.
--
-- Changes:
--   A. Add BEFORE UPDATE trigger to enforce diamond SKU immutability at DB level.
--   B. Enable RLS on diamond_sku_counters and revoke direct browser-role access.
--   C. Fix year extraction to be explicit UTC (was implicitly session-timezone-dependent).
--   D. Explicitly revoke EXECUTE on SKU functions from browser roles.
--
-- All changes are additive. Migration 0013 is not modified.

-- ── A. Enforce SKU immutability on UPDATE ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.reject_diamond_sku_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sku IS DISTINCT FROM OLD.sku THEN
    RAISE EXCEPTION 'diamond SKU is immutable'
      USING ERRCODE = 'P9005';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reject_diamond_sku_change
  BEFORE UPDATE ON public.diamonds
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_diamond_sku_change();

-- ── B. Protect diamond_sku_counters from browser roles ───────────────────────

ALTER TABLE public.diamond_sku_counters ENABLE ROW LEVEL SECURITY;

-- Remove all default privileges granted by Supabase bootstrap to browser roles.
-- No policies are added — the table must be wholly unreachable from anon/authenticated.
REVOKE ALL ON TABLE public.diamond_sku_counters
  FROM anon, authenticated;

-- ── C. Fix year extraction to explicit UTC in assign_diamond_sku ─────────────
-- CREATE OR REPLACE: updates the function body in place without touching the
-- trigger binding (trg_assign_diamond_sku created in 0013 is preserved).

CREATE OR REPLACE FUNCTION public.assign_diamond_sku()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year    INTEGER;
  v_counter INTEGER;
BEGIN
  -- Idempotency guard: if SKU already set (e.g. data seeding), leave it unchanged.
  IF NEW.sku IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Explicit UTC year — avoids session-timezone drift near year boundaries.
  v_year := EXTRACT(
    YEAR FROM (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
  )::INTEGER;

  -- Serialise concurrent inserts within the same year.
  PERFORM pg_advisory_xact_lock(hashtext('diamond_sku_')::integer, v_year::integer);

  -- Atomically increment (or initialise) the counter for this year.
  INSERT INTO public.diamond_sku_counters (year, last_counter)
  VALUES (v_year, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_counter = public.diamond_sku_counters.last_counter + 1
  RETURNING last_counter INTO v_counter;

  NEW.sku := 'EGD-' || v_year::TEXT || '-' || LPAD(v_counter::TEXT, 6, '0');
  RETURN NEW;
END;
$$;

-- ── D. Revoke EXECUTE on SKU functions from browser roles ────────────────────
-- Supabase bootstraps grant EXECUTE to PUBLIC by default; retract that here.

REVOKE ALL ON FUNCTION public.assign_diamond_sku()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.assign_diamond_sku()
  TO postgres, service_role;

REVOKE ALL ON FUNCTION public.reject_diamond_sku_change()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reject_diamond_sku_change()
  TO postgres, service_role;
-- =============================================================================
-- 0015: Phase 2 tables
--   ring_settings, ring_setting_media
--   jewellery_products, jewellery_product_media
--   hero_media
--   enquiries
--   orders
-- =============================================================================

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metal_type') THEN
    CREATE TYPE public.metal_type AS ENUM (
      'platinum', 'white_gold_18k', 'yellow_gold_18k', 'rose_gold_18k',
      'white_gold_9k', 'yellow_gold_9k', 'rose_gold_9k'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jewellery_category') THEN
    CREATE TYPE public.jewellery_category AS ENUM (
      'earrings', 'necklaces', 'bracelets', 'rings'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enquiry_status') THEN
    CREATE TYPE public.enquiry_status AS ENUM (
      'new', 'in_progress', 'quoted', 'closed_won', 'closed_lost'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM (
      'pending', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled', 'refunded'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hero_placement') THEN
    CREATE TYPE public.hero_placement AS ENUM (
      'homepage', 'engagement-rings', 'earrings', 'necklaces', 'bracelets'
    );
  END IF;
END $$;

-- ── Helper: is_staff() for RLS ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_staff()
  RETURNS boolean
  LANGUAGE sql
  SECURITY INVOKER
  STABLE
  SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_roles
    WHERE user_id = auth.uid()
  );
$$;

-- =============================================================================
-- RING SETTINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ring_settings (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text          NOT NULL,
  slug            text          NOT NULL UNIQUE,
  collection      text,
  description     text,
  metals          public.metal_type[]  NOT NULL DEFAULT '{}',
  base_price_gbp  numeric(10,2),
  is_published    boolean       NOT NULL DEFAULT false,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_ring_settings_updated_at
  BEFORE UPDATE ON public.ring_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ring_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ring_settings: public read published"
  ON public.ring_settings FOR SELECT
  USING (is_published = true);

CREATE POLICY "ring_settings: staff full access"
  ON public.ring_settings FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ── Ring setting media ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ring_setting_media (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ring_setting_id uuid        NOT NULL REFERENCES public.ring_settings(id) ON DELETE CASCADE,
  storage_path    text        NOT NULL,
  display_order   integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ring_setting_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ring_setting_media: public read via published ring"
  ON public.ring_setting_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ring_settings rs
    WHERE rs.id = ring_setting_id AND rs.is_published = true
  ));

CREATE POLICY "ring_setting_media: staff full access"
  ON public.ring_setting_media FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- JEWELLERY PRODUCTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.jewellery_products (
  id              uuid                        PRIMARY KEY DEFAULT gen_random_uuid(),
  category        public.jewellery_category   NOT NULL,
  name            text                        NOT NULL,
  slug            text                        NOT NULL,
  subtitle        text,
  description     text,
  metals          public.metal_type[]         NOT NULL DEFAULT '{}',
  base_price_gbp  numeric(10,2)               NOT NULL,
  show_diamond    boolean                     NOT NULL DEFAULT false,
  is_total_carat  boolean                     NOT NULL DEFAULT false,
  is_pair         boolean                     NOT NULL DEFAULT false,
  is_published    boolean                     NOT NULL DEFAULT false,
  created_at      timestamptz                 NOT NULL DEFAULT now(),
  updated_at      timestamptz                 NOT NULL DEFAULT now(),
  UNIQUE (category, slug)
);

CREATE TRIGGER trg_jewellery_products_updated_at
  BEFORE UPDATE ON public.jewellery_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.jewellery_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jewellery_products: public read published"
  ON public.jewellery_products FOR SELECT
  USING (is_published = true);

CREATE POLICY "jewellery_products: staff full access"
  ON public.jewellery_products FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ── Jewellery product media ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.jewellery_product_media (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  jewellery_product_id  uuid        NOT NULL REFERENCES public.jewellery_products(id) ON DELETE CASCADE,
  storage_path          text        NOT NULL,
  display_order         integer     NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jewellery_product_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jewellery_product_media: public read via published product"
  ON public.jewellery_product_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.jewellery_products jp
    WHERE jp.id = jewellery_product_id AND jp.is_published = true
  ));

CREATE POLICY "jewellery_product_media: staff full access"
  ON public.jewellery_product_media FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- HERO MEDIA
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hero_media (
  id            uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  placement     public.hero_placement NOT NULL,
  storage_path  text                  NOT NULL,
  headline      text,
  subheadline   text,
  is_published  boolean               NOT NULL DEFAULT false,
  created_at    timestamptz           NOT NULL DEFAULT now(),
  updated_at    timestamptz           NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_hero_media_updated_at
  BEFORE UPDATE ON public.hero_media
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.hero_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hero_media: public read published"
  ON public.hero_media FOR SELECT
  USING (is_published = true);

CREATE POLICY "hero_media: staff full access"
  ON public.hero_media FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- ENQUIRIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.enquiries (
  id                  uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name       text                    NOT NULL,
  customer_email      text                    NOT NULL,
  customer_phone      text,
  subject             text,
  message             text                    NOT NULL,
  status              public.enquiry_status   NOT NULL DEFAULT 'new',
  linked_diamond_id   uuid                    REFERENCES public.diamonds(id) ON DELETE SET NULL,
  linked_ring_id      uuid                    REFERENCES public.ring_settings(id) ON DELETE SET NULL,
  internal_notes      text,
  created_at          timestamptz             NOT NULL DEFAULT now(),
  updated_at          timestamptz             NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_enquiries_updated_at
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_enquiries_status     ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at DESC);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enquiries: staff full access"
  ON public.enquiries FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- ORDERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id                  uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name       text                  NOT NULL,
  customer_email      text                  NOT NULL,
  customer_phone      text,
  ring_setting_id     uuid                  REFERENCES public.ring_settings(id) ON DELETE SET NULL,
  diamond_id          uuid                  REFERENCES public.diamonds(id) ON DELETE SET NULL,
  total_gbp           numeric(10,2)         NOT NULL,
  status              public.order_status   NOT NULL DEFAULT 'pending',
  stripe_session_id   text,
  notes               text,
  created_at          timestamptz           NOT NULL DEFAULT now(),
  updated_at          timestamptz           NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders: staff full access"
  ON public.orders FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());
