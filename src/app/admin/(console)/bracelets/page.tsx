import { revalidatePath } from 'next/cache';
import { listJewelleryProducts, addJewelleryProductMedia } from '@/lib/jewellery/service';
import { uploadJewelleryMedia } from '@/lib/storage/jewellery';
import { requireStaffRole } from '@/lib/staff';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';
import { listAllStyles } from '@/lib/catalog/service';

export default async function AdminBraceletsPage() {
  const products_db = await listJewelleryProducts('bracelets').catch(() => []);
  const styles = await listAllStyles('bracelets').catch(() => []);

  const products: AdminProduct[] = products_db.map((p) => ({
    id:        p.id,
    slug:      p.slug,
    name:      p.name,
    subtitle:  p.subtitle ?? 'Bracelet',
    price:     p.base_price_gbp ? `Starting from £${Number(p.base_price_gbp).toLocaleString('en-GB')}` : 'Price on application',
    image:     p.media?.find((m: any) => m.media_type === 'image')?.storage_path ?? p.media?.[0]?.storage_path ?? '',
    video:     p.media?.find((m: any) => m.media_type === 'video' || m.media_type === 'video_360')?.storage_path,
    published: p.is_published,
    editHref:  `/admin/bracelets/${p.id}`,
  }));

  async function uploadMedia(productId: string, formData: FormData): Promise<string> {
    'use server';
    await requireStaffRole([]);
    const file = formData.get('file') as File;
    const url  = await uploadJewelleryMedia(file, productId);
    await addJewelleryProductMedia(productId, url, 0);
    revalidatePath('/admin/bracelets');
    return url;
  }

  return (
    <AdminProductGrid
      title="Bracelets"
      lede="Diamonds that grace every gesture"
      addHref="/admin/bracelets/new"
      products={products}
      itemLabel="bracelet"
      category="bracelets"
      styles={styles}
      onUploadMedia={uploadMedia}
    />
  );
}
