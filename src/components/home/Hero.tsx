'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Pause, Play, VolumeX, Volume2 } from 'lucide-react';

const BG   = '#1c1c17';
const TEXT = '#e8e0cc';

const PANELS = [
  { num: '01', label: 'Engagement Rings', image: '/images/hero/ring.png' },
  { num: '02', label: 'Necklaces',        image: '/images/hero/necklace.png' },
  { num: '03', label: 'Diamonds',         image: '/images/hero/diamond.png' },
  { num: '04', label: 'Bracelets',        image: '/images/hero/bracelet.png' },
  { num: '05', label: 'Earrings',         image: '/images/hero/earrings.png' },
];

function VideoPanel({ panel, index }: { panel: (typeof PANELS)[number]; index: number }) {
  const [paused, setPaused] = useState(false);
  const [muted,  setMuted]  = useState(true);

  return (
    <div
      className="group relative flex-1 min-w-0 overflow-hidden"
      style={{ borderRadius: '10px', aspectRatio: '9/16' }}
    >
      <Image
        src={panel.image}
        alt={panel.label}
        fill
        sizes="(max-width: 768px) 80vw, 20vw"
        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
        priority={index < 2}
      />

      {/* subtle top + bottom gradient vignette */}
      <div className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, transparent 28%, transparent 62%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* panel number — top left */}
      <div className="absolute top-4 left-4">
        <span
          className="font-sans tracking-[0.3em]"
          style={{ color: `${TEXT}90`, fontSize: '9px', fontWeight: 300 }}
        >
          {panel.num}
        </span>
      </div>

      {/* mute — top right */}
      <div className="absolute top-3 right-3">
        <button
          type="button"
          aria-label={muted ? 'Unmute' : 'Mute'}
          onClick={() => setMuted((m) => !m)}
          className="flex items-center justify-center rounded-full backdrop-blur-sm transition-opacity hover:opacity-70"
          style={{
            width: 28, height: 28,
            background: 'rgba(0,0,0,0.28)',
            color: `${TEXT}cc`,
          }}
        >
          {muted
            ? <VolumeX className="h-3 w-3" strokeWidth={1.25} />
            : <Volume2 className="h-3 w-3" strokeWidth={1.25} />}
        </button>
      </div>

      {/* label + pause — bottom */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        <span
          className="font-display italic"
          style={{ color: `${TEXT}cc`, fontSize: '13px', fontWeight: 300, letterSpacing: '0.04em' }}
        >
          {panel.label}
        </span>
        <button
          type="button"
          aria-label={paused ? 'Play' : 'Pause'}
          onClick={() => setPaused((p) => !p)}
          className="flex items-center justify-center rounded-full backdrop-blur-sm transition-opacity hover:opacity-70"
          style={{
            width: 28, height: 28,
            background: 'rgba(0,0,0,0.28)',
            color: `${TEXT}cc`,
          }}
        >
          {paused
            ? <Play  className="h-3 w-3" style={{ fill: `${TEXT}cc` }} strokeWidth={0} />
            : <Pause className="h-3 w-3" style={{ fill: `${TEXT}cc` }} strokeWidth={0} />}
        </button>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section
      className="flex h-screen w-full flex-col items-center justify-center gap-8 px-6"
      style={{ backgroundColor: BG }}
    >
      {/* thin gold rule above panels */}
      <div
        className="w-full max-w-[1400px]"
        style={{
          height: '1px',
          background: `linear-gradient(to right, transparent, rgba(184,150,90,0.35), transparent)`,
        }}
        aria-hidden="true"
      />

      {/* 5 panels */}
      <div className="flex w-full max-w-[1400px] gap-2.5" style={{ height: 'min(74vh, 700px)' }}>
        {PANELS.map((panel, i) => (
          <VideoPanel key={panel.num} panel={panel} index={i} />
        ))}
      </div>

      {/* thin gold rule below panels */}
      <div
        className="w-full max-w-[1400px]"
        style={{
          height: '1px',
          background: `linear-gradient(to right, transparent, rgba(184,150,90,0.35), transparent)`,
        }}
        aria-hidden="true"
      />
    </section>
  );
}
