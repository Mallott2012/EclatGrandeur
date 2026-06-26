-- ─────────────────────────────────────────────────────────────────────────────
-- 0033_earring_type.sql
--
-- Adds earring_type column to jewellery_products for internal admin slot
-- configuration.  Nullable so existing earrings and non-earring products
-- are unaffected.  Only the earrings admin editor reads or writes this column.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.jewellery_products
  ADD COLUMN IF NOT EXISTS earring_type TEXT
  CHECK (
    earring_type IS NULL OR earring_type IN (
      'classic_studs',
      'halo_studs',
      'drop_earrings',
      'pave_hoops',
      'fixed_composition',
      'other'
    )
  );

COMMENT ON COLUMN public.jewellery_products.earring_type
  IS 'Internal earring classification for slot configuration UI. NULL for non-earring products and earrings not yet configured.';
