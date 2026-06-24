'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { HeroEditModal } from '@/components/admin/HeroEditModal';
import type { HeroMediaRecord, HeroPlacement } from '@/lib/hero/service';
import type { HeroEditCallbacks } from '@/components/admin/HeroEditModal';

/**
 * Same 6-cell asymmetric grid as CategoryCollage, but each cell has
 * an edit overlay. Used on every admin category listing page.
 *
 *   ┌───────┬───┬───┐
 *   │       │ 2 │ 3 │
 *   │   1   ├───┼───┤
 *   │       │ 4 │ 5 │
 *   ├───────┴───┴───┤
 *   │       6       │
 *   └───────────────┘
 */

const CELL_SPANS: { gridColumn: string; gridRow: string }[] = [
  { gridColumn: '1',   gridRow: '1 / 3' },
  { gridColumn: '2',   gridRow: '1'     },
  { gridColumn: '3',   gridRow: '1'     },
  { gridColumn: '2',   gridRow: '2'     },
  { gridColumn: '3',   gridRow: '2'     },
  { gridColumn: '1/4', gridRow: '3'     },
];

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

interface Props {
  title:       string;
  subheading:  string;
  placement:   HeroPlacement;
  initialSlots: (HeroMediaRecord | null)[];  // length 6, nulls for empty
  callbacks:   HeroEditCallbacks;
}

export function AdminCategoryCollage({ title, subheading, placement, initialSlots, callbacks }: Props) {
  // Keep a local copy of slots so saves reflect immediately without a full page reload
  const [slots, setSlots] = useState<(HeroMediaRecord | null)[]>(
    Array.from({ length: 6 }, (_, i) => initialSlots[i] ?? null)
  );
  const [editingSlot, setEditingSlot] = useState<number | null>(null);

  const activeRecord = editingSlot !== null ? slots[editingSlot] : null;

  async function handleSave(payload: Parameters<typeof callbacks.onSave>[0]) {
    const saved = await callbacks.onSave({
      ...payload,
      sort_order: editingSlot ?? 0,
    });
    setSlots(prev => {
      const next = [...prev];
      next[editingSlot!] = saved;
      return next;
    });
    setEditingSlot(null);
    return saved;
  }

  async function handleDelete(id: string) {
    await callbacks.onDelete?.(id);
    setSlots(prev => {
      const next = [...prev];
      if (editingSlot !== null) next[editingSlot] = null;
      return next;
    });
    setEditingSlot(null);
  }

  return (
    <>
      <section className="w-full" style={{ paddingTop: 81 }}>
        {/* Admin banner */}
        <div
          className="flex items-center justify-between px-6 py-2.5"
          style={{ background: G }}
        >
          <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.5)' }}>
            Admin — {title} Collage
          </p>
          <p className="font-sans" style={{ fontSize: 9, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.35)' }}>
            Click any cell to edit
          </p>
        </div>

        {/* Collage grid */}
        <div
          className="w-full"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gridTemplateRows: '28vw 28vw 18vw',
            gap: 2,
            maxHeight: '90vh',
          }}
        >
          {slots.map((slot, i) => {
            const span    = CELL_SPANS[i];
            const isEmpty = !slot?.storage_path;
            const isVideo = slot?.media_type === 'video' || slot?.media_type === 'video_360';
            const isLive  = slot?.is_published === true;

            return (
              <div
                key={i}
                className="relative overflow-hidden group"
                style={{ gridColumn: span.gridColumn, gridRow: span.gridRow }}
              >
                {/* Media */}
                {isEmpty ? (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: '#ede9e3' }}
                  >
                    <span className="font-sans" style={{ fontSize: 11, letterSpacing: '0.2em', color: '#c8c0b4', textTransform: 'uppercase' }}>
                      Empty
                    </span>
                  </div>
                ) : isVideo ? (
                  <video
                    src={slot!.storage_path}
                    autoPlay muted loop playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={slot!.storage_path}
                    alt={slot!.headline ?? `Slot ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority={i < 3}
                  />
                )}

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ background: 'rgba(0,0,0,0.38)' }}
                />

                {/* Status badge */}
                {!isEmpty && (
                  <div
                    className="absolute top-2.5 left-3 font-sans uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{ fontSize: 8, letterSpacing: '0.2em', color: '#fff', background: isLive ? '#2d6a2d' : '#888', padding: '2px 6px' }}
                  >
                    {isLive ? 'Live' : 'Draft'}
                  </div>
                )}

                {/* Edit / Add button */}
                <button
                  type="button"
                  onClick={() => setEditingSlot(i)}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 font-sans uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{
                    fontSize: 9, letterSpacing: '0.18em', color: '#fff',
                    background: isEmpty ? G : 'rgba(0,0,0,0.55)',
                    padding: '5px 10px',
                    border: isEmpty ? 'none' : '1px solid rgba(255,255,255,0.3)',
                    backdropFilter: 'blur(4px)',
                  }}
                  aria-label={isEmpty ? `Add media to slot ${i + 1}` : `Edit slot ${i + 1}`}
                >
                  {isEmpty ? (
                    <><Plus className="w-2.5 h-2.5" strokeWidth={2} /> Add</>
                  ) : (
                    <><Pencil className="w-2.5 h-2.5" strokeWidth={2} /> Edit</>
                  )}
                </button>

                {/* Delete shortcut — only when filled */}
                {!isEmpty && (
                  <button
                    type="button"
                    onClick={() => handleDelete(slot!.id)}
                    className="absolute bottom-3 left-3 flex items-center gap-1 font-sans uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    style={{
                      fontSize: 9, letterSpacing: '0.14em', color: '#fff',
                      background: 'rgba(180,40,40,0.65)',
                      padding: '5px 8px',
                      backdropFilter: 'blur(4px)',
                    }}
                    aria-label={`Remove slot ${i + 1}`}
                  >
                    <Trash2 className="w-2.5 h-2.5" strokeWidth={2} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Title strip — mirrors frontend exactly */}
        <div
          className="w-full flex flex-col items-center justify-center py-10 px-6"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <h1
            className="font-display text-center text-balance"
            style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 300, color: G, letterSpacing: '0.06em', lineHeight: 1.1 }}
          >
            {title}
          </h1>
          {subheading && (
            <p className="font-sans mt-3 text-center" style={{ fontSize: 11, letterSpacing: '0.22em', fontWeight: 300, color: '#999', textTransform: 'uppercase' }}>
              {subheading}
            </p>
          )}
        </div>
      </section>

      {/* Edit modal */}
      {editingSlot !== null && (
        <HeroEditModal
          current={activeRecord}
          placement={placement}
          callbacks={{ onSave: handleSave, onDelete: handleDelete }}
          onClose={() => setEditingSlot(null)}
        />
      )}
    </>
  );
}
