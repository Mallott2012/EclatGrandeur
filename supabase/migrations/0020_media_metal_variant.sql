-- Add metal-variant tagging to media rows.
-- NULL = generic / shown for all metals (safe fallback).
-- A non-null value means this image/video is only shown when the customer
-- has selected that specific metal on the product detail page.

ALTER TABLE ring_setting_media      ADD COLUMN IF NOT EXISTS metal TEXT;
ALTER TABLE jewellery_product_media ADD COLUMN IF NOT EXISTS metal TEXT;
