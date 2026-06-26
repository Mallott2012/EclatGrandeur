-- ─────────────────────────────────────────────────────────────────────────────
-- 0032_pair_lock_semantics.sql
--
-- Narrow correction: pair-member locking rule precision.
--
-- Problem:
--   The 0031 functions and the 0029 uniqueness trigger used `status != 'sold'`
--   as the definition of "this pair locks its constituent diamonds".  That rule
--   is too broad:
--     - A pair with status='reserved' AND held_until < now() (expired hold)
--       continued blocking both diamonds indefinitely.
--     - Conversely, there was no guard preventing an admin from unpublishing
--       a pair that still had a valid reservation, which could silently break
--       the locking invariant (the pair would stop appearing in
--       getActivePairDiamondIds because is_published became false, yet the
--       reservation was still live and the constituent diamonds were still
--       marked reserved by the atomic claim).
--
-- Solution:
--   Replace every occurrence of the old rule with the precise three-condition
--   definition below, and add a database trigger that prevents unpublishing a
--   pair that holds a valid (unexpired) reservation.
--
-- ── Pair-lock definition (single source of truth) ─────────────────────────────
--
--   A pair LOCKS its constituent diamonds (blocks individual use) when ANY of:
--
--     1. status = 'sold'
--        → Permanent lock; sold diamonds are not re-usable.
--
--     2. is_published = true AND status = 'available'
--        → Pair is live in the catalogue; customers may select it.
--
--     3. status = 'reserved' AND held_until > now()
--        → Valid unexpired reservation, regardless of is_published.
--           (An admin should not be able to unpublish such a pair — see trigger.)
--
--   A pair DOES NOT lock when:
--     - status = 'reserved' AND held_until <= now()   (expired hold)
--     - is_published = false AND no valid reservation
--
-- Updates (all CREATE OR REPLACE — safe to replay):
--   public.check_pair_diamond_uniqueness()    updated lock definition
--   public.prevent_unpublish_reserved_pair()  new trigger function
--   public.claim_pair_atomic()                adds is_published = true guard
--   public.claim_pairs_atomic()               adds is_published = true guard
--
-- New trigger:
--   trg_prevent_unpublish_reserved  on diamond_pairs BEFORE UPDATE OF is_published
--
-- No tables created or modified. No data migration. Forward-only. Safe to replay.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. Updated uniqueness guard ───────────────────────────────────────────────
--
-- Replaces the 0029 version. Uses the authoritative three-condition lock
-- definition, so expired-hold pairs no longer block creation of new pairs
-- referencing the same diamonds.

CREATE OR REPLACE FUNCTION public.check_pair_diamond_uniqueness()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
DECLARE
  v_now       timestamptz := now();
  conflict_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT p.id INTO conflict_id
    FROM public.diamond_pairs p
    WHERE (
      p.status = 'sold'
      OR (p.is_published = true AND p.status = 'available')
      OR (p.status = 'reserved' AND p.held_until > v_now)
    )
    AND (
      p.diamond_id_a = NEW.diamond_id_a OR
      p.diamond_id_b = NEW.diamond_id_a OR
      p.diamond_id_a = NEW.diamond_id_b OR
      p.diamond_id_b = NEW.diamond_id_b
    )
    LIMIT 1;

  ELSIF TG_OP = 'UPDATE' AND (
    NEW.diamond_id_a IS DISTINCT FROM OLD.diamond_id_a OR
    NEW.diamond_id_b IS DISTINCT FROM OLD.diamond_id_b OR
    (NEW.status IS DISTINCT FROM OLD.status AND NEW.status != 'sold')
  ) THEN
    SELECT p.id INTO conflict_id
    FROM public.diamond_pairs p
    WHERE p.id != NEW.id
      AND (
        p.status = 'sold'
        OR (p.is_published = true AND p.status = 'available')
        OR (p.status = 'reserved' AND p.held_until > v_now)
      )
      AND (
        p.diamond_id_a = NEW.diamond_id_a OR
        p.diamond_id_b = NEW.diamond_id_a OR
        p.diamond_id_a = NEW.diamond_id_b OR
        p.diamond_id_b = NEW.diamond_id_b
      )
    LIMIT 1;
  END IF;

  IF conflict_id IS NOT NULL THEN
    RAISE EXCEPTION
      'pair_diamond_conflict: one or both diamonds already belong to an active pair (%)',
      conflict_id
    USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$;


-- ── 2. Guard: cannot unpublish a pair with a valid reservation ─────────────────
--
-- Fires BEFORE UPDATE OF is_published only, so claim/release operations (which
-- do not touch is_published) are unaffected.
--
-- Prevents the silent inconsistency where an admin sets is_published=false on a
-- reserved pair, causing getActivePairDiamondIds to stop seeing the pair (because
-- the old rule required is_published=true), while the constituent diamonds remain
-- in status='reserved' with no route back to 'available'.

CREATE OR REPLACE FUNCTION public.prevent_unpublish_reserved_pair()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
BEGIN
  -- Only act when is_published transitions true → false
  IF OLD.is_published = true AND NEW.is_published = false THEN
    IF OLD.status = 'reserved' AND OLD.held_until > now() THEN
      RAISE EXCEPTION
        'pair_reserved: cannot unpublish pair % — active reservation expires at %',
        OLD.id, OLD.held_until
      USING ERRCODE = '23514';  -- check_violation
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_unpublish_reserved ON public.diamond_pairs;
CREATE TRIGGER trg_prevent_unpublish_reserved
  BEFORE UPDATE OF is_published ON public.diamond_pairs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_unpublish_reserved_pair();

