export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { JewelleryDetailPage, type JewelleryDetailProduct } from '@/components/jewellery/JewelleryDetailPage';
import { EarringDetailPage } from '@/components/earrings/EarringDetailPage';
import { EarringConsultationNotice } from '@/components/earrings/EarringConsultationNotice';
import { getJewelleryProductBySlug } from '@/lib/jewellery/service';
import { countPublishedOffers } from '@/lib/earrings/offers';
import { resolveEarringRenderMode } from '@/lib/earrings/route-mode';
import { METAL_LABELS } from '@/lib/diamonds/types';
import { parseGalleryConfig, parseMetalVariants, buildDefaultVariants } from '@/lib/gallery/types';

interface Props { params: Promise<{ slug: string }>; }

/** Short fixed-design note for a halo/pavé setting — only generic, never invented specs. */
function fixedDesignNoteFor(earringType: string | null): string | null {
  if (earringType === 'halo_studs') return 'Finished with a refined pavé halo setting.';
  if (earringType === 'pave_hoops') return 'Finished with a continuous pavé-set diamond line.';
  return null;
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const p = await getJewelleryProductBySlug(slug, 'earrings').catch(() => null);
  if (!p) notFound();

  const galleryConfig = parseGalleryConfig(p.gallery_config);
  const metalVariants = parseMetalVariants(p.metal_variants) ?? buildDefaultVariants(galleryConfig);
  const earringType   = (p.earring_type as string | null) ?? null;

  // The active customer model is editable Earring Diamond Offers (admin-managed).
  const offerCount = await countPublishedOffers(p.id).catch(() => 0);
  const mode = resolveEarringRenderMode({
    hasPublishedOffers: offerCount > 0,
    earringType,
    legacyShowDiamond:  Boolean(p.show_diamond),
    legacyIsPair:       Boolean(p.is_pair),
  });

  // ── Configurable: Metal → Choose Your Diamonds → Your Earrings ────────────────
  if (mode.kind === 'configurable') {
    return (
      <Suspense>
        <EarringDetailPage
          productId={p.id}
          productSlug={p.slug}
          productName={p.name}
          productSubtitle={p.subtitle ?? ''}
          productDescription={p.description ?? ''}
          earringType={earringType ?? 'other'}
          fixedDesignNote={fixedDesignNoteFor(earringType)}
          galleryConfig={galleryConfig}
          metalVariants={metalVariants}
          config={{ categoryLabel: 'Earrings', categoryPath: '/earrings' }}
        />
      </Suspense>
    );
  }

  // ── Consultation-only: configurable-intent setting with no published offers ────
  if (mode.kind === 'consultation') {
    return (
      <EarringConsultationNotice
        productName={p.name}
        productSubtitle={p.subtitle ?? ''}
        productDescription={p.description ?? ''}
        gallery={galleryConfig}
        categoryLabel="Earrings"
        categoryPath="/earrings"
      />
    );
  }

  // ── Standard fixed-composition earring — normal jewellery flow, NO diamond
  //    selector (earrings never mount the engagement-ring DiamondSelector). ──────
  const product: JewelleryDetailProduct = {
    name:        p.name,
    subtitle:    p.subtitle ?? '',
    basePrice:   p.base_price_gbp,
    description: p.description ?? '',
    media:       p.media.sort((a, b) => a.display_order - b.display_order).map(m => ({ url: m.storage_path, metal: m.metal ?? null })),
    materials:   p.metals.map(m => METAL_LABELS[m]),
    diamondMode: 'none',
    caratIsPair: false,
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
