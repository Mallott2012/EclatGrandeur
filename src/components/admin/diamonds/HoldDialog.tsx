'use client'

import { useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import type { DiamondActionResult } from '@/app/admin/(console)/diamonds/types'
import { DIAMOND_ACTION_INITIAL } from '@/app/admin/(console)/diamonds/types'

interface Props {
  mode:             'place' | 'extend'
  action:           (state: DiamondActionResult, formData: FormData) => Promise<DiamondActionResult>
  label:            string
  currentExpiresAt?: string | null
}

export function HoldDialog({ mode, action, label, currentExpiresAt }: Props) {
  const [isOpen, setIsOpen]   = useState(false)
  const dialogRef             = useRef<HTMLDialogElement>(null)
  const [state, formAction]   = useFormState(action, DIAMOND_ACTION_INITIAL)

  const fe = state.success ? {} : (state.fieldErrors ?? {})

  function openDialog() {
    setIsOpen(true)
    dialogRef.current?.showModal()
  }

  function closeDialog() {
    setIsOpen(false)
    dialogRef.current?.close()
  }

  // Minimum datetime for the expiry input: now + 1 minute.
  const minDatetime = new Date(Date.now() + 60_000).toISOString().slice(0, 16)

  // Default expiry: 48h from now for place, current expiry for extend.
  const defaultExpiry = mode === 'place'
    ? new Date(Date.now() + 48 * 3_600_000).toISOString().slice(0, 16)
    : (currentExpiresAt ? currentExpiresAt.slice(0, 16) : minDatetime)

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="w-full rounded border border-neutral-700 px-3 py-2 text-left text-sm text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
      >
        {label}
      </button>

      {/* Native <dialog> element — backdrop and focus trap are provided automatically. */}
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-sm rounded border border-neutral-700 bg-neutral-950 p-6 text-white backdrop:bg-black/60"
        onClose={closeDialog}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-widest text-neutral-300">
            {mode === 'place' ? 'PLACE HOLD' : 'EXTEND HOLD'}
          </h2>
          <button
            type="button"
            onClick={closeDialog}
            className="text-neutral-500 hover:text-neutral-300"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!state.success && state.message && (
          <div className="mb-4 rounded border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-300">
            {state.message}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium tracking-widest text-neutral-400">
              {mode === 'place' ? 'EXPIRES AT' : 'NEW EXPIRY'}
              <span className="ml-1 text-amber-600">*</span>
            </label>
            <input
              name={mode === 'place' ? 'hold_expires_at' : 'new_expires_at'}
              type="datetime-local"
              min={minDatetime}
              defaultValue={defaultExpiry}
              required
              className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-amber-700 focus:outline-none"
            />
            {(fe.hold_expires_at || fe.new_expires_at) && (
              <p className="text-xs text-red-400">{fe.hold_expires_at ?? fe.new_expires_at}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium tracking-widest text-neutral-400">
              REASON
              {mode === 'place' && <span className="ml-1 text-amber-600">*</span>}
            </label>
            <textarea
              name="hold_reason"
              rows={2}
              required={mode === 'place'}
              className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-amber-700 focus:outline-none resize-none"
            />
            {fe.hold_reason && <p className="text-xs text-red-400">{fe.hold_reason}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <HoldSubmitButton label={mode === 'place' ? 'Confirm hold' : 'Extend hold'} />
            <button
              type="button"
              onClick={closeDialog}
              className="text-sm text-neutral-500 hover:text-neutral-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}

function HoldSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
    >
      {pending ? 'Saving…' : label}
    </button>
  )
}
