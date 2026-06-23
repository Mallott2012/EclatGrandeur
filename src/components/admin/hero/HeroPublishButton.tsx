'use client'

import { useTransition } from 'react'
import { publishHeroAction, unpublishHeroAction } from '@/app/admin/(console)/hero/actions'
import type { HeroMediaRecord } from '@/lib/hero/service'

interface Props {
  record: HeroMediaRecord
}

export function HeroPublishButton({ record }: Props) {
  const [pending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      if (record.is_published) {
        await unpublishHeroAction(record.id)
      } else {
        await publishHeroAction(record.id)
      }
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`text-xs tracking-wide transition-colors disabled:opacity-50 ${
        record.is_published
          ? 'text-emerald-500 hover:text-red-400'
          : 'text-neutral-500 hover:text-emerald-400'
      }`}
    >
      {pending
        ? '…'
        : record.is_published
          ? 'Unpublish'
          : 'Publish'}
    </button>
  )
}
