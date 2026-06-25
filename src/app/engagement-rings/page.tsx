export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { listRingSettings } from '@/lib/ring-settings/service';
import { EngagementRingPage } from '@/components/engagement/EngagementRingPage';
import { listVisibleStyles } from '@/lib/catalog/service';

export const metadata: Metadata = {
  title: 'Engagement Rings — Éclat Grandeur',
  description: 'Individually handcrafted engagement rings in platinum and gold. Choose your setting, stone shape and metal — each ring made to order in our London atelier.',
};

interface Props {
  searchParams: Promise<{ shape?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const [{ shape }, all, dbStyles] = await Promise.all([
    searchParams,
    listRingSettings().catch(() => []),
    listVisibleStyles('engagement-rings').catch(() => []),
  ]);
  const settings = all.filter(s => s.is_published);
  const styles   = dbStyles.map(s => ({ id: s.slug, label: s.label, image: s.image_url }));

  // Validate shape — only accept the six supported values
  const VALID_SHAPES = ['round', 'oval', 'emerald', 'cushion', 'pear', 'radiant'];
  const initialShape = shape && VALID_SHAPES.includes(shape) ? shape : null;

  return <EngagementRingPage settings={settings} styles={styles} initialShape={initialShape} />;
}
