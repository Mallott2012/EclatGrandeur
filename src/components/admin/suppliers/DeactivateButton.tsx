'use client'

import { useState, useTransition } from 'react'

interface Props {
  action: () => Promise<{ success: false; message: string } | { success: true }>
}

export function DeactivateButton({ action }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirming) {
      setConfirming(true)
      setError(null)
      return
    }
    startTransition(async () => {
      const result = await action()
      if (!result.success) {
        setError(result.message)
        setConfirming(false)
      }
      // On success the action calls redirect() — no further state update needed.
    })
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className={`rounded border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            confirming
              ? 'border-red-700 bg-red-900/30 text-red-300 hover:bg-red-900/60'
              : 'border-neutral-700 text-neutral-400 hover:border-red-700 hover:text-red-300'
          }`}
        >
          {isPending ? 'Deactivating…' : confirming ? 'Confirm deactivation' : 'Deactivate supplier'}
        </button>
        {confirming && !isPending && (
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-sm text-neutral-600 hover:text-neutral-400"
          >
            Cancel
          </button>
        )}
      </div>
      {confirming && (
        <p className="text-xs text-neutral-500">
          This will mark the supplier as inactive. Active diamonds referencing this supplier must be resolved first.
        </p>
      )}
    </div>
  )
}
