-- ─────────────────────────────────────────────────────────────────────────────
-- 0024_reconcile_catalogue_columns_and_shared_tables.sql
--
-- Forward-only reconciliation migration.
-- Remote baseline: migrations 0001–0019 + 0023 applied.
-- Versions 0020–0022 and duplicate 0015/0016 files are archived (.superseded).
--
-- Creates or reconciles:
--   public.is_staff()                        function  (CREATE OR REPLACE)
--   ring_settings: staff full access         policy    (conditional DO block)
--   ring_setting_media: staff full access    policy    (conditional DO block)
--   ring_setting_media.metal                 column    (ADD COLUMN IF NOT EXISTS)
--   ring_settings.gallery_config             column    (ADD COLUMN IF NOT EXISTS)
--   ring_settings.metal_variants             column    (ADD COLUMN IF NOT EXISTS)
--   public.ring_setting_diamonds             table     (CREATE TABLE IF NOT EXISTS)
--   public.hero_media                        table     (CREATE TABLE IF NOT EXISTS)
--
-- Idempotency: every object uses IF NOT EXISTS, CREATE OR REPLACE, or a
-- pg_policies existence check. Safe to replay against a database where a
-- previous incomplete attempt created some but not all objects.
--
-- Data safety: all column additions are nullable or have safe defaults.
--   No ring_settings or ring_setting_media rows are deleted or modified.
--   No RLS policies are dropped. Existing public read policies are preserved.
--
-- No data migration. No destructive operations.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. is_staff() function ─────────────────────────────────────────────────────
--
-- SECURITY INVOKER is intentional and correct here.
-- staff_roles has RLS enabled with policy "staff_roles: owner read"
-- (USING auth.uid() = user_id). is_staff() queries exactly that predicate,
-- so an authenticated user can only discover their own staff_roles row —
-- no information leakage. Unauthenticated callers get auth.uid() = NULL which
-- matches nothing. The TO authenticated clause on downstream policies means
-- unauthenticated sessions never evaluate is_staff() anyway.
-- No recursive policy risk: staff_roles policies use auth.uid() comparisons
-- and is_super_admin() only — not is_staff().

CREATE OR REPLACE FUNCTION public.is_staff()
  RETURNS boolean
  LANGUAGE sql
  SECURITY INVOKER
  STABLE
  SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_roles WHERE user_id = auth.uid()
  );
$$;


-- ── 2. Staff write policies on existing catalogue tables ──────────────────────
--
-- 0015_catalogue_foundation_rings created public SELECT policies only.
-- These add ALL-operations access for authenticated staff.
-- All current admin writes use service_role (bypasses RLS), so these are
-- defence-in-depth for future authenticated-session admin access.
-- Existing "public read published" policies are untouched.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'ring_settings'
      AND policyname = 'ring_settings: staff full access'
  ) THEN
    CREATE POLICY "ring_settings: staff full access"
      ON public.ring_settings
      FOR ALL
      TO authenticated
      USING     (public.is_staff())
      WITH CHECK (public.is_staff());
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'ring_setting_media'
      AND policyname = 'ring_setting_media: staff full access'
  ) THEN
    CREATE POLICY "ring_setting_media: staff full access"
      ON public.ring_setting_media
      FOR ALL
      TO authenticated
      USING     (public.is_staff())
      WITH CHECK (public.is_staff());
  END IF;
END;
$$;


-- ── 3. Missing columns on existing tables ─────────────────────────────────────
--
-- These were intended by migrations 0020–0022 (now archived — those files
-- contained ALTER TABLE jewellery_product_media lines that failed because
-- jewellery_product_media did not exist; the forward-only strategy adds the
-- missing columns here and creates the jewellery tables fully in 0025).

ALTER TABLE public.ring_setting_media
  ADD COLUMN IF NOT EXISTS metal TEXT;

ALTER TABLE public.ring_settings
  ADD COLUMN IF NOT EXISTS gallery_config JSONB,
  ADD COLUMN IF NOT EXISTS metal_variants JSONB;


-- ── 4. ring_setting_diamonds ───────────────────────────────────────────────────
--
-- Join table for explicit diamond-to-setting overrides.
-- FKs reference ring_settings (0015 ✓) and diamonds (0019 ✓).
-- No public SELECT — diamonds must not be exposed via this join table
-- to unauthenticated reads. All customer diamond queries go through the
-- server-side API route with eligibility and availability filtering applied.

CREATE TABLE IF NOT EXISTS public.ring_setting_diamonds (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ring_setting_id uuid        NOT NULL REFERENCES public.ring_settings(id) ON DELETE CASCADE,
  metal           text        NOT NULL,
  diamond_id      uuid        NOT NULL REFERENCES public.diamonds(id)      ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ring_setting_id, metal, diamond_id)
);

CREATE INDEX IF NOT EXISTS idx_rsd_ring_setting
  ON public.ring_setting_diamonds (ring_setting_id);

ALTER TABLE public.ring_setting_diamonds ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'ring_setting_diamonds'
      AND policyname = 'ring_setting_diamonds: staff full access'
  ) THEN
    CREATE POLICY "ring_setting_diamonds: staff full access"
      ON public.ring_setting_diamonds
      FOR ALL
      TO authenticated
      USING     (public.is_staff())
      WITH CHECK (public.is_staff());
  END IF;
END;
$$;


-- ── 5. hero_media ──────────────────────────────────────────────────────────────
--
-- media_type is TEXT (not public.media_type enum) because the TypeScript
-- HeroMediaRecord uses 'video' which is not a value in the DB enum
-- (which has 'model_video'). Using TEXT avoids a silent constraint mismatch.

CREATE TABLE IF NOT EXISTS public.hero_media (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  placement    text         NOT NULL,
  media_type   text         NOT NULL DEFAULT 'image',
  storage_path text         NOT NULL,
  headline     text,
  subheadline  text,
  cta_label    text,
  cta_href     text,
  is_published boolean      NOT NULL DEFAULT false,
  sort_order   smallint     NOT NULL DEFAULT 0,
  created_by   uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by   uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hero_media_placement_published
  ON public.hero_media (placement, is_published);

DROP TRIGGER IF EXISTS trg_hero_media_updated_at ON public.hero_media;
CREATE TRIGGER trg_hero_media_updated_at
  BEFORE UPDATE ON public.hero_media
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.hero_media ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'hero_media'
      AND policyname = 'hero_media: public read published'
  ) THEN
    CREATE POLICY "hero_media: public read published"
      ON public.hero_media
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
      AND tablename  = 'hero_media'
      AND policyname = 'hero_media: staff full access'
  ) THEN
    CREATE POLICY "hero_media: staff full access"
      ON public.hero_media
      FOR ALL
      TO authenticated
      USING     (public.is_staff())
      WITH CHECK (public.is_staff());
  END IF;
END;
$$;
