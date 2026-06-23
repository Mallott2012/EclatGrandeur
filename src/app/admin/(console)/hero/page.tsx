import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { listHeroMedia, type HeroPlacement } from '@/lib/hero/service'
import { HeroPublishButton } from '@/components/admin/hero/HeroPublishButton'

export const metadata: Metadata = {
  title: 'Hero Media — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

const PLACEMENT_LABELS: Record<HeroPlacement, string> = {
  'homepage':         'Homepage',
  'engagement-rings': 'Engagement Rings',
  'earrings':         'Earrings',
  'necklaces':        'Necklaces',
  'bracelets':        'Bracelets',
}

const ALL_PLACEMENTS: HeroPlacement[] = [
  'homepage',
  'engagement-rings',
  'earrings',
  'necklaces',
  'bracelets',
]

export default async function HeroAdminPage() {
  await requireStaffRole(['super_admin', 'content_editor'])
  const records = await listHeroMedia()

  // Group by placement
  const byPlacement = ALL_PLACEMENTS.map((p) => ({
    placement:  p,
    label:      PLACEMENT_LABELS[p],
    records:    records.filter((r) => r.placement === p),
    published:  records.find((r) => r.placement === p && r.is_published),
  }))

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-stone-900">HERO MEDIA</h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage homepage &amp; category hero images and copy
          </p>
        </div>
        <Link
          href="/admin/hero/new"
          className="rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700"
        >
          + Add hero
        </Link>
      </div>

      {/* Placement grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {byPlacement.map(({ placement, label, records: recs, published }) => (
          <div
            key={placement}
            className="overflow-hidden rounded border border-stone-200 bg-white"
          >
            {/* Thumbnail */}
            <div className="relative h-28 bg-stone-100">
              {published?.storage_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={published.storage_path}
                  alt={published.headline ?? label}
                  className="h-full w-full object-cover opacity-80"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-xs text-stone-400 tracking-widest">NO HERO</span>
                </div>
              )}
              {/* Published badge */}
              <div className="absolute right-2 top-2">
                {published ? (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] tracking-widest text-emerald-700">
                    LIVE
                  </span>
                ) : (
                  <span className="rounded bg-stone-200 px-2 py-0.5 text-[10px] tracking-widest text-stone-500">
                    NO HERO
                  </span>
                )}
              </div>
            </div>

            {/* Card body */}
            <div className="px-4 py-3">
              <p className="text-xs font-semibold tracking-widest text-stone-700">{label.toUpperCase()}</p>
              {published?.headline && (
                <p className="mt-0.5 truncate text-xs text-stone-500">{published.headline}</p>
              )}
              <p className="mt-1 text-xs text-stone-400">
                {recs.length} record{recs.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Full records table */}
      {records.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-xs font-semibold tracking-widest text-stone-400">ALL RECORDS</h2>
          <div className="overflow-hidden rounded border border-stone-200">
            <table className="w-full text-sm">
              <thead className="border-b border-stone-200 bg-stone-50">
                <tr>
                  {['Placement', 'Type', 'Headline', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-stone-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {records.map((r) => (
                  <tr key={r.id} className="bg-white transition-colors hover:bg-stone-50">
                    <td className="px-4 py-3 text-stone-700">
                      {PLACEMENT_LABELS[r.placement]}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-400">{r.media_type}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-stone-600">
                      {r.headline ?? <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.is_published
                        ? <span className="text-xs text-emerald-600">Published</span>
                        : <span className="text-xs text-stone-400">Draft</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <HeroPublishButton record={r} />
                        <Link
                          href={`/admin/hero/${r.id}`}
                          className="text-xs text-stone-500 hover:text-stone-900"
                        >
                          Edit →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
