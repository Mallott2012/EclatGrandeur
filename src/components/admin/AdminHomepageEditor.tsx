'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Pencil, Pause, Play, VolumeX, Volume2, Heart, Video, Plus } from 'lucide-react';
import type { HeroMediaRecord, HeroPlacement } from '@/lib/hero/service';
import { HeroEditModal } from '@/components/admin/HeroEditModal';
import { saveHeroAction, deleteHeroAction, setHeroPublishedAction } from '@/app/admin/(console)/hero/actions';

/* ─── Static fallbacks (same as Hero.tsx) ─────────────────────────────── */

const PANELS = [
  {
    placement: 'homepage'        as HeroPlacement,
    num:       '01',
    label:     'The Éclat Collection',
    sublabel:  'A woman in full',
    image:     '/images/hero/model.png',
    size:      'large' as const,
  },
  {
    placement: 'engagement-rings' as HeroPlacement,
    num:       '02',
    label:     'The Promise',
    sublabel:  'Engagement',
    image:     '/images/hero/ring.png',
    size:      'small' as const,
  },
  {
    placement: 'necklaces'       as HeroPlacement,
    num:       '03',
    label:     'Lumière',
    sublabel:  'Necklaces',
    image:     '/images/hero/necklace.png',
    size:      'small' as const,
  },
  {
    placement: 'bracelets'       as HeroPlacement,
    num:       '04',
    label:     'Éternité',
    sublabel:  'Bracelets',
    image:     '/images/hero/bracelet.png',
    size:      'small' as const,
  },
  {
    placement: 'earrings'        as HeroPlacement,
    num:       '05',
    label:     'Aura',
    sublabel:  'Earrings',
    image:     '/images/hero/earrings.png',
    size:      'small' as const,
  },
];

/* ─── Vignette ─────────────────────────────────────────────────────────── */
function Vignette() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 20%, transparent 50%, rgba(0,0,0,0.7) 100%)',
      }}
    />
  );
}

/* ─── Video/image renderer ─────────────────────────────────────────────── */
function PanelMedia({
  src,
  alt,
  mediaType,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  mediaType: 'image' | 'video' | 'video_360' | 'certificate_pdf';
  priority: boolean;
  sizes: string;
}) {
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  if (mediaType === 'video' || mediaType === 'video_360') {
    return (
      <>
        <video
          src={src}
          autoPlay
          loop
          muted={muted}
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          style={{ display: paused ? 'none' : 'block' }}
        />
        {paused && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Play className="w-10 h-10 text-white/60" strokeWidth={1} />
          </div>
        )}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMuted(m => !m)}
            className="flex items-center justify-center rounded-full backdrop-blur-sm"
            style={{ width: 28, height: 28, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.85)' }}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted
              ? <VolumeX className="h-3 w-3" strokeWidth={1.25} />
              : <Volume2 className="h-3 w-3" strokeWidth={1.25} />}
          </button>
          <button
            type="button"
            onClick={() => setPaused(p => !p)}
            className="flex items-center justify-center rounded-full backdrop-blur-sm"
            style={{ width: 28, height: 28, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.85)' }}
            aria-label={paused ? 'Play' : 'Pause'}
          >
            {paused
              ? <Play className="h-3 w-3" style={{ fill: 'rgba(255,255,255,0.85)' }} strokeWidth={0} />
              : <Pause className="h-3 w-3" style={{ fill: 'rgba(255,255,255,0.85)' }} strokeWidth={0} />}
          </button>
        </div>
      </>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className="object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
      priority={priority}
    />
  );
}

