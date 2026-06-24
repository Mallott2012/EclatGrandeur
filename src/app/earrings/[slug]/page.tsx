import { notFound } from 'next/navigation';
import { JewelleryDetailPage, type JewelleryDetailProduct } from '@/components/jewellery/JewelleryDetailPage';
import { getJewelleryProductBySlug } from '@/lib/jewellery/service';
import { METAL_LABELS } from '@/lib/diamonds/types';

interface Props { params: Promise<{ slug: string }>; }

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const p = await getJewelleryProductBySlug(slug, 'earrings').catch(() => null);
  if (!p) notFound();

  const images = p.media.length > 0 ? p.media.map(m => m.storage_path) : [];
  const diamondMode: JewelleryDetailProduct['diamondMode'] =
    !p.show_diamond ? 'none' : p.is_total_carat ? 'total-carat' : p.is_pair ? 'pair' : 'single';

  const product: JewelleryDetailProduct = {
    name:        p.name,
    subtitle:    p.subtitle ?? '',
    basePrice:   p.base_price_gbp,
    description: p.description ?? '',
    images,
    materials:   p.metals.map(m => METAL_LABELS[m]),
    diamondMode,
    caratIsPair: p.is_pair,
  };

  return (
    <JewelleryDetailPage
      product={product}
      config={{ categoryLabel: 'Earrings', categoryPath: '/earrings' }}
      jewelleryId={p.id}
    />
  );
}
