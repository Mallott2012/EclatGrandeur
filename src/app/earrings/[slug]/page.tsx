import { JewelleryDetailPage, type JewelleryDetailProduct } from '@/components/jewellery/JewelleryDetailPage';
import { EARRING_PRODUCTS, EARRING_FALLBACK } from '@/components/jewellery/earring-data';
import { getJewelleryProductBySlug } from '@/lib/jewellery/service';
import { METAL_LABELS } from '@/lib/diamonds/types';

interface Props { params: Promise<{ slug: string }>; }

export default async function Page({ params }: Props) {
  const { slug } = await params;

  // Try DB first, fall back to hardcoded data
  try {
    const dbProduct = await getJewelleryProductBySlug(slug, 'earrings');
    if (dbProduct) {
      const images = dbProduct.media.length > 0
        ? dbProduct.media.map((m) => m.storage_path)
        : ['/images/earrings/earring-1.png', '/images/earrings/earring-3.png'];
      const diamondMode: JewelleryDetailProduct['diamondMode'] =
        !dbProduct.show_diamond  ? 'none'
        : dbProduct.is_total_carat ? 'total-carat'
        : dbProduct.is_pair        ? 'pair'
        : 'single';
      const product: JewelleryDetailProduct = {
        name:          dbProduct.name,
        subtitle:      dbProduct.subtitle ?? '',
        basePrice:     dbProduct.base_price_gbp,
        description:   dbProduct.description ?? '',
        images,
        materials:     dbProduct.metals.map((m) => METAL_LABELS[m]),
        diamondMode,
        caratIsPair:   dbProduct.is_pair,
      };
      return (
        <JewelleryDetailPage
          product={product}
          config={{ categoryLabel: 'Earrings', categoryPath: '/earrings' }}
          jewelleryId={dbProduct.id}
        />
      );
    }
  } catch {
    // Fall through to static fallback
  }

  const product = EARRING_PRODUCTS[slug] ?? EARRING_FALLBACK;
  return (
    <JewelleryDetailPage
      product={product}
      config={{ categoryLabel: 'Earrings', categoryPath: '/earrings' }}
    />
  );
}
