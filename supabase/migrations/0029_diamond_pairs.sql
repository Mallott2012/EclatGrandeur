-- ─────────────────────────────────────────────────────────────────────────────
-- 0029_diamond_pairs.sql
--
-- Phase E1: Matched Diamond Pair inventory.
--
-- Introduces diamond_pairs — a reusable, pair-level inventory unit that
-- groups exactly two diamonds for sale/reservation together.
-- Earrings (and future jewellery) select from this table; customers never
-- choose a left diamond and a right diamond independently.
--
-- Depends on: 0019 (diamonds table in customer-catalogue form), 0027 (status,
--   held_until, held_by_cart pattern established for single diamonds).
--
-- Creates:
--   public.diamond_pairs_sku_seq          sequence
--   public.generate_pair_sku()            trigger function
--   public.check_pair_diamond_uniqueness() trigger function (uniqueness guard)
--   public.diamond_pairs                  table
--
-- Invariants enforced at database level:
--   1. A pair must contain two distinct diamonds (chk_pair_distinct_diamonds).
--   2. Neither diamond may appear in two active (non-sold) pairs
--      (trg_check_pair_diamond_uniqueness — trigger, not a partial unique index,
--       because the constraint spans two separate FK columns in both directions).
--   3. Status is restricted to the same values used by individual diamonds.
--   4. FKs to diamonds use ON DELETE RESTRICT — a diamond cannot be deleted
--      while it is a member of any pair.
--   5. pair_price_gbp and total_carat must be positive.
--
-- Idempotency: CREATE IF NOT EXISTS / CREATE OR REPLACE throughout.
-- Forward-only. No existing tables modified. No data migration.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. SKU sequence ───────────────────────────────────────────────────────────
--
-- Format: EGP-{YYYY}-{NNNN}
-- EGP = Éclat Grandeur Pair. Sequence is global and non-resetting.

