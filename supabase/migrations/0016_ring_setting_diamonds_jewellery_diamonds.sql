-- Join table: which diamonds are available for a given ring setting + metal combo
CREATE TABLE IF NOT EXISTS public.ring_setting_diamonds (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  ring_setting_id   uuid    NOT NULL REFERENCES public.ring_settings(id) ON DELETE CASCADE,
  metal             text    NOT NULL,
  diamond_id        uuid    NOT NULL REFERENCES public.diamonds(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ring_setting_id, metal, diamond_id)
);

ALTER TABLE public.ring_setting_diamonds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.ring_setting_diamonds
  USING (true) WITH CHECK (true);

-- Join table: which diamonds are available for a given jewellery product
CREATE TABLE IF NOT EXISTS public.jewellery_diamonds (
  id                uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  jewellery_id      uuid    NOT NULL REFERENCES public.jewellery_products(id) ON DELETE CASCADE,
  diamond_id        uuid    NOT NULL REFERENCES public.diamonds(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (jewellery_id, diamond_id)
);

ALTER TABLE public.jewellery_diamonds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.jewellery_diamonds
  USING (true) WITH CHECK (true);
