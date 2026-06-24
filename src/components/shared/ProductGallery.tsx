'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import type { GallerySlot, TileData, GalleryData } from '@/lib/gallery/types';

export type { GallerySlot, TileData, GalleryData };

const SLOTS: { key: GallerySlot; label: string }[] = [
  { key: 'topLeft',     label: 'Top Left'     },
  { key: 'topRight',    label: 'Top Right'    },
  { key: 'bottomLeft',  label: 'Bottom Left'  },
  { key: 'bottomRight', label: 'Bottom Right' },
];

// ── Slider row ─────────────────────────────────────────────────────────────────
function SliderRow({ label, min, max, step, value, onChange }: {
  label: string; min: number; max: number; step: number; value: number;
  onChange: (v: number) => void;
}) {
  const display = label === 'S'
    ? value.toFixed(2)
    : `${value > 0 ? '+' : ''}${value.toFixed(0)}%`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.1em', color: '#999', width: 18, textTransform: 'uppercase', flexShrink: 0 }}>
        {label}
      </span>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, cursor: 'pointer', accentColor: '#1a2b1a' }}
      />
      <span style={{ fontFamily: 'sans-serif', fontSize: 9, color: '#bbb', width: 34, textAlign: 'right', flexShrink: 0 }}>
        {display}
      </span>
    </div>
  );
}

const MENU_BTN: React.CSSProperties = {
  fontFamily: 'sans-serif', fontSize: 10, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#1a2b1a', background: '#fff',
  border: '1px solid #e8e8e8', padding: '5px 18px', cursor: 'pointer', minWidth: 90,
};

