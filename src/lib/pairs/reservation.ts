import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

const HOLD_MINUTES = 60;

// ── claimPair ─────────────────────────────────────────────────────────────────

/**
 * Atomically claim a diamond pair for a cart.
 *
 * Delegates to the `claim_pair_atomic` PostgreSQL function (migration 0031),
 * which runs as a single implicit transaction:
 *   1. UPDATE diamond_pairs  (pair → reserved)
 *   2. UPDATE diamonds × 2  (both constituents → reserved, same held_until)
 *
 * If either constituent diamond is held by a different cart, the ENTIRE
 * transaction is rolled back — the pair remains in its previous state and
 * the partial state (pair reserved + diamond available) is impossible.
 *
 * Returns:
 *   true  — pair and both diamonds are now reserved by cartToken
 *   false — pair is held by another cart OR a constituent diamond is
 *            individually reserved by a different cart
 */
export async function claimPair(
  pairId:    string,
  cartToken: string,
): Promise<boolean> {
  const supabase  = createAdminClient();
  const heldUntil = new Date(Date.now() + HOLD_MINUTES * 60_000).toISOString();

  const { data, error } = await supabase.rpc('claim_pair_atomic', {
    p_pair_id:    pairId,
    p_cart_token: cartToken,
    p_held_until: heldUntil,
  });

  if (error) {
    // serialization_failure (40001) from PostgreSQL means constituent diamonds
    // were unavailable; the pair UPDATE was rolled back. Return false — nothing
    // was reserved, consistent with the "another cart holds it" code path.
    if (
      error.code === '40001' ||
      error.message.includes('claim_pair_atomic:')
    ) {
      return false;
    }
    throw new Error(`claimPair: ${error.message}`);
  }

  return data === true;
}

// ── releasePair ───────────────────────────────────────────────────────────────

/**
 * Atomically release a pair and both constituent diamonds.
 *
 * Delegates to the `release_pair_atomic` PostgreSQL function (migration 0031).
 *
 * Only the owning cart can release. Wrong-token calls are silent no-ops.
 * Sold pairs are never released (the DB function guards status = 'reserved').
 */
export async function releasePair(
  pairId:    string,
  cartToken: string,
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.rpc('release_pair_atomic', {
    p_pair_id:    pairId,
    p_cart_token: cartToken,
  });

  if (error) throw new Error(`releasePair: ${error.message}`);
}

// ── claimPairsAtomically ──────────────────────────────────────────────────────

/**
 * All-or-nothing atomic reservation of multiple pairs and all their constituent
 * diamonds in a single PostgreSQL transaction.
 *
 * Intended for products requiring more than one pair (e.g. drop earrings:
 * top_pair + drop_pair). If any pair or constituent diamond is unavailable,
 * the PostgreSQL function raises an exception, rolling back all changes.
 *
 * The caller receives false — nothing was reserved — and must inform the user
 * that one or more items are no longer available.
 *
 * Returns:
 *   true  — every pair and every constituent diamond is now reserved
 *   false — at least one item was unavailable; nothing was changed
 */
export async function claimPairsAtomically(opts: {
  pairIds:      string[];
  cartToken:    string;
  holdMinutes?: number;
}): Promise<boolean> {
  if (opts.pairIds.length === 0) return true;

  const supabase  = createAdminClient();
  const minutes   = opts.holdMinutes ?? HOLD_MINUTES;
  const heldUntil = new Date(Date.now() + minutes * 60_000).toISOString();

  const { data, error } = await supabase.rpc('claim_pairs_atomic', {
    p_pair_ids:   opts.pairIds,
    p_cart_token: opts.cartToken,
    p_held_until: heldUntil,
  });

  if (error) {
    // serialization_failure = all-or-nothing rollback occurred; nothing reserved
    if (
      error.code === '40001' ||
      error.message.includes('claim_pairs_atomic:')
    ) {
      return false;
    }
    throw new Error(`claimPairsAtomically: ${error.message}`);
  }

  return data === true;
}

// ── isPairHoldValid ───────────────────────────────────────────────────────────

/**
 * Returns true when the pair is still reserved by this cart and the hold has
 * not expired. Used at checkout to confirm the reservation is live before
 * taking payment.
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
