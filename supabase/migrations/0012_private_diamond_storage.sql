-- Phase 1A T2: private Supabase Storage buckets for diamond inventory.
--
-- Creates two private buckets. No storage.objects RLS policies are created:
-- browser clients have zero direct access to either bucket. All uploads,
-- downloads, signed-URL generation and deletion will be implemented in T3
-- via server-only repository functions using the service-role client.
--
-- service_role has the BYPASSRLS privilege in Supabase and therefore retains
-- full access to storage.objects without any explicit policy.
--
-- Bucket constraints enforced by Supabase Storage on upload:
--   diamond-certificates: PDF only, 20 MB max
--   diamond-media: JPEG/PNG/WebP/AVIF/MP4, 100 MB max

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'diamond-certificates',
  'diamond-certificates',
  false,
  20971520,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'diamond-media',
  'diamond-media',
  false,
  104857600,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;
