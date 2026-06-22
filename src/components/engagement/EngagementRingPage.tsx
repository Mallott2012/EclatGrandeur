'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { ShapeSelector, type DiamondShape } from './ShapeSelector';
import type { RingSettingRecord, RingMetal } from '@/lib/ring-settings/types';

const GREEN = '#1a2b1a';
const BORDER = '#e8e8e8';

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

const SORT_OPTIONS = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest'];

// Tiffany-style ring images scraped from their site as placeholders
const TIFFANY_IMAGES = [
  'https://media.tiffany.com/is/image/Tiffany/EcomItemM/the-tiffany-setting-engagement-ring-11254893_949996_ED.jpg',
  'https://media.tiffany.com/is/image/Tiffany/EcomItemM/the-tiffany-setting-engagement-ring-11254893_1013096_ED.jpg',
  'https://media.tiffany.com/is/image/Tiffany/EcomItemM/pave-tiffany-setting-engagement-ring-GRP07454_949996_ED.jpg',
  'https://media.tiffany.com/is/image/Tiffany/EcomItemM/tiffany-harmony-round-brilliant-engagement-ring-60696180_979395_ED.jpg',
  'https://media.tiffany.com/is/image/Tiffany/EcomItemM/tiffany-true-engagement-ring-with-a-round-brilliant-diamond-and-a-tiffany-true-band-62128830_979395_ED.jpg',
  'https://media.tiffany.com/is/image/Tiffany/EcomItemM/tiffany-soleste-halo-engagement-ring-GRP07459_979395_ED.jpg',
];

const PLACEHOLDER_RINGS = [
  { id: 'p1', name: 'The Éclat Solitaire',    subtitle: 'Engagement Ring in Platinum',           price: 'Starting from £4,800',  image: TIFFANY_IMAGES[0], setting: 'solitaire',   slug: 'eclat-solitaire',     materials: 3 },
  { id: 'p2', name: 'The Éclat Solitaire',    subtitle: 'Engagement Ring in 18k Yellow Gold',    price: 'Starting from £4,800',  image: TIFFANY_IMAGES[1], setting: 'solitaire',   slug: 'eclat-solitaire-gold',materials: 3 },
  { id: 'p3', name: 'Pavé Éclat Setting',     subtitle: 'Engagement Ring with Pavé Band',        price: 'Starting from £28,600', image: TIFFANY_IMAGES[2], setting: 'pave',        slug: 'pave-eclat',          materials: 2 },
  { id: 'p4', name: 'Harmonie Solitaire',     subtitle: 'Engagement Ring in Platinum',           price: 'Starting from £6,100',  image: TIFFANY_IMAGES[3], setting: 'solitaire',   slug: 'harmonie-solitaire',  materials: 4 },
  { id: 'p5', name: 'Éternité Solitaire',     subtitle: 'Engagement Ring with Diamond Band',     price: 'Starting from £5,200',  image: TIFFANY_IMAGES[4], setting: 'solitaire',   slug: 'eternite-solitaire',  materials: 3 },
  { id: 'p6', name: 'Lumière Halo',           subtitle: 'Engagement Ring with Diamond Halo',     price: 'Starting from £6,200',  image: TIFFANY_IMAGES[5], setting: 'halo',        slug: 'lumiere-halo',        materials: 3 },
];

interface Props { settings: RingSettingRecord[]; }

