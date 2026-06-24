'use client'

import { useFormState as useActionState, useFormStatus } from 'react-dom'
import {
  BRACELET_SETTING_SIMPLE_INITIAL,
  type BraceletSettingSimpleResult,
} from '@/app/admin/(console)/bracelet-settings/types'

interface Props {
  deleteAction: (state: BraceletSettingSimpleResult, formData: FormData) => Promise<BraceletSettingSimpleResult>
}

export function DeleteBraceletSettingForm({ deleteAction }: Props) {
  const [state, formAction] = useActionState(deleteAction, BRACELET_SETTING_SIMPLE_INITIAL)
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
      onClick={(e) => { if (!pending && !confirm('Delete this bracelet setting? This cannot be undone.')) e.preventDefault() }}
      className="rounded border border-red-900/60 px-4 py-2 text-sm text-red-500 transition-colors hover:border-red-700 hover:text-red-400 disabled:opacity-50">
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
