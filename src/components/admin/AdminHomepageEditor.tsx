'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Pencil, Pause, Play, VolumeX, Volume2 } from 'lucide-react';
import type { HeroMediaRecord, HeroPlacement } from '@/lib/hero/service';
import { HeroEditModal } from '@/components/admin/HeroEditModal';
import { saveHeroAction, deleteHeroAction } from '@/app/admin/(console)/hero/actions';

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
          'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 20%, transparent 60%, rgba(0,0,0,0.6) 100%)',
      }}
    />
  );
}

/* ─── Edit button overlay ──────────────────────────────────────────────── */
function EditOverlay({
  record,
  onClick,
}: {
  record: HeroMediaRecord | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 font-sans uppercase transition-opacity hover:opacity-80"
      style={{
        fontSize: 9,
        letterSpacing: '0.2em',
        color: '#fff',
        background: record ? 'rgba(26,43,26,0.75)' : 'rgba(0,0,0,0.45)',
        padding: '6px 12px',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
      aria-label="Edit hero panel"
    >
      <Pencil className="w-2.5 h-2.5" strokeWidth={2} />
      {record ? 'Change' : 'Set Media'}
    </button>
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
        {/* video controls */}
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

/* ─── Main component ───────────────────────────────────────────────────── */

interface Props {
  initialRecords: Record<HeroPlacement, HeroMediaRecord | null>;
}

export function AdminHomepageEditor({ initialRecords }: Props) {
  const [records, setRecords] = useState<Record<HeroPlacement, HeroMediaRecord | null>>(initialRecords);
  const [editing, setEditing] = useState<HeroPlacement | null>(null);

  const activePanel = editing ? PANELS.find(p => p.placement === editing) : null;

  async function handleSave(payload: Parameters<typeof saveHeroAction>[0]) {
    const saved = await saveHeroAction(payload);
    setRecords(prev => ({ ...prev, [payload.placement]: saved }));
    setEditing(null);
    return saved;
  }

  async function handleDelete(id: string) {
    await deleteHeroAction(id);
    if (editing) setRecords(prev => ({ ...prev, [editing]: null }));
    setEditing(null);
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
          Click any panel to change its image or video
        </p>
      </div>

      {/* ── Exact homepage layout ── */}
      <div className="flex flex-1" style={{ minHeight: 0, height: 'calc(100dvh - 81px - 38px)' }}>

        {/* Large left panel */}
        {(() => {
          const p = PANELS[0];
          const record = records[p.placement];
          const src = record?.storage_path ?? p.image;
          const label = record?.headline ?? p.label;
          const sublabel = record?.subheadline ?? p.sublabel;
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

              {/* label */}
              <div className="absolute bottom-10 left-8 right-16 z-10">
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

              {/* live badge */}
              {record?.is_published && (
                <div className="absolute top-4 left-10 z-10">
                  <span
                    className="font-sans uppercase"
                    style={{ fontSize: 7, letterSpacing: '0.22em', color: '#fff', background: 'rgba(60,120,60,0.7)', padding: '2px 7px', backdropFilter: 'blur(4px)' }}
                  >
                    Live
                  </span>
                </div>
              )}

              <EditOverlay record={record} onClick={() => setEditing(p.placement)} />
            </div>
          );
        })()}

        {/* Hairline divider */}
        <div style={{ width: 1, flexShrink: 0, background: 'rgba(255,255,255,0.08)' }} />

        {/* Right 2×2 grid */}
        <div className="grid flex-1 grid-cols-2 grid-rows-2">
          {PANELS.slice(1).map((p, i) => {
            const record = records[p.placement];
            const src = record?.storage_path ?? p.image;
            const label = record?.headline ?? p.label;
            const sublabel = record?.subheadline ?? p.sublabel;
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

                {/* label */}
                <div className="absolute bottom-5 left-5 right-14 z-10">
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
                {record?.is_published && (
                  <div className="absolute top-4 left-10 z-10">
                    <span
                      className="font-sans uppercase"
                      style={{ fontSize: 7, letterSpacing: '0.22em', color: '#fff', background: 'rgba(60,120,60,0.7)', padding: '2px 7px', backdropFilter: 'blur(4px)' }}
                    >
                      Live
                    </span>
                  </div>
                )}

                <EditOverlay record={record} onClick={() => setEditing(p.placement)} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── HeroEditModal ── */}
      {editing && activePanel && (
        <HeroEditModal
          current={records[editing]}
          placement={editing}
          callbacks={{ onSave: handleSave, onDelete: handleDelete }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
