-- ─────────────────────────────────────────────────────────────────────────────
-- 0027_diamond_reservations.sql
--
-- Phase 6: Cart, Diamond Reservation, and Enquiry Snapshot.
-- Adds lightweight hold columns to diamonds (60-minute customer reservation).
-- Adds configuration snapshot column to enquiries.
--
-- Depends on: 0026 (diamonds table with eclat_approved), 0025 (enquiries table).
--
-- Adds to public.diamonds:
--   held_until   TIMESTAMPTZ  — reservation expiry; NULL when not held
--   held_by_cart TEXT         — opaque cart token; NULL when not held
--
-- Adds to public.enquiries:
--   configuration JSONB       — full ConfiguredEngagementRing snapshot at submission
--
-- Idempotency: ADD COLUMN IF NOT EXISTS throughout.
-- No data migration. No RLS changes. Existing rows unaffected (new columns NULL).
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Diamond hold columns ──────────────────────────────────────────────────

ALTER TABLE public.diamonds
  ADD COLUMN IF NOT EXISTS held_until   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS held_by_cart TEXT;

CREATE INDEX IF NOT EXISTS idx_diamonds_held_until
  ON public.diamonds (held_until)
  WHERE held_until IS NOT NULL;


-- ── 2. Enquiry configuration snapshot ────────────────────────────────────────

ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS configuration JSONB;
