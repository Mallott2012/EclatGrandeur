-- Phase 1A: atomic hold and status transition RPCs.
--
-- TWO FUNCTIONS in this migration:
--   transition_diamond_status  handles all status changes including placing /
--     releasing holds, progressing to reserved/sold, and archiving. Also
--     atomically resolves expired holds when a new action is requested.
--   extend_diamond_hold  dedicated extension path; preserves original held_at;
--     enforces per-role duration limits anchored to that timestamp.
--
-- SECURITY MODEL (both functions):
--   SECURITY DEFINER, SET search_path = '': runs with definer privileges,
--     immune to search_path manipulation.
--   EXECUTE revoked from PUBLIC (covers anon + authenticated): PostgREST
--     cannot expose either function via /rpc/.
--   GRANT EXECUTE TO service_role only: callable exclusively from the
--     server-side admin client (import 'server-only').
--
-- CALLER INTEGRITY (enforced in T3 server wrappers, documented here):
--   p_actor_id MUST be resolved from requireStaffRole() on the server.
--   It MUST NOT be accepted from form data, route parameters, URL params,
--   or any other browser-controlled input. The server wrapper calls
--   requireStaffRole() first; only on success does it pass user.id as
--   p_actor_id to the RPC.
--
-- ATOMICITY:
--   Each function acquires FOR UPDATE on the target row before any check or
--   write. All checks, the UPDATE, and every audit INSERT execute in one
--   transaction. A raised exception rolls back the entire transaction and
--   leaves the diamond row unchanged.

-- =============================================================================
-- FUNCTION 1: transition_diamond_status
-- =============================================================================

