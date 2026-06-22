import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getDiamond } from '@/lib/diamonds/service'
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
  await requireStaffRole(['super_admin', 'diamond_buyer'])
  const { id }   = await params
  const diamond  = await getDiamond(id)
  if (!diamond) notFound()

  const boundUpdate = updateDiamondAction.bind(null, id)

  return (
    <div className="max-w-3xl">
      <Link
        href={`/admin/diamonds/${id}`}
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300"
      >
        ← {diamond.sku}
      </Link>
      <h1 className="mb-1 font-display text-3xl font-light tracking-widest text-white">EDIT DIAMOND</h1>
      <p className="mb-8 font-mono text-xs text-neutral-500">{diamond.sku}</p>

      <div className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
        <DiamondForm
          action={boundUpdate}
          defaultValues={{
            ring_setting_id:    diamond.ring_setting_id,
            cut:                diamond.cut,
            carat:              diamond.carat,
            colour:             diamond.colour,
            clarity:            diamond.clarity,
            cut_grade:          diamond.cut_grade,
            polish:             diamond.polish,
            symmetry:           diamond.symmetry,
            fluorescence:       diamond.fluorescence,
            gia_report_number:  diamond.gia_report_number,
            gia_report_date:    diamond.gia_report_date,
            gia_report_url:     diamond.gia_report_url,
            measurement_length: diamond.measurement_length,
            measurement_width:  diamond.measurement_width,
            measurement_depth:  diamond.measurement_depth,
            depth_pct:          diamond.depth_pct,
            table_pct:          diamond.table_pct,
            price_gbp:          diamond.price_gbp,
            is_published:       diamond.is_published,
            notes:              diamond.notes,
          }}
          submitLabel="Save changes"
          cancelHref={`/admin/diamonds/${id}`}
        />
      </div>
    </div>
  )
}
