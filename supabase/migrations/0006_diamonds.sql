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