// ── Single tile ────────────────────────────────────────────────────────────────
function GalleryTile({ slot, tile, editable, onUpload, onChange }: {
  slot:      GallerySlot;
  tile:      TileData;
  editable:  boolean;
  onUpload?: (slot: GallerySlot, fd: FormData) => Promise<string>;
  onChange?: (updates: Partial<TileData>) => void;
}) {
  const [mode, setMode] = useState<'idle' | 'menu' | 'adjust' | 'uploading'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);
  const isEmpty = !tile.url;

  async function handleFile(file: File) {
    if (!onUpload) return;
    setMode('uploading');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const url = await onUpload(slot, fd);
      onChange?.({ url });
    } catch { /* silent — user sees no change */ }
    setMode('idle');
  }

  // CSS custom properties feed the image transform without React re-renders on each pixel
  const containerStyle: React.CSSProperties & Record<string, string> = {
    position:    'relative',
    aspectRatio: '1 / 1',
    width:       '100%',
    overflow:    'hidden',
    background:  '#f8f8f8',
    '--offset-x':    `${tile.offsetX}%`,
    '--offset-y':    `${tile.offsetY}%`,
    '--image-scale': String(tile.scale),
  };

  const imgStyle: React.CSSProperties = {
    position:        'absolute',
    left:            '50%',
    top:             '50%',
    width:           '100%',
    height:          '100%',
    objectFit:       'contain',
    transform:       'translate(calc(-50% + var(--offset-x)), calc(-50% + var(--offset-y))) scale(var(--image-scale))',
    transformOrigin: '50% 50%',
    pointerEvents:   'none',
    userSelect:      'none',
  };

  return (
    <div style={containerStyle as React.CSSProperties}>

      {/* ── Image ──────────────────────────────────────────────────────────── */}
      {tile.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tile.url} alt={tile.alt || ''} style={imgStyle} />
      )}

      {/* ── Read-only empty tile ───────────────────────────────────────────── */}
      {isEmpty && !editable && (
        <div style={{ position: 'absolute', inset: 0, background: '#f0f0f0' }} />
      )}

      {/* ── Editable empty — click to upload ──────────────────────────────── */}
      {isEmpty && editable && mode !== 'uploading' && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: 'transparent', border: '1px dashed #ccc', cursor: 'pointer',
          }}
        >
          <Upload style={{ width: 18, height: 18, color: '#ccc' }} strokeWidth={1.5} />
          <span style={{ fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ccc' }}>
            Upload
          </span>
        </button>
      )}

      {/* ── Uploading spinner ─────────────────────────────────────────────── */}
      {mode === 'uploading' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.9)', zIndex: 20 }}>
          <Loader2 style={{ width: 22, height: 22, color: '#1a2b1a' }} className="animate-spin" />
        </div>
      )}

      {/* ── Idle transparent click target on filled tile ───────────────────── */}
      {editable && !isEmpty && mode === 'idle' && (
        <button
          type="button"
          onClick={() => setMode('menu')}
          style={{ position: 'absolute', inset: 0, background: 'transparent', cursor: 'pointer' }}
          aria-label="Edit image"
        />
      )}

      {/* ── Menu overlay: Replace / Adjust / Remove ───────────────────────── */}
      {mode === 'menu' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7,
          background: 'rgba(255,255,255,0.93)',
        }}>
          <button type="button" onClick={() => { setMode('idle'); fileRef.current?.click(); }} style={MENU_BTN}>
            Replace
          </button>
          <button type="button" onClick={() => setMode('adjust')} style={MENU_BTN}>
            Adjust
          </button>
          <button type="button" onClick={() => { onChange?.({ url: '', alt: '', scale: 1, offsetX: 0, offsetY: 0 }); setMode('idle'); }} style={{ ...MENU_BTN, color: '#e05050', borderColor: '#fcc' }}>
            Remove
          </button>
          <button type="button" onClick={() => setMode('idle')} style={{ fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}>
            Cancel
          </button>
        </div>
      )}

      {/* ── Adjust overlay: scale + X + Y sliders ─────────────────────────── */}
      {mode === 'adjust' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'rgba(255,255,255,0.96)',
          display: 'flex', flexDirection: 'column', padding: '10px 10px 8px', gap: 9,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#888' }}>Adjust</span>
            <button type="button" onClick={() => setMode('idle')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <X style={{ width: 12, height: 12, color: '#bbb' }} strokeWidth={2} />
            </button>
          </div>
          <SliderRow label="S" min={0.5} max={3}   step={0.01} value={tile.scale}   onChange={v => onChange?.({ scale: v })} />
          <SliderRow label="X" min={-50} max={50}  step={0.5}  value={tile.offsetX} onChange={v => onChange?.({ offsetX: v })} />
          <SliderRow label="Y" min={-50} max={50}  step={0.5}  value={tile.offsetY} onChange={v => onChange?.({ offsetY: v })} />
          <button
            type="button"
            onClick={() => onChange?.({ scale: 1, offsetX: 0, offsetY: 0 })}
            style={{ fontFamily: 'sans-serif', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bbb', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: 1 }}
          >
            ↺ Reset
          </button>
        </div>
      )}

      {/* ── Hidden file input ─────────────────────────────────────────────── */}
      {editable && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/mp4"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
      )}
    </div>
  );
}

// ── Public component ───────────────────────────────────────────────────────────
export function ProductGallery({ data, editable = false, onUpload, onChange }: {
  data:      GalleryData;
  editable?: boolean;
  onUpload?: (slot: GallerySlot, fd: FormData) => Promise<string>;
  onChange?: (data: GalleryData) => void;
}) {
  function updateSlot(slot: GallerySlot, updates: Partial<TileData>) {
    onChange?.({ ...data, [slot]: { ...data[slot], ...updates } });
  }

  return (
    <div
      style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gridTemplateRows:    'repeat(2, minmax(0, 1fr))',
        gap:                 10,
        width:               '100%',
      }}
    >
      {SLOTS.map(({ key }) => (
        <GalleryTile
          key={key}
          slot={key}
          tile={data[key]}
          editable={editable}
          onUpload={onUpload}
          onChange={updates => updateSlot(key, updates)}
        />
      ))}
    </div>
  );
}