CREATE SEQUENCE IF NOT EXISTS public.diamond_pairs_sku_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_pair_sku()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
BEGIN
  IF NEW.pair_sku IS NULL OR NEW.pair_sku = '' THEN
    NEW.pair_sku := 'EGP-'
      || to_char(now(), 'YYYY')
      || '-'
      || lpad(nextval('public.diamond_pairs_sku_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;


-- ── 2. Uniqueness guard ───────────────────────────────────────────────────────
--
-- Prevents the same diamond from appearing in two active pairs.
-- A pair is "active" when status != 'sold'.
--
-- Cannot be expressed as a standard UNIQUE index because the constraint must
-- be checked in both column directions (diamond_id_a and diamond_id_b) across
-- all rows in the table, not just within a single column.
--
-- Fires BEFORE INSERT and BEFORE UPDATE.
-- On INSERT: scans all existing rows.
-- On UPDATE: scans all rows except the current row being updated.

CREATE OR REPLACE FUNCTION public.check_pair_diamond_uniqueness()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
DECLARE
  conflict_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT p.id INTO conflict_id
    FROM public.diamond_pairs p
    WHERE p.status != 'sold'
      AND (
        p.diamond_id_a = NEW.diamond_id_a OR
        p.diamond_id_b = NEW.diamond_id_a OR
        p.diamond_id_a = NEW.diamond_id_b OR
        p.diamond_id_b = NEW.diamond_id_b
      )
    LIMIT 1;

  ELSIF TG_OP = 'UPDATE' AND (
    NEW.diamond_id_a IS DISTINCT FROM OLD.diamond_id_a OR
    NEW.diamond_id_b IS DISTINCT FROM OLD.diamond_id_b OR
    (NEW.status IS DISTINCT FROM OLD.status AND NEW.status != 'sold')
  ) THEN
    SELECT p.id INTO conflict_id
    FROM public.diamond_pairs p
    WHERE p.id != NEW.id
      AND p.status != 'sold'
      AND (
        p.diamond_id_a = NEW.diamond_id_a OR
        p.diamond_id_b = NEW.diamond_id_a OR
        p.diamond_id_a = NEW.diamond_id_b OR
        p.diamond_id_b = NEW.diamond_id_b
      )
    LIMIT 1;
  END IF;

  IF conflict_id IS NOT NULL THEN
    RAISE EXCEPTION
      'pair_diamond_conflict: one or both diamonds already belong to an active pair (%)',
      conflict_id
    USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$;


-- ── 3. diamond_pairs table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.diamond_pairs (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_sku        text          NOT NULL,

  -- The two constituent stones. FK ON DELETE RESTRICT prevents deleting a
  -- diamond while it is a member of any pair (active or sold).
  diamond_id_a    uuid          NOT NULL REFERENCES public.diamonds(id) ON DELETE RESTRICT,
  diamond_id_b    uuid          NOT NULL REFERENCES public.diamonds(id) ON DELETE RESTRICT,

  -- Pair-level catalogue identity.
  -- These represent the customer-facing specification; slight matching
  -- tolerances between the two stones are recorded in matching_notes only.
  shape               text      NOT NULL,
  diamond_category    text      NOT NULL
                        CHECK (diamond_category IN ('white', 'coloured')),
  colour_family       text
                        CHECK (colour_family IS NULL OR colour_family IN ('yellow', 'pink')),
  colour              text,             -- representative grade, e.g. 'G'
  clarity             text,             -- representative grade, e.g. 'VS1'
  colour_intensity    text
                        CHECK (colour_intensity IS NULL OR
                               colour_intensity IN ('fancy_light','fancy','fancy_intense','fancy_vivid')),
  colour_description  text,

  -- Carat
  total_carat         numeric(8,3) NOT NULL CHECK (total_carat > 0),
  carat_per_stone     numeric(8,3),     -- NULL when the two stones differ meaningfully

  -- Pricing — the pair price, not the sum of individual stone prices
  pair_price_gbp      numeric(12,2) NOT NULL CHECK (pair_price_gbp > 0),

  -- Inventory state — mirrors the pattern used by individual diamonds
  status              text NOT NULL DEFAULT 'available'
                        CHECK (status IN ('available', 'reserved', 'sold')),
  is_published        boolean NOT NULL DEFAULT false,

  -- Reservation — same cart-token ownership model as individual diamonds
  held_until          timestamptz,
  held_by_cart        text,

  -- Internal matching notes — never exposed in public API responses
  matching_notes      text,

  -- Audit
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- A pair cannot reference the same diamond twice
  CONSTRAINT chk_pair_distinct_diamonds CHECK (diamond_id_a <> diamond_id_b),

  -- SKU must be unique
  CONSTRAINT uq_diamond_pairs_sku UNIQUE (pair_sku)
);


-- ── 4. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_diamond_pairs_status
  ON public.diamond_pairs (status);

CREATE INDEX IF NOT EXISTS idx_diamond_pairs_diamond_a
  ON public.diamond_pairs (diamond_id_a);

CREATE INDEX IF NOT EXISTS idx_diamond_pairs_diamond_b
  ON public.diamond_pairs (diamond_id_b);

CREATE INDEX IF NOT EXISTS idx_diamond_pairs_shape
  ON public.diamond_pairs (shape);

CREATE INDEX IF NOT EXISTS idx_diamond_pairs_category
  ON public.diamond_pairs (diamond_category, colour_family);

CREATE INDEX IF NOT EXISTS idx_diamond_pairs_held_until
  ON public.diamond_pairs (held_until)
  WHERE held_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_diamond_pairs_published
  ON public.diamond_pairs (is_published, status);


-- ── 5. Triggers ───────────────────────────────────────────────────────────────

-- Auto-generate pair_sku on INSERT if not supplied
DROP TRIGGER IF EXISTS trg_diamond_pairs_generate_sku ON public.diamond_pairs;
CREATE TRIGGER trg_diamond_pairs_generate_sku
  BEFORE INSERT ON public.diamond_pairs
  FOR EACH ROW EXECUTE FUNCTION public.generate_pair_sku();

-- Maintain updated_at timestamp
DROP TRIGGER IF EXISTS trg_diamond_pairs_updated_at ON public.diamond_pairs;
CREATE TRIGGER trg_diamond_pairs_updated_at
  BEFORE UPDATE ON public.diamond_pairs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Prevent a diamond from appearing in two active pairs
DROP TRIGGER IF EXISTS trg_check_pair_diamond_uniqueness ON public.diamond_pairs;
CREATE TRIGGER trg_check_pair_diamond_uniqueness
  BEFORE INSERT OR UPDATE ON public.diamond_pairs
  FOR EACH ROW EXECUTE FUNCTION public.check_pair_diamond_uniqueness();


-- ── 6. Row Level Security ─────────────────────────────────────────────────────
--
-- All reads and writes via service-role admin client only (same pattern as
-- diamonds). Public RLS policies added when customer-facing APIs are wired.

ALTER TABLE public.diamond_pairs ENABLE ROW LEVEL SECURITY;


-- ── 7. Grants ─────────────────────────────────────────────────────────────────

GRANT SELECT ON public.diamond_pairs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.diamond_pairs TO service_role;
GRANT USAGE ON SEQUENCE public.diamond_pairs_sku_seq TO service_role;

COMMENT ON TABLE public.diamond_pairs IS
  'Matched diamond pairs for earrings and future jewellery. Each pair is a single inventory and reservation unit — customers never select individual members.';
