'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { ShapeSelector, type DiamondShape } from './ShapeSelector';
import type { RingSettingRecord, RingMetal } from '@/lib/ring-settings/types';

const GREEN = '#1a2b1a';

const SETTINGS = [
  { id: 'solitaire',   label: 'Solitaire' },
  { id: 'halo',        label: 'Halo' },
  { id: 'three-stone', label: 'Three Stone' },
  { id: 'pave',        label: 'Pavé' },
  { id: 'vintage',     label: 'Vintage' },
];

const METALS: { id: RingMetal; label: string }[] = [
  { id: 'platinum',        label: 'Platinum' },
  { id: 'white_gold_18k',  label: '18k White Gold' },
  { id: 'yellow_gold_18k', label: '18k Yellow Gold' },
  { id: 'rose_gold_18k',   label: '18k Rose Gold' },
];

const PLACEHOLDER_RINGS = [
  { id: 'p1', name: 'Aurora Solitaire',        subtitle: 'Engagement Ring in Platinum',         price: 'Starting from £4,800',  image: '/images/engagement/hero-solitaire.png',  setting: 'solitaire',   slug: 'aurora-solitaire',    materials: 3 },
  { id: 'p2', name: 'Lumière Halo',            subtitle: 'Engagement Ring with Diamond Halo',   price: 'Starting from £6,200',  image: '/images/engagement/hero-halo.png',        setting: 'halo',        slug: 'lumiere-halo',        materials: 2 },
  { id: 'p3', name: 'Trilogy Three Stone',     subtitle: 'Engagement Ring in 18k White Gold',   price: 'Starting from £7,500',  image: '/images/engagement/hero-three-stone.png', setting: 'three-stone', slug: 'trilogy-three-stone', materials: 3 },
  { id: 'p4', name: 'Éclat Pavé',             subtitle: 'Engagement Ring with Pavé Band',       price: 'Starting from £3,900',  image: '/images/engagement/hero-pave.png',        setting: 'pave',        slug: 'eclat-pave',          materials: 2 },
  { id: 'p5', name: 'Signature Solitaire',     subtitle: 'Engagement Ring in Platinum',         price: 'Starting from £5,200',  image: '/images/engagement/hero-solitaire.png',  setting: 'solitaire',   slug: 'signature-solitaire', materials: 4 },
  { id: 'p6', name: 'Constellation Halo',      subtitle: 'Engagement Ring in 18k Yellow Gold',  price: 'Starting from £8,100',  image: '/images/engagement/hero-halo.png',        setting: 'halo',        slug: 'constellation-halo',  materials: 3 },
  { id: 'p7', name: 'Classic Round Brilliant', subtitle: 'Engagement Ring in Platinum',         price: 'Starting from £5,500',  image: '/images/engagement/hero-collection.png', setting: 'solitaire',   slug: 'classic-round',       materials: 2 },
  { id: 'p8', name: 'Vintage Pavé Band',       subtitle: 'Engagement Ring with Diamond Accents',price: 'Starting from £2,475',  image: '/images/engagement/hero-pave.png',        setting: 'vintage',     slug: 'vintage-pave',        materials: 3 },
  { id: 'p9', name: 'Oval Side Stone',         subtitle: 'Engagement Ring in 18k Rose Gold',    price: 'Starting from £10,300', image: '/images/engagement/hero-three-stone.png', setting: 'three-stone', slug: 'oval-side-stone',     materials: 2 },
];

interface Props { settings: RingSettingRecord[]; }

