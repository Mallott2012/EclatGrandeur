'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Pause, Play, VolumeX, Volume2 } from 'lucide-react';

/* ─── Panel definitions ───────────────────────────────────────────────── */

const MODEL_PANEL = {
  num: '01',
  label: 'The Éclat Collection',
  sublabel: 'A woman in full',
  image: '/images/hero/model.png',
};

const PRODUCT_PANELS = [
  { num: '02', label: 'The Promise',    sublabel: 'Engagement', image: '/images/hero/ring.png' },
  { num: '03', label: 'Lumière',        sublabel: 'Necklaces',  image: '/images/hero/necklace.png' },
  { num: '04', label: 'Éternité',       sublabel: 'Bracelets',  image: '/images/hero/bracelet.png' },
  { num: '05', label: 'Aura',           sublabel: 'Earrings',   image: '/images/hero/earrings.png' },
];

/* ─── Shared controls ─────────────────────────────────────────────────── */

function Controls({ paused, muted, onPause, onMute }: {
  paused: boolean;
  muted: boolean;
  onPause: () => void;
  onMute: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      <button
        type="button"
        aria-label={mounted && !muted ? 'Mute' : 'Unmute'}
        onClick={onMute}
        className="flex items-center justify-center rounded-full backdrop-blur-sm transition-opacity hover:opacity-70"
        style={{ width: 28, height: 28, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.85)' }}
      >
        {mounted && !muted
          ? <Volume2 className="h-3 w-3" strokeWidth={1.25} />
          : <VolumeX className="h-3 w-3" strokeWidth={1.25} />}
      </button>
      <button
        type="button"
        aria-label={mounted && !paused ? 'Pause' : 'Play'}
        onClick={onPause}
        className="flex items-center justify-center rounded-full backdrop-blur-sm transition-opacity hover:opacity-70"
        style={{ width: 28, height: 28, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.85)' }}
      >
        {mounted && !paused
          ? <Pause className="h-3 w-3" style={{ fill: 'rgba(255,255,255,0.85)' }} strokeWidth={0} />
          : <Play  className="h-3 w-3" style={{ fill: 'rgba(255,255,255,0.85)' }} strokeWidth={0} />}
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
      <div className="absolute bottom-10 left-8 right-8">
        <p
          className="font-sans uppercase text-white/45 mb-2"
          style={{ fontSize: '9px', fontWeight: 300, letterSpacing: '0.4em' }}
        >
          {MODEL_PANEL.sublabel}
        </p>
        {/* thin gold hairline */}
        <div style={{ width: 32, height: '1px', backgroundColor: 'rgba(212,168,71,0.6)', marginBottom: '14px' }} />
        <h2
          className="font-display italic text-white"
          style={{ fontSize: 'clamp(32px, 3.8vw, 56px)', fontWeight: 300, lineHeight: 1.05, letterSpacing: '0.02em' }}
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
      <div className="absolute bottom-5 left-5 right-5">
        <p
          className="font-sans uppercase text-white/50 mb-1"
          style={{ fontSize: '8px', fontWeight: 300, letterSpacing: '0.32em' }}
        >
          {panel.sublabel}
        </p>
        <span
          className="font-display italic text-white"
          style={{ fontSize: 'clamp(14px, 1.4vw, 20px)', fontWeight: 300, letterSpacing: '0.03em', lineHeight: 1.1 }}
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
    <div className="flex flex-1" style={{ minHeight: 0, height: 'calc(100dvh - 81px)' }}>

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
