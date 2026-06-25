'use server'

import { createAdminClient }             from '@/lib/supabase/admin'
import { isEclatEligible }               from '@/lib/diamonds/eligibility'
import { claimDiamond }                  from '@/lib/diamonds/reservation'
import { parseMetalVariants, METAL_DISPLAY } from '@/lib/gallery/types'
import type { ConfiguredEngagementRing } from '@/types'

type ReserveResult =
  | { ok: true;  ring: ConfiguredEngagementRing }
  | { ok: false; error: string }

function toPence(gbp: number): number {
  return Math.round(gbp * 100)
}

function buildDiamondDescription(d: {
  cut:               string;
  carat:             number;
  colour:            string;
  clarity:           string;
  diamond_category:  string;
  colour_family:     string | null;
  colour_intensity:  string | null;
}): string {
  if (d.diamond_category === 'coloured') {
    const intensityLabels: Record<string, string> = {
      fancy_light:   'Fancy Light',
      fancy:         'Fancy',
      fancy_intense: 'Fancy Intense',
      fancy_vivid:   'Fancy Vivid',
    }
    const familyLabels: Record<string, string> = { yellow: 'Yellow', pink: 'Pink' }
    const parts = [`${d.carat.toFixed(2)}ct`]
    if (d.colour_intensity) parts.push(intensityLabels[d.colour_intensity] ?? d.colour_intensity)
    if (d.colour_family)    parts.push(familyLabels[d.colour_family] ?? d.colour_family)
    parts.push(d.cut.charAt(0).toUpperCase() + d.cut.slice(1))
    parts.push(`· ${d.clarity}`)
    return parts.join(' ')
  }
  return `${d.carat.toFixed(2)}ct ${d.cut.charAt(0).toUpperCase() + d.cut.slice(1)} · ${d.colour} · ${d.clarity}`
}

/**
 * Server action: validates a full ring configuration and atomically reserves
 * the diamond for 60 minutes under the given cart token.
 *
 * All prices are fetched server-side; no client-supplied price is trusted.
 * Returns a locked ConfiguredEngagementRing (prices in pence) or an error string.
 */
