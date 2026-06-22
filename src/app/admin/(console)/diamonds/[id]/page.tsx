import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { getDiamond } from '@/lib/diamonds/service'
import { listDiamondMedia } from '@/lib/diamonds/media'
import type { DiamondFull, DiamondSalesView, DiamondStatus } from '@/lib/diamonds/types'
import { HoldDialog } from '@/components/admin/diamonds/HoldDialog'
import { ReleaseHoldButton } from '@/components/admin/diamonds/ReleaseHoldButton'
import { StatusTransitionButton } from '@/components/admin/diamonds/StatusTransitionButton'
import { MediaGallery } from '@/components/admin/diamonds/MediaGallery'
import { CertUploadForm } from '@/components/admin/diamonds/CertUploadForm'
import { CertViewButton } from '@/components/admin/diamonds/CertViewButton'
import {
  placeHoldAction,
  releaseHoldAction,
  extendHoldAction,
  transitionStatusAction,
  uploadMediaAction,
  deleteMediaAction,
  setPrimaryMediaAction,
  uploadCertificateAction,
  getCertificateUrlAction,
} from './actions'

export const metadata: Metadata = {
  title: 'Diamond — Éclat Grandeur Admin',
  robots: { index: false, follow: false },
}

interface Props {
  params:       Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

function isPrivileged(actor: { roles: string[] }): boolean {
  return actor.roles.includes('super_admin') || actor.roles.includes('diamond_buyer')
}

export default async function DiamondDetailPage({ params, searchParams }: Props) {
  const actor    = await requireStaffRole(['super_admin', 'diamond_buyer', 'sales_adviser'])
  const { id }   = await params
  const sp       = await searchParams
  const privil   = isPrivileged(actor)

  const [diamond, media] = await Promise.all([
    getDiamond(actor, id).catch(() => null),
    listDiamondMedia(actor, id).catch(() => []),
  ])
  if (!diamond) notFound()

  const full = privil ? (diamond as DiamondFull) : null
  const sale = !privil ? (diamond as DiamondSalesView) : null

  // Derived booleans (available on both views via the union)
  const status:       DiamondStatus = (diamond as DiamondFull).status
  const holdExpired:  boolean       = (diamond as DiamondFull).holdIsExpired
  const isMyHold:     boolean       = privil ? false : (diamond as DiamondSalesView).isMyHold
  const holdExpAt:    string | null = (diamond as DiamondFull).hold_expires_at

  // Pre-bind actions for client components.
  const boundPlaceHold   = placeHoldAction.bind(null, id)
  const boundExtendHold  = extendHoldAction.bind(null, id)
  const boundReleaseHold = releaseHoldAction.bind(null, id)
  const boundReserve     = transitionStatusAction.bind(null, id, 'reserved')
  const boundSold        = transitionStatusAction.bind(null, id, 'sold')
  const boundRemoved     = transitionStatusAction.bind(null, id, 'removed')
  const boundAvailable   = transitionStatusAction.bind(null, id, 'available')
  const boundUploadMedia = uploadMediaAction.bind(null, id)
  const boundUploadCert  = uploadCertificateAction.bind(null, id)
  const boundGetCertUrl  = getCertificateUrlAction.bind(null, id)

  const mediaWithActions = media.map((m) => ({
    ...m,
    deleteAction:     deleteMediaAction.bind(null, m.id, id),
    setPrimaryAction: setPrimaryMediaAction.bind(null, m.id, id),
  }))

  const certWarn = sp.cert_warn === '1'

  const canPlaceHold  = status === 'available'
  const canReleaseHold = status === 'on_hold' && (privil || isMyHold)
  const canExtendHold  = status === 'on_hold' && (privil || isMyHold)

  return (
    <div className="max-w-5xl">
      {/* Breadcrumb */}
      <Link
        href="/admin/diamonds"
        className="mb-4 inline-block text-xs tracking-widest text-neutral-500 transition-colors hover:text-neutral-300"
      >
        ← DIAMONDS
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-widest text-white">
            {diamond.sku}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <DiamondStatusBadge status={status} holdExpired={holdExpired} />
            {full?.is_visible ? (
              <span className="text-xs text-emerald-400">Visible on storefront</span>
            ) : (
              <span className="text-xs text-neutral-600">Hidden</span>
            )}
          </div>
        </div>
        {privil && status !== 'sold' && status !== 'removed' && (
          <Link
            href={`/admin/diamonds/${id}/edit`}
            className="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
          >
            Edit
          </Link>
        )}
      </div>

      {/* Cert audit warning banner */}
      {certWarn && (
        <div className="mb-6 rounded border border-amber-800/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
          Certificate uploaded. The audit record could not be written — please notify an administrator.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left / main column ── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Grading */}
          <Section title="Grading">
            <Rows>
              <Row label="Shape"       value={fmt(diamond.shape)} />
              <Row label="Carat"       value={String(diamond.carat)} />
              <Row label="Clarity"     value={diamond.clarity} />
              <Row label="Cut"         value={diamond.cut ?? '—'} />
              <Row label="Polish"      value={diamond.polish} />
              <Row label="Symmetry"    value={diamond.symmetry} />
              <Row label="Fluorescence" value={diamond.fluorescence} />
              <Row label="Origin"      value={fmt(diamond.origin)} />
            </Rows>
          </Section>

          {/* Colour */}
          <Section title="Colour">
            {diamond.colour_category === 'standard' ? (
              <Rows><Row label="Grade" value={diamond.colour_grade ?? '—'} /></Rows>
            ) : (
              <Rows>
                <Row label="Hue"       value={fmt(diamond.fancy_colour_hue ?? '—')} />
                <Row label="Intensity" value={diamond.fancy_colour_intensity ?? '—'} />
                <Row label="Overtone"  value={diamond.fancy_colour_overtone ?? '—'} />
              </Rows>
            )}
          </Section>

          {/* Measurements */}
          {(diamond.meas_length_mm || diamond.meas_width_mm || diamond.meas_depth_mm) && (
            <Section title="Measurements">
              <Rows>
                {diamond.meas_length_mm && <Row label="L × W × D" value={`${diamond.meas_length_mm} × ${diamond.meas_width_mm} × ${diamond.meas_depth_mm} mm`} />}
                {diamond.table_pct     && <Row label="Table"  value={`${diamond.table_pct}%`} />}
                {diamond.depth_pct     && <Row label="Depth"  value={`${diamond.depth_pct}%`} />}
                {diamond.girdle        && <Row label="Girdle" value={diamond.girdle} />}
                {diamond.culet         && <Row label="Culet"  value={diamond.culet} />}
              </Rows>
            </Section>
          )}

          {/* Certificate */}
          <Section title="Certificate">
            <Rows>
              <Row label="Lab"    value={diamond.cert_lab ?? '—'} />
              <Row label="Number" value={diamond.cert_number ?? '—'} />
            </Rows>
            {privil && diamond.cert_lab && diamond.cert_number && (
              <div className="mt-3 flex gap-3">
                <CertViewButton action={boundGetCertUrl} />
              </div>
            )}
          </Section>

          {/* Pricing */}
          <Section title="Pricing">
            <Rows>
              <Row
                label="Retail price"
                value={diamond.retail_price_amount
                  ? `${diamond.retail_price_currency} ${diamond.retail_price_amount.toLocaleString()}`
                  : '—'}
              />
              {full && (
                <Row
                  label="Supplier cost"
                  value={full.supplier_cost_amount
                    ? `${full.supplier_cost_currency} ${full.supplier_cost_amount.toLocaleString()}`
                    : '—'}
                />
              )}
            </Rows>
          </Section>

          {/* Selection note */}
          {diamond.selection_note && (
            <Section title="Selection note">
              <p className="whitespace-pre-wrap text-sm text-neutral-300">{diamond.selection_note}</p>
            </Section>
          )}

          {/* Internal (privileged) */}
          {full && (
            <>
              {full.internal_notes && (
                <Section title="Internal notes">
                  <p className="whitespace-pre-wrap text-sm text-neutral-300">{full.internal_notes}</p>
                </Section>
              )}
              <Section title="Supplier">
                <Rows>
                  <Row label="Code"        value={full.supplier_code ?? '—'} />
                  <Row label="Supplier SKU" value={full.supplier_sku ?? '—'} />
                </Rows>
              </Section>
            </>
          )}
        </div>

        {/* ── Right column: status, operations, certificate, media ── */}
        <div className="space-y-6">

          {/* Hold info (when on hold) */}
          {status === 'on_hold' && (
            <Section title="Hold">
              <Rows>
                {privil && full?.held_by_user_id && (
                  <Row label="Held by" value={<span className="font-mono text-xs">{full.held_by_user_id.slice(0, 8)}…</span>} />
                )}
                <Row label="Expires" value={holdExpAt ? fmtDate(holdExpAt) : '—'} />
                {holdExpired && (
                  <Row label="Status" value={<span className="text-red-400">Expired</span>} />
                )}
                {(isMyHold || privil) && (diamond as DiamondSalesView | DiamondFull).hold_reason && (
                  <Row label="Reason" value={(diamond as DiamondSalesView | DiamondFull).hold_reason!} />
                )}
              </Rows>
            </Section>
          )}

          {/* Operational controls */}
          {(canPlaceHold || canReleaseHold || canExtendHold || privil) && (
            <Section title="Operations">
              <div className="space-y-2">
                {canPlaceHold && (
                  <HoldDialog
                    mode="place"
                    action={boundPlaceHold}
                    label="Place hold"
                  />
                )}
                {canExtendHold && !holdExpired && (
                  <HoldDialog
                    mode="extend"
                    action={boundExtendHold}
                    label="Extend hold"
                    currentExpiresAt={holdExpAt}
                  />
                )}
                {canReleaseHold && (
                  <ReleaseHoldButton action={boundReleaseHold} />
                )}

                {/* Privileged status transitions */}
                {privil && status === 'available' && (
                  <>
                    <StatusTransitionButton label="Mark as reserved" action={boundReserve} />
                    <StatusTransitionButton label="Mark as removed"  action={boundRemoved}  requiresConfirm />
                  </>
                )}
                {privil && status === 'on_hold' && (
                  <>
                    <StatusTransitionButton label="Move to reserved" action={boundReserve} />
                    <StatusTransitionButton label="Mark as sold"     action={boundSold}     requiresConfirm />
                    <StatusTransitionButton label="Mark as removed"  action={boundRemoved}  requiresConfirm />
                  </>
                )}
                {privil && status === 'reserved' && (
                  <>
                    <StatusTransitionButton label="Mark as sold"      action={boundSold}      requiresConfirm />
                    <StatusTransitionButton label="Release reserve"   action={boundAvailable} />
                    <StatusTransitionButton label="Mark as removed"   action={boundRemoved}   requiresConfirm />
                  </>
                )}
              </div>
            </Section>
          )}

          {/* Certificate management (privileged only) */}
          {privil && (
            <Section title="Certificate PDF">
              <CertUploadForm
                action={boundUploadCert}
                existingCertLab={full?.cert_lab ?? null}
                existingCertNumber={full?.cert_number ?? null}
              />
            </Section>
          )}

          {/* Audit trail meta */}
          <Section title="Record">
            <Rows>
              <Row label="Created" value={fmtDate(diamond.created_at)} />
              <Row label="Updated" value={fmtDate(diamond.updated_at)} />
            </Rows>
          </Section>
        </div>
      </div>

      {/* Media gallery */}
      <div className="mt-6">
        <MediaGallery
          items={mediaWithActions}
          isPrivileged={privil}
          uploadAction={boundUploadMedia}
          nextDisplayOrder={media.length}
        />
      </div>
    </div>
  )
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function fmt(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900/30">
      <p className="border-b border-neutral-800 px-4 py-2 text-xs font-semibold tracking-widest text-neutral-500">
        {title.toUpperCase()}
      </p>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Rows({ children }: { children: React.ReactNode }) {
  return <dl className="divide-y divide-neutral-800/40">{children}</dl>
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 py-1.5">
      <dt className="w-28 shrink-0 text-xs font-medium tracking-wider text-neutral-500">
        {label.toUpperCase()}
      </dt>
      <dd className="flex-1 text-sm text-neutral-200">{value}</dd>
    </div>
  )
}

function DiamondStatusBadge({
  status,
  holdExpired,
}: {
  status:      DiamondStatus
  holdExpired: boolean
}) {
  if (holdExpired) {
    return <span className="inline-flex items-center gap-1 text-xs text-red-400"><span className="h-1.5 w-1.5 rounded-full bg-red-400" />Hold expired</span>
  }
  switch (status) {
    case 'available': return <span className="text-xs text-emerald-400">Available</span>
    case 'on_hold':   return <span className="text-xs text-amber-400">On hold</span>
    case 'reserved':  return <span className="text-xs text-blue-400">Reserved</span>
    case 'sold':      return <span className="text-xs text-neutral-400">Sold</span>
    case 'removed':   return <span className="text-xs text-neutral-600">Removed</span>
  }
}
