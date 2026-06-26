-- ─────────────────────────────────────────────────────────────────────────────
-- 0031_pair_reservation_functions.sql
--
-- Phase E1 integrity patch: atomic pair-reservation PostgreSQL functions.
--
-- Problem addressed:
--   claimPair() (TypeScript, 0029) only reserved the diamond_pairs row.
--   It did not update the constituent diamonds' status, leaving a window where
--   a reserved pair's stones could still appear in ring-selection results and
--   be claimed individually. A partial state (pair reserved, left diamond
--   available, right diamond unavailable) was possible.
--
-- Solution:
--   Three server-side functions executed as single PostgreSQL transactions.
--   All or nothing — a RAISE EXCEPTION rolls back every UPDATE in the same
--   function call because PL/pgSQL functions run inside an implicit transaction.
--
-- Creates:
--   public.claim_pair_atomic(uuid, text, timestamptz)  → boolean
--   public.release_pair_atomic(uuid, text)             → void
--   public.claim_pairs_atomic(uuid[], text, timestamptz) → boolean
--
-- claim_pair_atomic:
--   Reserves the pair row AND both constituent diamond rows simultaneously.
--   Returns FALSE if the pair is already held by another cart (no exception).
--   Raises serialization_failure if either constituent diamond is individually
--   reserved by a different cart — rolling back the pair update too.
--
-- release_pair_atomic:
--   Releases pair AND constituent diamonds in one statement each.
--   Only acts when held_by_cart matches the supplied token.
--   A wrong token is a silent no-op — nothing is released.
--   A sold pair is never released (WHERE status = 'reserved' guard).
--
-- claim_pairs_atomic:
--   All-or-nothing claim of N pairs and their 2N constituent diamonds.
--   Raises serialization_failure on partial failure, rolling back all updates.
--   Designed for drop-earring products that require two required pairs.
--
-- Idempotency: CREATE OR REPLACE throughout. No tables created or modified.
-- Forward-only. Safe to replay.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1. claim_pair_atomic ──────────────────────────────────────────────────────
--
-- Returns:
--   TRUE   — pair and both diamonds are now reserved by p_cart_token
--   FALSE  — pair is held by another cart with a valid hold (no changes made)
-- Raises:
--   serialization_failure — pair claim succeeded but ≥1 constituent diamond is
--     held by a different cart; the pair UPDATE is rolled back as part of the
--     same implicit transaction.

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
  -- Eligible pairs: status='available', OR reserved with an expired hold.
  UPDATE public.diamond_pairs
  SET status       = 'reserved',
      held_until   = p_held_until,
      held_by_cart = p_cart_token
  WHERE id = p_pair_id
    AND (
      status = 'available'
      OR (status = 'reserved' AND held_until < v_now)
    )
  RETURNING diamond_id_a, diamond_id_b
  INTO v_diamond_a, v_diamond_b;

  -- No row returned → pair held by another cart with a valid hold.
  IF v_diamond_a IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Step 2: Reserve both constituent diamonds in one UPDATE.
  -- Eligible diamonds: available, OR reserved with an expired hold, OR already
  -- held by this cart (idempotent renewal of the same reservation).
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

  -- Fewer than 2 diamonds updated → at least one is held by a different cart.
  -- RAISE rolls back the pair UPDATE from Step 1 automatically.
  IF v_updated < 2 THEN
    RAISE EXCEPTION
      'claim_pair_atomic: constituent diamond(s) unavailable (% of 2 updated). Pair claim rolled back.',
      v_updated
    USING ERRCODE = '40001';  -- serialization_failure
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_pair_atomic(uuid, text, timestamptz)
  TO service_role;


-- ── 2. release_pair_atomic ────────────────────────────────────────────────────
--
-- Releases the pair and both constituent diamonds atomically.
-- Silent no-op in all non-owning cases:
--   - wrong cart token
--   - pair not in 'reserved' status (sold, available)
--   - pair not found

CREATE OR REPLACE FUNCTION public.release_pair_atomic(
  p_pair_id    uuid,
  p_cart_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_diamond_a uuid;
  v_diamond_b uuid;
BEGIN
  -- Step 1: Release the pair only when this cart owns it AND it is reserved.
  -- 'sold' pairs are protected by the WHERE status = 'reserved' guard.
  UPDATE public.diamond_pairs
  SET status       = 'available',
      held_until   = NULL,
      held_by_cart = NULL
  WHERE id           = p_pair_id
    AND status       = 'reserved'
    AND held_by_cart = p_cart_token
  RETURNING diamond_id_a, diamond_id_b
  INTO v_diamond_a, v_diamond_b;

  -- No row updated → wrong token, already available, or sold. Do nothing.
  IF v_diamond_a IS NULL THEN
    RETURN;
  END IF;

  -- Step 2: Release constituent diamonds held by this cart only.
  -- The AND status = 'reserved' guard prevents touching sold diamonds.
  UPDATE public.diamonds
  SET status       = 'available',
      held_until   = NULL,
      held_by_cart = NULL
  WHERE id IN (v_diamond_a, v_diamond_b)
    AND status       = 'reserved'
    AND held_by_cart = p_cart_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_pair_atomic(uuid, text)
  TO service_role;


-- ── 3. claim_pairs_atomic ─────────────────────────────────────────────────────
--
-- All-or-nothing reservation of multiple pairs and all their constituent
-- diamonds in a single implicit transaction.
--
-- Designed for drop-earring products where TWO required pairs (top + drop)
-- must both be reserved before the customer can proceed. If either pair or
-- any constituent diamond is unavailable, nothing is reserved.
--
-- Returns:
--   TRUE   — all pairs and all constituent diamonds are now reserved
-- Raises:
--   serialization_failure — any pair or diamond was not available; all updates
--     are rolled back by PostgreSQL's implicit transaction.
--
-- Trivial case: empty array input returns TRUE without touching the DB.

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
  -- Trivial case: nothing to claim.
  IF v_expected = 0 THEN
    RETURN TRUE;
  END IF;

  -- Step 1: Claim all pairs in one UPDATE statement.
  WITH claimed AS (
    UPDATE public.diamond_pairs
    SET status       = 'reserved',
        held_until   = p_held_until,
        held_by_cart = p_cart_token
    WHERE id = ANY(p_pair_ids)
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

  IF v_claimed IS DISTINCT FROM v_expected THEN
    RAISE EXCEPTION
      'claim_pairs_atomic: only % of % pairs were available. All claims rolled back.',
      COALESCE(v_claimed, 0), v_expected
    USING ERRCODE = '40001';
  END IF;

  -- Step 2: Reserve all constituent diamonds (2 per pair) in one UPDATE.
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
