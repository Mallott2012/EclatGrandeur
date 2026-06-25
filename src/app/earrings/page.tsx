export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { listPublishedJewelleryProducts } from '@/lib/jewellery/service';
import { listVisibleStyles } from '@/lib/catalog/service';
import { JewelleryListingPage, type JewelleryProduct, type JewelleryConfig } from '@/components/jewellery/JewelleryListingPage';
import { getCardMediaFromVariants } from '@/lib/gallery/types';

export const metadata: Metadata = {
  title: 'Diamond Earrings | Éclat Grandeur',
  description: 'Diamond studs, drop earrings, hoops and chandeliers — perfectly matched GIA-certified stones crafted to catch the light from every angle.',
};

const CONFIG_BASE: Omit<JewelleryConfig, 'products'> = {
  title:        'Earrings',
  heroCopy:     'The finest diamonds, perfectly matched',
  heroImage:    '',
  basePath:     '/earrings',
  itemLabel:    'earring',
  collageSlots: [],
  styles:       [],
};

export default async function Page() {
  const db = await listPublishedJewelleryProducts('earrings').catch(() => []);
  const dbStyles = await listVisibleStyles('earrings').catch(() => []);
  const styles = dbStyles.map(s => ({ id: s.slug, label: s.label, image: s.image_url }));
  const products: JewelleryProduct[] = db.map(p => {
    const cardMedia = getCardMediaFromVariants(p.metal_variants);
    const sorted    = [...(p.media ?? [])].sort((a: any, b: any) => a.display_order - b.display_order);
    const isVid     = (s?: string) => s?.toLowerCase().endsWith('.mp4');
    return {
      id:         p.id,
      slug:       p.slug,
      name:       p.name,
      subtitle:   p.subtitle ?? '',
      price:      p.base_price_gbp ? `Starting from £${Number(p.base_price_gbp).toLocaleString('en-GB')}` : 'Price on application',
      metals:     p.metals.length,
      style:      '',
      image:      cardMedia.mainUrl || sorted[0]?.storage_path || '',
      mediaImage: cardMedia.hoverEnabled && cardMedia.hoverUrl && !isVid(cardMedia.hoverUrl)
        ? cardMedia.hoverUrl
        : sorted[1] && !isVid(sorted[1].storage_path) ? sorted[1].storage_path
        : undefined,
      video:      cardMedia.hoverEnabled && cardMedia.hoverUrl && isVid(cardMedia.hoverUrl)
        ? cardMedia.hoverUrl
        : sorted[1] && isVid(sorted[1].storage_path) ? sorted[1].storage_path
        : undefined,
    };
  });
  return <JewelleryListingPage config={{ ...CONFIG_BASE, styles, products }} />;
}
