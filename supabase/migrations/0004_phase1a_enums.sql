-- Phase 1A: diamond inventory enums and fancy-colour hue reference table.
-- Enums created idempotently; migration is safe to re-run.
--
-- SECURITY: fancy_colour_hues has RLS enabled with zero policies.
-- Consistent with Phase 1A principle: all raw inventory-related tables
-- are server-only operational data. No authenticated SELECT policy granted.

DO $$
BEGIN

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_origin' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_origin AS ENUM ('natural', 'lab_grown');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_colour_category' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_colour_category AS ENUM ('standard', 'fancy');
  END IF;

  -- D-M covers all realistic luxury white-diamond stock.
  -- Fancy stones use fancy_colour_hue + fancy_colour_intensity instead.
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_colour_grade' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_colour_grade AS ENUM (
      'D','E','F','G','H','I','J','K','L','M'
    );
  END IF;

  -- GIA official fancy-colour intensity scale.
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'fancy_colour_intensity' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.fancy_colour_intensity AS ENUM (
      'Faint', 'Very Light', 'Light',
      'Fancy Light', 'Fancy', 'Fancy Intense',
      'Fancy Vivid', 'Fancy Deep', 'Fancy Dark'
    );
  END IF;

  -- Shape enum. New cuts added via ALTER TYPE ... ADD VALUE in future migrations.
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_shape' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_shape AS ENUM (
      'round', 'oval', 'princess', 'emerald', 'cushion',
      'pear', 'marquise', 'radiant', 'asscher', 'heart',
      'trilliant', 'baguette', 'old_european', 'old_mine'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_clarity' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_clarity AS ENUM (
      'FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2'
    );
  END IF;

  -- 'Ideal' retained for AGS-certified stones; GIA's highest formal grade is 'Excellent'.
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_cut' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_cut AS ENUM (
      'Ideal', 'Excellent', 'Very Good', 'Good', 'Fair'
    );
  END IF;

  -- Shared grade set for polish and symmetry.
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_finish' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_finish AS ENUM (
      'Excellent', 'Very Good', 'Good', 'Fair'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_fluorescence' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_fluorescence AS ENUM (
      'None', 'Faint', 'Medium', 'Strong', 'Very Strong'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'certificate_lab' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.certificate_lab AS ENUM (
      'GIA', 'IGI', 'HRD', 'AGS', 'GCAL'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_status AS ENUM (
      'available', 'on_hold', 'reserved', 'sold', 'removed'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'diamond_media_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.diamond_media_type AS ENUM ('image', 'video_360');
  END IF;

END;
$$;

-- Fancy-colour hue reference table.
-- Text primary key, not an enum: new hues need only an INSERT, not a migration.
-- diamonds.fancy_colour_hue FKs to this table for referential integrity.
-- Application-layer Zod validation also guards approved values.
CREATE TABLE IF NOT EXISTS public.fancy_colour_hues (
  hue text PRIMARY KEY
);

INSERT INTO public.fancy_colour_hues (hue) VALUES
  ('yellow'), ('pink'),   ('blue'),  ('green'),
  ('brown'),  ('grey'),   ('black'), ('orange'),
  ('red'),    ('violet')
ON CONFLICT DO NOTHING;

-- RLS enabled; zero policies.
-- All access via service-role server functions only.
ALTER TABLE public.fancy_colour_hues ENABLE ROW LEVEL SECURITY;
