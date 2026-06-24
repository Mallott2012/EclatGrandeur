export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { JewelleryDetailPage, type JewelleryDetailProduct } from '@/components/jewellery/JewelleryDetailPage';
import { getJewelleryProductBySlug } from '@/lib/jewellery/service';
import { METAL_LABELS } from '@/lib/diamonds/types';
import { parseGalleryConfig } from '@/lib/gallery/types';

interface Props { params: Promise<{ slug: string }>; }

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const p = await getJewelleryProductBySlug(slug, 'necklaces').catch(() => null);
  if (!p) notFound();

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
      config={{ categoryLabel: 'Necklaces', categoryPath: '/necklaces' }}
      jewelleryId={p.id}
      galleryConfig={parseGalleryConfig(p.gallery_config)}
    />
  );
}