export function EngagementRingPage({ settings }: Props) {
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const [activeShape,   setActiveShape]   = useState<DiamondShape | null>(null);
  const [activeMetal,   setActiveMetal]   = useState<RingMetal | null>(null);
  const [filtersOpen,   setFiltersOpen]   = useState(false);

  const rings = PLACEHOLDER_RINGS.filter(r => !activeSetting || r.setting === activeSetting);
  const count = rings.length;

  return (
    <div style={{ backgroundColor: '#fff', color: GREEN }}>

      {/* ── TOP BAR — Sort / Count / Filters (exact Tiffany layout) ─────── */}
      <div
        className="flex items-center justify-between border-b px-6 lg:px-10"
        style={{ height: 56, borderColor: '#e5e5e5' }}
      >
        {/* Sort by */}
        <button
          type="button"
          className="flex items-center gap-1.5 font-sans uppercase border px-4 py-2"
          style={{ fontSize: 11, letterSpacing: '0.18em', borderColor: '#ccc', color: GREEN }}
        >
          Sort By <ChevronDown className="w-3 h-3" strokeWidth={1.5} />
        </button>

        {/* Centred title */}
        <h1
          className="font-display italic absolute left-1/2 -translate-x-1/2"
          style={{ fontSize: 'clamp(16px, 2vw, 22px)', fontWeight: 300, letterSpacing: '0.02em' }}
        >
          Engagement Rings
        </h1>

        {/* Filters */}
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-1.5 font-sans uppercase border px-4 py-2"
          style={{ fontSize: 11, letterSpacing: '0.18em', borderColor: '#ccc', color: GREEN }}
        >
          Filters <SlidersHorizontal className="w-3 h-3" strokeWidth={1.5} />
        </button>
      </div>

      {/* Product count line */}
      <div className="px-6 lg:px-10 py-3 border-b" style={{ borderColor: '#e5e5e5' }}>
        <p className="font-sans text-center" style={{ fontSize: 12, color: '#888' }}>
          {count} Products
        </p>
      </div>

      {/* ── SHAPE FILTER — single scrollable row ────────────────────────── */}
      <div className="px-6 lg:px-10 py-6 border-b overflow-x-auto" style={{ borderColor: '#e5e5e5', scrollbarWidth: 'none' }}>
        <ShapeSelector selected={activeShape} onChange={(s) => setActiveShape(prev => prev === s ? null : s)} />
      </div>

      {/* ── RING GRID — pure white bg, 3 columns, centred text ──────────── */}
      <div className="px-6 lg:px-10 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
          {rings.map(ring => (
            <Link key={ring.id} href={`/engagement-rings/${ring.slug}`} className="group block text-center">

              {/* Ring image — pure white background, large, no border */}
              <div className="relative w-full" style={{ aspectRatio: '1/1', backgroundColor: '#fff' }}>
                <Image
                  src={ring.image}
                  alt={ring.name}
                  fill
                  className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Materials badge — exact Tiffany pill */}
                {ring.materials > 1 && (
                  <div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 font-sans"
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      backgroundColor: 'rgba(255,255,255,0.92)',
                      border: '1px solid #ddd',
                      padding: '4px 10px',
                      whiteSpace: 'nowrap',
                      color: GREEN,
                    }}
                  >
                    {ring.materials} Materials
                  </div>
                )}
              </div>

              {/* Text block — centred, 3 lines like Tiffany */}
              <div className="mt-5">
                <h2
                  className="font-sans"
                  style={{ fontSize: 14, fontWeight: 400, color: GREEN, letterSpacing: '0.01em', lineHeight: 1.4 }}
                >
                  {ring.name}
                </h2>
                <p
                  className="font-sans mt-1"
                  style={{ fontSize: 12, color: '#777', fontWeight: 300, lineHeight: 1.5 }}
                >
                  {ring.subtitle}
                </p>
                <p
                  className="font-sans mt-1"
                  style={{ fontSize: 12, color: '#777', fontWeight: 300 }}
                >
                  {ring.price}
                </p>
              </div>

            </Link>
          ))}
        </div>
      </div>

      {/* ── FILTERS DRAWER — slides in from right ───────────────────────── */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* backdrop */}
          <div className="flex-1 bg-black/30" onClick={() => setFiltersOpen(false)} />

          {/* panel */}
          <div
            className="w-80 bg-white h-full overflow-y-auto flex flex-col"
            style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.08)' }}
          >
            {/* header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: '#e5e5e5' }}>
              <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.25em', color: GREEN }}>Filters</span>
              <button type="button" onClick={() => setFiltersOpen(false)}>
                <X className="w-4 h-4" strokeWidth={1.5} style={{ color: GREEN }} />
              </button>
            </div>

            <div className="px-6 py-8 flex flex-col gap-10">
              {/* Setting style */}
              <div>
                <p className="font-sans uppercase mb-5" style={{ fontSize: 10, letterSpacing: '0.3em', color: '#888' }}>Setting Style</p>
                <div className="flex flex-col gap-3">
                  {SETTINGS.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSetting(prev => prev === s.id ? null : s.id)}
                      className="flex items-center justify-between font-sans text-left py-2 border-b"
                      style={{ fontSize: 13, color: activeSetting === s.id ? GREEN : '#555', borderColor: '#eee', fontWeight: activeSetting === s.id ? 500 : 400 }}
                    >
                      {s.label}
                      {activeSetting === s.id && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: GREEN, display: 'inline-block' }} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metal */}
              <div>
                <p className="font-sans uppercase mb-5" style={{ fontSize: 10, letterSpacing: '0.3em', color: '#888' }}>Metal</p>
                <div className="flex flex-col gap-3">
                  {METALS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveMetal(prev => prev === m.id ? null : m.id)}
                      className="flex items-center justify-between font-sans text-left py-2 border-b"
                      style={{ fontSize: 13, color: activeMetal === m.id ? GREEN : '#555', borderColor: '#eee', fontWeight: activeMetal === m.id ? 500 : 400 }}
                    >
                      {m.label}
                      {activeMetal === m.id && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: GREEN, display: 'inline-block' }} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear */}
              {(activeSetting || activeMetal || activeShape) && (
                <button
                  type="button"
                  onClick={() => { setActiveSetting(null); setActiveMetal(null); setActiveShape(null); }}
                  className="font-sans uppercase underline text-left"
                  style={{ fontSize: 11, letterSpacing: '0.2em', color: '#888' }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
