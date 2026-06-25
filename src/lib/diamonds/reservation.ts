import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Atomically claims a diamond reservation for a cart.
 * Succeeds only if diamond is available OR its existing hold has expired.
 * Returns true if the claim succeeded, false if actively held by another cart.
 */
export async function claimDiamond(
  diamondId: string,
  cartToken: string,
): Promise<boolean> {
  const admin = createAdminClient()
  const now       = new Date().toISOString()
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
