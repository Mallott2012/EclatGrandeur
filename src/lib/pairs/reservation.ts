import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

const HOLD_MINUTES = 60;

// ── claimPair ─────────────────────────────────────────────────────────────────

/**
 * Atomically claim a diamond pair for a cart.
 *
 * Succeeds only when the pair is currently `available` (or has an expired hold).
 * On success: marks the pair `reserved`, sets held_until and held_by_cart.
 * Returns true when the hold was acquired; false when another cart owns it.
 *
 * Does NOT update the status of the individual constituent diamonds — those are
 * managed as a unit through the pair. Admin dashboards must consider pair status
 * when assessing individual diamond availability.
 */
export async function claimPair(
  pairId:    string,
  cartToken: string,
): Promise<boolean> {
  const supabase = createAdminClient();
  const now      = new Date().toISOString();
  const heldUntil = new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString();

  const { data, error } = await supabase
    .from('diamond_pairs')
    .update({
      status:       'reserved',
      held_until:   heldUntil,
      held_by_cart: cartToken,
    })
    .eq('id', pairId)
    .or(`status.eq.available,and(status.eq.reserved,held_until.lt.${now})`)
    .select('id')
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned (pair already held by another cart)
    throw new Error(`claimPair: ${error.message}`);
  }

  return data !== null;
}

// ── releasePair ───────────────────────────────────────────────────────────────

/**
 * Release a pair hold back to `available`.
 * Only the cart that holds the pair may release it — owned_by_cart must match.
 */
export async function releasePair(
  pairId:    string,
  cartToken: string,
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('diamond_pairs')
    .update({
      status:       'available',
      held_until:   null,
      held_by_cart: null,
    })
    .eq('id', pairId)
    .eq('held_by_cart', cartToken)
    .eq('status', 'reserved');

  if (error) throw new Error(`releasePair: ${error.message}`);
}

// ── isPairHoldValid ───────────────────────────────────────────────────────────

/**
 * Returns true when the pair is still held by this cart and the hold has not expired.
 * Used at checkout to confirm the reservation is live before payment.
 */
export async function isPairHoldValid(
  pairId:    string,
  cartToken: string,
): Promise<boolean> {
  const supabase = createAdminClient();
  const now      = new Date().toISOString();

  const { data, error } = await supabase
    .from('diamond_pairs')
    .select('id')
    .eq('id', pairId)
    .eq('status', 'reserved')
    .eq('held_by_cart', cartToken)
    .gt('held_until', now)
    .maybeSingle();

  if (error) throw new Error(`isPairHoldValid: ${error.message}`);
  return data !== null;
}