/* ─── Gallery strip ─────────────────────────────────────────────────────── */
function GalleryStrip({
  items,
  onToggleFavourite,
  onEdit,
  onAdd,
}: {
  items: HeroMediaRecord[];
  onToggleFavourite: (id: string, val: boolean) => void;
  onEdit: (item: HeroMediaRecord) => void;
  onAdd: () => void;
}) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 flex items-center gap-2 overflow-x-auto px-3 py-2"
      style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(8px)', scrollbarWidth: 'none' }}
    >
      {items.map(item => (
        <div
          key={item.id}
          className="relative flex-shrink-0 cursor-pointer"
          style={{ width: 44, height: 44 }}
          onClick={() => onEdit(item)}
          title="Click to edit"
        >
          {/* thumbnail */}
          {item.media_type === 'video' || item.media_type === 'video_360' ? (
            <div className="w-full h-full flex items-center justify-center" style={{ background: '#111' }}>
              <Video className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} strokeWidth={1.5} />
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.storage_path}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}

          {/* heart badge */}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onToggleFavourite(item.id, !item.is_published); }}
            className="absolute top-0.5 right-0.5 flex items-center justify-center"
            style={{ width: 16, height: 16, background: 'rgba(0,0,0,0.55)', borderRadius: 2 }}
            title={item.is_published ? 'Remove from live' : 'Set as live'}
          >
            <Heart
              style={{
                width: 9,
                height: 9,
                color: item.is_published ? '#4ade80' : 'rgba(255,255,255,0.45)',
                fill: item.is_published ? '#4ade80' : 'none',
              }}
              strokeWidth={2}
            />
          </button>

          {/* edit pencil badge */}
          <div
            className="absolute bottom-0.5 right-0.5 flex items-center justify-center"
            style={{ width: 14, height: 14, background: 'rgba(0,0,0,0.55)', borderRadius: 2 }}
          >
            <Pencil style={{ width: 7, height: 7, color: 'rgba(255,255,255,0.5)' }} strokeWidth={2} />
          </div>
        </div>
      ))}

      {/* add button */}
      <button
        type="button"
        onClick={onAdd}
        className="flex-shrink-0 flex items-center justify-center"
        style={{ width: 44, height: 44, border: '1px dashed rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)' }}
        title="Add hero media"
      >
        <Plus style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.5)' }} strokeWidth={2} />
      </button>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────── */

interface Props {
  initialRecords: Record<HeroPlacement, HeroMediaRecord[]>;
}

