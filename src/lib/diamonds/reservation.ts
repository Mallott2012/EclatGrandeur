import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Atomically claims a diamond reservation for a cart.
 * Succeeds only if diamond is available OR its existing hold has expired.
 * Returns true if the claim succeeded, false if actively held by another cart
 * OR if the diamond belongs to an active published pair (those are only
 * reservable as part of the pair via claimPair / claimPairsAtomically).
 */
export async function claimDiamond(
  diamondId: string,
  cartToken: string,
): Promise<boolean> {
  const admin = createAdminClient()

  // Guard: reject if this diamond is currently locked by an active pair.
  //
  // Uses the same three-condition lock definition as getActivePairDiamondIds
  // and migration 0032:
  //   1. status = 'sold'                              → permanent lock
  //   2. is_published = true AND status = 'available' → live in catalogue
  //   3. status = 'reserved' AND held_until > now     → unexpired reservation
  //
  // Expired-hold pairs (held_until ≤ now) do NOT block — the diamond is free
  // for individual use once its pair's hold expires.
  const now = new Date().toISOString()

  const { count: pairCount } = await admin
    .from('diamond_pairs')
    .select('id', { count: 'exact', head: true })
    .or(
      `status.eq.sold,` +
      `and(is_published.eq.true,status.eq.available),` +
      `and(status.eq.reserved,held_until.gt.${now})`
    )
    .or(`diamond_id_a.eq.${diamondId},diamond_id_b.eq.${diamondId}`)

  if ((pairCount ?? 0) > 0) return false

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  const { data } = await admin
    .from('diamonds')
    .update({
      status:       'reserved',
      held_until:   expiresAt,
      held_by_cart: cartToken,
    })
    .eq('id', diamondId)
    .eq('is_published', true)
    .or(`status.eq.available,and(status.eq.reserved,held_until.lt.${now})`)
    .select('id')
    .maybeSingle()

  return data !== null
}

/**
 * Releases a diamond hold. Only succeeds when held_by_cart matches the token.
 * Silently a no-op if the hold has already expired or been released.
 */
export async function releaseDiamond(
  diamondId: string,
  cartToken: string,
): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('diamonds')
    .update({ status: 'available', held_until: null, held_by_cart: null })
    .eq('id', diamondId)
    .eq('held_by_cart', cartToken)
}

/**
 * Returns true if the diamond is actively reserved by the given cart token
 * and the hold has not expired.
 */
export async function isHoldValid(
  diamondId: string,
  cartToken: string,
): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('diamonds')
    .select('id')
    .eq('id', diamondId)
    .eq('status', 'reserved')
    .eq('held_by_cart', cartToken)
    .gt('held_until', new Date().toISOString())
    .maybeSingle()

  return data !== null
}
