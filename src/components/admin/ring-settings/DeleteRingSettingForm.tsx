'use client'

import { useFormState as useActionState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import { RING_SETTING_SIMPLE_INITIAL, type RingSettingSimpleResult } from '@/app/admin/(console)/ring-settings/types'

interface Props {
  deleteAction: (state: RingSettingSimpleResult, formData: FormData) => Promise<RingSettingSimpleResult>
}

export function DeleteRingSettingForm({ deleteAction }: Props) {
  const [state, formAction] = useActionState(deleteAction, RING_SETTING_SIMPLE_INITIAL)
  return (
    <form action={formAction}>
      {!state.success && state.message && (
        <p className="mb-1 text-xs text-red-600">{state.message}</p>
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
      onClick={(e) => {
        if (!pending && !confirm('Delete this ring setting? This cannot be undone.')) e.preventDefault()
      }}
      className="rounded border border-red-200 px-4 py-2 text-sm text-red-600 transition-colors hover:border-red-400 hover:text-red-700 disabled:opacity-50"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
