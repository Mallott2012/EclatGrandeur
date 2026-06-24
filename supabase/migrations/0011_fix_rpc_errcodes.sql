-- Phase 1A correction: fix conflicting ERRCODE in transition_diamond_status.
--
-- ERRCODE 'P0004' was used for 'already_in_target_status' but P0004 is
-- PostgreSQL's reserved SQLSTATE for assert_failure, which is one of two
-- conditions excluded from WHEN OTHERS THEN. Changed to 'P9004' (user-defined
-- class P9, not reserved by PostgreSQL), which is catchable by WHEN OTHERS.
--
-- All other ERRCODEs (P0005–P0022) are technically user-defined too (only
-- P0000–P0004 are reserved by PostgreSQL) and remain catchable by WHEN OTHERS.
-- This migration only changes P0004 to avoid the assert_failure collision.
--
-- Migration 0008 and 0010 on disk are also updated for fresh-setup correctness.

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
  --    P9004 used (not P0004 which conflicts with PostgreSQL assert_failure).
  IF v_effective_status = p_new_status AND NOT v_hold_was_expired THEN
    RAISE EXCEPTION 'already_in_target_status' USING ERRCODE = 'P9004';
  END IF;

  -- 6. Transition matrix and role verification.
  IF p_new_status = 'on_hold' THEN
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
    IF v_is_super_admin THEN
      NULL;
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
    IF v_original_status <> 'on_hold' THEN
      RAISE EXCEPTION 'invalid_transition: available requires on_hold source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF v_is_super_admin OR v_is_buyer THEN
      NULL;
    ELSIF v_is_adviser THEN
      IF v_diamond.held_by_user_id IS DISTINCT FROM p_actor_id THEN
        RAISE EXCEPTION 'cannot_release_others_hold' USING ERRCODE = 'P0012';
      END IF;
    ELSE
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'reserved' THEN
    IF v_original_status <> 'on_hold' THEN
      RAISE EXCEPTION 'invalid_transition: reserved requires on_hold source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'sold' THEN
    IF v_original_status <> 'reserved' THEN
      RAISE EXCEPTION 'invalid_transition: sold requires reserved source, got %',
        v_original_status::text USING ERRCODE = 'P0005';
    END IF;
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSIF p_new_status = 'removed' THEN
    IF NOT (v_is_super_admin OR v_is_buyer) THEN
      RAISE EXCEPTION 'insufficient_role_for_transition' USING ERRCODE = 'P0006';
    END IF;

  ELSE
    RAISE EXCEPTION 'unknown_target_status: %', p_new_status::text
      USING ERRCODE = 'P0013';
  END IF;

  -- 7. Write expired-hold audit action (if applicable).
  IF v_hold_was_expired THEN
    INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
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

  -- 9. Write primary action audit record.
  v_audit_event := CASE p_new_status
    WHEN 'on_hold'   THEN 'diamond.hold_created'
    WHEN 'available' THEN 'diamond.hold_released'
    ELSE                  'diamond.status_changed'
  END;

  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
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

  -- 10. Return role-safe result.
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

-- Re-apply access control after CREATE OR REPLACE.
REVOKE EXECUTE ON FUNCTION public.transition_diamond_status(
  uuid, uuid, public.diamond_status, timestamptz, text
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.transition_diamond_status(
  uuid, uuid, public.diamond_status, timestamptz, text
) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_diamond_status(
  uuid, uuid, public.diamond_status, timestamptz, text
) TO service_role;
