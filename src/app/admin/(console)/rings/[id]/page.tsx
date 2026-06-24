import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getRingSetting, getRingSettingDiamonds, addRingSettingMedia, deleteRingSettingMedia, reorderRingSettingMedia, setRingSettingMediaPrimary, setRingSettingMediaMetal } from '@/lib/ring-settings/service';
import { uploadJewelleryMedia, deleteJewelleryMedia } from '@/lib/storage/jewellery';
import { requireStaffRole } from '@/lib/staff';
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
  saveRingGalleryAction,
  saveRingMetalVariantsAction,
} from './actions';
import { parseGalleryConfig, parseMetalVariants } from '@/lib/gallery/types';
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

  const sortedMedia = ring.media.sort((a, b) => a.display_order - b.display_order);
  const primaryIdx  = sortedMedia.findIndex(m => m.is_primary);
  const mediaItems  = sortedMedia.map((m, i) => ({
    id:          m.id,
    url:         m.storage_path,
    isPrimary:   m.is_primary,
    isSecondary: !m.is_primary && (primaryIdx === -1 ? i === 1 : i === (primaryIdx === 0 ? 1 : 0)),
    metal:       m.metal ?? null,
  }));

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

  const galleryConfig  = parseGalleryConfig(ring.gallery_config);
  const metalVariants  = parseMetalVariants(ring.metal_variants);

  return (
    <AdminProductEditor
      id={ring.id}
      name={ring.name}
      subtitle={ring.collection ?? 'Engagement Ring'}
      description={ring.description ?? ''}
      basePrice={typeof ring.base_price_gbp === 'number' ? ring.base_price_gbp : parseFloat(String(ring.base_price_gbp ?? 0)) || 0}
      metals={ring.metals}
      mediaItems={mediaItems}
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
      onUploadMedia={async (formData) => {
        'use server';
        await requireStaffRole([]);
        const file    = formData.get('file') as File;
        const url     = await uploadJewelleryMedia(file, id);
        const current = await getRingSetting(id);
        const item    = await addRingSettingMedia(id, url, current?.media.length ?? 0);
        revalidatePath(`/admin/rings/${id}`);
        revalidatePath('/engagement-rings');
        revalidatePath('/engagement-rings/[slug]', 'page');
        return { ...item, isSecondary: false, metal: null };
      }}
      onDeleteMedia={async (url) => {
        'use server';
        await requireStaffRole([]);
        await deleteRingSettingMedia(id, url);
        await deleteJewelleryMedia(url);
        revalidatePath(`/admin/rings/${id}`);
        revalidatePath('/engagement-rings');
        revalidatePath('/engagement-rings/[slug]', 'page');
      }}
      onReorderMedia={async (ids) => {
        'use server';
        await requireStaffRole([]);
        await reorderRingSettingMedia(id, ids);
        revalidatePath(`/admin/rings/${id}`);
        revalidatePath('/engagement-rings');
        revalidatePath('/engagement-rings/[slug]', 'page');
      }}
      onSetPrimaryMedia={async (mediaId) => {
        'use server';
        await requireStaffRole([]);
        await setRingSettingMediaPrimary(id, mediaId);
        revalidatePath(`/admin/rings/${id}`);
        revalidatePath('/engagement-rings');
        revalidatePath('/engagement-rings/[slug]', 'page');
      }}
      onSetMediaMetal={async (mediaId, metal) => {
        'use server';
        await requireStaffRole([]);
        await setRingSettingMediaMetal(id, mediaId, metal);
        revalidatePath(`/admin/rings/${id}`);
        revalidatePath('/engagement-rings');
        revalidatePath('/engagement-rings/[slug]', 'page');
      }}
      galleryConfig={galleryConfig}
      onSaveGallery={async (data) => {
        'use server';
        await saveRingGalleryAction(id, data);
      }}
      metalVariants={metalVariants ?? undefined}
      onSaveMetalVariants={async (variants) => {
        'use server';
        await saveRingMetalVariantsAction(id, variants);
      }}
      categoryLabel="Engagement Rings"
      categoryHref="/engagement-rings"
      backHref="/admin/rings"
      backLabel="All Rings"
    />
  );
}