CREATE OR REPLACE FUNCTION public.transition_diamond_status(
  p_actor_id        uuid,
  p_diamond_id      uuid,
  p_new_status      public.diamond_status,
  p_hold_expires_at timestamptz DEFAULT NULL,
  p_hold_reason     text        DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_diamond           public.diamonds%ROWTYPE;
  v_actor_roles       text[];
  v_is_super_admin    boolean;
  v_is_buyer          boolean;
  v_is_adviser        boolean;
  v_now               timestamptz            := now();
  v_original_status   public.diamond_status;
  v_effective_status  public.diamond_status;
  v_hold_was_expired  boolean                := false;
  v_expired_held_by   uuid;
  v_expired_at        timestamptz;
  v_expired_reason    text;
  v_audit_event       text;
BEGIN

  -- 1. Resolve actor roles from staff_roles.
  --    Queried inside the function so role state is current at call time.
  SELECT array_agg(sr.role::text) INTO v_actor_roles
  FROM public.staff_roles sr
  WHERE sr.user_id = p_actor_id;

  IF v_actor_roles IS NULL OR array_length(v_actor_roles, 1) IS NULL THEN
    RAISE EXCEPTION 'actor_not_staff' USING ERRCODE = 'P0001';
  END IF;

  v_is_super_admin := 'super_admin'   = ANY(v_actor_roles);
  v_is_buyer       := 'diamond_buyer' = ANY(v_actor_roles);
  v_is_adviser     := 'sales_adviser' = ANY(v_actor_roles);

  -- 2. Lock the target row before any check or write.
  SELECT * INTO v_diamond
  FROM public.diamonds
  WHERE id = p_diamond_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'diamond_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_original_status  := v_diamond.status;
  v_effective_status := v_diamond.status;

  -- 3. Reject terminal sources.
  IF v_original_status = 'sold' THEN
    RAISE EXCEPTION 'diamond_already_sold' USING ERRCODE = 'P0003';
  END IF;
  IF v_original_status = 'removed' THEN
    RAISE EXCEPTION 'diamond_already_removed' USING ERRCODE = 'P0003';
  END IF;

  -- 4. Expired-hold detection.
  --    Runs after FOR UPDATE lock; no other session can modify the row
  --    concurrently. An expired hold is treated as effective status 'available'
  --    for transition purposes. Only 'available', 'on_hold', and 'removed'
  --    are permitted from an expired hold; 'reserved' and 'sold' are blocked
  --    to force explicit expiry resolution before progression.
  IF v_original_status = 'on_hold' AND v_diamond.hold_expires_at <= v_now THEN
    v_hold_was_expired := true;
    v_expired_held_by  := v_diamond.held_by_user_id;
    v_expired_at       := v_diamond.hold_expires_at;
    v_expired_reason   := v_diamond.hold_reason;

    IF p_new_status NOT IN ('available', 'on_hold', 'removed') THEN
      RAISE EXCEPTION
        'expired_hold_must_be_released_first: cannot transition to % from an expired hold; use available or on_hold first',
        p_new_status::text
        USING ERRCODE = 'P0014';
    END IF;

    v_effective_status := 'available';
  END IF;

  -- 5. Same-status guard.
  --    Skipped when the hold was expired and the target is 'available', because
  --    effective status and target both read 'available' but the action is valid:
  --    it atomically expires the hold and confirms the stone as available.
  IF v_effective_status = p_new_status AND NOT v_hold_was_expired THEN
    RAISE EXCEPTION 'already_in_target_status' USING ERRCODE = 'P0004';
  END IF;

  -- 6. Transition matrix and role verification.

  IF p_new_status = 'on_hold' THEN
    -- Source: available (including effective-available from expired hold).
    IF v_effective_status <> 'available' THEN
      RAISE EXCEPTION 'invalid_transition: on_hold requires available source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF NOT (v_is_super_admin OR v_is_buyer OR v_is_adviser) THEN
      RAISE EXCEPTION 'insufficient_role_for_hold' USING ERRCODE = 'P0006';
    END IF;
    IF p_hold_expires_at IS NULL THEN
      RAISE EXCEPTION 'hold_expiry_required' USING ERRCODE = 'P0007';
    END IF;
    IF p_hold_reason IS NULL OR length(trim(p_hold_reason)) = 0 THEN
      RAISE EXCEPTION 'hold_reason_required' USING ERRCODE = 'P0008';
    END IF;
    IF p_hold_expires_at <= v_now THEN
      RAISE EXCEPTION 'hold_expiry_must_be_future' USING ERRCODE = 'P0009';
    END IF;
    -- Duration limits. super_admin checked first; a user may hold multiple roles.
    IF v_is_super_admin THEN
      NULL; -- No cap.
    ELSIF v_is_buyer THEN
      IF p_hold_expires_at > v_now + interval '7 days' THEN
        RAISE EXCEPTION 'hold_exceeds_7_day_buyer_limit' USING ERRCODE = 'P0010';
      END IF;
    ELSIF v_is_adviser THEN
      IF p_hold_expires_at > v_now + interval '48 hours' THEN
        RAISE EXCEPTION 'hold_exceeds_48_hour_adviser_limit' USING ERRCODE = 'P0011';
      END IF;
    END IF;

  ELSIF p_new_status = 'available' THEN
    -- Source: on_hold (live or expired; expired already corrected v_effective_status).
    IF v_original_status <> 'on_hold' THEN
      RAISE EXCEPTION 'invalid_transition: available requires on_hold source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF v_is_super_admin OR v_is_buyer THEN
      NULL; -- May release any hold.
    ELSIF v_is_adviser THEN
      -- Sales adviser may release only their own hold.
      IF v_diamond.held_by_user_id IS DISTINCT FROM p_actor_id THEN
        RAISE EXCEPTION 'cannot_release_others_hold' USING ERRCODE = 'P0012';
      END IF;
    ELSE
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'reserved' THEN
    -- Source: on_hold (live only; expired hold is blocked at step 4).
    IF v_original_status <> 'on_hold' THEN
      RAISE EXCEPTION 'invalid_transition: reserved requires on_hold source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'sold' THEN
    -- Source: reserved only.
    IF v_original_status <> 'reserved' THEN
      RAISE EXCEPTION 'invalid_transition: sold requires reserved source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'removed' THEN
    -- Source: any non-terminal status, including an expired on_hold stone.
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSE
    RAISE EXCEPTION 'unknown_target_status: %', p_new_status::text
      USING ERRCODE = 'P0013';
  END IF;

  -- 7. Write expired-hold audit event first (if applicable).
  --    Even though this INSERT and the status UPDATE share a transaction,
  --    logging the expiry before the new action makes the audit timeline clear.
  IF v_hold_was_expired THEN
    INSERT INTO public.audit_logs (actor_user_id, event, entity_type, entity_id, metadata)
    VALUES (
      p_actor_id,
      'diamond.hold_expired',
      'diamond',
      p_diamond_id,
      jsonb_build_object(
        'original_held_by', v_expired_held_by,
        'hold_expires_at',  v_expired_at,
        'hold_reason',      v_expired_reason,
        'resolved_by',      p_actor_id,
        'resolved_action',  p_new_status::text
      )
    );
  END IF;

  -- 8. Apply the status update.
  IF p_new_status = 'on_hold' THEN
    -- is_visible set to false: a held diamond is not publicly available.
    -- Visibility is never auto-restored after a hold ends; re-publication
    -- requires an explicit visibility update server action.
    UPDATE public.diamonds
    SET
      status          = 'on_hold',
      is_visible      = false,
      held_by_user_id = p_actor_id,
      held_at         = v_now,
      hold_expires_at = p_hold_expires_at,
      hold_reason     = p_hold_reason,
      updated_by      = p_actor_id,
      updated_at      = v_now
    WHERE id = p_diamond_id;

  ELSE
    -- All other transitions: clear hold fields.
    -- is_visible set to false for every non-'available' terminal/progression
    -- status. For 'available' the stone remains invisible until explicitly
    -- re-published; for sold/removed visibility is permanently ended.
    UPDATE public.diamonds
    SET
      status          = p_new_status,
      is_visible      = false,
      held_by_user_id = NULL,
      held_at         = NULL,
      hold_expires_at = NULL,
      hold_reason     = NULL,
      updated_by      = p_actor_id,
      updated_at      = v_now
    WHERE id = p_diamond_id;
  END IF;

  -- 9. Write primary action audit event.
  v_audit_event := CASE p_new_status
    WHEN 'on_hold'   THEN 'diamond.hold_created'
    WHEN 'available' THEN 'diamond.hold_released'
    ELSE                  'diamond.status_changed'
  END;

  INSERT INTO public.audit_logs (actor_user_id, event, entity_type, entity_id, metadata)
  VALUES (
    p_actor_id,
    v_audit_event,
    'diamond',
    p_diamond_id,
    jsonb_build_object(
      'old_status',       v_original_status::text,
      'new_status',       p_new_status::text,
      'hold_expires_at',  p_hold_expires_at,
      'hold_reason',      p_hold_reason,
      'was_expired_hold', v_hold_was_expired
    )
  );

  -- 10. Return role-safe result (no cost or internal fields).
  RETURN jsonb_build_object(
    'id',               p_diamond_id,
    'old_status',       v_original_status::text,
    'new_status',       p_new_status::text,
    'held_at',          CASE WHEN p_new_status = 'on_hold' THEN v_now     ELSE NULL END,
    'hold_expires_at',  CASE WHEN p_new_status = 'on_hold' THEN p_hold_expires_at ELSE NULL END,
    'was_expired_hold', v_hold_was_expired
  );

END;
$$;

-- =============================================================================
-- FUNCTION 2: extend_diamond_hold
-- =============================================================================
-- Dedicated extension path. Status remains 'on_hold'; only hold_expires_at
-- (and optionally hold_reason) changes. Separate from transition_diamond_status
-- because extension is not a status change and has distinct role rules and
-- parameters.
--
-- Duration limits are anchored to the ORIGINAL held_at, not the current time.
-- A sales adviser who placed a hold at T+0 has a ceiling of T+48 h regardless
-- of when they attempt to extend. Same principle applies to diamond_buyer (T+7d).
--
-- p_hold_reason: if non-null and non-empty, replaces the existing reason.
--   If null or blank, the existing hold_reason is preserved.
--   Super admins extending a hold beyond 7 days from original held_at must
--   ensure a reason is present (existing or newly provided).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.extend_diamond_hold(
  p_actor_id       uuid,
  p_diamond_id     uuid,
  p_new_expires_at timestamptz,
  p_hold_reason    text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_diamond          public.diamonds%ROWTYPE;
  v_actor_roles      text[];
  v_is_super_admin   boolean;
  v_is_buyer         boolean;
  v_is_adviser       boolean;
  v_now              timestamptz := now();
  v_final_reason     text;
  v_previous_expires timestamptz;
BEGIN

  -- 1. Resolve actor roles.
  SELECT array_agg(sr.role::text) INTO v_actor_roles
  FROM public.staff_roles sr
  WHERE sr.user_id = p_actor_id;

  IF v_actor_roles IS NULL OR array_length(v_actor_roles, 1) IS NULL THEN
    RAISE EXCEPTION 'actor_not_staff' USING ERRCODE = 'P0001';
  END IF;

  v_is_super_admin := 'super_admin'   = ANY(v_actor_roles);
  v_is_buyer       := 'diamond_buyer' = ANY(v_actor_roles);
  v_is_adviser     := 'sales_adviser' = ANY(v_actor_roles);

  -- 2. Lock the target row.
  SELECT * INTO v_diamond
  FROM public.diamonds
  WHERE id = p_diamond_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'diamond_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Verify the stone is on an active (non-expired) hold.
  IF v_diamond.status <> 'on_hold' THEN
    RAISE EXCEPTION 'diamond_not_on_hold: current status is %', v_diamond.status::text
      USING ERRCODE = 'P0015';
  END IF;
  IF v_diamond.hold_expires_at <= v_now THEN
    RAISE EXCEPTION
      'hold_already_expired: use transition_diamond_status to release or re-hold'
      USING ERRCODE = 'P0016';
  END IF;

  -- 4. New expiry must be strictly later than current expiry and in the future.
  IF p_new_expires_at IS NULL THEN
    RAISE EXCEPTION 'new_expires_at_required' USING ERRCODE = 'P0017';
  END IF;
  IF p_new_expires_at <= v_diamond.hold_expires_at THEN
    RAISE EXCEPTION 'new_expiry_must_exceed_current_expiry' USING ERRCODE = 'P0018';
  END IF;
  IF p_new_expires_at <= v_now THEN
    RAISE EXCEPTION 'new_expiry_must_be_future' USING ERRCODE = 'P0009';
  END IF;

  -- 5. Determine final reason: prefer new if provided and non-empty;
  --    otherwise preserve existing. chk_hold_fields guarantees the existing
  --    reason is non-empty, so v_final_reason will always be non-null here.
  v_final_reason := CASE
    WHEN p_hold_reason IS NOT NULL AND length(trim(p_hold_reason)) > 0
      THEN trim(p_hold_reason)
    ELSE v_diamond.hold_reason
  END;

  -- 6. Role checks and duration limits (anchored to original held_at).
  IF v_is_super_admin THEN
    -- No duration cap. Reason must be present if extending beyond 7 days.
    IF p_new_expires_at > v_diamond.held_at + interval '7 days'
       AND (v_final_reason IS NULL OR length(trim(v_final_reason)) = 0)
    THEN
      RAISE EXCEPTION 'hold_reason_required_for_super_admin_extended_hold'
        USING ERRCODE = 'P0019';
    END IF;

  ELSIF v_is_buyer THEN
    -- Max 7 days from original held_at.
    IF p_new_expires_at > v_diamond.held_at + interval '7 days' THEN
      RAISE EXCEPTION
        'extension_exceeds_7_day_buyer_limit_from_original_held_at'
        USING ERRCODE = 'P0020';
    END IF;

  ELSIF v_is_adviser THEN
    -- Own hold only; max 48 hours from original held_at.
    IF v_diamond.held_by_user_id IS DISTINCT FROM p_actor_id THEN
      RAISE EXCEPTION 'cannot_extend_others_hold' USING ERRCODE = 'P0021';
    END IF;
    IF p_new_expires_at > v_diamond.held_at + interval '48 hours' THEN
      RAISE EXCEPTION
        'extension_exceeds_48_hour_adviser_limit_from_original_held_at'
        USING ERRCODE = 'P0022';
    END IF;

  ELSE
    RAISE EXCEPTION 'insufficient_role_for_hold_extension' USING ERRCODE = 'P0006';
  END IF;

  -- 7. Snapshot previous expiry for audit trail.
  v_previous_expires := v_diamond.hold_expires_at;

  -- 8. Apply extension. held_at is intentionally NOT updated:
  --    duration limits are always anchored to the original hold timestamp.
  UPDATE public.diamonds
  SET
    hold_expires_at = p_new_expires_at,
    hold_reason     = v_final_reason,
    updated_by      = p_actor_id,
    updated_at      = v_now
  WHERE id = p_diamond_id;

  -- 9. Write audit event.
  INSERT INTO public.audit_logs (actor_user_id, event, entity_type, entity_id, metadata)
  VALUES (
    p_actor_id,
    'diamond.hold_extended',
    'diamond',
    p_diamond_id,
    jsonb_build_object(
      'previous_expires_at', v_previous_expires,
      'new_expires_at',      p_new_expires_at,
      'original_held_at',    v_diamond.held_at,
      'held_by_user_id',     v_diamond.held_by_user_id,
      'hold_reason',         v_final_reason
    )
  );

  -- 10. Return role-safe result.
  RETURN jsonb_build_object(
    'id',                  p_diamond_id,
    'previous_expires_at', v_previous_expires,
    'new_expires_at',      p_new_expires_at,
    'original_held_at',    v_diamond.held_at
  );

END;
$$;

-- =============================================================================
-- Access control for both functions
-- =============================================================================
-- Revoke from PUBLIC covers both the 'anon' and 'authenticated' roles.
-- PostgREST will not expose either function via /rpc/.

REVOKE EXECUTE ON FUNCTION public.transition_diamond_status(
  uuid, uuid, public.diamond_status, timestamptz, text
) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.extend_diamond_hold(
  uuid, uuid, timestamptz, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.transition_diamond_status(
  uuid, uuid, public.diamond_status, timestamptz, text
) TO service_role;

GRANT EXECUTE ON FUNCTION public.extend_diamond_hold(
  uuid, uuid, timestamptz, text
) TO service_role;
