import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getJewelleryProduct, getJewelleryDiamonds, addJewelleryProductMedia, deleteJewelleryProductMedia, reorderJewelleryProductMedia, setJewelleryMediaMetal, setJewelleryGallery, setJewelleryMetalVariants } from '@/lib/jewellery/service';
import { parseGalleryConfig, parseMetalVariants } from '@/lib/gallery/types';
import { uploadJewelleryMedia, deleteJewelleryMedia } from '@/lib/storage/jewellery';
import { requireStaffRole } from '@/lib/staff';
import { AdminProductEditor } from '@/components/admin/AdminProductEditor';
import { listSlotsForProduct, countCompatiblePairsForSlot } from '@/lib/pairs/service';
import { getEarringConfigurationAvailability } from '@/lib/earrings/configuration';
import { EarringConfigSection } from '@/components/admin/earrings/EarringConfigSection';
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
  saveEarringTypeAction,
  createSlotAction,
  updateSlotAction,
  deleteSlotAction,
} from './actions';
import type { DiamondRow } from '@/components/admin/DiamondPanel';

interface Props { params: Promise<{ id: string }> }

export default async function AdminEARRINGEditPage({ params }: Props) {
  const { id } = await params;
  const [product, allDiamonds, assignedIds] = await Promise.all([
    getJewelleryProduct(id).catch(() => null),
    listDiamonds().catch(() => []),
    getJewelleryDiamonds(id).catch(() => []),
  ]);

  if (!product) notFound();

  // Earring-specific: fetch stone slots, compatible pair counts, and completability
  const slots = await listSlotsForProduct(id).catch(() => []);
  const [pairCounts, configAvailability] = await Promise.all([
    Promise.all(
      slots.map(s =>
        s.selection_mode === 'matched_pair'
          ? countCompatiblePairsForSlot({
              shapes:          s.compatible_shapes,
              min_carat:       s.min_carat,
              max_carat:       s.max_carat,
              categories:      s.allowed_diamond_categories,
              colour_families: s.allowed_colour_families,
            }).catch(() => 0)
          : Promise.resolve(null)
      )
    ),
    getEarringConfigurationAvailability(id).catch(() => null),
  ]);

  const mediaItems = product.media
    .sort((a, b) => a.display_order - b.display_order)
    .map((m, i) => ({ id: m.id, url: m.storage_path, isPrimary: i === 0, isSecondary: i === 1, metal: m.metal ?? null }));

  const diamondRows: DiamondRow[] = allDiamonds.map(d => ({
    id: d.id, sku: d.sku, cut: d.cut, carat: d.carat,
    colour: d.colour, clarity: d.clarity, price_gbp: d.price_gbp,
    status: d.status, is_published: d.is_published,
    fluorescence: d.fluorescence, cut_grade: d.cut_grade,
    polish: d.polish, symmetry: d.symmetry,
    gia_report_number: d.gia_report_number,
    gia_report_url: d.gia_report_url, notes: d.notes,
    diamond_category: d.diamond_category, colour_family: d.colour_family,
    colour_intensity: d.colour_intensity, colour_description: d.colour_description,
    eclat_approved: d.eclat_approved,
  }));

  const galleryConfig = parseGalleryConfig(product.gallery_config);
  const metalVariants = parseMetalVariants(product.metal_variants);

  return (
    <>
    <AdminProductEditor
      id={product.id}
      name={product.name}
      subtitle={product.subtitle ?? 'Earring'}
      description={product.description ?? ''}
      basePrice={product.base_price_gbp}
      metals={product.metals}
      mediaItems={mediaItems}
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
          diamond_category: d.diamond_category, colour_family: d.colour_family,
          colour_intensity: d.colour_intensity, colour_description: d.colour_description,
          eclat_approved: d.eclat_approved,
        };
      }}
      onUpdateDiamond={async (dId, data) => { 'use server'; await updateDiamondAction(dId, data); }}
      onDeleteDiamond={async (dId) => { 'use server'; await deleteDiamondAction(dId); }}
      onUploadMedia={async (formData) => {
        'use server';
        await requireStaffRole([]);
        const file    = formData.get('file') as File;
        const url     = await uploadJewelleryMedia(file, id);
        const current = await getJewelleryProduct(id);
        const item    = await addJewelleryProductMedia(id, url, current?.media.length ?? 0);
        revalidatePath(`/admin/earrings/${id}`);
        revalidatePath('/earrings');
        revalidatePath('/earrings/[slug]', 'page');
        return { ...item, isSecondary: false, metal: null };
      }}
      onDeleteMedia={async (url) => {
        'use server';
        await requireStaffRole([]);
        await deleteJewelleryProductMedia(id, url);
        await deleteJewelleryMedia(url);
        revalidatePath(`/admin/earrings/${id}`);
        revalidatePath('/earrings');
        revalidatePath('/earrings/[slug]', 'page');
      }}
      onReorderMedia={async (ids) => {
        'use server';
        await requireStaffRole([]);
        await reorderJewelleryProductMedia(id, ids);
        revalidatePath(`/admin/earrings/${id}`);
        revalidatePath('/earrings');
        revalidatePath('/earrings/[slug]', 'page');
      }}
      onSetPrimaryMedia={async (mediaId) => {
        'use server';
        await requireStaffRole([]);
        const current = await getJewelleryProduct(id);
        const sorted  = (current?.media ?? []).sort((a, b) => a.display_order - b.display_order);
        const newOrder = [mediaId, ...sorted.filter(m => m.id !== mediaId).map(m => m.id)];
        await reorderJewelleryProductMedia(id, newOrder);
        revalidatePath(`/admin/earrings/${id}`);
        revalidatePath('/earrings');
        revalidatePath('/earrings/[slug]', 'page');
      }}
      onSetMediaMetal={async (mediaId, metal) => {
        'use server';
        await requireStaffRole([]);
        await setJewelleryMediaMetal(id, mediaId, metal);
        revalidatePath(`/admin/earrings/${id}`);
        revalidatePath('/earrings');
        revalidatePath('/earrings/[slug]', 'page');
      }}
      galleryConfig={galleryConfig}
      onSaveGallery={async (data) => {
        'use server';
        await requireStaffRole([]);
        await setJewelleryGallery(id, data);
        revalidatePath(`/admin/earrings/${id}`);
        revalidatePath('/earrings');
        revalidatePath('/earrings/[slug]', 'page');
      }}
      metalVariants={metalVariants ?? undefined}
      onSaveMetalVariants={async (variants) => {
        'use server';
        await requireStaffRole([]);
        await setJewelleryMetalVariants(id, variants);
        revalidatePath(`/admin/earrings/${id}`);
        revalidatePath('/earrings');
        revalidatePath('/earrings/[slug]', 'page');
      }}
      categoryLabel="Earrings"
      categoryHref="/earrings"
      backHref="/admin/earrings"
      backLabel="All Earrings"
    />

    {/* Earring-specific configuration — stone slots, earring type, pair counts */}
    <EarringConfigSection
      productId={product.id}
      earringType={product.earring_type}
      slots={slots}
      pairCounts={pairCounts}
      configAvailability={configAvailability}
      saveTypeAction={async (pid, type) => { 'use server'; await saveEarringTypeAction(pid, type); }}
      createSlotAction={async (input) => { 'use server'; return await createSlotAction(input); }}
      updateSlotAction={async (slotId, patch) => { 'use server'; return await updateSlotAction(slotId, patch, id); }}
      deleteSlotAction={async (slotId) => { 'use server'; await deleteSlotAction(slotId, id); }}
    />
    </>
  );
}