export function EngagementRingPage({ settings }: Props) {
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const [activeShape,   setActiveShape]   = useState<DiamondShape | null>(null);
  const [activeMetal,   setActiveMetal]   = useState<RingMetal | null>(null);
  const [filtersOpen,   setFiltersOpen]   = useState(false);
  const [sortOpen,      setSortOpen]      = useState(false);
  const [activeSort,    setActiveSort]    = useState('Featured');

  const rings = PLACEHOLDER_RINGS.filter(r => !activeSetting || r.setting === activeSetting);
  const count = rings.length;

  const clearAll = useCallback(() => {
    setActiveSetting(null);
    setActiveShape(null);
    setActiveMetal(null);
  }, []);

  const activeFilterCount = [activeSetting, activeShape, activeMetal].filter(Boolean).length;

  return (
    <div style={{ backgroundColor: '#fff', color: GREEN }}>

      {/* ── TOOLBAR: SORT BY / COUNT / FILTERS — exact Tiffany ─────────── */}
      <div
        className="flex items-center px-8 lg:px-14 bg-white"
        style={{ height: 52, borderBottom: `1px solid ${BORDER}` }}
      >
        {/* Sort By */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setSortOpen(v => !v)}
            className="flex items-center gap-1.5 font-sans border px-4 py-1.5"
            style={{ fontSize: 11, letterSpacing: '0.12em', color: GREEN, borderColor: BORDER, textTransform: 'uppercase' }}
          >
            Sort By
            <ChevronDown className="w-3 h-3" strokeWidth={1.5} />
          </button>
          {sortOpen && (
            <div
              className="absolute top-full left-0 mt-0.5 bg-white z-30"
              style={{ minWidth: 200, border: `1px solid ${BORDER}`, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
            >
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setActiveSort(opt); setSortOpen(false); }}
                  className="block w-full text-left px-5 py-3 font-sans"
                  style={{
                    fontSize: 12, color: activeSort === opt ? GREEN : '#666',
                    fontWeight: activeSort === opt ? 500 : 300,
                    letterSpacing: '0.03em',
                    backgroundColor: activeSort === opt ? '#f8f8f8' : 'transparent',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Centre: page title */}
        <div className="flex-1 text-center">
          <h1
            className="font-display"
            style={{ fontSize: 'clamp(18px, 2.5vw, 26px)', fontWeight: 300, letterSpacing: '0.04em', color: GREEN, lineHeight: 1 }}
          >
            Engagement Rings
          </h1>
          <p className="font-sans mt-0.5" style={{ fontSize: 10, color: '#bbb', letterSpacing: '0.1em' }}>
            {count} {count === 1 ? 'product' : 'products'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex-1 flex justify-end">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 font-sans border px-4 py-1.5"
            style={{ fontSize: 11, letterSpacing: '0.12em', color: GREEN, borderColor: BORDER, textTransform: 'uppercase' }}
          >
            Filters
            <SlidersHorizontal className="w-3 h-3" strokeWidth={1.5} />
            {activeFilterCount > 0 && (
              <span
                className="flex items-center justify-center rounded-full font-sans"
                style={{ width: 16, height: 16, backgroundColor: GREEN, color: '#fff', fontSize: 9 }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── SHAPE ROW — single scrollable row exactly like Tiffany ─────── */}
      <div
        className="overflow-x-auto px-8 lg:px-14"
        style={{ borderBottom: `1px solid ${BORDER}`, scrollbarWidth: 'none' }}
      >
        <ShapeSelector
          selected={activeShape}
          onChange={(s) => setActiveShape(prev => prev === s ? null : s)}
        />
      </div>

      {/* ── ACTIVE CHIPS ─────────────────────────────────────────────────── */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-3 px-8 lg:px-14 py-3 flex-wrap" style={{ borderBottom: `1px solid ${BORDER}` }}>
          {activeSetting && (
            <button
              type="button"
              onClick={() => setActiveSetting(null)}
              className="flex items-center gap-1.5 font-sans px-3 py-1 border"
              style={{ fontSize: 11, color: GREEN, borderColor: GREEN, letterSpacing: '0.06em' }}
            >
              {SETTINGS.find(s => s.id === activeSetting)?.label}
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          )}
          {activeShape && (
            <button
              type="button"
              onClick={() => setActiveShape(null)}
              className="flex items-center gap-1.5 font-sans px-3 py-1 border capitalize"
              style={{ fontSize: 11, color: GREEN, borderColor: GREEN, letterSpacing: '0.06em' }}
            >
              {activeShape} <X className="w-3 h-3" strokeWidth={2} />
            </button>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="font-sans underline"
            style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.06em' }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── RING GRID — exact Tiffany: 3 cols, ring floats on white ─────── */}
      <div className="px-8 lg:px-14 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
          {rings.map(ring => (
            <Link key={ring.id} href={`/engagement-rings/${ring.slug}`} className="group block text-center">

              {/* Ring image — pure white, NO background container, ring floats */}
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: '4/3', backgroundColor: '#fff' }}
              >
                <Image
                  src={ring.image}
                  alt={ring.name}
                  fill
                  className="object-contain transition-transform duration-700 group-hover:scale-[1.04]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized
                />
                {/* Materials badge — thin border, white bg, bottom centre, exact Tiffany */}
                {ring.materials > 1 && (
                  <div
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 font-sans whitespace-nowrap"
                    style={{
                      fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
                      backgroundColor: '#fff', border: `1px solid ${BORDER}`,
                      padding: '4px 14px', color: '#888',
                    }}
                  >
                    {ring.materials} Materials
                  </div>
                )}
              </div>

              {/* 3 lines — name / subtitle / price — centred, thin weight */}
              <div className="mt-5">
                <p className="font-sans" style={{ fontSize: 13, fontWeight: 400, color: GREEN, letterSpacing: '0.01em', lineHeight: 1.5 }}>
                  {ring.name}
                </p>
                <p className="font-sans mt-0.5" style={{ fontSize: 12, color: '#888', fontWeight: 300, lineHeight: 1.5 }}>
                  {ring.subtitle}
                </p>
                <p className="font-sans mt-0.5" style={{ fontSize: 12, color: '#888', fontWeight: 300 }}>
                  {ring.price}
                </p>
              </div>

            </Link>
          ))}
        </div>
      </div>

      {/* ── FILTERS DRAWER ────────────────────────────────────────────────── */}
      {filtersOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/15" onClick={() => setFiltersOpen(false)} />
          <div
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white overflow-y-auto"
            style={{ width: 300, boxShadow: '-4px 0 32px rgba(0,0,0,0.08)' }}
          >
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.35em', color: GREEN }}>Filters</span>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close">
                <X className="w-4 h-4" strokeWidth={1.5} style={{ color: '#999' }} />
              </button>
            </div>

            <div className="px-6 py-8 flex flex-col gap-10 flex-1">
              {/* Setting */}
              <div>
                <p className="font-sans uppercase mb-5" style={{ fontSize: 9, letterSpacing: '0.35em', color: '#bbb' }}>
                  Setting Style
                </p>
                {SETTINGS.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSetting(prev => prev === s.id ? null : s.id)}
                    className="flex items-center justify-between w-full py-3 font-sans text-left"
                    style={{
                      fontSize: 13, color: activeSetting === s.id ? GREEN : '#555',
                      fontWeight: activeSetting === s.id ? 400 : 300,
                      borderBottom: `1px solid ${BORDER}`, letterSpacing: '0.02em',
                    }}
                  >
                    {s.label}
                    {activeSetting === s.id && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: GREEN, display: 'inline-block' }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Metal */}
              <div>
                <p className="font-sans uppercase mb-5" style={{ fontSize: 9, letterSpacing: '0.35em', color: '#bbb' }}>
                  Metal
                </p>
                {METALS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveMetal(prev => prev === m.id ? null : m.id)}
                    className="flex items-center justify-between w-full py-3 font-sans text-left"
                    style={{
                      fontSize: 13, color: activeMetal === m.id ? GREEN : '#555',
                      fontWeight: activeMetal === m.id ? 400 : 300,
                      borderBottom: `1px solid ${BORDER}`, letterSpacing: '0.02em',
                    }}
                  >
                    {m.label}
                    {activeMetal === m.id && (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: GREEN, display: 'inline-block' }} />
                    )}
                  </button>
                ))}
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => { clearAll(); setFiltersOpen(false); }}
                  className="font-sans underline self-start"
                  style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em' }}
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="px-6 py-5" style={{ borderTop: `1px solid ${BORDER}` }}>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="w-full font-sans uppercase py-3"
                style={{ fontSize: 10, letterSpacing: '0.3em', backgroundColor: GREEN, color: '#fff' }}
              >
                View {count} {count === 1 ? 'Ring' : 'Rings'}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
