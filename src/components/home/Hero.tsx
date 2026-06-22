'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Pause, Play, VolumeX, Volume2 } from 'lucide-react';

const PANELS = [
  {
    num: '01',
    label: 'Engagement Rings',
    href: '/engagement-rings',
    image: '/images/hero/ring.png',
  },
  {
    num: '02',
    label: 'Necklaces',
    href: '/necklaces',
    image: '/images/hero/necklace.png',
  },
  {
    num: '03',
    label: 'Diamonds',
    href: '/diamonds',
    image: '/images/hero/diamond.png',
  },
  {
    num: '04',
    label: 'Bracelets',
    href: '/bracelets',
    image: '/images/hero/bracelet.png',
  },
  {
    num: '05',
    label: 'Earrings',
    href: '/earrings',
    image: '/images/hero/earrings.png',
  },
];

function VideoPanel({
  panel,
  index,
}: {
  panel: (typeof PANELS)[number];
  index: number;
}) {
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  return (
    <div
      className="group relative flex-1 min-w-0 overflow-hidden rounded-2xl"
      style={{ aspectRatio: '9/16' }}
    >
      {/* Image fills the card — acts as video placeholder */}
      <Image
        src={panel.image}
        alt={panel.label}
        fill
        sizes="(max-width: 768px) 80vw, 20vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        priority={index < 2}
      />

      {/* Subtle dark gradient at top and bottom */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

      {/* Number + mute — top row */}
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
          {muted ? (
            <VolumeX className="h-3.5 w-3.5" strokeWidth={1.75} />
          ) : (
            <Volume2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          )}
        </button>
      </div>

      {/* Pause / play — bottom-left */}
      <div className="absolute bottom-3 left-3 flex items-end justify-between w-[calc(100%-1.5rem)]">
        <button
          type="button"
          aria-label={paused ? 'Play' : 'Pause'}
          onClick={() => setPaused((p) => !p)}
          className="rounded-full bg-black/25 p-1.5 text-white/80 backdrop-blur-sm transition hover:bg-black/40"
        >
          {paused ? (
            <Play className="h-3.5 w-3.5 fill-white/80" strokeWidth={0} />
          ) : (
            <Pause className="h-3.5 w-3.5 fill-white/80" strokeWidth={0} />
          )}
        </button>

        {/* Label on hover */}
        <span className="translate-y-1 font-sans text-[10px] font-medium uppercase tracking-widest text-white/0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:text-white/80">
          {panel.label}
        </span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="w-full bg-ivory py-16 md:py-20">
      <div className="container-luxe flex flex-col items-center">

        {/* Editorial headline */}
        <div className="mb-10 flex flex-col items-center text-center">
          <span className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-ink/50">
            The Collection
          </span>
          <div className="mb-4 h-px w-8 bg-champagne/60" />
          <h1 className="font-display text-5xl font-light italic leading-[1.1] text-ink md:text-6xl lg:text-7xl">
            Crafted for<br className="hidden sm:block" /> a lifetime.
          </h1>
          <p className="mt-5 max-w-md font-sans text-sm leading-relaxed text-ink/55">
            Timeless jewellery, individually certified and<br className="hidden sm:block" />
            handset by our master craftsmen in London.
          </p>
        </div>

        {/* 5 video panels */}
        <div className="flex w-full gap-2.5 md:gap-3">
          {PANELS.map((panel, i) => (
            <VideoPanel key={panel.num} panel={panel} index={i} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10">
          <Link
            href="/collections"
            className="inline-flex items-center gap-3 rounded-full border border-ink/25 bg-ivory-deep px-8 py-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/70 transition-all duration-300 hover:border-champagne hover:bg-champagne hover:text-ivory"
          >
            Explore the Collection
            <span className="text-base leading-none">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
