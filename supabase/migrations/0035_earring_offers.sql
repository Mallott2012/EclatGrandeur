-- ─────────────────────────────────────────────────────────────────────────────
-- 0035_earring_offers.sql
--
-- ACTIVE customer-facing earring model: editable "Earring Diamond Offers".
--
-- An offer is a completed matched-pair SPECIFICATION (cut / carat / colour / clarity
-- / quality / price), created and fully editable in admin per earring product. It is
-- NOT physical diamond inventory: there are no GIA stones, no reservation/holds, and
-- no link to the diamonds table. We source/allocate the matched pair after the order.
--
-- The customer flow is: pick the earring setting (the product) → pick metal →
-- CHOOSE YOUR DIAMONDS → pick one published offer → Add to Bag / Enquire.
--
-- DORMANT models retained for migration-ledger integrity, NOT used by this flow:
--   diamond_pairs / jewellery_stone_slots (0029–0032), earring_variants (0034).
-- jewellery_products.earring_type (0033) is reused as the product classification.
--
-- Forward-only. Additive. No existing tables modified. No data migration.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── SKU sequence + generator (EGO = Éclat Grandeur Offer) ─────────────────────

CREATE SEQUENCE IF NOT EXISTS public.earring_offers_sku_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_earring_offer_sku()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := 'EGO-' || to_char(now(), 'YYYY') || '-'
      || lpad(nextval('public.earring_offers_sku_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;


-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.earring_offers (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  jewellery_product_id  uuid          NOT NULL
                          REFERENCES public.jewellery_products(id) ON DELETE CASCADE,
  sku                   text          NOT NULL,

  -- Which product metals this offer is available in. Empty = all product metals.
  supported_metals      text[]        NOT NULL DEFAULT '{}',

  -- Completed matched-pair specification
  cut                   text          NOT NULL,                          -- shape, e.g. 'round'
  total_carat           numeric(6,2)  NOT NULL CHECK (total_carat > 0),
  carat_per_stone       numeric(6,2),
  colour                text          NOT NULL,                          -- e.g. 'E'
  clarity               text          NOT NULL,                          -- e.g. 'VS1' (FL shown as "Flawless")

  -- Optional quality wording (rendered on the offer card; nullable for fancy shapes)
  cut_grade             text,
  polish                text,
  symmetry              text,
  fluorescence          text,

  -- Commercials
  price_gbp             numeric(12,2) NOT NULL CHECK (price_gbp > 0),
  currency              text          NOT NULL DEFAULT 'GBP',
  availability          text          NOT NULL DEFAULT 'made_to_order'
                          CHECK (availability IN ('available','made_to_order','unavailable')),

  -- Presentation / control
  is_published          boolean       NOT NULL DEFAULT false,
  display_order         integer       NOT NULL DEFAULT 0,
  admin_note            text,

  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT uq_earring_offers_sku UNIQUE (sku)
);


-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_earring_offers_product
  ON public.earring_offers (jewellery_product_id);
CREATE INDEX IF NOT EXISTS idx_earring_offers_published
  ON public.earring_offers (jewellery_product_id, is_published, availability);
CREATE INDEX IF NOT EXISTS idx_earring_offers_order
  ON public.earring_offers (jewellery_product_id, display_order);


-- ── Triggers ──────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_earring_offers_generate_sku ON public.earring_offers;
CREATE TRIGGER trg_earring_offers_generate_sku
  BEFORE INSERT ON public.earring_offers
  FOR EACH ROW EXECUTE FUNCTION public.generate_earring_offer_sku();

DROP TRIGGER IF EXISTS trg_earring_offers_updated_at ON public.earring_offers;
CREATE TRIGGER trg_earring_offers_updated_at
  BEFORE UPDATE ON public.earring_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── RLS + grants ──────────────────────────────────────────────────────────────

ALTER TABLE public.earring_offers ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.earring_offers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.earring_offers TO service_role;
GRANT USAGE ON SEQUENCE public.earring_offers_sku_seq TO service_role;

COMMENT ON TABLE public.earring_offers IS
  'Editable completed matched-pair offers (specifications) per earring product. Customer-facing earring selection uses ONLY published rows here — never the diamonds table or diamond_pairs. No physical inventory or reservation.';
