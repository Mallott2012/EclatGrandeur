export const dynamic = 'force-dynamic';

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
  let ringSettingId: string | null = null;
  try {
    const setting = await getRingSettingBySlug(slug);
    if (setting) {
      ringSettingId = setting.id;
      const sorted = setting.media.sort((a, b) => a.display_order - b.display_order);
      const media = sorted.length > 0
        ? sorted.map(m => ({ url: m.storage_path, metal: m.metal ?? null }))
        : [
            { url: '/images/rings/ring-1.png', metal: null },
            { url: '/images/rings/ring-3.png', metal: null },
            { url: '/images/rings/ring-7.png', metal: null },
          ];
      dbRing = {
        name:        setting.name,
        subtitle:    setting.collection ?? 'Engagement Ring',
        basePrice:   setting.base_price_gbp ? parseFloat(setting.base_price_gbp) : 4800,
        description: setting.description ?? '',
        media,
        materials:   setting.metals.map((m) => METAL_LABELS[m]),
      };
    }
  } catch {
    // Fall through to hardcoded data
  }

  return <RingDetailPage slug={slug} dbRing={dbRing} ringSettingId={ringSettingId} />;
}
