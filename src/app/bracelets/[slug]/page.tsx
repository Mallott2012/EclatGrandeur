import { JewelleryDetailPage, type JewelleryDetailProduct } from '@/components/jewellery/JewelleryDetailPage';
import { BRACELET_PRODUCTS, BRACELET_FALLBACK } from '@/components/jewellery/bracelet-data';
import { getJewelleryProductBySlug } from '@/lib/jewellery/service';
import { METAL_LABELS } from '@/lib/diamonds/types';

interface Props { params: Promise<{ slug: string }>; }

export default async function Page({ params }: Props) {
  const { slug } = await params;

  try {
    const dbProduct = await getJewelleryProductBySlug(slug, 'bracelets');
    if (dbProduct) {
      const images = dbProduct.media.length > 0
        ? dbProduct.media.map((m) => m.storage_path)
        : ['/images/bracelets/bracelet-1.png', '/images/bracelets/bracelet-3.png'];
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
          config={{ categoryLabel: 'Bracelets', categoryPath: '/bracelets' }}
        />
      );
    }
  } catch {
    // Fall through to static fallback
  }

  const product = BRACELET_PRODUCTS[slug] ?? BRACELET_FALLBACK;
  return (
    <JewelleryDetailPage
      product={product}
      config={{ categoryLabel: 'Bracelets', categoryPath: '/bracelets' }}
    />
  );
}
