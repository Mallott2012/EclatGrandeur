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
