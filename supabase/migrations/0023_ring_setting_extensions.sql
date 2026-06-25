-- ─────────────────────────────────────────────────────────────────────────────
-- 0023_ring_setting_extensions.sql
--
-- Phase 0: Ring-setting metadata for the setting-first engagement-ring
-- purchase flow.
--
-- Adds:
--   diamond_shapes               TEXT[]   — compatible centre-stone shapes
--                                           (closes a code/type gap: this column
--                                            is referenced in app types and admin
--                                            UI but had no migration file)
--   min_carat                    NUMERIC  — minimum compatible diamond carat
--   max_carat                    NUMERIC  — maximum compatible diamond carat
--   ring_sizes                   TEXT[]   — available ring sizes (UK standard)
--   requires_diamond_selection   BOOLEAN  — always true for engagement settings;
--                                           gates the configurator flow
--   requires_ring_size_selection BOOLEAN  — always true for engagement settings
--   setting_style                TEXT     — internal reference (e.g. "Classic Solitaire")
--   band_style                   TEXT     — internal reference
--   head_style                   TEXT     — internal reference
--
-- SAFE: all additions are ADD COLUMN IF NOT EXISTS with NULL-safe or empty
-- defaults. Zero data loss. No RLS changes. No diamond-table changes.
-- No customer-visible change.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.ring_settings
  ADD COLUMN IF NOT EXISTS diamond_shapes               TEXT[]        NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS min_carat                    NUMERIC(6,3),
  ADD COLUMN IF NOT EXISTS max_carat                    NUMERIC(6,3),
  ADD COLUMN IF NOT EXISTS ring_sizes                   TEXT[]        NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requires_diamond_selection   BOOLEAN       NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS requires_ring_size_selection BOOLEAN       NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS setting_style                TEXT,
  ADD COLUMN IF NOT EXISTS band_style                   TEXT,
  ADD COLUMN IF NOT EXISTS head_style                   TEXT;

COMMENT ON COLUMN public.ring_settings.diamond_shapes IS
  'Compatible centre-stone shapes for this setting (round, oval, emerald, cushion, pear, radiant).';
COMMENT ON COLUMN public.ring_settings.min_carat IS
  'Minimum compatible diamond carat weight. NULL means no lower restriction.';
COMMENT ON COLUMN public.ring_settings.max_carat IS
  'Maximum compatible diamond carat weight. NULL means no upper restriction.';
COMMENT ON COLUMN public.ring_settings.ring_sizes IS
  'Available ring sizes for this setting (UK standard, e.g. [''L'', ''M'', ''N'']). Empty array means all sizes available on request.';
COMMENT ON COLUMN public.ring_settings.requires_diamond_selection IS
  'True for all engagement ring settings — gates the diamond selection step in the configurator.';
COMMENT ON COLUMN public.ring_settings.requires_ring_size_selection IS
  'True for all engagement ring settings — gates the ring size step in the configurator.';
COMMENT ON COLUMN public.ring_settings.setting_style IS
  'Internal reference label (e.g. "Classic Solitaire"). Admin use only, not customer-facing.';
COMMENT ON COLUMN public.ring_settings.band_style IS
  'Internal reference label for the band construction. Admin use only.';
COMMENT ON COLUMN public.ring_settings.head_style IS
  'Internal reference label for the head/prong construction. Admin use only.';
