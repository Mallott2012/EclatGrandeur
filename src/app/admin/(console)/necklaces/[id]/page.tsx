import { notFound } from 'next/navigation';
import { getJewelleryProduct, getJewelleryDiamonds } from '@/lib/jewellery/service';
import { AdminProductEditor } from '@/components/admin/AdminProductEditor';
import {
  updateProductAction,
  togglePublishAction,
  deleteProductAction,
  assignDiamondAction,
  unassignDiamondAction,
  createDiamondAction,
  updateDiamondAction,
  deleteDiamondAction,
  listDiamonds,
} from './actions';
import type { DiamondRow } from '@/components/admin/DiamondPanel';

interface Props { params: Promise<{ id: string }> }

export default async function AdminNecklaceEditPage({ params }: Props) {
  const { id } = await params;
  const [product, allDiamonds, assignedIds] = await Promise.all([
    getJewelleryProduct(id).catch(() => null),
    listDiamonds().catch(() => []),
    getJewelleryDiamonds(id).catch(() => []),
  ]);

  if (!product) notFound();

  const images = product.media
    .sort((a, b) => a.display_order - b.display_order)
    .map(m => m.storage_path);

  const diamondRows: DiamondRow[] = allDiamonds.map(d => ({
    id: d.id, sku: d.sku, cut: d.cut, carat: d.carat,
    colour: d.colour, clarity: d.clarity, price_gbp: d.price_gbp,
    status: d.status, is_published: d.is_published,
    fluorescence: d.fluorescence, cut_grade: d.cut_grade,
    polish: d.polish, symmetry: d.symmetry,
    gia_report_number: d.gia_report_number,
    gia_report_url: d.gia_report_url, notes: d.notes,
  }));

  return (
    <AdminProductEditor
      id={product.id}
      name={product.name}
      subtitle={product.subtitle ?? 'Necklace'}
      description={product.description ?? ''}
      basePrice={product.base_price_gbp}
      metals={product.metals}
      images={images.length > 0 ? images : ['/images/necklaces/necklace-1.png']}
      published={product.is_published}
      assignedDiamondIds={assignedIds}
      allDiamonds={diamondRows}
      onSave={async (patch) => { 'use server'; await updateProductAction(id, patch as Record<string, unknown>); }}
      onTogglePublish={async () => { 'use server'; await togglePublishAction(id); }}
      onDelete={async () => { 'use server'; await deleteProductAction(id); }}
      onAssignDiamond={async (dId) => { 'use server'; await assignDiamondAction(id, dId); }}
      onUnassignDiamond={async (dId) => { 'use server'; await unassignDiamondAction(id, dId); }}
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
      onUpdateDiamond={async (dId, data) => { 'use server'; await updateDiamondAction(dId, data); }}
      onDeleteDiamond={async (dId) => { 'use server'; await deleteDiamondAction(dId); }}
      categoryLabel="Necklaces"
      categoryHref="/necklaces"
      backHref="/admin/necklaces"
      backLabel="All Necklaces"
    />
  );
}
