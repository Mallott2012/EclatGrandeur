-- ─────────────────────────────────────────────────────────────────────────────
-- 0025_reconcile_jewellery_and_enquiries.sql
--
-- Forward-only reconciliation migration (second part).
-- Depends on: 0024 applied (is_staff() function + ring_settings + diamonds exist).
--
-- Creates:
--   public.jewellery_products                table  (CREATE TABLE IF NOT EXISTS)
--   public.jewellery_product_media           table  (CREATE TABLE IF NOT EXISTS)
--   public.jewellery_diamonds                table  (CREATE TABLE IF NOT EXISTS)
--   public.enquiry_number_seq                seq    (CREATE SEQUENCE IF NOT EXISTS)
--   public.enquiries                         table  (CREATE TABLE IF NOT EXISTS)
--
-- Internal declaration order is load-bearing:
--   jewellery_products must precede jewellery_product_media, jewellery_diamonds,
--   and enquiries (all carry FK → jewellery_products).
--
-- Idempotency: every object uses IF NOT EXISTS or conditional DO blocks.
-- Safe to replay.
--
-- No data migration. All tables are empty on first application.
-- No destructive operations. No existing objects modified.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. jewellery_products ──────────────────────────────────────────────────────
--
-- category uses TEXT + CHECK rather than a jewellery_category enum because
-- that enum does not exist on remote (defined only in the archived 0015_phase2
-- file). The CHECK constraint provides equivalent enforcement without
-- introducing an orphaned type.
--
-- metals uses public.ring_metal[] — same enum as ring_settings.metals.
-- The pre-existing _18ct/_9ct (DB) vs _18k/_9k (TypeScript) enum mismatch
-- is inherited from the existing codebase and is not introduced here.
--
-- gallery_config and metal_variants are included from creation so that
-- the ADD COLUMN IF NOT EXISTS lines in the archived 0021/0022 migrations
-- are fully superseded — no gap in the forward-only sequence.

CREATE TABLE IF NOT EXISTS public.jewellery_products (
  id             uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text                NOT NULL,
  category       text                NOT NULL
                   CHECK (category IN ('earrings', 'necklaces', 'bracelets')),
  name           text                NOT NULL,
  subtitle       text,
  description    text,
  base_price_gbp numeric(12,2)       NOT NULL CHECK (base_price_gbp >= 0),
  metals         public.ring_metal[] NOT NULL DEFAULT '{}',
  show_diamond   boolean             NOT NULL DEFAULT false,
  is_total_carat boolean             NOT NULL DEFAULT false,
  is_pair        boolean             NOT NULL DEFAULT false,
  is_published   boolean             NOT NULL DEFAULT false,
  sort_order     smallint            NOT NULL DEFAULT 0,
  gallery_config jsonb,
  metal_variants jsonb,
  created_by     uuid                REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by     uuid                REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz         NOT NULL DEFAULT now(),
  updated_at     timestamptz         NOT NULL DEFAULT now(),
  UNIQUE (category, slug)
);

CREATE INDEX IF NOT EXISTS idx_jp_category_published
  ON public.jewellery_products (category, is_published);

CREATE INDEX IF NOT EXISTS idx_jp_slug
  ON public.jewellery_products (slug);

DROP TRIGGER IF EXISTS trg_jewellery_products_updated_at ON public.jewellery_products;
CREATE TRIGGER trg_jewellery_products_updated_at
  BEFORE UPDATE ON public.jewellery_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.jewellery_products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'jewellery_products'
      AND policyname = 'jewellery_products: public read published'
  ) THEN
    CREATE POLICY "jewellery_products: public read published"
      ON public.jewellery_products
      FOR SELECT
      USING (is_published = true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'jewellery_products'
      AND policyname = 'jewellery_products: staff full access'
  ) THEN
    CREATE POLICY "jewellery_products: staff full access"
      ON public.jewellery_products
      FOR ALL
      TO authenticated
      USING     (public.is_staff())
      WITH CHECK (public.is_staff());
  END IF;
END;
$$;


-- ── 2. jewellery_product_media ────────────────────────────────────────────────
--
-- media_type is TEXT (not public.media_type enum) — same rationale as
-- hero_media: TypeScript type uses 'video' which is not a valid enum value.
--
-- storage_path UNIQUE prevents duplicate storage entries, consistent with
-- ring_setting_media.
--
-- Public read is scoped via parent published status — media is visible only
-- when the parent jewellery_product is published.

