'use server';

import { createAdminClient }                 from '@/lib/supabase/admin';
import { getOfferForSale }                    from '@/lib/earrings/offers';
import { parseGalleryConfig, METAL_DISPLAY }  from '@/lib/gallery/types';
import { toPence }                            from '@/lib/earrings/cart-helpers';
import type { ConfiguredEarring }             from '@/types';
import type { MetalKey }                      from '@/lib/gallery/types';

type SelectEarringResult =
  | { ok: true;  earring: ConfiguredEarring }
  | { ok: false; error: string };

/**
 * Server action: validates a chosen Earring Diamond Offer against the live database
 * and returns a locked ConfiguredEarring snapshot. The offer is a completed matched-
 * pair specification — there is no physical reservation/hold. The price is taken from
 * the database offer, never trusted from the client. Prices are MINOR units (pence).
 */
export async function validateAndSelectEarringOffer(
  productId: string,
  offerId:   string,
  metal:     string | null,
  cartToken: string,
): Promise<SelectEarringResult> {
  void cartToken; // offers are not exclusively reserved
  const admin = createAdminClient();

  const { data: product } = await admin
    .from('jewellery_products')
    .select('id, name, slug, category, earring_type, gallery_config')
    .eq('id', productId)
    .eq('is_published', true)
    .maybeSingle();

  if (!product || (product.category as string) !== 'earrings') {
    return { ok: false, error: 'This earring is no longer available.' };
  }

  const offer = await getOfferForSale(productId, offerId);
  if (!offer || !offer.is_published || offer.availability === undefined) {
    return { ok: false, error: 'This diamond pair offer is no longer available.' };
  }

  // Validate the chosen metal is supported by the offer (empty = all product metals).
  if (metal && offer.supported_metals.length > 0 && !offer.supported_metals.includes(metal)) {
    return { ok: false, error: 'This diamond pair is not available in the selected metal.' };
  }

  const galleryConfig = parseGalleryConfig(product.gallery_config);
  const metalLabel = metal ? (METAL_DISPLAY[metal as MetalKey] ?? metal) : '';

  const earring: ConfiguredEarring = {
    productId,
    productSlug:    product.slug as string,
    productName:    product.name as string,
    productMedia:   galleryConfig.topLeft?.url ?? '',
    offerId:        offer.id,
    metalVariantId: metal,
    metalLabel,
    earringType:    (product.earring_type as string) ?? 'other',
    cut:            offer.cut,
    totalCarat:     offer.total_carat,
    caratPerStone:  offer.carat_per_stone,
    colour:         offer.colour,
    clarity:        offer.clarity,
    availability:   offer.availability,
    totalPrice:     toPence(offer.price_gbp),
    currency:       offer.currency ?? 'GBP',
    addedAt:        new Date().toISOString(),
  };

  return { ok: true, earring };
}
