'use client'

import { useFormState as useActionState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import type { DiamondSimpleResult } from '@/app/admin/(console)/diamonds/types'
import { DIAMOND_SIMPLE_INITIAL } from '@/app/admin/(console)/diamonds/types'

interface ApproveProps {
  approveAction: (state: DiamondSimpleResult, formData: FormData) => Promise<DiamondSimpleResult>
  revokeAction:  (state: DiamondSimpleResult, formData: FormData) => Promise<DiamondSimpleResult>
  approved:      boolean
  approvedAt:    string | null
  approvedBy:    string | null
  approvalNote:  string | null
}

export function EclatApprovalSection(props: ApproveProps) {
  const [approveState, approveFormAction] = useActionState(props.approveAction, DIAMOND_SIMPLE_INITIAL)
  const [revokeState, revokeFormAction]   = useActionState(props.revokeAction,  DIAMOND_SIMPLE_INITIAL)

  return (
    <div className="rounded border border-stone-200 bg-white">
      <p className="border-b border-stone-200 px-4 py-2 text-xs font-semibold tracking-widest text-stone-400">
        ÉCLAT APPROVAL
      </p>
      <div className="p-4 space-y-4">

        {/* Current status */}
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${props.approved ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          <span className="text-sm text-stone-700 font-medium">
            {props.approved ? 'Approved' : 'Not approved'}
          </span>
        </div>

        {props.approved && (
          <dl className="space-y-1 text-xs text-stone-500">
            {props.approvedAt && (
              <div className="flex gap-2">
                <dt className="w-20 text-stone-400">Approved</dt>
                <dd>{new Date(props.approvedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</dd>
              </div>
            )}
            {props.approvalNote && (
              <div className="flex gap-2">
                <dt className="w-20 text-stone-400">Note</dt>
                <dd>{props.approvalNote}</dd>
              </div>
            )}
          </dl>
        )}

        <p className="text-xs text-stone-400 leading-relaxed">
          Éclat approval is required for fancy-shape diamonds before they can be published.
          Approval is automatically revoked if any grade, measurement, or identity field changes.
        </p>

        {/* Approve form */}
        {!props.approved && (
          <form action={approveFormAction} className="space-y-3">
            {!approveState.success && approveState.message && (
              <p className="text-xs text-red-600">{approveState.message}</p>
            )}
            {approveState.success && (
              <p className="text-xs text-emerald-600">Approval saved — refresh to see updated status.</p>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium tracking-widest text-stone-500">
                APPROVAL NOTE (OPTIONAL)
              </label>
              <textarea
                name="approval_note"
                rows={2}
                placeholder="Internal approval rationale…"
                className="w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none resize-none"
              />
            </div>
            <ApproveSubmit />
          </form>
        )}

        {/* Revoke form */}
        {props.approved && (
          <form action={revokeFormAction}>
            {!revokeState.success && revokeState.message && (
              <p className="mb-1 text-xs text-red-600">{revokeState.message}</p>
            )}
            <RevokeSubmit />
          </form>
        )}
      </div>
    </div>
  )
}

function ApproveSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-stone-900 px-4 py-2 text-xs font-medium tracking-wider text-white uppercase transition-colors hover:bg-stone-700 disabled:opacity-50"
    >
      {pending ? 'Approving…' : 'Grant Éclat Approval'}
    </button>
  )
}

function RevokeSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded border border-stone-200 px-4 py-2 text-xs text-stone-600 uppercase tracking-wider transition-colors hover:border-stone-400 hover:text-stone-900 disabled:opacity-50"
      onClick={(e) => {
        if (!pending && !confirm('Revoke Éclat approval? The diamond will be unpublishable until re-approved.')) {
          e.preventDefault()
        }
      }}
    >
      {pending ? 'Revoking…' : 'Revoke Approval'}
    </button>
  )
}
