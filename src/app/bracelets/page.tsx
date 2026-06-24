export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { listPublishedJewelleryProducts } from '@/lib/jewellery/service';
import { listVisibleStyles } from '@/lib/catalog/service';
import { JewelleryListingPage, type JewelleryProduct, type JewelleryConfig } from '@/components/jewellery/JewelleryListingPage';

export const metadata: Metadata = {
  title: 'Diamond Bracelets | Éclat Grandeur',
  description: 'Diamond tennis bracelets, bangles and pavé bracelets — hand-articulated for fluid movement and set with matched brilliant-cut diamonds.',
};

const CONFIG_BASE: Omit<JewelleryConfig, 'products'> = {
  title:        'Bracelets',
  heroCopy:     'Diamonds that grace every gesture',
  heroImage:    '',
  basePath:     '/bracelets',
  itemLabel:    'bracelet',
  collageSlots: [],
  styles:       [],
};

export default async function Page() {
  const db = await listPublishedJewelleryProducts('bracelets').catch(() => []);
  const dbStyles = await listVisibleStyles('bracelets').catch(() => []);
  const styles = dbStyles.map(s => ({ id: s.slug, label: s.label, image: s.image_url }));
  const products: JewelleryProduct[] = db.map(p => {
    const sorted = [...(p.media ?? [])].sort((a: any, b: any) => a.display_order - b.display_order);
    const card   = sorted[0];
    const hover  = sorted[1];
    const isVid  = (s?: string) => s?.toLowerCase().endsWith('.mp4');
    return {
      id:         p.id,
      slug:       p.slug,
      name:       p.name,
      subtitle:   p.subtitle ?? '',
      price:      p.base_price_gbp ? `Starting from £${Number(p.base_price_gbp).toLocaleString('en-GB')}` : 'Price on application',
      metals:     p.metals.length,
      style:      '',
      image:      card?.storage_path ?? '',
      mediaImage: hover && !isVid(hover.storage_path) ? hover.storage_path : undefined,
      video:      hover && isVid(hover.storage_path) ? hover.storage_path : undefined,
    };
  });
  return <JewelleryListingPage config={{ ...CONFIG_BASE, styles, products }} />;
}
