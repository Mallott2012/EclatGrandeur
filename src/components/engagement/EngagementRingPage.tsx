'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, SlidersHorizontal, X, ChevronRight } from 'lucide-react';
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

const SORT_OPTIONS = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest'];

const PLACEHOLDER_RINGS = [
  { id: 'p1', name: 'The Éclat Solitaire',      subtitle: 'Engagement Ring in Platinum',          price: 'Starting from £4,800',  image: '/images/engagement/hero-solitaire.png',   setting: 'solitaire',   slug: 'eclat-solitaire',     materials: 3 },
  { id: 'p2', name: 'Lumière Halo',              subtitle: 'Engagement Ring with Diamond Halo',    price: 'Starting from £6,200',  image: '/images/engagement/hero-halo.png',         setting: 'halo',        slug: 'lumiere-halo',        materials: 2 },
  { id: 'p3', name: 'Trilogy Three Stone',       subtitle: 'Engagement Ring in 18k White Gold',    price: 'Starting from £7,500',  image: '/images/engagement/hero-three-stone.png',  setting: 'three-stone', slug: 'trilogy-three-stone', materials: 3 },
  { id: 'p4', name: 'Éclat Pavé',               subtitle: 'Engagement Ring with Pavé Band',       price: 'Starting from £3,900',  image: '/images/engagement/hero-pave.png',         setting: 'pave',        slug: 'eclat-pave',          materials: 2 },
  { id: 'p5', name: 'Signature Solitaire',       subtitle: 'Engagement Ring in Platinum',          price: 'Starting from £5,200',  image: '/images/engagement/hero-solitaire.png',   setting: 'solitaire',   slug: 'signature-solitaire', materials: 4 },
  { id: 'p6', name: 'Constellation Halo',        subtitle: 'Engagement Ring in 18k Yellow Gold',   price: 'Starting from £8,100',  image: '/images/engagement/hero-halo.png',         setting: 'halo',        slug: 'constellation-halo',  materials: 3 },
  { id: 'p7', name: 'Classic Round Brilliant',   subtitle: 'Engagement Ring in Platinum',          price: 'Starting from £5,500',  image: '/images/engagement/hero-collection.png',  setting: 'solitaire',   slug: 'classic-round',       materials: 2 },
  { id: 'p8', name: 'Vintage Pavé Band',         subtitle: 'Engagement Ring with Diamond Accents', price: 'Starting from £2,475',  image: '/images/engagement/hero-pave.png',         setting: 'vintage',     slug: 'vintage-pave',        materials: 3 },
  { id: 'p9', name: 'Oval Side Stone',           subtitle: 'Engagement Ring in 18k Rose Gold',     price: 'Starting from £10,300', image: '/images/engagement/hero-three-stone.png',  setting: 'three-stone', slug: 'oval-side-stone',     materials: 2 },
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
    <div style={{ backgroundColor: '#fff', color: GREEN, minHeight: '100vh' }}>

      {/* ── PAGE HEADER ──────────────────────────────────────────────────── */}
      <div className="px-6 lg:px-16 pt-10 pb-6">
        <nav className="flex items-center gap-2 mb-6" aria-label="Breadcrumb">
          <Link href="/" className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Home</Link>
          <ChevronRight className="w-2.5 h-2.5" style={{ color: '#ddd' }} strokeWidth={1.5} />
          <span className="font-sans" style={{ fontSize: 11, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Engagement Rings</span>
        </nav>
        <h1
          className="font-display"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 300, letterSpacing: '0.06em', lineHeight: 1.05, color: '#111' }}
        >
          Engagement Rings
        </h1>
        <p className="font-sans mt-4 max-w-md" style={{ fontSize: 13, color: '#aaa', lineHeight: 1.8, fontWeight: 300, letterSpacing: '0.02em' }}>
          Each ring is individually handcrafted in our London atelier.
          Choose your setting, select your diamond, and create something made to last forever.
        </p>
      </div>

      {/* ── TOOLBAR — Sort / Count / Filters ─────────────────────────────── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-16 bg-white"
        style={{ height: 48, borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}
      >
        {/* Sort */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortOpen(v => !v)}
            className="flex items-center gap-1.5 font-sans"
            style={{ fontSize: 11, letterSpacing: '0.16em', color: GREEN, textTransform: 'uppercase' }}
          >
            Sort By: <span style={{ fontWeight: 500 }}>{activeSort}</span>
            <ChevronDown className="w-3 h-3" strokeWidth={1.5} />
          </button>
          {sortOpen && (
            <div
              className="absolute top-full left-0 mt-1 bg-white border py-1 z-30"
              style={{ minWidth: 200, borderColor: '#e5e5e5', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
            >
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setActiveSort(opt); setSortOpen(false); }}
                  className="block w-full text-left px-4 py-2.5 font-sans"
                  style={{
                    fontSize: 12,
                    color: activeSort === opt ? GREEN : '#555',
                    fontWeight: activeSort === opt ? 500 : 400,
                    backgroundColor: activeSort === opt ? '#f8f8f6' : 'transparent',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Count */}
        <p className="font-sans" style={{ fontSize: 11, color: '#999', letterSpacing: '0.1em' }}>
          {count} {count === 1 ? 'Product' : 'Products'}
        </p>

        {/* Filters */}
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-2 font-sans"
          style={{ fontSize: 11, letterSpacing: '0.16em', color: GREEN, textTransform: 'uppercase' }}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
          Filters
          {activeFilterCount > 0 && (
            <span
              className="flex items-center justify-center font-sans"
              style={{
                width: 16, height: 16, borderRadius: '50%',
                backgroundColor: GREEN, color: '#fff', fontSize: 9,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── SHAPE ROW ─────────────────────────────────────────────────────── */}
      <div
        className="px-6 lg:px-16 overflow-x-auto"
        style={{ borderBottom: '1px solid #f0f0f0', scrollbarWidth: 'none' }}
      >
        <ShapeSelector
          selected={activeShape}
          onChange={(s) => setActiveShape(prev => prev === s ? null : s)}
        />
      </div>

      {/* ── ACTIVE FILTER CHIPS ───────────────────────────────────────────── */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-3 px-6 lg:px-10 py-3 flex-wrap" style={{ borderBottom: '1px solid #eee' }}>
          {activeSetting && (
            <button
              type="button"
              onClick={() => setActiveSetting(null)}
              className="flex items-center gap-1.5 font-sans px-3 py-1 border"
              style={{ fontSize: 11, color: GREEN, borderColor: GREEN, letterSpacing: '0.08em' }}
            >
              {SETTINGS.find(s => s.id === activeSetting)?.label}
              <X className="w-3 h-3" strokeWidth={1.5} />
            </button>
          )}
          {activeShape && (
            <button
              type="button"
              onClick={() => setActiveShape(null)}
              className="flex items-center gap-1.5 font-sans px-3 py-1 border"
              style={{ fontSize: 11, color: GREEN, borderColor: GREEN, letterSpacing: '0.08em', textTransform: 'capitalize' }}
            >
              {activeShape}
              <X className="w-3 h-3" strokeWidth={1.5} />
            </button>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="font-sans underline"
            style={{ fontSize: 11, color: '#999', letterSpacing: '0.08em' }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── RING GRID ─────────────────────────────────────────────────────── */}
      <div className="px-6 lg:px-16 py-12">
        {rings.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-sans" style={{ fontSize: 14, color: '#aaa' }}>No rings match your selection.</p>
            <button type="button" onClick={clearAll} className="font-sans underline mt-4" style={{ fontSize: 12, color: GREEN }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
            {rings.map(ring => (
              <Link key={ring.id} href={`/engagement-rings/${ring.slug}`} className="group block text-center">

                {/* Image — pure white bg, object-contain, subtle hover zoom */}
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1/1', backgroundColor: '#ffffff' }}>
                  <Image
                    src={ring.image}
                    alt={ring.name}
                    fill
                    className="object-contain transition-transform duration-700 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {/* Materials badge — Tiffany style: bottom centre, white pill */}
                  {ring.materials > 1 && (
                    <div
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 font-sans"
                      style={{
                        fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
                        backgroundColor: '#fff', border: '1px solid #e8e8e8',
                        padding: '4px 12px', whiteSpace: 'nowrap', color: '#888',
                      }}
                    >
                      {ring.materials} Materials
                    </div>
                  )}
                </div>

                {/* 3-line text — centred, thin, airy */}
                <div className="mt-4">
                  <p className="font-sans" style={{ fontSize: 13, fontWeight: 300, color: '#111', lineHeight: 1.5, letterSpacing: '0.01em' }}>
                    {ring.name}
                  </p>
                  <p className="font-sans mt-0.5" style={{ fontSize: 12, color: '#999', fontWeight: 300, lineHeight: 1.5 }}>
                    {ring.subtitle}
                  </p>
                  <p className="font-sans mt-0.5" style={{ fontSize: 12, color: '#999', fontWeight: 300 }}>
                    {ring.price}
                  </p>
                </div>

              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── FILTERS DRAWER ────────────────────────────────────────────────── */}
      {filtersOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setFiltersOpen(false)} />
          <div
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white overflow-y-auto"
            style={{ width: 320, boxShadow: '-2px 0 20px rgba(0,0,0,0.1)' }}
          >
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: '1px solid #eee' }}
            >
              <span className="font-sans uppercase" style={{ fontSize: 11, letterSpacing: '0.3em', color: GREEN }}>Filters</span>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <X className="w-4 h-4" strokeWidth={1.5} style={{ color: GREEN }} />
              </button>
            </div>

            <div className="px-6 py-8 flex flex-col gap-10 flex-1">

              {/* Setting style */}
              <div>
                <p className="font-sans uppercase mb-5" style={{ fontSize: 10, letterSpacing: '0.3em', color: '#aaa' }}>
                  Setting Style
                </p>
                <div className="flex flex-col">
                  {SETTINGS.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSetting(prev => prev === s.id ? null : s.id)}
                      className="flex items-center justify-between py-3 font-sans text-left"
                      style={{
                        fontSize: 13,
                        color: activeSetting === s.id ? GREEN : '#444',
                        fontWeight: activeSetting === s.id ? 500 : 300,
                        borderBottom: '1px solid #f0f0f0',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {s.label}
                      {activeSetting === s.id && (
                        <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: GREEN, display: 'inline-block' }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metal */}
              <div>
                <p className="font-sans uppercase mb-5" style={{ fontSize: 10, letterSpacing: '0.3em', color: '#aaa' }}>
                  Metal
                </p>
                <div className="flex flex-col">
                  {METALS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setActiveMetal(prev => prev === m.id ? null : m.id)}
                      className="flex items-center justify-between py-3 font-sans text-left"
                      style={{
                        fontSize: 13,
                        color: activeMetal === m.id ? GREEN : '#444',
                        fontWeight: activeMetal === m.id ? 500 : 300,
                        borderBottom: '1px solid #f0f0f0',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {m.label}
                      {activeMetal === m.id && (
                        <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: GREEN, display: 'inline-block' }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => { clearAll(); setFiltersOpen(false); }}
                  className="font-sans uppercase text-left"
                  style={{ fontSize: 10, letterSpacing: '0.25em', color: '#aaa', textDecoration: 'underline' }}
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Apply button */}
            <div className="px-6 py-5" style={{ borderTop: '1px solid #eee' }}>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="w-full font-sans uppercase py-3"
                style={{
                  fontSize: 11, letterSpacing: '0.25em',
                  backgroundColor: GREEN, color: '#fff',
                }}
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
