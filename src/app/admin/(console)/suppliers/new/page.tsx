import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { SupplierForm } from '@/components/admin/suppliers/SupplierForm'
import { createSupplierAction } from '../actions'

export const metadata: Metadata = {
  title: 'New Supplier — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function NewSupplierPage() {
  await requireStaffRole(['super_admin', 'diamond_buyer'])

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/suppliers"
          className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300"
        >
          ← SUPPLIERS
        </Link>
        <h1 className="font-display text-3xl font-light tracking-widest text-white">NEW SUPPLIER</h1>
      </div>

      <div className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
        <SupplierForm
          action={createSupplierAction}
          submitLabel="Create supplier"
          cancelHref="/admin/suppliers"
        />
      </div>
    </div>
  )
}
