-- ─────────────────────────────────────────────────────────────────────────────
-- 0030_jewellery_stone_slots.sql
--
-- Phase E1: Generic jewellery stone-slot configuration.
--
-- Introduces jewellery_stone_slots — a reusable per-product stone-slot
-- configuration table that drives the customer selection flow for any
-- jewellery category: earrings, pendants, necklaces, bracelets, and
-- future Creative Studio designs.
--
-- A "stone slot" describes one selectable or fixed diamond group within
-- a jewellery product. A Classic Stud earring has one slot (centre_pair).
-- A Drop Earring has two slots (top_pair + drop_pair).
-- A Pavé Hoop has one fixed slot (fixed_accent, selection_mode = fixed).
--
-- Depends on: 0025 (jewellery_products table exists).
--
-- Creates:
--   public.jewellery_stone_slots    table
--
-- Idempotency: CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS,
--   DROP/CREATE TRIGGER. Safe to replay.
-- Forward-only. No existing tables modified. No data migration.
-- ─────────────────────────────────────────────────────────────────────────────


CREATE TABLE IF NOT EXISTS public.jewellery_stone_slots (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent product
  jewellery_product_id    uuid        NOT NULL
                            REFERENCES public.jewellery_products(id) ON DELETE CASCADE,

  -- Slot identity
  slot_key                text        NOT NULL,   -- machine key, e.g. 'centre_pair'
  label                   text        NOT NULL,   -- customer label, e.g. 'Centre Diamond Pair'
  display_order           integer     NOT NULL DEFAULT 0,

  -- Role describes the structural position of this stone group in the design
  role                    text        NOT NULL
                            CHECK (role IN (
                              'centre_pair',
                              'top_pair',
                              'drop_pair',
                              'accent_pair',
                              'centre_single',
                              'fixed_accent'
                            )),

  -- Selection mode:
  --   matched_pair   → customer picks one DiamondPair record
  --   single         → customer picks one individual Diamond record
  --   fixed          → no customer selection; stones included in setting price
  selection_mode          text        NOT NULL
                            CHECK (selection_mode IN ('matched_pair', 'single', 'fixed')),

  -- Whether the customer must fill this slot before adding to bag
  required                boolean     NOT NULL DEFAULT true,

  -- Logical stone count in this slot (e.g. 1 pair = 2 stones, quantity = 1)
  quantity                integer     NOT NULL DEFAULT 1 CHECK (quantity > 0),

  -- Compatibility constraints applied when listing selectable inventory
  compatible_shapes       text[]      NOT NULL DEFAULT '{}',
  min_carat               numeric(8,3),           -- NULL = no lower bound
  max_carat               numeric(8,3),           -- NULL = no upper bound

  -- Which diamond categories are selectable in this slot
  -- Defaults include both white and coloured; restrict to ['white'] for white-only slots
  allowed_diamond_categories  text[]  NOT NULL DEFAULT '{"white","coloured"}',

  -- Which colour families are allowed for coloured diamonds.
  -- NULL = all families (yellow + pink); set to '{yellow}' or '{pink}' to restrict.
  allowed_colour_families     text[],

  -- Pricing behaviour
  --   selected_inventory    → slot adds the pair/stone price to the total
  --   included_in_setting   → slot is priced as part of the base setting price
  price_mode              text        NOT NULL DEFAULT 'selected_inventory'
                            CHECK (price_mode IN ('selected_inventory', 'included_in_setting')),

  -- For fixed slots: human description shown to customers, e.g. 'Pavé diamond halo'
  fixed_stone_description text,

  -- Audit
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  -- Each product may define each slot_key only once
  CONSTRAINT uq_jewellery_stone_slots_product_key UNIQUE (jewellery_product_id, slot_key)
);


-- ── Indexes ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_jss_product_id
  ON public.jewellery_stone_slots (jewellery_product_id);

CREATE INDEX IF NOT EXISTS idx_jss_product_order
  ON public.jewellery_stone_slots (jewellery_product_id, display_order);

CREATE INDEX IF NOT EXISTS idx_jss_role
  ON public.jewellery_stone_slots (role);


-- ── Triggers ──────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_jewellery_stone_slots_updated_at ON public.jewellery_stone_slots;
CREATE TRIGGER trg_jewellery_stone_slots_updated_at
  BEFORE UPDATE ON public.jewellery_stone_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE public.jewellery_stone_slots ENABLE ROW LEVEL SECURITY;


-- ── Grants ────────────────────────────────────────────────────────────────────

GRANT SELECT ON public.jewellery_stone_slots TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.jewellery_stone_slots TO service_role;

COMMENT ON TABLE public.jewellery_stone_slots IS
  'Generic per-product stone-slot configuration. Drives customer selection flow for earrings, necklaces, bracelets, and future Creative Studio designs.';
