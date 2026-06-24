-- =============================================================================
-- 0015: Phase 2 tables
--   ring_settings, ring_setting_media
--   jewellery_products, jewellery_product_media
--   hero_media
--   enquiries
--   orders
-- =============================================================================

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metal_type') THEN
    CREATE TYPE public.metal_type AS ENUM (
      'platinum', 'white_gold_18k', 'yellow_gold_18k', 'rose_gold_18k',
      'white_gold_9k', 'yellow_gold_9k', 'rose_gold_9k'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'jewellery_category') THEN
    CREATE TYPE public.jewellery_category AS ENUM (
      'earrings', 'necklaces', 'bracelets', 'rings'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enquiry_status') THEN
    CREATE TYPE public.enquiry_status AS ENUM (
      'new', 'in_progress', 'quoted', 'closed_won', 'closed_lost'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM (
      'pending', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled', 'refunded'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hero_placement') THEN
    CREATE TYPE public.hero_placement AS ENUM (
      'homepage', 'engagement-rings', 'earrings', 'necklaces', 'bracelets'
    );
  END IF;
END $$;

-- ── Helper: is_staff() for RLS ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_staff()
  RETURNS boolean
  LANGUAGE sql
  SECURITY INVOKER
  STABLE
  SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_roles
    WHERE user_id = auth.uid()
  );
$$;

-- =============================================================================
-- RING SETTINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ring_settings (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text          NOT NULL,
  slug            text          NOT NULL UNIQUE,
  collection      text,
  description     text,
  metals          public.metal_type[]  NOT NULL DEFAULT '{}',
  base_price_gbp  numeric(10,2),
  is_published    boolean       NOT NULL DEFAULT false,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_ring_settings_updated_at
  BEFORE UPDATE ON public.ring_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ring_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ring_settings: public read published"
  ON public.ring_settings FOR SELECT
  USING (is_published = true);

CREATE POLICY "ring_settings: staff full access"
  ON public.ring_settings FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ── Ring setting media ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ring_setting_media (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ring_setting_id uuid        NOT NULL REFERENCES public.ring_settings(id) ON DELETE CASCADE,
  storage_path    text        NOT NULL,
  display_order   integer     NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ring_setting_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ring_setting_media: public read via published ring"
  ON public.ring_setting_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ring_settings rs
    WHERE rs.id = ring_setting_id AND rs.is_published = true
  ));

CREATE POLICY "ring_setting_media: staff full access"
  ON public.ring_setting_media FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- JEWELLERY PRODUCTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.jewellery_products (
  id              uuid                        PRIMARY KEY DEFAULT gen_random_uuid(),
  category        public.jewellery_category   NOT NULL,
  name            text                        NOT NULL,
  slug            text                        NOT NULL,
  subtitle        text,
  description     text,
  metals          public.metal_type[]         NOT NULL DEFAULT '{}',
  base_price_gbp  numeric(10,2)               NOT NULL,
  show_diamond    boolean                     NOT NULL DEFAULT false,
  is_total_carat  boolean                     NOT NULL DEFAULT false,
  is_pair         boolean                     NOT NULL DEFAULT false,
  is_published    boolean                     NOT NULL DEFAULT false,
  created_at      timestamptz                 NOT NULL DEFAULT now(),
  updated_at      timestamptz                 NOT NULL DEFAULT now(),
  UNIQUE (category, slug)
);

CREATE TRIGGER trg_jewellery_products_updated_at
  BEFORE UPDATE ON public.jewellery_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.jewellery_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jewellery_products: public read published"
  ON public.jewellery_products FOR SELECT
  USING (is_published = true);

CREATE POLICY "jewellery_products: staff full access"
  ON public.jewellery_products FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ── Jewellery product media ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.jewellery_product_media (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  jewellery_product_id  uuid        NOT NULL REFERENCES public.jewellery_products(id) ON DELETE CASCADE,
  storage_path          text        NOT NULL,
  display_order         integer     NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jewellery_product_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jewellery_product_media: public read via published product"
  ON public.jewellery_product_media FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.jewellery_products jp
    WHERE jp.id = jewellery_product_id AND jp.is_published = true
  ));

CREATE POLICY "jewellery_product_media: staff full access"
  ON public.jewellery_product_media FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- HERO MEDIA
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.hero_media (
  id            uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  placement     public.hero_placement NOT NULL,
  storage_path  text                  NOT NULL,
  headline      text,
  subheadline   text,
  is_published  boolean               NOT NULL DEFAULT false,
  created_at    timestamptz           NOT NULL DEFAULT now(),
  updated_at    timestamptz           NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_hero_media_updated_at
  BEFORE UPDATE ON public.hero_media
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.hero_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hero_media: public read published"
  ON public.hero_media FOR SELECT
  USING (is_published = true);

CREATE POLICY "hero_media: staff full access"
  ON public.hero_media FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- ENQUIRIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.enquiries (
  id                  uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name       text                    NOT NULL,
  customer_email      text                    NOT NULL,
  customer_phone      text,
  subject             text,
  message             text                    NOT NULL,
  status              public.enquiry_status   NOT NULL DEFAULT 'new',
  linked_diamond_id   uuid                    REFERENCES public.diamonds(id) ON DELETE SET NULL,
  linked_ring_id      uuid                    REFERENCES public.ring_settings(id) ON DELETE SET NULL,
  internal_notes      text,
  created_at          timestamptz             NOT NULL DEFAULT now(),
  updated_at          timestamptz             NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_enquiries_updated_at
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_enquiries_status     ON public.enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at DESC);

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enquiries: staff full access"
  ON public.enquiries FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- =============================================================================
-- ORDERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id                  uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name       text                  NOT NULL,
  customer_email      text                  NOT NULL,
  customer_phone      text,
  ring_setting_id     uuid                  REFERENCES public.ring_settings(id) ON DELETE SET NULL,
  diamond_id          uuid                  REFERENCES public.diamonds(id) ON DELETE SET NULL,
  total_gbp           numeric(10,2)         NOT NULL,
  status              public.order_status   NOT NULL DEFAULT 'pending',
  stripe_session_id   text,
  notes               text,
  created_at          timestamptz           NOT NULL DEFAULT now(),
  updated_at          timestamptz           NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders: staff full access"
  ON public.orders FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());
