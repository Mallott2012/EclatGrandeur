import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getDiamond } from '@/lib/diamonds/service'
import { isEclatEligible } from '@/lib/diamonds/eligibility'
import {
  CUT_LABELS,
  GRADE_LABELS,
  FLUORESCENCE_LABELS,
  COLOUR_FAMILY_LABELS,
  COLOUR_INTENSITY_LABELS,
  type DiamondStatus,
} from '@/lib/diamonds/types'
import { DeleteDiamondForm }      from '@/components/admin/diamonds/DeleteDiamondForm'
import { EclatApprovalSection }   from '@/components/admin/diamonds/EclatApprovalSection'
import { deleteDiamondAction, approveEclatDiamondAction, revokeEclatApprovalAction } from './actions'

export const metadata: Metadata = {
  title: 'Diamond — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

// Fancy shapes — require eclat_approved
const FANCY_SHAPES = ['oval','cushion','emerald','pear','radiant','princess','marquise','asscher','heart']

interface Props {
  params: Promise<{ id: string }>
}

export default async function DiamondDetailPage({ params }: Props) {
  await requireStaffRole(['super_admin', 'diamond_buyer'])
  const { id } = await params
  const diamond = await getDiamond(id)
  if (!diamond) notFound()

  const deleteWithId  = deleteDiamondAction.bind(null, id)
  const approveWithId = approveEclatDiamondAction.bind(null, id)
  const revokeWithId  = revokeEclatApprovalAction.bind(null, id)

  const isFancy  = FANCY_SHAPES.includes(diamond.cut)
  const eligible = isEclatEligible(diamond)

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <Link
        href="/admin/diamonds"
        className="mb-4 inline-block text-xs tracking-widest text-stone-400 transition-colors hover:text-stone-700"
      >
        ← DIAMONDS
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-stone-900">{diamond.sku}</h1>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <StatusBadge status={diamond.status} />
            {diamond.is_published
              ? <span className="text-xs text-emerald-600">Published</span>
              : <span className="text-xs text-stone-400">Draft</span>}
            <span className="text-xs text-stone-300">·</span>
            <CategoryBadge category={diamond.diamond_category} />
            <span className="text-xs text-stone-300">·</span>
            <EligibilityBadge eligible={eligible} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/diamonds/${id}/edit`}
            className="rounded border border-stone-200 px-4 py-2 text-sm text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-900"
          >
            Edit
          </Link>
          <DeleteDiamondForm deleteAction={deleteWithId} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">

          <Section title="4Cs">
            <Rows>
              <Row label="Cut"     value={CUT_LABELS[diamond.cut]} />
              <Row label="Carat"   value={`${diamond.carat.toFixed(2)} ct`} />
              {diamond.diamond_category === 'white' && (
                <Row label="Colour"  value={diamond.colour} />
              )}
              <Row label="Clarity" value={diamond.clarity} />
            </Rows>
          </Section>

          {/* Coloured diamond identity */}
          {diamond.diamond_category === 'coloured' && (
            <Section title="Colour">
              <Rows>
                {diamond.colour_family && (
                  <Row label="Family"      value={COLOUR_FAMILY_LABELS[diamond.colour_family]} />
                )}
                {diamond.colour_intensity && (
                  <Row label="Intensity"   value={COLOUR_INTENSITY_LABELS[diamond.colour_intensity]} />
                )}
                {diamond.colour_description && (
                  <Row label="Description" value={diamond.colour_description} />
                )}
              </Rows>
            </Section>
          )}

          <Section title="Cut grades">
            <Rows>
              <Row label="Cut grade"    value={diamond.cut_grade ? GRADE_LABELS[diamond.cut_grade] : '—'} />
              <Row label="Polish"       value={diamond.polish    ? GRADE_LABELS[diamond.polish]    : '—'} />
              <Row label="Symmetry"     value={diamond.symmetry  ? GRADE_LABELS[diamond.symmetry]  : '—'} />
              <Row label="Fluorescence" value={FLUORESCENCE_LABELS[diamond.fluorescence]} />
            </Rows>
          </Section>

          {(diamond.gia_report_number || diamond.gia_report_date || diamond.gia_report_url) && (
            <Section title="GIA certification">
              <Rows>
                {diamond.gia_report_number && (
                  <Row label="Report no." value={diamond.gia_report_number} />
                )}
                {diamond.gia_report_date && (
                  <Row label="Date" value={fmtDate(diamond.gia_report_date)} />
                )}
                {diamond.gia_report_url && (
                  <Row label="Report PDF" value={
                    <a href={diamond.gia_report_url} target="_blank" rel="noopener noreferrer"
                      className="text-stone-700 underline hover:text-stone-900">
                      View report
                    </a>
                  } />
                )}
              </Rows>
            </Section>
          )}

          {(diamond.measurement_length || diamond.measurement_width || diamond.measurement_depth ||
            diamond.depth_pct || diamond.table_pct) && (
            <Section title="Measurements">
              <Rows>
                {(diamond.measurement_length || diamond.measurement_width || diamond.measurement_depth) && (
                  <Row label="L × W × D" value={
                    `${diamond.measurement_length ?? '?'} × ${diamond.measurement_width ?? '?'} × ${diamond.measurement_depth ?? '?'} mm`
                  } />
                )}
                {diamond.table_pct && <Row label="Table" value={`${diamond.table_pct}%`} />}
                {diamond.depth_pct && <Row label="Depth" value={`${diamond.depth_pct}%`} />}
              </Rows>
            </Section>
          )}

          {diamond.notes && (
            <Section title="Internal notes">
              <p className="whitespace-pre-wrap text-sm text-stone-700">{diamond.notes}</p>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Section title="Pricing">
            <Rows>
              <Row label="Price (GBP)" value={
                new Intl.NumberFormat('en-GB', {
                  style: 'currency', currency: 'GBP', maximumFractionDigits: 0,
                }).format(diamond.price_gbp)
              } />
            </Rows>
          </Section>

          {/* Éclat Approval — fancy shapes only */}
          {isFancy && (
            <EclatApprovalSection
              approveAction={approveWithId}
              revokeAction={revokeWithId}
              approved={diamond.eclat_approved}
              approvedAt={diamond.eclat_approved_at}
              approvedBy={diamond.eclat_approved_by}
              approvalNote={diamond.eclat_approval_note}
            />
          )}

          {diamond.ring_setting_id && (
            <Section title="Ring setting">
              <Rows>
                <Row label="Setting ID" value={
                  <Link
                    href={`/admin/ring-settings/${diamond.ring_setting_id}`}
                    className="font-mono text-xs text-stone-700 underline hover:text-stone-900"
                  >
                    {diamond.ring_setting_id.slice(0, 8)}…
                  </Link>
                } />
              </Rows>
            </Section>
          )}

          <Section title="Record">
            <Rows>
              <Row label="Created" value={fmtDate(diamond.created_at)} />
              <Row label="Updated" value={fmtDate(diamond.updated_at)} />
            </Rows>
          </Section>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: DiamondStatus }) {
  switch (status) {
    case 'available': return <span className="text-xs text-emerald-600">Available</span>
    case 'reserved':  return <span className="text-xs text-amber-600">Reserved</span>
    case 'sold':      return <span className="text-xs text-stone-400">Sold</span>
    default:          return <span className="text-xs text-stone-500">{status}</span>
  }
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="text-xs text-stone-500">
      {category === 'coloured' ? 'Coloured' : 'White'}
    </span>
  )
}

function EligibilityBadge({ eligible }: { eligible: boolean }) {
  return eligible
    ? <span className="text-xs text-emerald-600">Éclat eligible</span>
    : <span className="text-xs text-amber-600">Not eligible</span>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-stone-200 bg-white">
      <p className="border-b border-stone-200 px-4 py-2 text-xs font-semibold tracking-widest text-stone-400">
        {title.toUpperCase()}
      </p>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Rows({ children }: { children: React.ReactNode }) {
  return <dl className="divide-y divide-stone-100">{children}</dl>
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 py-1.5">
      <dt className="w-28 shrink-0 text-xs font-medium tracking-wider text-stone-400">
        {label.toUpperCase()}
      </dt>
      <dd className="flex-1 text-sm text-stone-800">{value}</dd>
    </div>
  )
}
