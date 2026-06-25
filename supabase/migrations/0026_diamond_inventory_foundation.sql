-- ─────────────────────────────────────────────────────────────────────────────
-- 0026_diamond_inventory_foundation.sql
--
-- Phase 2: Diamond Inventory Foundation.
-- Adds coloured-diamond identity fields and Éclat approval workflow to the
-- diamonds table. No hold fields. No public RLS changes.
--
-- Depends on: 0019 (diamonds table exists), 0024/0025 (auth.users accessible).
--
-- Adds:
--   diamonds.diamond_category    TEXT NOT NULL DEFAULT 'white'
--   diamonds.colour_family       TEXT nullable, CHECK ('yellow','pink')
--   diamonds.colour_intensity    TEXT nullable, CHECK (four intensities)
--   diamonds.colour_description  TEXT nullable
--   diamonds.eclat_approved      BOOLEAN NOT NULL DEFAULT false
--   diamonds.eclat_approved_at   TIMESTAMPTZ nullable
--   diamonds.eclat_approved_by   UUID nullable, FK → auth.users ON DELETE SET NULL
--   diamonds.eclat_approval_note TEXT nullable
--
-- Creates:
--   public.invalidate_eclat_approval()  trigger function
--   trg_invalidate_eclat_approval       BEFORE UPDATE trigger
--
-- Idempotency: ADD COLUMN IF NOT EXISTS; CREATE OR REPLACE FUNCTION;
--   DROP TRIGGER IF EXISTS / CREATE TRIGGER.
--
-- Existing diamonds default to diamond_category='white', eclat_approved=false.
-- No existing data is modified. Existing public RLS policy unchanged.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Coloured-diamond identity columns ────────────────────────────────────────

ALTER TABLE public.diamonds
  ADD COLUMN IF NOT EXISTS diamond_category TEXT
    NOT NULL DEFAULT 'white'
    CHECK (diamond_category IN ('white', 'coloured')),

  ADD COLUMN IF NOT EXISTS colour_family TEXT
    CHECK (colour_family IS NULL OR colour_family IN ('yellow', 'pink')),

  ADD COLUMN IF NOT EXISTS colour_intensity TEXT
    CHECK (
      colour_intensity IS NULL OR
      colour_intensity IN ('fancy_light', 'fancy', 'fancy_intense', 'fancy_vivid')
    ),

  ADD COLUMN IF NOT EXISTS colour_description TEXT;


-- ── 2. Éclat approval columns ────────────────────────────────────────────────────

ALTER TABLE public.diamonds
  ADD COLUMN IF NOT EXISTS eclat_approved      BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS eclat_approved_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eclat_approved_by   UUID
                              REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS eclat_approval_note TEXT;


-- ── 3. Approval auto-invalidation trigger ────────────────────────────────────────
--
-- Fires BEFORE UPDATE on diamonds. Clears approval fields whenever any field
-- that affects suitability or identity changes.
--
-- Fields that DO reset approval (any change triggers reset):
--   cut, diamond_category, colour_family, colour_intensity, colour_description,
--   carat, colour, clarity, cut_grade, polish, symmetry, fluorescence,
--   gia_report_number, measurement_length, measurement_width, measurement_depth,
--   depth_pct, table_pct.
--
-- Fields that do NOT reset approval:
--   price_gbp, status, is_published, notes, gia_report_date, gia_report_url,
--   media, updated_by, updated_at — any field not in the list above.
--
-- Setting eclat_approved=true in an UPDATE that also changes no qualifying
-- field does NOT trigger a reset. Admin must set approval in a separate
-- UPDATE after the grade/identity fields are finalised.

CREATE OR REPLACE FUNCTION public.invalidate_eclat_approval()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
BEGIN
  IF (
    NEW.cut                IS DISTINCT FROM OLD.cut                OR
    NEW.diamond_category   IS DISTINCT FROM OLD.diamond_category   OR
    NEW.colour_family      IS DISTINCT FROM OLD.colour_family      OR
    NEW.colour_intensity   IS DISTINCT FROM OLD.colour_intensity   OR
    NEW.colour_description IS DISTINCT FROM OLD.colour_description OR
    NEW.carat              IS DISTINCT FROM OLD.carat              OR
    NEW.colour             IS DISTINCT FROM OLD.colour             OR
    NEW.clarity            IS DISTINCT FROM OLD.clarity            OR
    NEW.cut_grade          IS DISTINCT FROM OLD.cut_grade          OR
    NEW.polish             IS DISTINCT FROM OLD.polish             OR
    NEW.symmetry           IS DISTINCT FROM OLD.symmetry           OR
    NEW.fluorescence       IS DISTINCT FROM OLD.fluorescence       OR
    NEW.gia_report_number  IS DISTINCT FROM OLD.gia_report_number  OR
    NEW.measurement_length IS DISTINCT FROM OLD.measurement_length OR
    NEW.measurement_width  IS DISTINCT FROM OLD.measurement_width  OR
    NEW.measurement_depth  IS DISTINCT FROM OLD.measurement_depth  OR
    NEW.depth_pct          IS DISTINCT FROM OLD.depth_pct          OR
    NEW.table_pct          IS DISTINCT FROM OLD.table_pct
  ) THEN
    NEW.eclat_approved      := false;
    NEW.eclat_approved_at   := NULL;
    NEW.eclat_approved_by   := NULL;
    NEW.eclat_approval_note := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invalidate_eclat_approval ON public.diamonds;
CREATE TRIGGER trg_invalidate_eclat_approval
  BEFORE UPDATE ON public.diamonds
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_eclat_approval();
