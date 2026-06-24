-- Per-metal independent gallery, card-media selections, price, and SKU.
-- gallery_config (from 0021) is preserved for backward-compat; metal_variants takes precedence.
ALTER TABLE ring_settings      ADD COLUMN IF NOT EXISTS metal_variants JSONB;
ALTER TABLE jewellery_products ADD COLUMN IF NOT EXISTS metal_variants JSONB;
