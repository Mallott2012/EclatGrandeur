-- Phase 1A: diamond media table (images and 360 videos only).
-- Certificate PDFs are referenced via diamonds.cert_pdf_path, not here.
-- Both managed through the diamond-certificates and diamond-media private
-- storage buckets configured in T2.

CREATE TABLE IF NOT EXISTS public.diamond_media (
  id             uuid                       PRIMARY KEY DEFAULT gen_random_uuid(),
  diamond_id     uuid                       NOT NULL REFERENCES public.diamonds(id) ON DELETE CASCADE,
  media_type     public.diamond_media_type  NOT NULL,
  storage_path   text                       NOT NULL,
  display_order  smallint                   NOT NULL DEFAULT 0,
  alt_text       text,
  is_primary     boolean                    NOT NULL DEFAULT false,
  created_at     timestamptz                NOT NULL DEFAULT now(),

  CONSTRAINT diamond_media_storage_path_unique UNIQUE (storage_path)
);

-- At most one primary image per diamond.
CREATE UNIQUE INDEX IF NOT EXISTS idx_diamond_media_one_primary
  ON public.diamond_media (diamond_id)
  WHERE is_primary = true AND media_type = 'image';

CREATE INDEX IF NOT EXISTS idx_diamond_media_diamond_id
  ON public.diamond_media (diamond_id);

-- RLS enabled; zero policies.
-- All access via service-role server functions only.
ALTER TABLE public.diamond_media ENABLE ROW LEVEL SECURITY;
