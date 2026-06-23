'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteHeroAction } from '@/app/admin/(console)/hero/actions'

interface Props { id: string }

export function DeleteHeroButton({ id }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Delete this hero record? This cannot be undone.')) return
    startTransition(async () => {
      await deleteHeroAction(id)
      router.push('/admin/hero')
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="text-xs text-neutral-600 transition-colors hover:text-red-400 disabled:opacity-50"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
