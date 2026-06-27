-- ─────────────────────────────────────────────────────────────────────────────
-- 0034_earring_variants.sql
--
-- DORMANT / RESERVED — NOT the active earring model.
--
-- This table was applied to the canonical database during an earlier, since-
-- reversed direction. The ACTIVE earring architecture is the matched-pair model
-- (diamond_pairs + jewellery_stone_slots, migrations 0029–0033), driven by a
-- setting/style-led configurator: the customer selects metal/cut/colour/clarity/
-- total-carat, then chooses a real curated matched pair.
--
-- This migration is intentionally RETAINED, empty and dormant, to preserve
-- migration-history integrity (the table is applied in the DB). No active
-- application code reads earring_variants. Do not drop it without an explicit
-- forward migration decision.
--
-- jewellery_products.earring_type (added by 0033) is the product classification
-- (classic_studs, halo_studs, drop_earrings, pave_hoops, fixed_composition, other).
--
-- Creates:
--   public.earring_variants_sku_seq     sequence
--   public.generate_earring_variant_sku() trigger function
--   public.earring_variants             table
--   public.claim_earring_variant(uuid, text, timestamptz)   → boolean
--   public.release_earring_variant(uuid, text)              → void
--
-- Reservation model:
--   availability 'available'      → one-of-one stock; reservable via a cart hold.
--   availability 'made_to_order'  → not exclusive; may be added by many carts.
--   availability 'reserved'/'sold'/'unavailable' → not purchasable.
--   The transient hold (held_until, held_by_cart) overlays an 'available' variant
--   without losing its catalogue intent.
--
-- Forward-only. Additive. No existing tables modified. No data migration.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. SKU sequence + generator ───────────────────────────────────────────────
-- Format: EGE-{YYYY}-{NNNN}  (Éclat Grandeur Earring variant)

CREATE SEQUENCE IF NOT EXISTS public.earring_variants_sku_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_earring_variant_sku()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := 'EGE-'
      || to_char(now(), 'YYYY')
      || '-'
      || lpad(nextval('public.earring_variants_sku_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;


-- ── 2. earring_variants table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.earring_variants (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  jewellery_product_id  uuid          NOT NULL
                          REFERENCES public.jewellery_products(id) ON DELETE CASCADE,

  sku                   text          NOT NULL,

  -- Customer-chosen specification
  metal                 text          NOT NULL,                        -- metal key, e.g. 'yellow-gold-18k'
  total_carat           numeric(6,2)  NOT NULL CHECK (total_carat > 0),
  colour                text          NOT NULL CHECK (colour  IN ('D','E','F')),
  clarity               text          NOT NULL CHECK (clarity IN ('VS2','VS1','VVS2','VVS1','IF','FL')),

  -- Commercials
  price_gbp             numeric(12,2) NOT NULL CHECK (price_gbp > 0),
  currency              text          NOT NULL DEFAULT 'GBP',

  -- Availability / sellability
  availability          text          NOT NULL DEFAULT 'available'
                          CHECK (availability IN ('available','reserved','sold','made_to_order','unavailable')),

  -- Presentation / control
  display_order         integer       NOT NULL DEFAULT 0,
  is_published          boolean       NOT NULL DEFAULT false,
  admin_note            text,

  -- Transient reservation overlay (only meaningful for one-of-one 'available')
  held_until            timestamptz,
  held_by_cart          text,

  -- Audit
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT uq_earring_variants_sku UNIQUE (sku),
  -- A product may define each metal+carat+colour+clarity combination only once
  CONSTRAINT uq_earring_variants_combo
    UNIQUE (jewellery_product_id, metal, total_carat, colour, clarity)
);


-- ── 3. Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_earring_variants_product
  ON public.earring_variants (jewellery_product_id);

CREATE INDEX IF NOT EXISTS idx_earring_variants_published
  ON public.earring_variants (jewellery_product_id, is_published, availability);

CREATE INDEX IF NOT EXISTS idx_earring_variants_order
  ON public.earring_variants (jewellery_product_id, display_order);

CREATE INDEX IF NOT EXISTS idx_earring_variants_held_until
  ON public.earring_variants (held_until) WHERE held_until IS NOT NULL;


-- ── 4. Triggers ───────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_earring_variants_generate_sku ON public.earring_variants;
CREATE TRIGGER trg_earring_variants_generate_sku
  BEFORE INSERT ON public.earring_variants
  FOR EACH ROW EXECUTE FUNCTION public.generate_earring_variant_sku();

DROP TRIGGER IF EXISTS trg_earring_variants_updated_at ON public.earring_variants;
CREATE TRIGGER trg_earring_variants_updated_at
  BEFORE UPDATE ON public.earring_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── 5. Reservation functions ──────────────────────────────────────────────────
--
-- claim_earring_variant:
--   made_to_order  → TRUE (no exclusive hold; not one-of-one).
--   available      → atomically place a cart hold; TRUE on success, FALSE if held
--                    by another cart with a still-valid hold (or not claimable).
--   other states   → FALSE.

CREATE OR REPLACE FUNCTION public.claim_earring_variant(
  p_variant_id uuid,
  p_cart_token text,
  p_held_until timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_now    timestamptz := now();
  v_avail  text;
  v_id     uuid;
BEGIN
  SELECT availability INTO v_avail
  FROM public.earring_variants
  WHERE id = p_variant_id AND is_published = true;

  IF v_avail IS NULL THEN
    RETURN FALSE;                       -- not found / unpublished
  END IF;

  IF v_avail = 'made_to_order' THEN
    RETURN TRUE;                        -- not exclusive; always claimable
  END IF;

  IF v_avail <> 'available' THEN
    RETURN FALSE;                       -- reserved/sold/unavailable
  END IF;

  -- One-of-one available stock: place/refresh the hold atomically.
  UPDATE public.earring_variants
  SET held_until   = p_held_until,
      held_by_cart = p_cart_token
  WHERE id = p_variant_id
    AND availability = 'available'
    AND (held_by_cart IS NULL OR held_until < v_now OR held_by_cart = p_cart_token)
  RETURNING id INTO v_id;

  RETURN v_id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_earring_variant(uuid, text, timestamptz) TO service_role;


-- release_earring_variant:
--   Clears a hold only when this cart owns it. Wrong token / made_to_order = no-op.

CREATE OR REPLACE FUNCTION public.release_earring_variant(
  p_variant_id uuid,
  p_cart_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.earring_variants
  SET held_until   = NULL,
      held_by_cart = NULL
  WHERE id = p_variant_id
    AND held_by_cart = p_cart_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_earring_variant(uuid, text) TO service_role;


-- ── 6. Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE public.earring_variants ENABLE ROW LEVEL SECURITY;


-- ── 7. Grants ─────────────────────────────────────────────────────────────────

GRANT SELECT ON public.earring_variants TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.earring_variants TO service_role;
GRANT USAGE ON SEQUENCE public.earring_variants_sku_seq TO service_role;

COMMENT ON TABLE public.earring_variants IS
  'Finished, sellable earring configurations (metal/carat/colour/clarity). One row per genuinely available combination. Customers never select individual diamonds or matched pairs. Replaces the deprecated, dormant diamond_pairs/jewellery_stone_slots model (0029-0033).';
