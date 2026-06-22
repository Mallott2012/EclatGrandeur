'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SettingSelector } from './SettingSelector';
import { ShapeSelector, type DiamondShape } from './ShapeSelector';
import { MetalSelector } from './MetalSelector';
import { RingGrid } from './RingGrid';
import { ConsultationCTA } from './ConsultationCTA';
import type { RingSettingRecord, RingMetal } from '@/lib/ring-settings/types';

const GREEN = '#1a2b1a';
const IVORY = '#ffffff';
const GOLD  = '#b8965a';

const HERO_IMAGES = [
  '/images/engagement/hero-collection.png',
  '/images/engagement/hero-solitaire.png',
  '/images/engagement/hero-halo.png',
  '/images/engagement/hero-three-stone.png',
  '/images/engagement/hero-pave.png',
];

const DIVIDER = (
  <div
    aria-hidden
    style={{ height: 1, backgroundColor: `${GREEN}10`, margin: '72px 0' }}
  />
);

interface Props {
  settings: RingSettingRecord[];
}

export function EngagementRingPage({ settings }: Props) {
  const [heroImage, setHeroImage]       = useState(HERO_IMAGES[0]);
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const [activeShape, setActiveShape]   = useState<DiamondShape | null>(null);
  const [activeMetal, setActiveMetal]   = useState<RingMetal | null>(null);

  const [prevHero, setPrevHero]         = useState(HERO_IMAGES[0]);
  const [fading, setFading]             = useState(false);

  function changeHero(next: string) {
    if (next === heroImage) return;
    setPrevHero(heroImage);
    setFading(true);
    setTimeout(() => {
      setHeroImage(next);
      setFading(false);
    }, 600);
  }

  function handleSettingChange(id: string, image: string) {
    setActiveSetting(id === activeSetting ? null : id);
    changeHero(image);
  }

  return (
    <div className="flex items-start" style={{ backgroundColor: IVORY }}>

      {/* ── LEFT: sticky hero panel ──────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-end sticky top-0"
        style={{ width: '45%', height: '100vh', flexShrink: 0 }}
      >
        {/* crossfade images */}
        <div className="absolute inset-0 overflow-hidden">
          {/* previous image fades out */}
          <Image
            src={prevHero}
            alt="Engagement ring"
            fill
            priority
            className="object-cover"
            style={{ opacity: fading ? 1 : 0, transition: 'opacity 0.6s ease' }}
            sizes="45vw"
          />
          {/* current image fades in */}
          <Image
            src={heroImage}
            alt="Engagement ring"
            fill
            priority
            className="object-cover"
            style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.6s ease' }}
            sizes="45vw"
          />
          {/* bottom scrim for text legibility */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ height: '50%', background: 'linear-gradient(to top, rgba(26,43,26,0.85) 0%, transparent 100%)' }}
          />
        </div>

        {/* hero text overlay */}
        <div className="relative z-10 p-10 pb-12">
          <p
            className="font-sans uppercase tracking-[0.3em] mb-3"
            style={{ fontSize: 9, color: `${IVORY}88` }}
          >
            Éclat Grandeur
          </p>
          <div style={{ width: 32, height: 1, backgroundColor: GOLD, marginBottom: 16 }} />
          <h1
            className="font-display italic"
            style={{
              fontSize: 'clamp(36px, 4vw, 56px)',
              fontWeight: 300,
              color: IVORY,
              lineHeight: 1.05,
              letterSpacing: '0.01em',
            }}
          >
            Engagement<br />Rings
          </h1>
          <p
            className="font-sans mt-4 leading-relaxed"
            style={{ fontSize: 13, color: `${IVORY}bb`, maxWidth: 280 }}
          >
            Individually handcrafted in London. Each ring is made to order and unique to you.
          </p>
        </div>
      </div>

      {/* ── RIGHT: scrolling selector journey ──────────────────────────── */}
      <div
        className="flex-1 min-w-0"
        style={{ backgroundColor: IVORY }}
      >
        {/* mobile hero — shown only below lg */}
        <div className="relative lg:hidden" style={{ height: '55vw', minHeight: 240, maxHeight: 400 }}>
          <Image
            src={heroImage}
            alt="Engagement rings"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div
            className="absolute inset-x-0 bottom-0"
            style={{ height: '60%', background: 'linear-gradient(to top, rgba(26,43,26,0.8) 0%, transparent 100%)' }}
          />
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <h1 className="font-display italic text-white" style={{ fontSize: 32, fontWeight: 300 }}>
              Engagement Rings
            </h1>
          </div>
        </div>

        {/* content sections */}
        <div className="px-8 lg:px-14 py-16">

          {/* page intro — desktop only left panel handles it */}
          <div className="lg:hidden mb-10">
            <p className="font-sans leading-relaxed" style={{ fontSize: 14, color: `${GREEN}99` }}>
              Individually handcrafted in London. Each ring is made to order and unique to you.
            </p>
          </div>

          {/* Step 1 — Setting */}
          <SettingSelector
            settings={settings}
            selected={activeSetting}
            onChange={handleSettingChange}
          />

          {DIVIDER}

          {/* Step 2 — Shape */}
          <ShapeSelector
            selected={activeShape}
            onChange={setActiveShape}
          />

          {DIVIDER}

          {/* Step 3 — Metal */}
          <MetalSelector
            selected={activeMetal}
            onChange={setActiveMetal}
          />

          {DIVIDER}

          {/* Step 4 — Ring grid */}
          <RingGrid
            settings={settings}
            activeSetting={activeSetting}
            activeShape={activeShape}
            activeMetal={activeMetal}
          />

          {DIVIDER}

          {/* Consultation CTA */}
          <ConsultationCTA />

          {/* bottom breathing room */}
          <div style={{ height: 80 }} />
        </div>
      </div>
    </div>
  );
}
