'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Pause, Play, VolumeX, Volume2 } from 'lucide-react';

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
    <div className="group relative flex-1 min-w-0 overflow-hidden">
      <Image
        src={panel.image}
        alt={panel.label}
        fill
        sizes="20vw"
        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
        priority={index < 3}
      />

      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 25%, transparent 65%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* number — top left */}
      <div className="absolute top-4 left-4">
        <span className="font-sans tracking-[0.3em] text-white/60" style={{ fontSize: '9px', fontWeight: 300 }}>
          {panel.num}
        </span>
      </div>

      {/* mute — top right */}
      <button
        type="button"
        aria-label={muted ? 'Unmute' : 'Mute'}
        onClick={() => setMuted((m) => !m)}
        className="absolute top-3 right-3 flex items-center justify-center rounded-full backdrop-blur-sm transition-opacity hover:opacity-70"
        style={{ width: 28, height: 28, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.8)' }}
      >
        {muted
          ? <VolumeX className="h-3 w-3" strokeWidth={1.25} />
          : <Volume2 className="h-3 w-3" strokeWidth={1.25} />}
      </button>

      {/* label + pause — bottom */}
      <div className="absolute bottom-5 left-4 right-4 flex items-end justify-between">
        <span
          className="font-display italic text-white/80"
          style={{ fontSize: '13px', fontWeight: 300, letterSpacing: '0.04em' }}
        >
          {panel.label}
        </span>
        <button
          type="button"
          aria-label={paused ? 'Play' : 'Pause'}
          onClick={() => setPaused((p) => !p)}
          className="flex items-center justify-center rounded-full backdrop-blur-sm transition-opacity hover:opacity-70"
          style={{ width: 28, height: 28, background: 'rgba(0,0,0,0.28)', color: 'rgba(255,255,255,0.8)' }}
        >
          {paused
            ? <Play  className="h-3 w-3" style={{ fill: 'rgba(255,255,255,0.8)' }} strokeWidth={0} />
            : <Pause className="h-3 w-3" style={{ fill: 'rgba(255,255,255,0.8)' }} strokeWidth={0} />}
        </button>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    /* sit directly under the fixed 72px header, fill everything below it */
    <div className="flex" style={{ height: 'calc(100vh - 72px)' }}>
      {PANELS.map((panel, i) => (
        <VideoPanel key={panel.num} panel={panel} index={i} />
      ))}
    </div>
  );
}
