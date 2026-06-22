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
  const [muted, setMuted]   = useState(true);

  return (
    <div
      className="group relative flex-1 min-w-0 overflow-hidden rounded-2xl"
      style={{ aspectRatio: '9/16' }}
    >
      <Image
        src={panel.image}
        alt={panel.label}
        fill
        sizes="(max-width: 768px) 80vw, 20vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        priority={index < 2}
      />

      {/* top/bottom vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

      {/* number + mute */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-3">
        <span className="font-sans text-[11px] font-medium text-white/90 tracking-widest">
          {panel.num}
        </span>
        <button
          type="button"
          aria-label={muted ? 'Unmute' : 'Mute'}
          onClick={() => setMuted((m) => !m)}
          className="rounded-full bg-black/25 p-1.5 text-white/80 backdrop-blur-sm transition hover:bg-black/40"
        >
          {muted
            ? <VolumeX className="h-3.5 w-3.5" strokeWidth={1.75} />
            : <Volume2 className="h-3.5 w-3.5" strokeWidth={1.75} />}
        </button>
      </div>

      {/* pause/play */}
      <div className="absolute bottom-3 left-3">
        <button
          type="button"
          aria-label={paused ? 'Play' : 'Pause'}
          onClick={() => setPaused((p) => !p)}
          className="rounded-full bg-black/25 p-1.5 text-white/80 backdrop-blur-sm transition hover:bg-black/40"
        >
          {paused
            ? <Play  className="h-3.5 w-3.5 fill-white/80" strokeWidth={0} />
            : <Pause className="h-3.5 w-3.5 fill-white/80" strokeWidth={0} />}
        </button>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="flex h-screen w-full items-center justify-center bg-[#f5f0e8] px-6">
      <div className="flex w-full max-w-[1400px] gap-3">
        {PANELS.map((panel, i) => (
          <VideoPanel key={panel.num} panel={panel} index={i} />
        ))}
      </div>
    </section>
  );
}
