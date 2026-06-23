import type { Metadata } from 'next'
import Link from 'next/link'
import { requireStaffRole } from '@/lib/staff'
import { listEnquiries, type EnquiryStatus } from '@/lib/enquiries/service'

export const metadata: Metadata = {
  title: 'Enquiries — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new:       'New',
  contacted: 'Contacted',
  closed:    'Closed',
}

const STATUS_COLOURS: Record<EnquiryStatus, string> = {
  new:       'text-amber-400',
  contacted: 'text-sky-400',
  closed:    'text-neutral-600',
}

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function EnquiriesListPage({ searchParams }: Props) {
  await requireStaffRole(['super_admin', 'sales_adviser'])
  const { status } = await searchParams
  const activeStatus = (['new', 'contacted', 'closed'].includes(status ?? '')
    ? (status as EnquiryStatus)
    : undefined)

  const enquiries = await listEnquiries(activeStatus)

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-white">ENQUIRIES</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {enquiries.length} enquir{enquiries.length !== 1 ? 'ies' : 'y'}
            {activeStatus ? ` · ${STATUS_LABELS[activeStatus]}` : ''}
          </p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex gap-1">
        {([undefined, 'new', 'contacted', 'closed'] as const).map((s) => {
          const isActive = (s ?? '') === (activeStatus ?? '')
          const label = s ? STATUS_LABELS[s] : 'All'
          const href = s ? `/admin/enquiries?status=${s}` : '/admin/enquiries'
          return (
            <Link
              key={label}
              href={href}
              className={`rounded px-3 py-1.5 text-xs tracking-wide transition-colors ${
                isActive
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {enquiries.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-neutral-900/50 px-6 py-16 text-center">
          <p className="text-sm text-neutral-500">No enquiries{activeStatus ? ` with status "${STATUS_LABELS[activeStatus]}"` : ''} yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-800 bg-neutral-900/50">
              <tr>
                {['Ref', 'Customer', 'Subject', 'Status', 'Received', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-widest text-neutral-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {enquiries.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-neutral-900/40">
                  <td className="px-4 py-3 font-mono text-xs text-neutral-500">{e.enquiry_number}</td>
                  <td className="px-4 py-3">
                    <p className="text-neutral-200">{e.customer_name}</p>
                    <p className="text-xs text-neutral-600">{e.customer_email}</p>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-neutral-400">
                    {e.subject ?? <span className="italic text-neutral-700">No subject</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${STATUS_COLOURS[e.status]}`}>
                      {STATUS_LABELS[e.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/enquiries/${e.id}`}
                      className="text-xs text-neutral-400 hover:text-white"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
