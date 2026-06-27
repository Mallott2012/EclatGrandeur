'use server';

import { createAdminClient }                       from '@/lib/supabase/admin';
import { validateEarringConfiguration,
         preflightPairReservation,
         calculateEarringConfigurationPrice }       from '@/lib/earrings/configuration';
import { claimPairsAtomically }                    from '@/lib/pairs/reservation';
import { listSlotsForProduct }                     from '@/lib/pairs/service';
import { parseGalleryConfig, METAL_DISPLAY }       from '@/lib/gallery/types';
import { buildPairDescription, toPence,
         buildEarringCartLineId }                  from '@/lib/earrings/cart-helpers';
import type { ConfiguredEarring, ConfiguredEarringSlot } from '@/types';
import type { MetalKey }                           from '@/lib/gallery/types';

type ReserveEarringResult =
  | { ok: true;  earring: ConfiguredEarring }
  | { ok: false; error: string };

/**
 * Server action: validates a full earring configuration, atomically reserves all
 * selected pairs, and returns a locked ConfiguredEarring snapshot.
 *
 * All prices are fetched server-side (never trusted from the client).
 * Prices stored in the snapshot are in MINOR units (pence).
 */
export async function validateAndReserveEarringConfiguration(
  productId:     string,
  metalVariantId: string | null,
  selectedPairs: Array<{ slotKey: string; pairId: string }>,
  cartToken:     string,
): Promise<ReserveEarringResult> {
  const admin = createAdminClient();

  // ── 1. Validate full configuration (structure + availability + compatibility) ──
  const validation = await validateEarringConfiguration({
    jewelleryProductId: productId,
    metalVariantId:     metalVariantId ?? undefined,
    selectedPairs,
  });

  if (!validation.valid) {
    const first = validation.errors[0];
    if (first?.code === 'pair_unavailable') {
      return { ok: false, error: 'One of your selected diamond pairs is no longer available. Please choose another option.' };
    }
    return { ok: false, error: 'Your earring configuration is no longer valid. Please review your selections.' };
  }

  // ── 2. Pre-flight check (no mutations) ────────────────────────────────────────
  const preflight = await preflightPairReservation({
    jewelleryProductId: productId,
    metalVariantId:     metalVariantId ?? undefined,
    selectedPairs,
  });

  if (!preflight.canClaim) {
    return { ok: false, error: 'One of your selected diamond pairs is no longer available. Please choose another option.' };
  }

  // ── 3. Compute server-side price ──────────────────────────────────────────────
  const priceResult = await calculateEarringConfigurationPrice({
    jewelleryProductId: productId,
    metalVariantId:     metalVariantId ?? undefined,
    selectedPairs,
  });

  // ── 4. Fetch product snapshot (name, slug, media, earring_type) ───────────────
  const { data: product } = await admin
    .from('jewellery_products')
    .select('id, name, slug, earring_type, gallery_config, metal_variants')
    .eq('id', productId)
    .eq('is_published', true)
    .maybeSingle();

  if (!product) {
    return { ok: false, error: 'This earring is no longer available.' };
  }

  const galleryConfig = parseGalleryConfig(product.gallery_config);
  const productMedia  = galleryConfig.topLeft?.url ?? '';

  // ── 5. Determine metal label ──────────────────────────────────────────────────
  let metalLabel = metalVariantId ? (METAL_DISPLAY[metalVariantId as MetalKey] ?? metalVariantId) : '';
  if (!metalLabel && metalVariantId) {
    // Fallback: look up in metal_variants JSONB
    try {
      const rawVariants = product.metal_variants as Array<{ id?: string; label?: string; metal?: string }> | null;
      const variant = rawVariants?.find(v => v.id === metalVariantId || v.metal === metalVariantId);
      metalLabel = variant?.label ?? variant?.metal ?? metalVariantId;
    } catch {
      metalLabel = metalVariantId;
    }
  }

  // ── 6. Fetch slot labels ──────────────────────────────────────────────────────
  const slots = await listSlotsForProduct(productId).catch(() => []);
  const slotLabelMap = new Map(slots.map(s => [s.slot_key, s.label ?? s.slot_key]));

  // ── 7. Fetch pair descriptions (shape, carat, colour, clarity) ────────────────
  const pairIds = selectedPairs.map(sp => sp.pairId);
  const { data: pairRows } = await admin
    .from('diamond_pairs')
    .select('id, shape, total_carat, carat_per_stone, colour, clarity, colour_description')
    .in('id', pairIds);

  const pairDescMap = new Map<string, string>();
  for (const row of (pairRows ?? [])) {
    pairDescMap.set(row.id as string, buildPairDescription({
      shape:             row.shape as string,
      totalCarat:        parseFloat(String(row.total_carat ?? 0)),
      caratPerStone:     row.carat_per_stone ? parseFloat(String(row.carat_per_stone)) : null,
      colour:            row.colour as string | null,
      clarity:           row.clarity as string | null,
      colourDescription: row.colour_description as string | null,
    }));
  }

  // ── 8. Atomic reservation — all pairs or none ─────────────────────────────────
  const claimed = await claimPairsAtomically({ pairIds, cartToken });
  if (!claimed) {
    return { ok: false, error: 'One of your selected diamond pairs is no longer available. Please choose another option.' };
  }

  // ── 9. Build per-slot price map ───────────────────────────────────────────────
  const slotPriceMap = new Map(priceResult.selectedPairs.map(sp => [sp.slotKey, sp.pairPrice]));

  // ── 10. Build ConfiguredEarring snapshot ──────────────────────────────────────
  const reservationExpiresAt = new Date(Date.now() + 60 * 60_000).toISOString();

  const configuredSlots: ConfiguredEarringSlot[] = selectedPairs.map(sp => ({
    slotKey:         sp.slotKey,
    slotLabel:       slotLabelMap.get(sp.slotKey) ?? sp.slotKey,
    pairId:          sp.pairId,
    pairDescription: pairDescMap.get(sp.pairId) ?? sp.pairId,
    pairPrice:       toPence(slotPriceMap.get(sp.slotKey) ?? 0),
  }));

  const earring: ConfiguredEarring = {
    productId,
    productSlug:          product.slug as string,
    productName:          product.name as string,
    productMedia,
    metalVariantId,
    metalLabel,
    earringType:          (product.earring_type as string) ?? 'other',
    settingPrice:         toPence(priceResult.basePrice),
    selectedSlots:        configuredSlots,
    totalPrice:           toPence(priceResult.totalPrice),
    currency:             'GBP',
    reservationExpiresAt,
    addedAt:              new Date().toISOString(),
  };

  return { ok: true, earring };
}
