'use client'

import { useTransition } from 'react'
import { deleteJewelleryAction } from '@/app/admin/(console)/jewellery/actions'

interface Props {
  id:   string
  name: string
}

export function DeleteJewelleryButton({ id, name }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    startTransition(() => deleteJewelleryAction(id))
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleDelete}
      className="rounded border border-red-800/60 px-3 py-1.5 text-xs text-red-500 transition-colors hover:border-red-600 hover:text-red-400 disabled:opacity-50"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
