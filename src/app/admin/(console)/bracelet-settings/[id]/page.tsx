import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getBraceletSetting } from '@/lib/bracelet-settings/service'
import { METAL_LABELS } from '@/lib/catalogue/enums'
import { DeleteBraceletSettingForm } from '@/components/admin/bracelets/DeleteBraceletSettingForm'
import { deleteBraceletSettingAction } from './actions'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const setting = await getBraceletSetting(id)
  return {
    title: setting ? `${setting.name} — Admin` : 'Bracelet Setting — Admin',
    robots: { index: false, follow: false },
  }
}

export default async function BraceletSettingDetailPage({ params }: Props) {
  await requireStaffRole(['super_admin'])
  const { id } = await params
  const setting = await getBraceletSetting(id)
  if (!setting) notFound()

  const deleteWithId = deleteBraceletSettingAction.bind(null, id)

  return (
    <div className="max-w-3xl">
      <Link href="/admin/bracelet-settings"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300">
        ← BRACELET SETTINGS
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-white">{setting.name}</h1>
          <p className="mt-1 font-mono text-xs text-neutral-500">{setting.slug}</p>
          <div className="mt-2">
            {setting.is_published
              ? <span className="text-xs text-emerald-400">Published</span>
              : <span className="text-xs text-neutral-600">Draft</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/bracelet-settings/${id}/edit`}
            className="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white">
            Edit
          </Link>
          <DeleteBraceletSettingForm deleteAction={deleteWithId} />
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
          <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-400">DETAILS</h2>
          <dl className="space-y-0.5">
            <Row label="Collection"    value={setting.collection ?? '—'} />
            <Row label="Style"         value={setting.style ?? '—'} />
            <Row label="Sizes" value={setting.sizes_cm.length ? setting.sizes_cm.map((c) => `${c} cm`).join(', ') : '—'} />
            <Row label="Base price"    value={setting.base_price_gbp ? `£${Number(setting.base_price_gbp).toLocaleString()}` : '—'} />
            <Row label="Sort order"    value={String(setting.sort_order)} />
            <Row label="Created"       value={new Date(setting.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} />
          </dl>
        </section>

        <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
          <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-400">METALS</h2>
          <div className="flex flex-wrap gap-2">
            {setting.metals.map((m) => (
              <span key={m} className="rounded border border-neutral-700 px-3 py-1 text-sm text-neutral-300">{METAL_LABELS[m]}</span>
            ))}
          </div>
        </section>

        {setting.description && (
          <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
            <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-400">DESCRIPTION</h2>
            <p className="text-sm leading-relaxed text-neutral-300">{setting.description}</p>
          </section>
        )}

        <section className="rounded border border-neutral-800 bg-neutral-900/30 p-6">
          <h2 className="mb-4 text-xs font-semibold tracking-widest text-neutral-400">MEDIA</h2>
          {setting.media.length === 0
            ? <p className="text-sm text-neutral-600">No media uploaded yet.</p>
            : <p className="text-sm text-neutral-400">{setting.media.length} file{setting.media.length !== 1 ? 's' : ''} attached.</p>}
        </section>
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
