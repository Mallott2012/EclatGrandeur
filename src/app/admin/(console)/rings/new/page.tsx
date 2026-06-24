'use client';

import { useRouter } from 'next/navigation';
import { AdminNewProductForm } from '@/components/admin/AdminNewProductForm';

// Server action is wired via an API call from the client form
async function createRing(data: { name: string; slug: string; metals: string[]; basePrice: number; description: string }) {
  const res  = await fetch('/api/admin/rings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Failed to create ring');
  return json.id as string;
}

export default function AdminRingsNewPage() {
  return (
    <AdminNewProductForm
      categoryLabel="Ring"
      backHref="/admin/rings"
      onCreate={createRing}
    />
  );
}
