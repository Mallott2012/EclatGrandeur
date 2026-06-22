'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { DiamondSimpleResult } from '@/app/admin/(console)/diamonds/types'
import { DIAMOND_SIMPLE_INITIAL } from '@/app/admin/(console)/diamonds/types'

interface Props {
  deleteAction: (state: DiamondSimpleResult, formData: FormData) => Promise<DiamondSimpleResult>
}

export function DeleteDiamondForm({ deleteAction }: Props) {
  const [state, formAction] = useActionState(deleteAction, DIAMOND_SIMPLE_INITIAL)
  return (
    <form action={formAction}>
      {!state.success && state.message && (
        <p className="mb-1 text-xs text-red-400">{state.message}</p>
      )}
      <DeleteSubmit />
    </form>
  )
}

function DeleteSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded border border-red-900/60 px-4 py-2 text-sm text-red-500 transition-colors hover:border-red-700 hover:text-red-400 disabled:opacity-50"
      onClick={(e) => {
        if (!pending && !confirm('Delete this diamond? This cannot be undone.')) e.preventDefault()
      }}
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
