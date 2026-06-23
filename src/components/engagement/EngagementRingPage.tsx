import { EditorialListing, type EditorialItem } from '@/components/shared/EditorialListing';
import type { RingSettingFull } from '@/lib/ring-settings/types';

interface Props {
  settings: RingSettingFull[];
}

export function EngagementRingPage({ settings }: Props) {
  const items: EditorialItem[] = settings.map(ring => {
    const media    = ring.media ?? [];
    const image    = media.find(m => m.media_type === 'image')?.storage_path
                  ?? media[0]?.storage_path ?? '';
    const video    = media.find(m => m.media_type === 'video' || m.media_type === 'video_360')?.storage_path;
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
      items={items}
    />
  );
}