CREATE TABLE IF NOT EXISTS public.jewellery_product_media (
  id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  jewellery_product_id uuid         NOT NULL
                         REFERENCES public.jewellery_products(id) ON DELETE CASCADE,
  media_type           text         NOT NULL DEFAULT 'image',
  storage_path         text         NOT NULL UNIQUE,
  display_order        smallint     NOT NULL DEFAULT 0,
  alt_text             text,
  is_primary           boolean      NOT NULL DEFAULT false,
  metal                text,
  created_at           timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jpm_product
  ON public.jewellery_product_media (jewellery_product_id);

ALTER TABLE public.jewellery_product_media ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'jewellery_product_media'
      AND policyname = 'jewellery_product_media: public read published'
  ) THEN
    CREATE POLICY "jewellery_product_media: public read published"
      ON public.jewellery_product_media
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.jewellery_products jp
          WHERE jp.id  = jewellery_product_id
            AND jp.is_published = true
        )
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'jewellery_product_media'
      AND policyname = 'jewellery_product_media: staff full access'
  ) THEN
    CREATE POLICY "jewellery_product_media: staff full access"
      ON public.jewellery_product_media
      FOR ALL
      TO authenticated
      USING     (public.is_staff())
      WITH CHECK (public.is_staff());
  END IF;
END;
$$;


-- ── 3. jewellery_diamonds ─────────────────────────────────────────────────────
--
-- No public SELECT — diamond data must not be exposed to unauthenticated
-- reads via this join table. All customer diamond access goes through the
-- server-side API route with eligibility and availability filtering.

CREATE TABLE IF NOT EXISTS public.jewellery_diamonds (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  jewellery_id uuid         NOT NULL
                 REFERENCES public.jewellery_products(id) ON DELETE CASCADE,
  diamond_id   uuid         NOT NULL
                 REFERENCES public.diamonds(id)           ON DELETE CASCADE,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (jewellery_id, diamond_id)
);

CREATE INDEX IF NOT EXISTS idx_jd_jewellery
  ON public.jewellery_diamonds (jewellery_id);

ALTER TABLE public.jewellery_diamonds ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'jewellery_diamonds'
      AND policyname = 'jewellery_diamonds: staff full access'
  ) THEN
    CREATE POLICY "jewellery_diamonds: staff full access"
      ON public.jewellery_diamonds
      FOR ALL
      TO authenticated
      USING     (public.is_staff())
      WITH CHECK (public.is_staff());
  END IF;
END;
$$;


-- ── 4. enquiry_number_seq ─────────────────────────────────────────────────────
--
-- Sequence must be created before the enquiries table because it is
-- referenced in the enquiry_number column DEFAULT expression.

CREATE SEQUENCE IF NOT EXISTS public.enquiry_number_seq
  START     1
  INCREMENT 1
  NO MINVALUE
  NO MAXVALUE
  CACHE     1;


-- ── 5. enquiries ──────────────────────────────────────────────────────────────
--
-- status uses TEXT + CHECK rather than an enquiry_status enum — that enum
-- was defined only in the archived 0015_phase2 file and does not exist on
-- remote. The CHECK constraint provides equivalent enforcement.
--
-- enquiry_number is auto-generated on INSERT from the sequence above.
-- Format: EQ-00001, EQ-00002, …
--
-- jewellery_product_id FK uses ON DELETE SET NULL — an enquiry referencing
-- a deleted jewellery product is preserved with the FK nulled.
--
-- No public SELECT policy. Enquiry data is staff-only.

CREATE TABLE IF NOT EXISTS public.enquiries (
  id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_number       text         NOT NULL UNIQUE
                         DEFAULT ('EQ-' || lpad(nextval('public.enquiry_number_seq')::text, 5, '0')),
  customer_name        text         NOT NULL,
  customer_email       text         NOT NULL,
  customer_phone       text,
  subject              text,
  message              text         NOT NULL,
  ring_setting_id      uuid         REFERENCES public.ring_settings(id)      ON DELETE SET NULL,
  diamond_id           uuid         REFERENCES public.diamonds(id)           ON DELETE SET NULL,
  jewellery_product_id uuid         REFERENCES public.jewellery_products(id) ON DELETE SET NULL,
  metal                text,
  status               text         NOT NULL DEFAULT 'new'
                         CHECK (status IN ('new', 'contacted', 'closed')),
  assigned_to          text,
  notes                text,
  created_at           timestamptz  NOT NULL DEFAULT now(),
  updated_at           timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status
  ON public.enquiries (status, created_at DESC);

DROP TRIGGER IF EXISTS trg_enquiries_updated_at ON public.enquiries;
CREATE TRIGGER trg_enquiries_updated_at
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'enquiries'
      AND policyname = 'enquiries: staff full access'
  ) THEN
    CREATE POLICY "enquiries: staff full access"
      ON public.enquiries
      FOR ALL
      TO authenticated
      USING     (public.is_staff())
      WITH CHECK (public.is_staff());
  END IF;
END;
$$;
