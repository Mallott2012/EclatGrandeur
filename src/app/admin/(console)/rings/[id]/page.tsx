import { notFound } from 'next/navigation';
import { getRingSetting, getRingSettingDiamonds } from '@/lib/ring-settings/service';
import { listDiamonds } from '@/lib/diamonds/service';
import { AdminProductEditor } from '@/components/admin/AdminProductEditor';
import { METAL_LABELS } from '@/lib/ring-settings/types';
import {
  updateRingAction,
  toggleRingPublishAction,
  deleteRingAction,
  assignRingDiamondAction,
  unassignRingDiamondAction,
} from './actions';

interface Props { params: Promise<{ id: string }> }

export default async function AdminRingEditPage({ params }: Props) {
  const { id } = await params;
  const [ring, allDiamonds] = await Promise.all([
    getRingSetting(id).catch(() => null),
    listDiamonds().catch(() => []),
  ]);

  if (!ring) notFound();

  // Assigned diamond IDs across all metals (deduplicated)
  const diamondsByMetal = await getRingSettingDiamonds(id).catch(() => ({}));
  const assignedIds     = [...new Set(Object.values(diamondsByMetal).flat())];

  const images = ring.media
    .sort((a, b) => a.display_order - b.display_order)
    .map(m => m.storage_path);

  return (
    <AdminProductEditor
      id={ring.id}
      name={ring.name}
      subtitle={ring.collection ?? 'Engagement Ring'}
      description={ring.description ?? ''}
      basePrice={ring.base_price_gbp ? parseFloat(ring.base_price_gbp) : 0}
      metals={ring.metals}
      images={images.length > 0 ? images : ['/images/rings/ring-1.png']}
      published={ring.is_published}
      assignedDiamondIds={assignedIds}
      allDiamonds={allDiamonds.map(d => ({
        id:        d.id,
        sku:       d.sku,
        cut:       d.cut,
        carat:     String(d.carat),
        colour:    d.colour,
        clarity:   d.clarity,
        price_gbp: String(d.price_gbp),
      }))}
      onSave={async (patch) => {
        'use server';
        await updateRingAction(id, patch as Record<string, unknown>);
      }}
      onTogglePublish={async () => {
        'use server';
        await toggleRingPublishAction(id);
      }}
      onDelete={async () => {
        'use server';
        await deleteRingAction(id);
      }}
      onAssignDiamond={async (diamondId) => {
        'use server';
        await assignRingDiamondAction(id, diamondId);
      }}
      onUnassignDiamond={async (diamondId) => {
        'use server';
        await unassignRingDiamondAction(id, diamondId);
      }}
      backHref="/admin/rings"
      backLabel="All Rings"
    />
  );
}
