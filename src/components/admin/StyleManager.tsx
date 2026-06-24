'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Pencil, Plus, X, Eye, EyeOff } from 'lucide-react'
import {
  saveStyleAction,
  deleteStyleAction,
  reorderStylesAction,
} from '@/app/admin/(console)/styles-actions'
import type { CatalogStyle, StyleCategory } from '@/lib/catalog/service'

const G     = '#1a2b1a'
const MUTED = '#555'
const BORDER = '#e2e2e2'

const CARD_W = 360
const CARD_H = 220
const PAD_T  = 36

interface Props {
  category:    StyleCategory
  initialStyles: CatalogStyle[]
}

/**
 * Admin-only editable version of the style scroller. Each card carries an edit
 * pencil and reorder arrows; an "Add style" card sits at the end. All mutations
 * go through server actions and refresh local state optimistically.
 */
export function StyleManager({ category, initialStyles }: Props) {
  const [styles, setStyles] = useState<CatalogStyle[]>(initialStyles)
  const [editing, setEditing] = useState<CatalogStyle | 'new' | null>(null)
  const [, startTransition] = useTransition()

  function scroll(dir: number) {
    const track = document.getElementById(`style-track-${category}`)
    track?.scrollBy({ left: dir * (CARD_W + 24), behavior: 'smooth' })
  }

  function move(index: number, dir: number) {
    const next = index + dir
    if (next < 0 || next >= styles.length) return
    const reordered = [...styles]
    ;[reordered[index], reordered[next]] = [reordered[next], reordered[index]]
    setStyles(reordered)
    startTransition(() => {
      reorderStylesAction(category, reordered.map(s => s.id))
    })
  }

  const chevronTop = PAD_T + CARD_H / 2

  return (
    <div className="relative" style={{ padding: `${PAD_T}px 0 28px` }}>
      <button
        type="button"
        onClick={() => scroll(-1)}
        aria-label="Scroll styles left"
        className="absolute left-4 z-10 flex items-center justify-center"
        style={{ top: chevronTop, transform: 'translateY(-50%)', width: 40, height: 40 }}
      >
        <ChevronLeft className="w-6 h-6" strokeWidth={1.25} style={{ color: G }} />
      </button>

      <div
        id={`style-track-${category}`}
        className="flex overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', gap: 24, padding: '0 72px' }}
      >
        {styles.map((card, index) => (
          <div key={card.id} className="flex flex-shrink-0 flex-col items-center" style={{ width: CARD_W }}>
            <div
              className="group relative flex w-full items-center justify-center overflow-hidden bg-white"
              style={{ height: CARD_H, opacity: card.is_visible ? 1 : 0.4 }}
            >
              {card.image_url ? (
                <Image src={card.image_url} alt={card.label} fill sizes={`${CARD_W}px`} className="object-contain p-8" />
              ) : (
                <span className="font-display" style={{ fontSize: 18, color: '#cfcabe' }}>{card.label.charAt(0)}</span>
              )}

              {/* Edit overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ background: 'rgba(26,43,26,0.18)' }}
              >
                <button
                  type="button"
                  onClick={() => setEditing(card)}
                  aria-label={`Edit ${card.label}`}
                  className="flex items-center gap-1.5 font-sans uppercase"
                  style={{ fontSize: 10, letterSpacing: '0.18em', color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '8px 16px' }}
                >
                  <Pencil className="h-3 w-3" strokeWidth={1.75} /> Edit
                </button>
              </div>

              {/* Hidden badge */}
              {!card.is_visible && (
                <span
                  className="absolute left-3 top-3 flex items-center gap-1 font-sans uppercase"
                  style={{ fontSize: 8, letterSpacing: '0.16em', color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '4px 8px' }}
                >
                  <EyeOff className="h-2.5 w-2.5" strokeWidth={2} /> Hidden
                </span>
              )}
            </div>

            <span
              className="font-sans text-center"
              style={{ marginTop: 18, fontSize: 15, letterSpacing: '0.02em', color: MUTED, fontWeight: 300, whiteSpace: 'nowrap' }}
            >
              {card.label}
            </span>

            {/* Reorder arrows */}
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move left"
                className="transition-opacity disabled:opacity-20 hover:opacity-60"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} style={{ color: MUTED }} />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === styles.length - 1}
                aria-label="Move right"
                className="transition-opacity disabled:opacity-20 hover:opacity-60"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} style={{ color: MUTED }} />
              </button>
            </div>
          </div>
        ))}

        {/* Add new style card */}
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="flex flex-shrink-0 flex-col items-center justify-center"
          style={{ width: CARD_W }}
        >
          <div
            className="flex w-full flex-col items-center justify-center gap-3 transition-colors hover:bg-[#faf9f7]"
            style={{ height: CARD_H, border: `1px dashed ${BORDER}` }}
          >
            <Plus className="h-7 w-7" strokeWidth={1.25} style={{ color: '#bbb' }} />
            <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.2em', color: '#aaa' }}>
              Add Style
            </span>
          </div>
        </button>
      </div>

      <button
        type="button"
        onClick={() => scroll(1)}
        aria-label="Scroll styles right"
        className="absolute right-4 z-10 flex items-center justify-center"
        style={{ top: chevronTop, transform: 'translateY(-50%)', width: 40, height: 40 }}
      >
        <ChevronRight className="w-6 h-6" strokeWidth={1.25} style={{ color: G }} />
      </button>

      {editing && (
        <StyleEditModal
          category={category}
          style={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={record => {
            setStyles(prev => {
              const exists = prev.some(s => s.id === record.id)
              return exists ? prev.map(s => (s.id === record.id ? record : s)) : [...prev, record]
            })
            setEditing(null)
          }}
          onDeleted={id => {
            setStyles(prev => prev.filter(s => s.id !== id))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

/* ── Modal ────────────────────────────────────────────────────────────────── */

function StyleEditModal({
  category,
  style,
  onClose,
  onSaved,
  onDeleted,
}: {
  category:  StyleCategory
  style:     CatalogStyle | null
  onClose:   () => void
  onSaved:   (record: CatalogStyle) => void
  onDeleted: (id: string) => void
}) {
  const [label, setLabel]       = useState(style?.label ?? '')
  const [imageUrl, setImageUrl] = useState(style?.image_url ?? '')
  const [visible, setVisible]   = useState(style?.is_visible ?? true)
  const [error, setError]       = useState('')
  const [pending, startTransition] = useTransition()

  function handleSave() {
    if (!label.trim()) { setError('Please enter a style name.'); return }
    setError('')
    startTransition(async () => {
      try {
        const record = await saveStyleAction({
          id:         style?.id,
          category,
          label:      label.trim(),
          image_url:  imageUrl.trim() || null,
          is_visible: visible,
        })
        onSaved(record)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to save. Please try again.')
      }
    })
  }

  function handleDelete() {
    if (!style) return
    if (!confirm(`Remove the "${style.label}" style permanently?`)) return
    startTransition(async () => {
      try {
        await deleteStyleAction(category, style.id)
        onDeleted(style.id)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to delete.')
      }
    })
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div className="relative w-full max-w-lg bg-white shadow-2xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.28em', color: '#bbb' }}>
              {style ? 'Edit Style' : 'New Style'}
            </p>
            <p className="font-display mt-1 capitalize" style={{ fontSize: 18, fontWeight: 300, letterSpacing: '0.04em', color: G }}>
              {category.replace(/-/g, ' ')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 transition-opacity hover:opacity-50">
            <X className="h-4 w-4" style={{ color: '#aaa' }} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-7 px-8 py-8">
          {/* Preview */}
          <div className="flex items-center justify-center bg-[#faf9f7]" style={{ height: 160 }}>
            {imageUrl.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl.trim()} alt="" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', padding: 16 }} />
            ) : (
              <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.2em', color: '#ccc' }}>No image</span>
            )}
          </div>

          <div>
            <Label required>Style name</Label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Round Brilliant"
              className="mt-2 w-full font-sans"
              style={{ fontSize: 13, color: G, border: '1px solid #e0e0e0', padding: '10px 14px', outline: 'none' }}
            />
          </div>

          <div>
            <Label>Card image URL or storage path</Label>
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="/images/styles/round.png  or  https://…"
              className="mt-2 w-full font-sans"
              style={{ fontSize: 13, color: G, border: '1px solid #e0e0e0', padding: '10px 14px', outline: 'none' }}
            />
            <p className="mt-1.5 font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.02em' }}>
              Any public URL or storage path. Leave blank for a lettered placeholder.
            </p>
          </div>

          {/* Visibility */}
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            className="flex items-center gap-3 select-none"
          >
            <div className="relative flex-shrink-0" style={{ width: 36, height: 20 }}>
              <div className="absolute inset-0 rounded-full transition-colors" style={{ background: visible ? G : '#d8d8d8' }} />
              <div className="absolute top-1 rounded-full bg-white transition-transform" style={{ width: 14, height: 14, left: visible ? 19 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }} />
            </div>
            <span className="flex items-center gap-1.5 font-sans" style={{ fontSize: 12, color: '#555', letterSpacing: '0.03em' }}>
              {visible ? <Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> : <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />}
              {visible ? 'Visible on storefront' : 'Hidden from storefront'}
            </span>
          </button>

          {error && (
            <p className="font-sans" style={{ fontSize: 12, color: '#b85a5a', letterSpacing: '0.02em' }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-6" style={{ borderTop: '1px solid #f0f0f0' }}>
          {style ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="font-sans uppercase transition-opacity hover:opacity-60 disabled:opacity-30"
              style={{ fontSize: 10, letterSpacing: '0.18em', color: '#b85a5a' }}
            >
              Remove
            </button>
          ) : <span />}

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="font-sans uppercase transition-opacity hover:opacity-60 disabled:opacity-30"
              style={{ fontSize: 10, letterSpacing: '0.18em', color: '#aaa' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="font-sans uppercase transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ fontSize: 10, letterSpacing: '0.18em', color: '#fff', background: G, padding: '10px 24px' }}
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.24em', color: '#aaa' }}>
      {children}{required && <span style={{ color: G, marginLeft: 2 }}>*</span>}
    </p>
  )
}
