import { notFound } from 'next/navigation';
import { getRingSetting, getRingSettingDiamonds } from '@/lib/ring-settings/service';
import { listDiamonds } from '@/lib/diamonds/service';
import { AdminProductEditor } from '@/components/admin/AdminProductEditor';
import {
  updateRingAction,
  toggleRingPublishAction,
  deleteRingAction,
  assignRingDiamondAction,
  unassignRingDiamondAction,
  createDiamondAction,
  updateDiamondAction,
  deleteDiamondAction,
} from './actions';
import type { DiamondRow } from '@/components/admin/DiamondPanel';

interface Props { params: Promise<{ id: string }> }

export default async function AdminRingEditPage({ params }: Props) {
  const { id } = await params;
  const [ring, allDiamonds] = await Promise.all([
    getRingSetting(id).catch(() => null),
    listDiamonds().catch(() => []),
  ]);

  if (!ring) notFound();

  const diamondsByMetal = await getRingSettingDiamonds(id).catch(() => ({}));
  const assignedIds     = [...new Set(Object.values(diamondsByMetal).flat())];

  const images = ring.media
    .sort((a, b) => a.display_order - b.display_order)
    .map(m => m.storage_path);

  const diamondRows: DiamondRow[] = allDiamonds.map(d => ({
    id:               d.id,
    sku:              d.sku,
    cut:              d.cut,
    carat:            d.carat,
    colour:           d.colour,
    clarity:          d.clarity,
    price_gbp:        d.price_gbp,
    status:           d.status,
    is_published:     d.is_published,
    fluorescence:     d.fluorescence,
    cut_grade:        d.cut_grade,
    polish:           d.polish,
    symmetry:         d.symmetry,
    gia_report_number: d.gia_report_number,
    gia_report_url:   d.gia_report_url,
    notes:            d.notes,
  }));

  return (
    <AdminProductEditor
      id={ring.id}
      name={ring.name}
      subtitle={ring.collection ?? 'Engagement Ring'}
      description={ring.description ?? ''}
      basePrice={typeof ring.base_price_gbp === 'number' ? ring.base_price_gbp : parseFloat(String(ring.base_price_gbp ?? 0)) || 0}
      metals={ring.metals}
      images={images.length > 0 ? images : ['/images/rings/ring-1.png']}
      published={ring.is_published}
      assignedDiamondIds={assignedIds}
      allDiamonds={diamondRows}
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
      onCreateDiamond={async (data) => {
        'use server';
        const d = await createDiamondAction(data);
        return {
          id: d.id, sku: d.sku, cut: d.cut, carat: d.carat,
          colour: d.colour, clarity: d.clarity, price_gbp: d.price_gbp,
          status: d.status, is_published: d.is_published,
          fluorescence: d.fluorescence, cut_grade: d.cut_grade,
          polish: d.polish, symmetry: d.symmetry,
          gia_report_number: d.gia_report_number,
          gia_report_url: d.gia_report_url, notes: d.notes,
        };
      }}
      onUpdateDiamond={async (diamondId, data) => {
        'use server';
        await updateDiamondAction(diamondId, data);
      }}
      onDeleteDiamond={async (diamondId) => {
        'use server';
        await deleteDiamondAction(diamondId);
      }}
      categoryLabel="Engagement Rings"
      categoryHref="/engagement-rings"
      backHref="/admin/rings"
      backLabel="All Rings"
    />
  );
}
