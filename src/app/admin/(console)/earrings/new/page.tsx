'use client';

import { AdminNewProductForm } from '@/components/admin/AdminNewProductForm';

async function createProduct(data: { name: string; slug: string; metals: string[]; basePrice: number; description: string }) {
  const res  = await fetch('/api/admin/earrings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Failed to create product');
  return json.id as string;
}

export default function AdminNewEarringPage() {
  return (
    <AdminNewProductForm
      categoryLabel="Earring"
      backHref="/admin/earrings"
      onCreate={createProduct}
    />
  );
}
