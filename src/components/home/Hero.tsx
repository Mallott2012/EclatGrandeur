'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Pause, Play, VolumeX, Volume2 } from 'lucide-react';

/* ─── Panel definitions ───────────────────────────────────────────────── */

const MODEL_PANEL = {
  num: '01',
  label: 'The Collection',
  sublabel: 'Worn Together',
  image: '/images/hero/model.png',
};

const PRODUCT_PANELS = [
  { num: '02', label: 'Engagement Rings', image: '/images/hero/ring.png' },
  { num: '03', label: 'Necklaces',        image: '/images/hero/necklace.png' },
  { num: '04', label: 'Bracelets',        image: '/images/hero/bracelet.png' },
  { num: '05', label: 'Earrings',         image: '/images/hero/earrings.png' },
];

/* ─── Shared controls ─────────────────────────────────────────────────── */

function Controls({ paused, muted, onPause, onMute }: {
  paused: boolean;
  muted: boolean;
  onPause: () => void;
  onMute: () => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label={muted ? 'Unmute' : 'Mute'}
        onClick={onMute}
        className="flex items-center justify-center rounded-full backdrop-blur-sm transition-opacity hover:opacity-70"
        style={{ width: 28, height: 28, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.85)' }}
      >
        {muted
          ? <VolumeX className="h-3 w-3" strokeWidth={1.25} />
          : <Volume2 className="h-3 w-3" strokeWidth={1.25} />}
      </button>
      <button
        type="button"
        aria-label={paused ? 'Play' : 'Pause'}
        onClick={onPause}
        className="flex items-center justify-center rounded-full backdrop-blur-sm transition-opacity hover:opacity-70"
        style={{ width: 28, height: 28, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.85)' }}
      >
        {paused
          ? <Play  className="h-3 w-3" style={{ fill: 'rgba(255,255,255,0.85)' }} strokeWidth={0} />
          : <Pause className="h-3 w-3" style={{ fill: 'rgba(255,255,255,0.85)' }} strokeWidth={0} />}
      </button>
    </>
  );
}

/* ─── Vignette overlay ────────────────────────────────────────────────── */

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

/* ─── Large model panel (left, 45%) ──────────────────────────────────── */

function ModelPanel() {
  const [paused, setPaused] = useState(false);
  const [muted,  setMuted]  = useState(true);

  return (
    <div className="group relative overflow-hidden" style={{ flex: '0 0 45%' }}>
      <Image
        src={MODEL_PANEL.image}
        alt={MODEL_PANEL.label}
        fill
        sizes="45vw"
        className="object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
        priority
      />
      <Vignette />

      {/* number */}
      <div className="absolute left-5 top-5">
        <span className="font-sans text-white/50" style={{ fontSize: '9px', fontWeight: 300, letterSpacing: '0.3em' }}>
          {MODEL_PANEL.num}
        </span>
      </div>

      {/* controls — top right */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <Controls paused={paused} muted={muted} onPause={() => setPaused(p => !p)} onMute={() => setMuted(m => !m)} />
      </div>

      {/* label — bottom left, large editorial type */}
      <div className="absolute bottom-8 left-6 right-6">
        <p
          className="font-sans text-white/50 uppercase"
          style={{ fontSize: '9px', fontWeight: 400, letterSpacing: '0.35em', marginBottom: '6px' }}
        >
          {MODEL_PANEL.sublabel}
        </p>
        <h2
          className="font-display italic text-white"
          style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 300, lineHeight: 1.1, letterSpacing: '0.02em' }}
        >
          {MODEL_PANEL.label}
        </h2>
      </div>
    </div>
  );
}

/* ─── Small product panel (2×2 grid, right 55%) ──────────────────────── */

function ProductPanel({ panel, priority }: { panel: (typeof PRODUCT_PANELS)[number]; priority: boolean }) {
  const [paused, setPaused] = useState(false);
  const [muted,  setMuted]  = useState(true);

  return (
    <div className="group relative overflow-hidden">
      <Image
        src={panel.image}
        alt={panel.label}
        fill
        sizes="27vw"
        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.05]"
        priority={priority}
      />
      <Vignette />

      {/* number */}
      <div className="absolute left-4 top-4">
        <span className="font-sans text-white/50" style={{ fontSize: '9px', fontWeight: 300, letterSpacing: '0.3em' }}>
          {panel.num}
        </span>
      </div>

      {/* controls — top right */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        <Controls paused={paused} muted={muted} onPause={() => setPaused(p => !p)} onMute={() => setMuted(m => !m)} />
      </div>

      {/* label — bottom */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        <span
          className="font-display italic text-white/90"
          style={{ fontSize: 'clamp(11px, 1.1vw, 15px)', fontWeight: 300, letterSpacing: '0.04em' }}
        >
          {panel.label}
        </span>
      </div>
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────── */

export function Hero() {
  return (
    <div className="flex h-full"style={{ minHeight: 0 }}>

      {/* Left — model hero (45%) */}
      <ModelPanel />

      {/* Hairline divider */}
      <div style={{ width: '1px', flexShrink: 0, background: 'rgba(255,255,255,0.08)' }} />

      {/* Right — 2×2 product grid (55%) */}
      <div className="grid flex-1 grid-cols-2 grid-rows-2">
        {PRODUCT_PANELS.map((panel, i) => (
          <ProductPanel key={panel.num} panel={panel} priority={i < 2} />
        ))}
      </div>

    </div>
  );
}
