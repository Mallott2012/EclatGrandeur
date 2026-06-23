import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { JewelleryForm } from '@/components/admin/jewellery/JewelleryForm'
import { createJewelleryAction } from '../actions'

export const metadata: Metadata = {
  title: 'Add Jewellery Product — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function NewJewelleryPage() {
  await requireStaffRole(['super_admin', 'content_editor'])

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/jewellery"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300"
      >
        ← JEWELLERY
      </Link>
      <h1 className="mb-8 font-display text-3xl font-light tracking-widest text-white">ADD PRODUCT</h1>
      <div className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
        <JewelleryForm
          action={createJewelleryAction}
          submitLabel="Create product"
          cancelHref="/admin/jewellery"
        />
      </div>
    </div>
  )
}