export function AdminHomepageEditor({ initialRecords }: Props) {
  const [records, setRecords] = useState<Record<HeroPlacement, HeroMediaRecord[]>>(initialRecords);
  const [editing, setEditing] = useState<{ placement: HeroPlacement; item: HeroMediaRecord | null } | null>(null);
  const [, startTransition] = useTransition();

  const activePlacement = editing?.placement ?? null;
  const activePanel = activePlacement ? PANELS.find(p => p.placement === activePlacement) : null;

  /* pick the display item for a placement: first published, then first in list */
  function displayItem(placement: HeroPlacement): HeroMediaRecord | null {
    const list = records[placement] ?? [];
    return list.find(r => r.is_published) ?? list[0] ?? null;
  }

  async function handleSave(payload: Parameters<typeof saveHeroAction>[0]) {
    const saved = await saveHeroAction(payload);
    setRecords(prev => {
      const list = prev[payload.placement] ?? [];
      if (payload.id) {
        return { ...prev, [payload.placement]: list.map(x => x.id === payload.id ? saved : x) };
      }
      return { ...prev, [payload.placement]: [...list, saved] };
    });
    setEditing(null);
    return saved;
  }

  async function handleDelete(id: string) {
    if (!editing) return;
    await deleteHeroAction(id);
    setRecords(prev => ({
      ...prev,
      [editing.placement]: (prev[editing.placement] ?? []).filter(x => x.id !== id),
    }));
    setEditing(null);
  }

  function handleToggleFavourite(placement: HeroPlacement, id: string, val: boolean) {
    setRecords(prev => ({
      ...prev,
      [placement]: (prev[placement] ?? []).map(x => x.id === id ? { ...x, is_published: val } : x),
    }));
    startTransition(async () => {
      await setHeroPublishedAction(id, val);
    });
  }

  return (
    <>
      {/* ── Admin banner ── */}
      <div
        className="flex items-center justify-between px-6 py-2.5 flex-shrink-0"
        style={{ background: '#1a2b1a', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="font-sans uppercase text-white/50" style={{ fontSize: 9, letterSpacing: '0.3em' }}>
          Admin — Homepage Editor
        </p>
        <p className="font-sans text-white/40" style={{ fontSize: 10, letterSpacing: '0.05em' }}>
          Heart = live on site &nbsp;·&nbsp; Click thumbnail to edit &nbsp;·&nbsp; + to add
        </p>
      </div>

      {/* ── Exact homepage layout ── */}
      <div className="flex flex-1" style={{ minHeight: 0, height: 'calc(100dvh - 81px - 38px)' }}>

        {/* Large left panel */}
        {(() => {
          const p = PANELS[0];
          const record = displayItem(p.placement);
          const items  = records[p.placement] ?? [];
          const src    = record?.storage_path ?? p.image;
          const label  = record?.headline ?? p.label;
          const sublabel = record?.subheadline ?? p.sublabel;
          const anyLive = items.some(r => r.is_published);
          return (
            <div className="group relative overflow-hidden" style={{ flex: '0 0 45%' }}>
              <PanelMedia
                src={src}
                alt={label}
                mediaType={record?.media_type ?? 'image'}
                priority
                sizes="45vw"
              />
              <Vignette />

              {/* panel number */}
              <div className="absolute left-5 top-5 z-10">
                <span className="font-sans text-white/50" style={{ fontSize: 9, fontWeight: 300, letterSpacing: '0.3em' }}>
                  {p.num}
                </span>
              </div>

              {/* live badge */}
              {anyLive && (
                <div className="absolute top-4 left-10 z-10">
                  <span
                    className="font-sans uppercase"
                    style={{ fontSize: 7, letterSpacing: '0.22em', color: '#fff', background: 'rgba(60,120,60,0.7)', padding: '2px 7px', backdropFilter: 'blur(4px)' }}
                  >
                    {items.filter(r => r.is_published).length} Live
                  </span>
                </div>
              )}

              {/* label — sits above gallery strip */}
              <div className="absolute left-8 right-16 z-10" style={{ bottom: 76 }}>
                <p className="font-sans uppercase text-white/45 mb-2" style={{ fontSize: 9, fontWeight: 300, letterSpacing: '0.4em' }}>
                  {sublabel}
                </p>
                <div style={{ width: 32, height: 1, backgroundColor: 'rgba(212,168,71,0.6)', marginBottom: 14 }} />
                <h2
                  className="font-display italic text-white"
                  style={{ fontSize: 'clamp(32px, 3.8vw, 56px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '0.02em' }}
                >
                  {label}
                </h2>
              </div>

              <GalleryStrip
                items={items}
                onToggleFavourite={(id, val) => handleToggleFavourite(p.placement, id, val)}
                onEdit={item => setEditing({ placement: p.placement, item })}
                onAdd={() => setEditing({ placement: p.placement, item: null })}
              />
            </div>
          );
        })()}

        {/* Hairline divider */}
        <div style={{ width: 1, flexShrink: 0, background: 'rgba(255,255,255,0.08)' }} />

        {/* Right 2×2 grid */}
        <div className="grid flex-1 grid-cols-2 grid-rows-2">
          {PANELS.slice(1).map((p, i) => {
            const record   = displayItem(p.placement);
            const items    = records[p.placement] ?? [];
            const src      = record?.storage_path ?? p.image;
            const label    = record?.headline ?? p.label;
            const sublabel = record?.subheadline ?? p.sublabel;
            const anyLive  = items.some(r => r.is_published);
            return (
              <div key={p.placement} className="group relative overflow-hidden">
                <PanelMedia
                  src={src}
                  alt={label}
                  mediaType={record?.media_type ?? 'image'}
                  priority={i < 2}
                  sizes="27vw"
                />
                <Vignette />

                {/* panel number */}
                <div className="absolute left-4 top-4 z-10">
                  <span className="font-sans text-white/50" style={{ fontSize: 9, fontWeight: 300, letterSpacing: '0.3em' }}>
                    {p.num}
                  </span>
                </div>

                {/* label — sits above gallery strip */}
                <div className="absolute left-5 right-14 z-10" style={{ bottom: 68 }}>
                  <p className="font-sans uppercase text-white/50 mb-1" style={{ fontSize: 8, fontWeight: 300, letterSpacing: '0.32em' }}>
                    {sublabel}
                  </p>
                  <span
                    className="font-display italic text-white"
                    style={{ fontSize: 'clamp(14px, 1.4vw, 20px)', fontWeight: 300, letterSpacing: '0.03em', lineHeight: 1.1 }}
                  >
                    {label}
                  </span>
                </div>

                {/* live badge */}
                {anyLive && (
                  <div className="absolute top-4 left-10 z-10">
                    <span
                      className="font-sans uppercase"
                      style={{ fontSize: 7, letterSpacing: '0.22em', color: '#fff', background: 'rgba(60,120,60,0.7)', padding: '2px 7px', backdropFilter: 'blur(4px)' }}
                    >
                      {items.filter(r => r.is_published).length} Live
                    </span>
                  </div>
                )}

                <GalleryStrip
                  items={items}
                  onToggleFavourite={(id, val) => handleToggleFavourite(p.placement, id, val)}
                  onEdit={item => setEditing({ placement: p.placement, item })}
                  onAdd={() => setEditing({ placement: p.placement, item: null })}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── HeroEditModal ── */}
      {editing && activePanel && (
        <HeroEditModal
          current={editing.item}
          placement={editing.placement}
          callbacks={{ onSave: handleSave, onDelete: handleDelete }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
