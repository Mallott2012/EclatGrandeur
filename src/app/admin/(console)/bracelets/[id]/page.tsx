import { notFound } from 'next/navigation';
import { getJewelleryProduct, getJewelleryDiamonds } from '@/lib/jewellery/service';
import { listDiamonds } from '@/lib/diamonds/service';
import { AdminProductEditor } from '@/components/admin/AdminProductEditor';
import {
  updateProductAction,
  togglePublishAction,
  deleteProductAction,
  assignDiamondAction,
  unassignDiamondAction,
} from './actions';

interface Props { params: Promise<{ id: string }> }

export default async function AdminBraceletEditPage({ params }: Props) {
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

  return (
    <AdminProductEditor
      id={product.id}
      name={product.name}
      subtitle={product.subtitle ?? 'Bracelet'}
      description={product.description ?? ''}
      basePrice={product.base_price_gbp}
      metals={product.metals}
      images={images.length > 0 ? images : ['/images/necklaces/bracelet-1.png']}
      published={product.is_published}
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
        await updateProductAction(id, patch as Record<string, unknown>);
      }}
      onTogglePublish={async () => {
        'use server';
        await togglePublishAction(id);
      }}
      onDelete={async () => {
        'use server';
        await deleteProductAction(id);
      }}
      onAssignDiamond={async (diamondId) => {
        'use server';
        await assignDiamondAction(id, diamondId);
      }}
      onUnassignDiamond={async (diamondId) => {
        'use server';
        await unassignDiamondAction(id, diamondId);
      }}
      backHref="/admin/bracelets"
      backLabel="All Bracelets"
    />
  );
}
