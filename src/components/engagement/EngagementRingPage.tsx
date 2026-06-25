'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SignatureShapeDiscovery } from './SignatureShapeDiscovery';
import { EditorialListing, type EditorialItem } from '@/components/shared/EditorialListing';
import type { RingSettingFull } from '@/lib/ring-settings/types';

interface Props {
  settings:      RingSettingFull[];
  styles:        { id: string; label: string; image?: string | null }[];
  initialShape?: string | null;
}

export function EngagementRingPage({ settings, styles, initialShape }: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  const [activeShape, setActiveShape] = useState<string | null>(initialShape ?? null);

  function handleShapeSelect(shape: string) {
    setActiveShape(shape);
    const params = new URLSearchParams();
    params.set('shape', shape);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleShapeClear() {
    setActiveShape(null);
    router.replace(pathname, { scroll: false });
  }

  // Filter settings by active shape — null means all shapes
  const filteredSettings = settings.filter(
    s => !activeShape || (s.diamond_shapes as string[]).includes(activeShape),
  );

  const items: EditorialItem[] = filteredSettings.map(ring => {
    const sorted     = [...(ring.media ?? [])].sort((a, b) => a.display_order - b.display_order);
    const primary    = sorted.find(m => m.is_primary) ?? sorted[0];
    const hover      = sorted.find(m => !m.is_primary);
    const isVid      = (s?: string) => s?.toLowerCase().endsWith('.mp4');
    const image      = primary?.storage_path ?? '';
    const mediaImage = hover && !isVid(hover.storage_path) ? hover.storage_path : undefined;
    const video      = hover && isVid(hover.storage_path)  ? hover.storage_path : undefined;
    const priceNum   = parseFloat(ring.base_price_gbp ?? '');
    const price      = !isNaN(priceNum) && priceNum > 0
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
    <>
      <SignatureShapeDiscovery
        activeShape={activeShape}
        onShapeSelect={handleShapeSelect}
        onClear={handleShapeClear}
        settingCount={filteredSettings.length}
      />
      <EditorialListing
        categoryTitle="Engagement Rings"
        categoryLede="Crafted to last a lifetime"
        basePath="/engagement-rings"
        itemLabel="ring"
        enableMetals
        styles={styles}
        items={items}
      />
    </>
  );
}
