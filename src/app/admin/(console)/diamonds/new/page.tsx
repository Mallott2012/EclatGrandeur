import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { listSuppliers } from '@/lib/suppliers/service'
import { SupplierFilterSchema } from '@/lib/suppliers/schemas'
import { DiamondForm } from '@/components/admin/diamonds/DiamondForm'
import { createDiamondAction } from '../actions'

export const metadata: Metadata = {
  title: 'New Diamond — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

export default async function NewDiamondPage() {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer'])

  const { items: suppliers } = await listSuppliers(
    actor,
    SupplierFilterSchema.parse({ page: 1, limit: 200, is_active: true }),
  )
  const supplierOptions = suppliers.map((s) => ({ id: s.id, code: s.code, name: s.name }))

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link
          href="/admin/diamonds"
          className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300"
        >
          ← DIAMONDS
        </Link>
        <h1 className="font-display text-3xl font-light tracking-widest text-white">NEW DIAMOND</h1>
      </div>

      <div className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
        <DiamondForm
          action={createDiamondAction}
          supplierOptions={supplierOptions}
          submitLabel="Create diamond"
          cancelHref="/admin/diamonds"
        />
      </div>
    </div>
  )
}
