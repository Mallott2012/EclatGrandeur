export const dynamic = 'force-dynamic';

import { RingDetailPage } from '@/components/engagement/RingDetailPage';
import { getRingSettingBySlug } from '@/lib/ring-settings/service';
import { METAL_LABELS } from '@/lib/ring-settings/types';
import { parseGalleryConfig } from '@/lib/gallery/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EngagementRingDetailRoute({ params }: Props) {
  const { slug } = await params;

  // Fetch from DB; fall back to hardcoded data if not found
  let dbRing = null;
  let ringSettingId: string | null = null;
  let galleryConfig = null;
  try {
    const setting = await getRingSettingBySlug(slug);
    if (setting) {
      ringSettingId = setting.id;
      galleryConfig = parseGalleryConfig(setting.gallery_config);
      const sorted = [...setting.media].sort((a, b) => a.display_order - b.display_order);
      dbRing = {
        name:        setting.name,
        subtitle:    setting.collection ?? 'Engagement Ring',
        basePrice:   setting.base_price_gbp ? parseFloat(setting.base_price_gbp) : 4800,
        description: setting.description ?? '',
        media:       sorted.map(m => ({ url: m.storage_path, metal: m.metal ?? null })),
        materials:   setting.metals.map((m) => METAL_LABELS[m]),
      };
    }
  } catch (err) {
    console.error('[engagement-rings] failed to load ring from DB:', err);
  }

  return <RingDetailPage slug={slug} dbRing={dbRing} ringSettingId={ringSettingId} galleryConfig={galleryConfig} />;
}
