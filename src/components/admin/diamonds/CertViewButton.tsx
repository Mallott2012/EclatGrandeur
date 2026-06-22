'use client'

import { useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import type { CertUrlResult } from '@/app/admin/(console)/diamonds/types'
import { CERT_URL_INITIAL } from '@/app/admin/(console)/diamonds/types'

interface Props {
  action: (state: CertUrlResult, formData: FormData) => Promise<CertUrlResult>
}

export function CertViewButton({ action }: Props) {
  const [state, formAction] = useFormState(action, CERT_URL_INITIAL)

  // Open the URL in a new tab once the signed URL is ready.
  useEffect(() => {
    if (state.status === 'success') {
      window.open(state.signed_url, '_blank', 'noopener,noreferrer')
    }
  }, [state])

  return (
    <form action={formAction}>
      {state.status === 'error' && (
        <p className="mb-1 text-xs text-red-400">{state.message}</p>
      )}
      {state.status === 'success' && (
        <p className="mb-1 text-xs text-emerald-400">
          Opened in new tab. Expires: {new Date(state.expires_at).toLocaleTimeString()}
        </p>
      )}
      <CertViewSubmit />
    </form>
  )
}

function CertViewSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white disabled:opacity-50"
    >
      {pending ? 'Loading…' : 'View certificate PDF'}
    </button>
  )
}
