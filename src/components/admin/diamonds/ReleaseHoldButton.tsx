'use client'

import { useFormState, useFormStatus } from 'react-dom'
import type { DiamondSimpleResult } from '@/app/admin/(console)/diamonds/types'
import { DIAMOND_SIMPLE_INITIAL } from '@/app/admin/(console)/diamonds/types'

interface Props {
  action: (state: DiamondSimpleResult, formData: FormData) => Promise<DiamondSimpleResult>
}

export function ReleaseHoldButton({ action }: Props) {
  const [state, formAction] = useFormState(action, DIAMOND_SIMPLE_INITIAL)

  return (
    <form action={formAction}>
      {!state.success && state.message && (
        <p className="mb-1 text-xs text-red-400">{state.message}</p>
      )}
      <ReleaseSubmit />
    </form>
  )
}

function ReleaseSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded border border-neutral-700 px-3 py-2 text-left text-sm text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white disabled:opacity-50"
    >
      {pending ? 'Releasing…' : 'Release hold'}
    </button>
  )
}
