import type { Metadata } from 'next';
import { listRingSettings } from '@/lib/ring-settings/service';
import { listCollageMedia } from '@/lib/hero/service';
import { EngagementRingPage } from '@/components/engagement/EngagementRingPage';

export const metadata: Metadata = {
  title: 'Engagement Rings — Éclat Grandeur',
  description: 'Individually handcrafted engagement rings in platinum and gold. Choose your setting, stone shape and metal — each ring made to order in our London atelier.',
};

export default async function Page() {
  const [all, collageMedia] = await Promise.all([
    listRingSettings().catch(() => []),
    listCollageMedia('engagement-rings').catch(() => []),
  ]);
  const settings     = all.filter(s => s.is_published);
  const collageSlots = Array.from({ length: 6 }, (_, i) => collageMedia[i] ?? null);
  return <EngagementRingPage settings={settings} collageSlots={collageSlots} />;
}
