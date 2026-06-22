'use client'

import { useFormState, useFormStatus } from 'react-dom'
import type { DiamondSimpleResult } from '@/app/admin/(console)/diamonds/types'
import { DIAMOND_SIMPLE_INITIAL } from '@/app/admin/(console)/diamonds/types'

interface Props {
  action:              (state: DiamondSimpleResult, formData: FormData) => Promise<DiamondSimpleResult>
  existingCertLab:     string | null
  existingCertNumber:  string | null
}

export function CertUploadForm({ action, existingCertLab, existingCertNumber }: Props) {
  const [state, formAction] = useFormState(action, DIAMOND_SIMPLE_INITIAL)
  const hasCert             = !!(existingCertLab && existingCertNumber)

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-3">
      {!state.success && state.message && (
        <p className="text-xs text-red-400">{state.message}</p>
      )}

      {hasCert && (
        <p className="text-xs text-neutral-500">
          Existing: {existingCertLab} {existingCertNumber}. Upload a new file to replace.
        </p>
      )}

      <input
        name="file"
        type="file"
        accept="application/pdf"
        required
        className="block text-sm text-neutral-400 file:mr-3 file:cursor-pointer file:rounded file:border file:border-neutral-700 file:bg-neutral-900 file:px-3 file:py-1 file:text-xs file:text-neutral-300 hover:file:border-neutral-500"
      />

      <CertUploadSubmit />
    </form>
  )
}

function CertUploadSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-neutral-800 px-4 py-1.5 text-xs font-medium text-neutral-200 transition-colors hover:bg-neutral-700 disabled:opacity-50"
    >
      {pending ? 'Uploading…' : 'Upload PDF'}
    </button>
  )
}
