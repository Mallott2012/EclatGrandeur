import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getSupplier } from '@/lib/suppliers/service'
import { SupplierForm } from '@/components/admin/suppliers/SupplierForm'
import { updateSupplierAction } from '../../actions'

export const metadata: Metadata = {
  title: 'Edit Supplier — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditSupplierPage({ params }: Props) {
  const actor    = await requireStaffRole(['super_admin', 'diamond_buyer'])
  const { id }   = await params
  const supplier = await getSupplier(actor, id).catch(() => null)

  if (!supplier) notFound()

  // Bind the supplier ID into the action so the client form doesn't need to
  // know or send it — the ID never passes through user-controlled form data.
  const boundUpdate = updateSupplierAction.bind(null, supplier.id)

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="mb-4 flex gap-2 text-xs tracking-widest text-neutral-500">
        <Link href="/admin/suppliers" className="hover:text-neutral-300">SUPPLIERS</Link>
        <span>/</span>
        <Link href={`/admin/suppliers/${supplier.id}`} className="hover:text-neutral-300">
          {supplier.name.toUpperCase()}
        </Link>
        <span>/</span>
        <span className="text-neutral-400">EDIT</span>
      </div>

      <h1 className="mb-8 font-display text-3xl font-light tracking-widest text-white">
        EDIT SUPPLIER
      </h1>

      <div className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
        <SupplierForm
          action={boundUpdate}
          initialData={supplier}
          submitLabel="Save changes"
          cancelHref={`/admin/suppliers/${supplier.id}`}
        />
      </div>
    </div>
  )
}
