'use client'

import { useActionState } from 'react'
import { saveEnquiryNotesAction } from '@/app/admin/(console)/enquiries/actions'

interface Props {
  id:      string
  current: string
}

type NotesState = { success: boolean; message?: string }
const INIT: NotesState = { success: false }

export function EnquiryNotesForm({ id, current }: Props) {
  const boundAction = saveEnquiryNotesAction.bind(null, id)
  const [state, formAction, pending] = useActionState<NotesState, FormData>(boundAction, INIT)

  return (
    <form action={formAction} className="space-y-3">
      <textarea
        name="notes"
        defaultValue={current}
        rows={5}
        placeholder="Add internal notes visible only to staff…"
        className="w-full resize-none rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none"
      />
      {state.message && !state.success && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}
      {state.success && (
        <p className="text-xs text-emerald-600">Notes saved.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-stone-900 px-4 py-1.5 text-xs text-white transition-colors hover:bg-stone-700 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save notes'}
      </button>
    </form>
  )
}
