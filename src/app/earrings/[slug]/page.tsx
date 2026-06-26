export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { JewelleryDetailPage, type JewelleryDetailProduct } from '@/components/jewellery/JewelleryDetailPage';
import { EarringDetailPage } from '@/components/earrings/EarringDetailPage';
import { getJewelleryProductBySlug } from '@/lib/jewellery/service';
import { listSlotsForProduct } from '@/lib/pairs/service';
import { METAL_LABELS } from '@/lib/diamonds/types';
import { parseGalleryConfig, parseMetalVariants, buildDefaultVariants } from '@/lib/gallery/types';

interface Props { params: Promise<{ slug: string }>; }

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const p = await getJewelleryProductBySlug(slug, 'earrings').catch(() => null);
  if (!p) notFound();

  const galleryConfig   = parseGalleryConfig(p.gallery_config);
  const metalVariants   = parseMetalVariants(p.metal_variants) ?? buildDefaultVariants(galleryConfig);

  // Fetch stone slots — determines whether this earring needs the configurable experience
  const slots = await listSlotsForProduct(p.id).catch(() => []);
  const hasMatchedPairSlots = slots.some(s => s.selection_mode === 'matched_pair');

  // Configurable earring path — uses EarringDetailPage with pair selectors
  if (hasMatchedPairSlots) {
    return (
      <Suspense>
        <EarringDetailPage
          productId={p.id}
          productName={p.name}
          productSubtitle={p.subtitle ?? ''}
          productDescription={p.description ?? ''}
          basePrice={p.base_price_gbp}
          slots={slots}
          galleryConfig={galleryConfig}
          metalVariants={metalVariants}
          config={{ categoryLabel: 'Earrings', categoryPath: '/earrings' }}
        />
      </Suspense>
    );
  }

  // Standard jewellery path — existing experience, completely unchanged
  const diamondMode: JewelleryDetailProduct['diamondMode'] =
    !p.show_diamond ? 'none' : p.is_total_carat ? 'total-carat' : p.is_pair ? 'pair' : 'single';

  const product: JewelleryDetailProduct = {
    name:        p.name,
    subtitle:    p.subtitle ?? '',
    basePrice:   p.base_price_gbp,
    description: p.description ?? '',
    media:       p.media.sort((a, b) => a.display_order - b.display_order).map(m => ({ url: m.storage_path, metal: m.metal ?? null })),
    materials:   p.metals.map(m => METAL_LABELS[m]),
    diamondMode,
    caratIsPair: p.is_pair,
  };

  return (
    <JewelleryDetailPage
      product={product}
      config={{ categoryLabel: 'Earrings', categoryPath: '/earrings' }}
      jewelleryId={p.id}
      galleryConfig={galleryConfig}
      metalVariants={metalVariants}
    />
  );
}
