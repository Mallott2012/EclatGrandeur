'use server';

import { createAdminClient }                 from '@/lib/supabase/admin';
import { reserveVariant, getVariantForSale } from '@/lib/earrings/variants';
import { parseGalleryConfig, METAL_DISPLAY } from '@/lib/gallery/types';
import { toPence }                           from '@/lib/earrings/cart-helpers';
import type { ConfiguredEarring }            from '@/types';
import type { MetalKey }                     from '@/lib/gallery/types';

type ReserveEarringResult =
  | { ok: true;  earring: ConfiguredEarring }
  | { ok: false; error: string };

/**
 * Server action: validates a chosen earring variant against the live database,
 * reserves it (one-of-one 'available' variants take a cart hold; 'made_to_order'
 * variants need none), and returns a locked ConfiguredEarring snapshot.
 *
 * The price is taken from the database variant, never trusted from the client.
 * Prices in the snapshot are MINOR units (pence).
 */
export async function validateAndReserveEarringVariant(
  productId: string,
  variantId: string,
  cartToken: string,
): Promise<ReserveEarringResult> {
  const admin = createAdminClient();

  // 1. Product snapshot (must be a published earring)
  const { data: product } = await admin
    .from('jewellery_products')
    .select('id, name, slug, category, earring_type, gallery_config')
    .eq('id', productId)
    .eq('is_published', true)
    .maybeSingle();

  if (!product || (product.category as string) !== 'earrings') {
    return { ok: false, error: 'This earring is no longer available.' };
  }

  // 2. Authoritative variant facts (server price + availability)
  const sale = await getVariantForSale(productId, variantId);
  if (!sale || !sale.is_published) {
    return { ok: false, error: 'This earring configuration is no longer available.' };
  }

  // 3. Reserve (atomic hold for one-of-one stock; no-op for made-to-order)
  const res = await reserveVariant(productId, variantId, cartToken);
  if (!res.ok) {
    return { ok: false, error: res.reason ?? 'This earring could not be reserved. Please try again.' };
  }

  // 4. Build snapshot
  const galleryConfig = parseGalleryConfig(product.gallery_config);
  const metalLabel = METAL_DISPLAY[sale.metal as MetalKey] ?? sale.metal;

  const earring: ConfiguredEarring = {
    productId,
    productSlug:          product.slug as string,
    productName:          product.name as string,
    productMedia:         galleryConfig.topLeft?.url ?? '',
    variantId,
    metalVariantId:       sale.metal,
    metalLabel,
    earringType:          (product.earring_type as string) ?? 'other',
    totalCarat:           sale.total_carat,
    colour:               sale.colour,
    clarity:              sale.clarity,
    availability:         res.availability ?? (sale.availability as 'available' | 'made_to_order'),
    totalPrice:           toPence(sale.price_gbp),
    currency:             sale.currency ?? 'GBP',
    reservationExpiresAt: res.reservationExpiresAt,
    addedAt:              new Date().toISOString(),
  };

  return { ok: true, earring };
}
