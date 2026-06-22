'use client'

import { useFormState as useActionState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import type { DiamondMediaRecord } from '@/lib/diamonds/types'
import type { DiamondSimpleResult } from '@/app/admin/(console)/diamonds/types'
import { DIAMOND_SIMPLE_INITIAL } from '@/app/admin/(console)/diamonds/types'

type MediaItemWithActions = DiamondMediaRecord & {
  deleteAction:     (state: DiamondSimpleResult, formData: FormData) => Promise<DiamondSimpleResult>
  setPrimaryAction: (state: DiamondSimpleResult, formData: FormData) => Promise<DiamondSimpleResult>
  signed_url?:      string
}

interface Props {
  items:            MediaItemWithActions[]
  isPrivileged:     boolean
  uploadAction:     (state: DiamondSimpleResult, formData: FormData) => Promise<DiamondSimpleResult>
  nextDisplayOrder: number
}

export function MediaGallery({ items, isPrivileged, uploadAction, nextDisplayOrder }: Props) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900/30">
      <p className="border-b border-neutral-800 px-4 py-2 text-xs font-semibold tracking-widest text-neutral-500">
        MEDIA
      </p>
      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-sm text-neutral-600">No media uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <MediaCard key={item.id} item={item} isPrivileged={isPrivileged} />
            ))}
          </div>
        )}

        {isPrivileged && (
          <div className="mt-6">
            <p className="mb-3 text-xs font-medium tracking-widest text-neutral-400">UPLOAD MEDIA</p>
            <MediaUploadForm action={uploadAction} nextDisplayOrder={nextDisplayOrder} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── MediaCard ─────────────────────────────────────────────────────────────────

function MediaCard({ item, isPrivileged }: { item: MediaItemWithActions; isPrivileged: boolean }) {
  const [deleteState, deleteAction]   = useActionState(item.deleteAction, DIAMOND_SIMPLE_INITIAL)
  const [primaryState, primaryAction] = useActionState(item.setPrimaryAction, DIAMOND_SIMPLE_INITIAL)

  return (
    <div className="group relative overflow-hidden rounded border border-neutral-800 bg-neutral-900">
      {item.media_type === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.signed_url ?? item.storage_path}
          alt={item.alt_text ?? ''}
          className="aspect-square w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex aspect-square items-center justify-center bg-neutral-800 text-xs text-neutral-500">
          {item.media_type === 'video_360' ? '360° video' : item.media_type}
        </div>
      )}

      {item.is_primary && (
        <span className="absolute left-1 top-1 rounded bg-amber-700/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Primary
        </span>
      )}

      {isPrivileged && (
        <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-neutral-950/80 p-1 opacity-0 transition-opacity group-hover:opacity-100">
          {!item.is_primary && (
            <form action={primaryAction} className="flex-1">
              {!primaryState.success && primaryState.message && (
                <p className="text-[9px] text-red-400">{primaryState.message}</p>
              )}
              <SetPrimarySubmit />
            </form>
          )}
          <form action={deleteAction}>
            {!deleteState.success && deleteState.message && (
              <p className="text-[9px] text-red-400">{deleteState.message}</p>
            )}
            <DeleteSubmit />
          </form>
        </div>
      )}
    </div>
  )
}

function SetPrimarySubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded px-1.5 py-1 text-[10px] text-neutral-300 hover:bg-neutral-700 disabled:opacity-50"
    >
      {pending ? '…' : 'Set primary'}
    </button>
  )
}

function DeleteSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded px-1.5 py-1 text-[10px] text-red-400 hover:bg-red-950/30 disabled:opacity-50"
      onClick={(e) => {
        if (!pending && !window.confirm('Delete this media item?')) e.preventDefault()
      }}
    >
      {pending ? '…' : 'Delete'}
    </button>
  )
}

// ── MediaUploadForm ───────────────────────────────────────────────────────────

function MediaUploadForm({
  action,
  nextDisplayOrder,
}: {
  action:           (state: DiamondSimpleResult, formData: FormData) => Promise<DiamondSimpleResult>
  nextDisplayOrder: number
}) {
  const [state, formAction] = useActionState(action, DIAMOND_SIMPLE_INITIAL)

  return (
    <form action={formAction} className="space-y-3" encType="multipart/form-data">
      {!state.success && state.message && (
        <p className="text-xs text-red-400">{state.message}</p>
      )}

      <input
        name="file"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,video/mp4"
        required
        className="block text-sm text-neutral-400 file:mr-3 file:cursor-pointer file:rounded file:border file:border-neutral-700 file:bg-neutral-900 file:px-3 file:py-1 file:text-xs file:text-neutral-300 hover:file:border-neutral-500"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs tracking-widest text-neutral-500">ALT TEXT</label>
          <input
            name="alt_text"
            type="text"
            placeholder="Describe the image"
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs text-white focus:border-amber-700 focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs tracking-widest text-neutral-500">ORDER</label>
          <input
            name="display_order"
            type="number"
            defaultValue={nextDisplayOrder}
            min="0"
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs text-white focus:border-amber-700 focus:outline-none"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-neutral-400">
        <input name="is_primary" type="checkbox" className="accent-amber-500" />
        Set as primary image
      </label>

      <UploadSubmit />
    </form>
  )
}

function UploadSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-amber-700 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
    >
      {pending ? 'Uploading…' : 'Upload'}
    </button>
  )
}
