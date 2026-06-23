import { RingDetailPage } from '@/components/engagement/RingDetailPage';
import { getRingSettingBySlug } from '@/lib/ring-settings/service';
import { METAL_LABELS } from '@/lib/ring-settings/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EngagementRingDetailRoute({ params }: Props) {
  const { slug } = await params;

  // Fetch from DB; fall back to hardcoded data if not found
  let dbRing = null;
  try {
    const setting = await getRingSettingBySlug(slug);
    if (setting) {
      const images = setting.media.length > 0
        ? setting.media
            .sort((a, b) => a.display_order - b.display_order)
            .map((m) => m.storage_path)
        : ['/images/rings/ring-1.png', '/images/rings/ring-3.png', '/images/rings/ring-7.png'];
      dbRing = {
        name:        setting.name,
        subtitle:    setting.collection ?? 'Engagement Ring',
        basePrice:   setting.base_price_gbp ? parseFloat(setting.base_price_gbp) : 4800,
        description: setting.description ?? '',
        images,
        materials:   setting.metals.map((m) => METAL_LABELS[m]),
      };
    }
  } catch {
    // Fall through to hardcoded data
  }

  return <RingDetailPage slug={slug} dbRing={dbRing} />;
}
