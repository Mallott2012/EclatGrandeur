import { revalidatePath } from 'next/cache';
import { listRingSettings, addRingSettingMedia, deleteRingSetting } from '@/lib/ring-settings/service';
import { uploadJewelleryMedia } from '@/lib/storage/jewellery';
import { requireStaffRole } from '@/lib/staff';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';
import { METAL_LABELS } from '@/lib/ring-settings/types';
import { listAllStyles } from '@/lib/catalog/service';
import { getCardMediaFromVariants } from '@/lib/gallery/types';

export default async function AdminRingsPage() {
  const rings  = await listRingSettings().catch(() => []);
  const styles = await listAllStyles('engagement-rings').catch(() => []);

  const products: AdminProduct[] = rings.map((r) => {
    const card    = getCardMediaFromVariants(r.metal_variants);
    const sorted  = [...(r.media ?? [])].sort((a, b) => a.display_order - b.display_order);
    const primary = sorted.find(m => m.is_primary) ?? sorted[0];
    return {
      id:            r.id,
      slug:          r.slug,
      name:          r.name,
      subtitle:      r.metals.map((m) => METAL_LABELS[m]).join(' · ') || 'Engagement Ring',
      price:         r.base_price_gbp ? `Starting from £${parseFloat(String(r.base_price_gbp)).toLocaleString('en-GB')}` : 'Price on request',
      image:         card.mainUrl  || primary?.storage_path || '',
      hoverMediaUrl: card.hoverUrl,
      hoverEnabled:  card.hoverEnabled,
      published:     r.is_published,
      editHref:      `/admin/rings/${r.id}`,
    };
  });

  async function uploadRingMedia(productId: string, formData: FormData): Promise<string> {
    'use server';
    await requireStaffRole([]);
    const file = formData.get('file') as File;
    const url  = await uploadJewelleryMedia(file, productId);
    await addRingSettingMedia(productId, url, 0);
    revalidatePath('/admin/rings');
    return url;
  }

  async function deleteRing(id: string) {
    'use server';
    await requireStaffRole([]);
    await deleteRingSetting(id);
    revalidatePath('/admin/rings');
  }

  return (
    <AdminProductGrid
      title="Engagement Rings"
      lede="Crafted to last a lifetime"
      addHref="/admin/rings/new"
      products={products}
      itemLabel="ring"
      category="engagement-rings"
      styles={styles}
      onUploadMedia={uploadRingMedia}
      onDeleteProduct={deleteRing}
    />
  );
}
