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
        className="w-full resize-none rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder-neutral-700 focus:border-amber-700 focus:outline-none"
      />
      {state.message && !state.success && (
        <p className="text-xs text-red-400">{state.message}</p>
      )}
      {state.success && (
        <p className="text-xs text-emerald-500">Notes saved.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-neutral-800 px-4 py-1.5 text-xs text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save notes'}
      </button>
    </form>
  )
}
