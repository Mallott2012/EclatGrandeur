import { EditorialListing, type EditorialItem } from '@/components/shared/EditorialListing';
import type { RingSettingFull } from '@/lib/ring-settings/types';

interface Props {
  settings: RingSettingFull[];
  styles:   { id: string; label: string; image?: string | null }[];
}

export function EngagementRingPage({ settings, styles }: Props) {
  const items: EditorialItem[] = settings.map(ring => {
    const sorted     = [...(ring.media ?? [])].sort((a, b) => a.display_order - b.display_order);
    const primary    = sorted.find(m => m.is_primary) ?? sorted[0];
    const hover      = sorted.find(m => !m.is_primary);
    const isVid      = (s?: string) => s?.toLowerCase().endsWith('.mp4');
    const image      = primary?.storage_path ?? '';
    const mediaImage = hover && !isVid(hover.storage_path) ? hover.storage_path : undefined;
    const video      = hover && isVid(hover.storage_path) ? hover.storage_path : undefined;
    const priceNum = parseFloat(ring.base_price_gbp ?? '');
    const price    = !isNaN(priceNum) && priceNum > 0
      ? `Starting from £${priceNum.toLocaleString('en-GB')}`
      : 'Price on application';

    return {
      id:       ring.id,
      slug:     ring.slug,
      name:     ring.name,
      subtitle: ring.collection ?? '',
      price,
      image,
      mediaImage,
      video,
      metal:    (ring.metals as string[])[0] ?? '',
    };
  });

  return (
    <EditorialListing
      categoryTitle="Engagement Rings"
      categoryLede="Crafted to last a lifetime"
      basePath="/engagement-rings"
      itemLabel="ring"
      enableMetals
      styles={styles}
      items={items}
    />
  );
}
