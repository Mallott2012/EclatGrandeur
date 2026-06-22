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
