import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getSupplier } from '@/lib/suppliers/service'
import { countActiveDiamondsBySupplier } from '@/lib/suppliers/repository'
import { DeactivateButton } from '@/components/admin/suppliers/DeactivateButton'
import { deactivateSupplierAction } from '../actions'

export const metadata: Metadata = {
  title: 'Supplier — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function SupplierDetailPage({ params }: Props) {
  const actor      = await requireStaffRole(['super_admin', 'diamond_buyer'])
  const { id }     = await params
  const [supplier, activeDiamonds] = await Promise.all([
    getSupplier(actor, id).catch(() => null),
    countActiveDiamondsBySupplier(id),
  ])

  if (!supplier) notFound()

  const boundDeactivate = deactivateSupplierAction.bind(null, supplier.id)

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <Link
        href="/admin/suppliers"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300"
      >
        ← SUPPLIERS
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-white">
            {supplier.name}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="font-mono text-xs text-neutral-500">{supplier.code}</span>
            {supplier.is_active ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            ) : (
              <span className="text-xs text-neutral-600">Inactive</span>
            )}
          </div>
        </div>
        <Link
          href={`/admin/suppliers/${supplier.id}/edit`}
          className="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
        >
          Edit
        </Link>
      </div>

      {/* Active diamonds warning */}
      {activeDiamonds > 0 && (
        <div className="mb-6 rounded border border-amber-800/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
          {activeDiamonds} active diamond{activeDiamonds !== 1 ? 's' : ''} reference this supplier.
          These must be resolved before the supplier can be deactivated.
        </div>
      )}

      {/* Detail card */}
      <div className="mb-6 rounded border border-neutral-800 bg-neutral-900/30">
        <dl className="divide-y divide-neutral-800/60">
          <Row label="Name"         value={supplier.name} />
          <Row label="Code"         value={<span className="font-mono">{supplier.code}</span>} />
          <Row label="Currency"     value={supplier.currency} />
          <Row label="Country"      value={supplier.country ?? '—'} />
          <Row label="Contact"      value={supplier.contact_name ?? '—'} />
          <Row label="Email"        value={supplier.email
            ? <a href={`mailto:${supplier.email}`} className="text-amber-600 hover:text-amber-400">{supplier.email}</a>
            : '—'} />
          <Row label="Phone"        value={supplier.phone ?? '—'} />
          <Row label="Active diamonds" value={
            <span className={activeDiamonds > 0 ? 'text-amber-400' : 'text-neutral-400'}>
              {activeDiamonds}
            </span>
          } />
          <Row label="Created"      value={formatDate(supplier.created_at)} />
          <Row label="Updated"      value={formatDate(supplier.updated_at)} />
        </dl>
      </div>

      {/* Notes */}
      {supplier.notes && (
        <div className="mb-6 rounded border border-neutral-800 bg-neutral-900/30 p-4">
          <p className="mb-2 text-xs font-semibold tracking-widest text-neutral-400">NOTES</p>
          <p className="whitespace-pre-wrap text-sm text-neutral-300">{supplier.notes}</p>
        </div>
      )}

      {/* Deactivation — only shown when supplier is active */}
      {supplier.is_active && (
        <div className="rounded border border-neutral-800 bg-neutral-900/30 p-4">
          <p className="mb-3 text-xs font-semibold tracking-widest text-neutral-400">DEACTIVATE</p>
          <DeactivateButton action={boundDeactivate} />
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 px-4 py-3">
      <dt className="w-36 shrink-0 text-xs font-medium tracking-widest text-neutral-500">
        {label.toUpperCase()}
      </dt>
      <dd className="flex-1 text-sm text-neutral-200">{value}</dd>
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}
