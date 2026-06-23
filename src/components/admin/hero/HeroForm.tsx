'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createHeroAction, updateHeroAction, type HeroActionResult } from '@/app/admin/(console)/hero/actions'
import type { HeroMediaRecord, HeroPlacement } from '@/lib/hero/service'

const INITIAL: HeroActionResult = { success: false, message: '' }

const PLACEMENTS: { value: HeroPlacement; label: string }[] = [
  { value: 'homepage',         label: 'Homepage' },
  { value: 'engagement-rings', label: 'Engagement Rings' },
  { value: 'earrings',         label: 'Earrings' },
  { value: 'necklaces',        label: 'Necklaces' },
  { value: 'bracelets',        label: 'Bracelets' },
]

const MEDIA_TYPES = [
  { value: 'image',   label: 'Image (JPG / PNG / WebP)' },
  { value: 'video',   label: 'Video (MP4)' },
] as const

interface Props {
  record?: HeroMediaRecord
}

const inputCls = 'w-full rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none'
const labelCls = 'block text-xs font-semibold tracking-widest text-stone-500 mb-1'

export function HeroForm({ record }: Props) {
  const router = useRouter()

  const boundUpdateAction = record
    ? updateHeroAction.bind(null, record.id)
    : null

  const action = boundUpdateAction ?? createHeroAction
  const [state, formAction, pending] = useActionState(action, INITIAL)

  useEffect(() => {
    if (state.success) router.push('/admin/hero')
  }, [state.success, router])

  return (
    <form action={formAction} className="space-y-5">
      {/* Placement — locked for existing records */}
      <div>
        <label className={labelCls}>PLACEMENT</label>
        {record ? (
          <>
            <input type="hidden" name="placement" value={record.placement} />
            <p className="text-sm text-stone-900 capitalize">{record.placement.replace(/-/g, ' ')}</p>
          </>
        ) : (
          <select name="placement" required className={inputCls} defaultValue="">
            <option value="" disabled>Select placement…</option>
            {PLACEMENTS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Media type */}
      {!record && (
        <div>
          <label className={labelCls}>MEDIA TYPE</label>
          <select name="media_type" required className={inputCls} defaultValue="image">
            {MEDIA_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Storage path */}
      <div>
        <label className={labelCls}>STORAGE PATH / URL</label>
        <input
          type="text"
          name="storage_path"
          required
          defaultValue={record?.storage_path ?? ''}
          placeholder="/images/hero-homepage.jpg  or  https://…"
          className={inputCls}
        />
        <p className="mt-1 text-[11px] text-stone-400">
          Enter a Supabase Storage path or any public URL to the image/video.
        </p>
      </div>

      {/* Headline */}
      <div>
        <label className={labelCls}>HEADLINE</label>
        <input
          type="text"
          name="headline"
          defaultValue={record?.headline ?? ''}
          placeholder="The world's finest diamonds"
          className={inputCls}
        />
      </div>

      {/* Subheadline */}
      <div>
        <label className={labelCls}>SUBHEADLINE</label>
        <input
          type="text"
          name="subheadline"
          defaultValue={record?.subheadline ?? ''}
          placeholder="Handcrafted in London since 1987"
          className={inputCls}
        />
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>CTA LABEL</label>
          <input
            type="text"
            name="cta_label"
            defaultValue={record?.cta_label ?? ''}
            placeholder="Explore the Collection"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>CTA HREF</label>
          <input
            type="text"
            name="cta_href"
            defaultValue={record?.cta_href ?? ''}
            placeholder="/engagement-rings"
            className={inputCls}
          />
        </div>
      </div>

      {/* Sort order */}
      <div className="w-28">
        <label className={labelCls}>SORT ORDER</label>
        <input
          type="number"
          name="sort_order"
          defaultValue={record?.sort_order ?? 0}
          min={0}
          className={inputCls}
        />
      </div>

      {/* Error */}
      {'message' in state && state.message && !state.success && (
        <p className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{state.message}</p>
      )}

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-stone-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-50"
        >
          {pending ? 'Saving…' : record ? 'Save changes' : 'Create hero'}
        </button>
        <a href="/admin/hero" className="text-xs text-stone-400 hover:text-stone-700">
          Cancel
        </a>
      </div>
    </form>
  )
}
