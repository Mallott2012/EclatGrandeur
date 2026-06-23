import type { Metadata } from 'next';
import { listRingSettings } from '@/lib/ring-settings/service';
import { EngagementRingPage } from '@/components/engagement/EngagementRingPage';

export const metadata: Metadata = {
  title: 'Engagement Rings — Éclat Grandeur',
  description:
    'Individually handcrafted engagement rings in platinum and gold. Choose your setting, stone shape and metal — each ring made to order in our London atelier.',
};

export default async function Page() {
  const allSettings = await listRingSettings().catch(() => []);
  // Only show published settings on the public storefront
  const settings = allSettings.filter((s) => s.is_published);

  return <EngagementRingPage settings={settings} />;
}
