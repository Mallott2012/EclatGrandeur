import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getNecklaceStone } from '@/lib/necklace-stones/service'
import { GEMSTONE_TYPE_LABELS, GEM_SHAPE_LABELS, GEM_FLUORESCENCE_LABELS } from '@/lib/catalogue/enums'
import { StatusBadge } from '@/components/admin/catalogue/StatusBadge'
import { DeleteNecklaceStoneForm } from '@/components/admin/necklaces/DeleteNecklaceStoneForm'
import { deleteNecklaceStoneAction } from './actions'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const stone = await getNecklaceStone(id)
  return {
    title: stone ? `${stone.sku} — Admin` : 'Necklace Stone — Admin',
    robots: { index: false, follow: false },
  }
}

export default async function NecklaceStoneDetailPage({ params }: Props) {
  await requireStaffRole(['super_admin'])
  const { id } = await params
  const stone = await getNecklaceStone(id)
  if (!stone) notFound()

  const deleteWithId = deleteNecklaceStoneAction.bind(null, id)
  const colour = stone.colour ?? stone.colour_description
  const clarity = stone.clarity ?? stone.clarity_description

  return (
    <div className="max-w-3xl">
      <Link href="/admin/necklace-stones"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300">
        ← NECKLACE STONES
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-mono text-2xl font-light tracking-wider text-white">{stone.sku}</h1>
          <p className="mt-1 text-sm text-neutral-400">{GEMSTONE_TYPE_LABELS[stone.stone_type]}{stone.setting ? ` · ${stone.setting.name}` : ''}</p>
          <div className="mt-2 flex items-center gap-3">
            <StatusBadge status={stone.status} />
            {stone.is_published
              ? <span className="text-xs text-emerald-400">Published</span>
              : <span className="text-xs text-neutral-600">Draft</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/necklace-stones/${id}/edit`}
            className="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white">
            Edit
          </Link>
          <DeleteNecklaceStoneForm deleteAction={deleteWithId} />
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
          <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-400">THE 4CS</h2>
          <dl className="space-y-0.5">
            <Row label="Shape"   value={stone.shape ? GEM_SHAPE_LABELS[stone.shape] : '—'} />
            <Row label="Carat"   value={stone.carat ? `${Number(stone.carat).toFixed(2)} ct` : '—'} />
            <Row label="Colour"  value={colour ?? '—'} />
            <Row label="Clarity" value={clarity ?? '—'} />
          </dl>
        </section>

        <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
          <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-400">CUT QUALITY</h2>
          <dl className="space-y-0.5">
            <Row label="Cut grade"    value={stone.cut_grade ?? '—'} />
            <Row label="Polish"       value={stone.polish ?? '—'} />
            <Row label="Symmetry"     value={stone.symmetry ?? '—'} />
            <Row label="Fluorescence" value={stone.fluorescence ? GEM_FLUORESCENCE_LABELS[stone.fluorescence] : '—'} />
          </dl>
        </section>

        <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
          <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-400">CERTIFICATION & PRICING</h2>
          <dl className="space-y-0.5">
            <Row label="GIA report" value={stone.gia_report_number ?? '—'} />
            <Row label="Report date" value={stone.gia_report_date ?? '—'} />
            <Row label="Report URL" value={stone.gia_report_url
              ? <a href={stone.gia_report_url} target="_blank" rel="noreferrer" className="text-amber-500 hover:text-amber-400">View certificate ↗</a>
              : '—'} />
            <Row label="Price" value={stone.price_gbp ? `£${Number(stone.price_gbp).toLocaleString()}` : '—'} />
          </dl>
        </section>

        {stone.notes && (
          <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
            <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-400">INTERNAL NOTES</h2>
            <p className="text-sm leading-relaxed text-neutral-300">{stone.notes}</p>
          </section>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 py-1.5">
      <dt className="w-32 shrink-0 text-xs font-medium tracking-wider text-neutral-500">{label.toUpperCase()}</dt>
      <dd className="flex-1 text-sm text-neutral-200">{value}</dd>
    </div>
  )
}