export async function validateAndReserveConfiguredRing(
  settingId:     string,
  metalVariantId: string,
  diamondId:     string,
  ringSize:      string | null,
  cartToken:     string,
): Promise<ReserveResult> {
  const admin = createAdminClient()

  // ── Step 1–2: load setting + verify published ──────────────────────────────

  const { data: setting, error: settingErr } = await admin
    .from('ring_settings')
    .select('id, name, slug, is_published, diamond_shapes, min_carat, max_carat, ring_sizes, requires_ring_size_selection, base_price_gbp, metal_variants')
    .eq('id', settingId)
    .maybeSingle()

  if (settingErr || !setting) return { ok: false, error: 'Ring setting not found.' }
  if (!setting.is_published)  return { ok: false, error: 'Ring setting is not available.' }

  // ── Step 3: validate metal variant ────────────────────────────────────────

  const variants = parseMetalVariants(setting.metal_variants) ?? []
  const variant  = variants.find(v => v.id === metalVariantId)
  if (!variant || !variant.enabled) return { ok: false, error: 'Selected metal option is not available.' }

  // ── Step 4–5: load diamond + verify published ──────────────────────────────

  const { data: diamond, error: diaErr } = await admin
    .from('diamonds')
    .select('id, sku, cut, carat, colour, clarity, fluorescence, price_gbp, is_published, status, held_until, cut_grade, polish, symmetry, diamond_category, colour_family, colour_intensity, eclat_approved')
    .eq('id', diamondId)
    .maybeSingle()

  if (diaErr || !diamond) return { ok: false, error: 'Diamond not found.' }
  if (!diamond.is_published) return { ok: false, error: 'Diamond is not available.' }

  // ── Step 6: diamond is claimable (available or expired hold) ──────────────

  const now = new Date()
  const isClaimable =
    diamond.status === 'available' ||
    (diamond.status === 'reserved' &&
      diamond.held_until !== null &&
      new Date(diamond.held_until) < now)

  if (!isClaimable) {
    return { ok: false, error: 'This diamond is no longer available — it may have been reserved by another customer.' }
  }

  // ── Step 7: eligibility ────────────────────────────────────────────────────

  if (!isEclatEligible({
    cut:            diamond.cut,
    cut_grade:      diamond.cut_grade,
    polish:         diamond.polish,
    symmetry:       diamond.symmetry,
    fluorescence:   diamond.fluorescence,
    eclat_approved: diamond.eclat_approved,
  })) {
    return { ok: false, error: 'Diamond is not currently available.' }
  }

  // ── Step 8: category (white or coloured only) ──────────────────────────────

  if (diamond.diamond_category !== 'white' && diamond.diamond_category !== 'coloured') {
    return { ok: false, error: 'Diamond is not available.' }
  }

  // ── Step 9: coloured family must be yellow or pink ─────────────────────────

  if (
    diamond.diamond_category === 'coloured' &&
    diamond.colour_family !== 'yellow' &&
    diamond.colour_family !== 'pink'
  ) {
    return { ok: false, error: 'Diamond is not available.' }
  }

  // ── Step 10: shape compatibility ───────────────────────────────────────────

  const compatShapes = (setting.diamond_shapes as string[]) ?? []
  if (!compatShapes.includes(diamond.cut)) {
    return { ok: false, error: 'This diamond shape is not compatible with the selected setting.' }
  }

  // ── Step 11: carat range ───────────────────────────────────────────────────

  const minCarat = setting.min_carat != null ? parseFloat(String(setting.min_carat)) : null
  const maxCarat = setting.max_carat != null ? parseFloat(String(setting.max_carat)) : null
  if (minCarat !== null && diamond.carat < minCarat) {
    return { ok: false, error: 'This diamond is below the minimum carat for this setting.' }
  }
  if (maxCarat !== null && diamond.carat > maxCarat) {
    return { ok: false, error: 'This diamond exceeds the maximum carat for this setting.' }
  }

  // ── Step 12: ring size (if required) ──────────────────────────────────────

  const requiresSize = setting.requires_ring_size_selection ?? true
  const validSizes   = (setting.ring_sizes as string[]) ?? []
  if (requiresSize && (!ringSize || !validSizes.includes(ringSize))) {
    return { ok: false, error: 'Please select a ring size to continue.' }
  }

  // ── Step 13: atomic claim ──────────────────────────────────────────────────

  const claimed = await claimDiamond(diamondId, cartToken)
  if (!claimed) {
    return { ok: false, error: 'This diamond is no longer available — it may have been reserved by another customer.' }
  }

  // ── Build locked ConfiguredEngagementRing (all prices server-side) ─────────

  const settingPriceGBP = variant.price ?? (setting.base_price_gbp ? parseFloat(String(setting.base_price_gbp)) : 0)
  const diamondPriceGBP = diamond.price_gbp as number

  const settingPricePence = toPence(settingPriceGBP)
  const diamondPricePence = toPence(diamondPriceGBP)

  const ring: ConfiguredEngagementRing = {
    settingId:            setting.id,
    settingName:          setting.name,
    settingSlug:          setting.slug,
    metalVariantId:       variant.id,
    metal:                variant.metal,
    metalLabel:           METAL_DISPLAY[variant.metal],
    diamondId:            diamond.id,
    diamondSku:           diamond.sku,
    diamondDescription:   buildDiamondDescription(diamond),
    diamondCategory:      diamond.diamond_category as 'white' | 'coloured',
    diamondShape:         diamond.cut,
    diamondCarat:         diamond.carat,
    colourFamily:         (diamond.colour_family ?? undefined) as 'yellow' | 'pink' | undefined,
    colourIntensity:      diamond.colour_intensity ?? undefined,
    ringSize:             ringSize,
    settingPrice:         settingPricePence,
    diamondPrice:         diamondPricePence,
    totalPrice:           settingPricePence + diamondPricePence,
    reservationExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  }

  return { ok: true, ring }
}
