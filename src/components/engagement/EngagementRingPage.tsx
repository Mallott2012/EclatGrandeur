'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShapeSelector, type DiamondShape } from './ShapeSelector';
import { RingGrid } from './RingGrid';
import type { RingSettingRecord, RingMetal } from '@/lib/ring-settings/types';

const GREEN = '#1a2b1a';
const GREY  = '#f5f4f2';   // De Beers warm light grey

// ── Setting filter tabs ───────────────────────────────────────────────────────
const SETTINGS = [
  { id: 'solitaire',    label: 'Solitaire' },
  { id: 'halo',         label: 'Halo' },
  { id: 'three-stone',  label: 'Three Stone' },
  { id: 'pave',         label: 'Pavé' },
  { id: 'vintage',      label: 'Vintage' },
];

// ── Metal filter tabs ─────────────────────────────────────────────────────────
const METALS: { id: RingMetal; label: string }[] = [
  { id: 'platinum',        label: 'Platinum' },
  { id: 'white_gold_18k',  label: '18k White Gold' },
  { id: 'yellow_gold_18k', label: '18k Yellow Gold' },
  { id: 'rose_gold_18k',   label: '18k Rose Gold' },
];

interface Props {
  settings: RingSettingRecord[];
}

export function EngagementRingPage({ settings }: Props) {
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const [activeShape,   setActiveShape]   = useState<DiamondShape | null>(null);
  const [activeMetal,   setActiveMetal]   = useState<RingMetal | null>(null);

  function toggleSetting(id: string) {
    setActiveSetting(prev => prev === id ? null : id);
  }
  function toggleMetal(id: RingMetal) {
    setActiveMetal(prev => prev === id ? null : id);
  }

  return (
    <div style={{ backgroundColor: '#fff' }}>

      {/* ── HERO BANNER ─────────────────────────────────────────────────────── */}
      <div
        className="grid lg:grid-cols-2 items-stretch"
        style={{ backgroundColor: GREY, minHeight: 480 }}
      >
        {/* left — headline */}
        <div className="flex flex-col justify-center px-10 py-16 lg:px-16 lg:py-20">
          <p
            className="font-sans uppercase mb-5"
            style={{ fontSize: 10, letterSpacing: '0.35em', color: `${GREEN}66` }}
          >
            Éclat Grandeur
          </p>
          <h1
            className="font-display italic"
            style={{ fontSize: 'clamp(40px, 5vw, 68px)', fontWeight: 300, color: GREEN, lineHeight: 1.05, letterSpacing: '0.01em' }}
          >
            Engagement<br />Rings
          </h1>
          <p
            className="font-sans mt-6 leading-relaxed"
            style={{ fontSize: 14, color: `${GREEN}99`, maxWidth: 380 }}
          >
            Part of an evolving tradition, our engagement rings are individually
            handcrafted in London. Each is made to order and unique to you.
          </p>
          <p className="font-sans mt-3" style={{ fontSize: 13, color: `${GREEN}66` }}>
            {settings.length > 0 ? settings.length : 24} styles available
          </p>
        </div>

        {/* right — editorial image */}
        <div className="relative hidden lg:block" style={{ minHeight: 480 }}>
          <Image
            src="/images/engagement/hero-collection.png"
            alt="Engagement ring collection"
            fill
            priority
            className="object-cover object-center"
            sizes="50vw"
          />
        </div>
      </div>

      {/* ── FILTER BAR ──────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 border-b"
        style={{ backgroundColor: '#fff', borderColor: `${GREEN}14` }}
      >
        {/* Setting tabs */}
        <div className="flex items-center gap-0 overflow-x-auto px-8 lg:px-12" style={{ scrollbarWidth: 'none' }}>
          {/* "All" tab */}
          <FilterTab
            label="All Rings"
            active={activeSetting === null}
            onClick={() => setActiveSetting(null)}
          />
          {SETTINGS.map(s => (
            <FilterTab
              key={s.id}
              label={s.label}
              active={activeSetting === s.id}
              onClick={() => toggleSetting(s.id)}
            />
          ))}

          {/* divider */}
          <div className="mx-4 flex-shrink-0" style={{ width: 1, height: 16, backgroundColor: `${GREEN}20` }} />

          {/* Metal tabs */}
          {METALS.map(m => (
            <FilterTab
              key={m.id}
              label={m.label}
              active={activeMetal === m.id}
              onClick={() => toggleMetal(m.id)}
              small
            />
          ))}
        </div>
      </div>

      {/* ── SHAPE ROW ───────────────────────────────────────────────────────── */}
      <div className="px-8 lg:px-12 py-8 border-b" style={{ borderColor: `${GREEN}10` }}>
        <ShapeSelector selected={activeShape} onChange={setActiveShape} />
      </div>

      {/* ── RING GRID ───────────────────────────────────────────────────────── */}
      <div className="px-8 lg:px-12 py-12">
        <RingGrid
          settings={settings}
          activeSetting={activeSetting}
          activeShape={activeShape}
          activeMetal={activeMetal}
        />
      </div>

      {/* ── BOOK APPOINTMENT CTA ────────────────────────────────────────────── */}
      <div
        className="mx-8 lg:mx-12 mb-16 grid lg:grid-cols-2 items-center"
        style={{ backgroundColor: GREEN }}
      >
        <div className="relative hidden lg:block" style={{ height: 360 }}>
          <Image
            src="/images/engagement/hero-solitaire.png"
            alt="Book a private appointment"
            fill
            className="object-cover object-center"
            sizes="50vw"
          />
        </div>
        <div className="px-10 py-12 lg:px-14 lg:py-16">
          <p
            className="font-sans uppercase mb-4"
            style={{ fontSize: 9, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.5)' }}
          >
            Private Appointments
          </p>
          <h2
            className="font-display italic"
            style={{ fontSize: 'clamp(28px, 3vw, 42px)', fontWeight: 300, color: '#fff', lineHeight: 1.1 }}
          >
            Begin your<br />bespoke journey
          </h2>
          <p
            className="font-sans mt-4 leading-relaxed"
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', maxWidth: 300 }}
          >
            Our specialists are available in our London atelier to guide you through
            every aspect of your ring.
          </p>
          <button
            type="button"
            className="font-sans uppercase mt-8 px-8 py-3 transition-colors hover:bg-white hover:text-[#1a2b1a]"
            style={{
              fontSize: 10,
              letterSpacing: '0.28em',
              border: '1px solid rgba(255,255,255,0.5)',
              color: '#fff',
            }}
          >
            Book an Appointment
          </button>
        </div>
      </div>

    </div>
  );
}

// ── FilterTab ─────────────────────────────────────────────────────────────────
function FilterTab({
  label, active, onClick, small = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 relative font-sans uppercase"
      style={{
        fontSize: small ? 9 : 10,
        letterSpacing: '0.25em',
        color: active ? GREEN : `${GREEN}66`,
        fontWeight: active ? 500 : 400,
        padding: '18px 16px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        transition: 'color 0.2s',
      }}
    >
      {label}
      {/* active underline */}
      {active && (
        <span
          className="absolute inset-x-4 bottom-0"
          style={{ height: 2, backgroundColor: GREEN, display: 'block' }}
        />
      )}
    </button>
  );
}
