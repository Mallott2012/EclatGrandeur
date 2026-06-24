import { revalidatePath } from 'next/cache';
import { listJewelleryProducts, addJewelleryProductMedia } from '@/lib/jewellery/service';
import { uploadJewelleryMedia } from '@/lib/storage/jewellery';
import { requireStaffRole } from '@/lib/staff';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';
import { listAllStyles } from '@/lib/catalog/service';

export default async function AdminNecklacesPage() {
  const products_db = await listJewelleryProducts('necklaces').catch(() => []);
  const styles = await listAllStyles('necklaces').catch(() => []);

  const products: AdminProduct[] = products_db.map((p) => ({
    id:        p.id,
    slug:      p.slug,
    name:      p.name,
    subtitle:  p.subtitle ?? 'Necklace',
    price:     p.base_price_gbp ? `Starting from £${Number(p.base_price_gbp).toLocaleString('en-GB')}` : 'Price on application',
    image:     p.media?.find((m: any) => m.media_type === 'image')?.storage_path ?? p.media?.[0]?.storage_path ?? '',
    video:     p.media?.find((m: any) => m.media_type === 'video' || m.media_type === 'video_360')?.storage_path,
    published: p.is_published,
    editHref:  `/admin/necklaces/${p.id}`,
  }));

  async function uploadMedia(productId: string, formData: FormData): Promise<string> {
    'use server';
    await requireStaffRole([]);
    const file = formData.get('file') as File;
    const url  = await uploadJewelleryMedia(file, productId);
    await addJewelleryProductMedia(productId, url, 0);
    revalidatePath('/admin/necklaces');
    return url;
  }

  return (
    <AdminProductGrid
      title="Necklaces"
      lede="Diamonds to be worn close to the heart"
      addHref="/admin/necklaces/new"
      products={products}
      itemLabel="necklace"
      category="necklaces"
      styles={styles}
      onUploadMedia={uploadMedia}
    />
  );
}