GRANT EXECUTE ON FUNCTION public.prevent_unpublish_reserved_pair()
  TO service_role;


-- ── 3. Updated claim_pair_atomic ──────────────────────────────────────────────
--
-- Change from 0031: pair UPDATE now requires AND is_published = true.
-- Unpublished pairs cannot be claimed (even if their hold has expired).
-- Duplicate pair ID, missing pair ID, sold pairs, and unpublished pairs all
-- cause the pair UPDATE to match 0 rows → returns FALSE (no exception needed).

CREATE OR REPLACE FUNCTION public.claim_pair_atomic(
  p_pair_id    uuid,
  p_cart_token text,
  p_held_until timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_now       timestamptz := now();
  v_diamond_a uuid;
  v_diamond_b uuid;
  v_updated   integer;
BEGIN
  -- Step 1: Claim the pair.
  -- Must be published. Eligible statuses: available, OR reserved-with-expired-hold.
  UPDATE public.diamond_pairs
  SET status       = 'reserved',
      held_until   = p_held_until,
      held_by_cart = p_cart_token
  WHERE id           = p_pair_id
    AND is_published = true
    AND (
      status = 'available'
      OR (status = 'reserved' AND held_until < v_now)
    )
  RETURNING diamond_id_a, diamond_id_b
  INTO v_diamond_a, v_diamond_b;

  -- No row returned → pair not claimable (held by another cart, unpublished, sold).
  IF v_diamond_a IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Step 2: Reserve both constituent diamonds in one UPDATE.
  UPDATE public.diamonds
  SET status       = 'reserved',
      held_until   = p_held_until,
      held_by_cart = p_cart_token
  WHERE id IN (v_diamond_a, v_diamond_b)
    AND (
      status = 'available'
      OR (status = 'reserved' AND held_until < v_now)
      OR (status = 'reserved' AND held_by_cart = p_cart_token)
    );

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- < 2 diamonds updated → at least one held by a different cart; roll back pair.
  IF v_updated < 2 THEN
    RAISE EXCEPTION
      'claim_pair_atomic: constituent diamond(s) unavailable (% of 2 updated). Pair claim rolled back.',
      v_updated
    USING ERRCODE = '40001';
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_pair_atomic(uuid, text, timestamptz)
  TO service_role;


-- ── 4. Updated claim_pairs_atomic ─────────────────────────────────────────────
--
-- Change from 0031: pair UPDATE now requires AND is_published = true.
--
-- Rejects (returns false via exception + rollback) on:
--   duplicate pair IDs    — cardinality(array) > distinct rows updated
--   missing pair IDs      — same count check
--   unpublished pairs     — is_published = true guard
--   sold pairs            — status must be available or expired-reserved
--   invalid constituent   — diamond UPDATE count < 2 * pair count
--   empty array           — trivial true (no claims, no rollback)

CREATE OR REPLACE FUNCTION public.claim_pairs_atomic(
  p_pair_ids   uuid[],
  p_cart_token text,
  p_held_until timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_now         timestamptz := now();
  v_expected    integer     := cardinality(p_pair_ids);
  v_claimed     integer;
  v_diamond_ids uuid[];
  v_d_expected  integer;
BEGIN
  IF v_expected = 0 THEN
    RETURN TRUE;
  END IF;

  -- Step 1: Claim all pairs in one UPDATE.
  -- Requires is_published = true; expired holds are re-claimable.
  WITH claimed AS (
    UPDATE public.diamond_pairs
    SET status       = 'reserved',
        held_until   = p_held_until,
        held_by_cart = p_cart_token
    WHERE id = ANY(p_pair_ids)
      AND is_published = true
      AND (
        status = 'available'
        OR (status = 'reserved' AND held_until < v_now)
      )
    RETURNING diamond_id_a, diamond_id_b
  )
  SELECT
    COUNT(*)::integer,
    COALESCE(array_agg(diamond_id_a), '{}') ||
    COALESCE(array_agg(diamond_id_b), '{}')
  INTO v_claimed, v_diamond_ids
  FROM claimed;

  -- Count mismatch covers: duplicate IDs, missing IDs, unpublished, sold pairs.
  IF v_claimed IS DISTINCT FROM v_expected THEN
    RAISE EXCEPTION
      'claim_pairs_atomic: only % of % pairs were claimable. All claims rolled back.',
      COALESCE(v_claimed, 0), v_expected
    USING ERRCODE = '40001';
  END IF;

  -- Step 2: Reserve all constituent diamonds.
  v_d_expected := cardinality(v_diamond_ids);

  UPDATE public.diamonds
  SET status       = 'reserved',
      held_until   = p_held_until,
      held_by_cart = p_cart_token
  WHERE id = ANY(v_diamond_ids)
    AND (
      status = 'available'
      OR (status = 'reserved' AND held_until < v_now)
      OR (status = 'reserved' AND held_by_cart = p_cart_token)
    );

  -- Step 3: Verify all diamonds were reserved.
  IF (
    SELECT COUNT(*) FROM public.diamonds
    WHERE id = ANY(v_diamond_ids)
      AND status       = 'reserved'
      AND held_by_cart = p_cart_token
  ) < v_d_expected THEN
    RAISE EXCEPTION
      'claim_pairs_atomic: one or more constituent diamonds were unavailable. All claims rolled back.'
    USING ERRCODE = '40001';
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_pairs_atomic(uuid[], text, timestamptz)
  TO service_role;
