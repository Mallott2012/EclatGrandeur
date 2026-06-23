import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getRingSetting, getRingSettingDiamonds } from '@/lib/ring-settings/service'
import { listDiamonds } from '@/lib/diamonds/service'
import { METAL_LABELS } from '@/lib/ring-settings/types'
import { DeleteRingSettingForm } from '@/components/admin/ring-settings/DeleteRingSettingForm'
import { DiamondAssignmentPanel, type DiamondSummary } from '@/components/admin/DiamondAssignmentPanel'
import { deleteRingSettingAction } from './actions'
import { assignRingDiamondAction, unassignRingDiamondAction } from './diamond-actions'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const setting = await getRingSetting(id)
  return {
    title: setting ? `${setting.name} — Admin` : 'Ring Setting — Admin',
    robots: { index: false, follow: false },
  }
}

export default async function RingSettingDetailPage({ params }: Props) {
  await requireStaffRole(['super_admin'])
  const { id } = await params

  const [setting, assignedByMetal, allDiamonds] = await Promise.all([
    getRingSetting(id),
    getRingSettingDiamonds(id),
    listDiamonds(),
  ])

  if (!setting) notFound()

  const deleteWithId = deleteRingSettingAction.bind(null, id)

  // Shape diamonds into summary rows
  const diamondSummaries: DiamondSummary[] = allDiamonds
    .filter((d) => d.status === 'available')
    .map((d) => ({
      id:        d.id,
      sku:       d.sku,
      cut:       d.cut,
      carat:     String(d.carat),
      colour:    d.colour,
      clarity:   d.clarity,
      price_gbp: String(d.price_gbp),
    }))

  return (
    <div className="max-w-4xl">
      <Link
        href="/admin/ring-settings"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300"
      >
        ← RING SETTINGS
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-white">{setting.name}</h1>
          <p className="mt-1 font-mono text-xs text-neutral-500">{setting.slug}</p>
          <div className="mt-2">
            {setting.is_published ? (
              <span className="text-xs text-emerald-400">Published</span>
            ) : (
              <span className="text-xs text-neutral-600">Draft</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/ring-settings/${id}/edit`}
            className="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
          >
            Edit Details
          </Link>
          <DeleteRingSettingForm deleteAction={deleteWithId} />
        </div>
      </div>

      <div className="space-y-6">
        {/* Details */}
        <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
          <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-400">DETAILS</h2>
          <dl className="space-y-0.5">
            <Row label="Collection"  value={setting.collection ?? '—'} />
            <Row label="Base price"  value={setting.base_price_gbp ? `£${Number(setting.base_price_gbp).toLocaleString()}` : '—'} />
            <Row label="Sort order"  value={String(setting.sort_order)} />
            <Row label="Created"     value={new Date(setting.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} />
          </dl>
        </section>

        {/* Per-metal diamond assignment */}
        <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
          <h2 className="mb-1 text-xs font-semibold tracking-widest text-neutral-400">AVAILABLE DIAMONDS BY METAL</h2>
          <p className="mb-6 text-xs text-neutral-600">
            Tick the diamonds available for each metal option. Only ticked diamonds will appear on the product page for that metal.
          </p>

          {setting.metals.length === 0 ? (
            <p className="text-sm text-neutral-600">No metals configured. Edit the ring setting to add metals first.</p>
          ) : (
            <div className="space-y-8">
              {setting.metals.map((metal) => {
                const assigned = assignedByMetal[metal] ?? []
                const assignFn = assignRingDiamondAction.bind(null, id, metal)
                const unassignFn = unassignRingDiamondAction.bind(null, id, metal)
                return (
                  <div key={metal}>
                    <h3 className="mb-3 text-sm font-semibold text-neutral-200">
                      {METAL_LABELS[metal]}
                      <span className="ml-2 text-xs font-normal text-neutral-500">
                        ({assigned.length} assigned)
                      </span>
                    </h3>
                    <DiamondAssignmentPanel
                      diamonds={diamondSummaries}
                      assignedIds={assigned}
                      onAssign={assignFn}
                      onUnassign={unassignFn}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Description */}
        {setting.description && (
          <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
            <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-400">DESCRIPTION</h2>
            <p className="text-sm leading-relaxed text-neutral-300">{setting.description}</p>
          </section>
        )}

        {/* Media */}
        <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
          <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-400">MEDIA</h2>
          {setting.media.length === 0 ? (
            <p className="text-sm text-neutral-600">No media uploaded yet.</p>
          ) : (
            <p className="text-sm text-neutral-400">{setting.media.length} file{setting.media.length !== 1 ? 's' : ''} attached.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 py-1.5">
      <dt className="w-28 shrink-0 text-xs font-medium tracking-wider text-neutral-500">{label.toUpperCase()}</dt>
      <dd className="flex-1 text-sm text-neutral-200">{value}</dd>
    </div>
  )
}
