'use client'

import { useFormState as useActionState, useFormStatus } from 'react-dom'
import {
  EARRING_SETTING_SIMPLE_INITIAL,
  type EarringSettingSimpleResult,
} from '@/app/admin/(console)/earring-settings/types'

interface Props {
  deleteAction: (state: EarringSettingSimpleResult, formData: FormData) => Promise<EarringSettingSimpleResult>
}

export function DeleteEarringSettingForm({ deleteAction }: Props) {
  const [state, formAction] = useActionState(deleteAction, EARRING_SETTING_SIMPLE_INITIAL)
  return (
    <form action={formAction}>
      {!state.success && state.message && <p className="mb-1 text-xs text-red-400">{state.message}</p>}
      <DeleteSubmit />
    </form>
  )
}

function DeleteSubmit() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      onClick={(e) => { if (!pending && !confirm('Delete this earring setting? This cannot be undone.')) e.preventDefault() }}
      className="rounded border border-red-900/60 px-4 py-2 text-sm text-red-500 transition-colors hover:border-red-700 hover:text-red-400 disabled:opacity-50">
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
