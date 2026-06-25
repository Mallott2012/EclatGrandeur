-- Gallery configuration: four named, ordered image slots per product.
-- Each slot stores url, alt, scale, offsetX, offsetY as JSONB.
ALTER TABLE ring_settings      ADD COLUMN IF NOT EXISTS gallery_config JSONB;
ALTER TABLE jewellery_products ADD COLUMN IF NOT EXISTS gallery_config JSONB;
