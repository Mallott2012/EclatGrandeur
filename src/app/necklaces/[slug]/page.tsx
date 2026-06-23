import { JewelleryDetailPage, type JewelleryDetailProduct } from '@/components/jewellery/JewelleryDetailPage';
import { NECKLACE_PRODUCTS, NECKLACE_FALLBACK } from '@/components/jewellery/necklace-data';
import { getJewelleryProductBySlug } from '@/lib/jewellery/service';
import { METAL_LABELS } from '@/lib/diamonds/types';

interface Props { params: Promise<{ slug: string }>; }

export default async function Page({ params }: Props) {
  const { slug } = await params;

  try {
    const dbProduct = await getJewelleryProductBySlug(slug, 'necklaces');
    if (dbProduct) {
      const images = dbProduct.media.length > 0
        ? dbProduct.media.map((m) => m.storage_path)
        : ['/images/necklaces/necklace-1.png', '/images/necklaces/necklace-3.png'];
      const diamondMode: JewelleryDetailProduct['diamondMode'] =
        !dbProduct.show_diamond   ? 'none'
        : dbProduct.is_total_carat ? 'total-carat'
        : dbProduct.is_pair        ? 'pair'
        : 'single';
      const product: JewelleryDetailProduct = {
        name:        dbProduct.name,
        subtitle:    dbProduct.subtitle ?? '',
        basePrice:   dbProduct.base_price_gbp,
        description: dbProduct.description ?? '',
        images,
        materials:   dbProduct.metals.map((m) => METAL_LABELS[m]),
        diamondMode,
        caratIsPair: dbProduct.is_pair,
      };
      return (
        <JewelleryDetailPage
          product={product}
          config={{ categoryLabel: 'Necklaces', categoryPath: '/necklaces' }}
          jewelleryId={dbProduct.id}
        />
      );
    }
  } catch {
    // Fall through to static fallback
  }

  const product = NECKLACE_PRODUCTS[slug] ?? NECKLACE_FALLBACK;
  return (
    <JewelleryDetailPage
      product={product}
      config={{ categoryLabel: 'Necklaces', categoryPath: '/necklaces' }}
    />
  );
}
