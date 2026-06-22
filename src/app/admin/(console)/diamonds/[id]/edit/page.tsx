import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getDiamond } from '@/lib/diamonds/service'
import { listSuppliers } from '@/lib/suppliers/service'
import { SupplierFilterSchema } from '@/lib/suppliers/schemas'
import type { DiamondFull } from '@/lib/diamonds/types'
import { DiamondForm } from '@/components/admin/diamonds/DiamondForm'
import { updateDiamondAction } from '../actions'

export const metadata: Metadata = {
  title: 'Edit Diamond — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function DiamondEditPage({ params }: Props) {
  const actor  = await requireStaffRole(['super_admin', 'diamond_buyer'])
  const { id } = await params

  const [diamond, { items: suppliers }] = await Promise.all([
    getDiamond(actor, id).catch(() => null),
    listSuppliers(actor, SupplierFilterSchema.parse({ page: 1, limit: 200, is_active: true })),
  ])
  if (!diamond) notFound()

  const full            = diamond as DiamondFull
  const supplierOptions = suppliers.map((s) => ({ id: s.id, code: s.code, name: s.name }))
  const boundUpdate     = updateDiamondAction.bind(null, full.id)

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link
          href={`/admin/diamonds/${full.id}`}
          className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300"
        >
          ← {full.sku}
        </Link>
        <h1 className="font-display text-3xl font-light tracking-widest text-white">EDIT DIAMOND</h1>
        <p className="mt-1 font-mono text-xs text-neutral-500">{full.sku}</p>
      </div>

      <div className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
        <DiamondForm
          action={boundUpdate}
          supplierOptions={supplierOptions}
          defaultValues={{
            origin:                 full.origin,
            supplier_id:            full.supplier_id,
            supplier_sku:           full.supplier_sku,
            colour_category:        full.colour_category,
            colour_grade:           full.colour_grade,
            fancy_colour_hue:       full.fancy_colour_hue,
            fancy_colour_intensity: full.fancy_colour_intensity,
            fancy_colour_overtone:  full.fancy_colour_overtone,
            shape:                  full.shape,
            carat:                  full.carat,
            clarity:                full.clarity,
            cut:                    full.cut,
            polish:                 full.polish,
            symmetry:               full.symmetry,
            fluorescence:           full.fluorescence,
            meas_length_mm:         full.meas_length_mm,
            meas_width_mm:          full.meas_width_mm,
            meas_depth_mm:          full.meas_depth_mm,
            table_pct:              full.table_pct,
            depth_pct:              full.depth_pct,
            girdle:                 full.girdle,
            culet:                  full.culet,
            cert_lab:               full.cert_lab,
            cert_number:            full.cert_number,
            retail_price_amount:    full.retail_price_amount,
            retail_price_currency:  full.retail_price_currency,
            supplier_cost_amount:   full.supplier_cost_amount,
            supplier_cost_currency: full.supplier_cost_currency,
            selection_note:         full.selection_note,
            internal_notes:         full.internal_notes,
            is_visible:             full.is_visible,
          }}
          submitLabel="Save changes"
          cancelHref={`/admin/diamonds/${full.id}`}
        />
      </div>
    </div>
  )
}
