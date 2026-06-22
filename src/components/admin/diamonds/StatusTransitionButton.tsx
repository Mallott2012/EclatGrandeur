'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import type { DiamondSimpleResult } from '@/app/admin/(console)/diamonds/types'
import { DIAMOND_SIMPLE_INITIAL } from '@/app/admin/(console)/diamonds/types'

interface Props {
  label:           string
  action:          (state: DiamondSimpleResult, formData: FormData) => Promise<DiamondSimpleResult>
  requiresConfirm?: boolean
}

export function StatusTransitionButton({ label, action, requiresConfirm = false }: Props) {
  const [confirming, setConfirming]   = useState(false)
  const [state, formAction]           = useFormState(action, DIAMOND_SIMPLE_INITIAL)

  const isDestructive = requiresConfirm

  if (requiresConfirm && !confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full rounded border border-neutral-700 px-3 py-2 text-left text-sm text-neutral-400 transition-colors hover:border-red-800 hover:text-red-300"
      >
        {label}
      </button>
    )
  }

  return (
    <form action={formAction}>
      {!state.success && state.message && (
        <p className="mb-1 text-xs text-red-400">{state.message}</p>
      )}
      <div className="flex gap-2">
        <TransitionSubmit
          label={confirming ? `Confirm: ${label.toLowerCase()}` : label}
          destructive={isDestructive}
        />
        {confirming && (
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-xs text-neutral-500 hover:text-neutral-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

function TransitionSubmit({ label, destructive }: { label: string; destructive: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
        destructive
          ? 'border-red-800 text-red-300 hover:bg-red-950/30'
          : 'border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white'
      }`}
    >
      {pending ? 'Updating…' : label}
    </button>
  )
}
