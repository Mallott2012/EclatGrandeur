'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import type { RingSettingRecord, RingMetal } from '@/lib/ring-settings/types';

const G      = '#1a2b1a';
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

const RINGS = [
  { id: 'r1', slug: 'eclat-solitaire',    name: 'The Éclat Solitaire',  subtitle: 'Engagement Ring in Platinum',         price: 'Starting from £4,800',  metals: 3, setting: 'solitaire',   image: '/images/rings/ring-1.png' },
  { id: 'r2', slug: 'lumiere-halo',       name: 'Lumière Halo',         subtitle: 'Engagement Ring in Platinum',         price: 'Starting from £6,200',  metals: 3, setting: 'halo',        image: '/images/rings/ring-2.png' },
  { id: 'r3', slug: 'trilogy',            name: 'The Trilogy',          subtitle: 'Three Stone Engagement Ring',         price: 'Starting from £7,500',  metals: 2, setting: 'three-stone', image: '/images/rings/ring-3.png' },
  { id: 'r4', slug: 'oval-solitaire',     name: 'Oval Solitaire',       subtitle: 'Engagement Ring in Platinum',         price: 'Starting from £3,850',  metals: 3, setting: 'solitaire',   image: '/images/rings/ring-4.png' },
  { id: 'r5', slug: 'constellation',      name: 'Constellation Pavé',   subtitle: 'Pavé Band Engagement Ring',           price: 'Starting from £4,100',  metals: 3, setting: 'pave',        image: '/images/rings/ring-5.png' },
  { id: 'r6', slug: 'cushion-soleste',    name: 'Cushion Soleste',      subtitle: 'Halo Engagement Ring',                price: 'Starting from £5,650',  metals: 2, setting: 'halo',        image: '/images/rings/ring-6.png' },
  { id: 'r7', slug: 'emerald-solitaire',  name: 'Emerald Solitaire',    subtitle: 'Engagement Ring in Platinum',         price: 'Starting from £4,450',  metals: 2, setting: 'solitaire',   image: '/images/rings/ring-7.png' },
  { id: 'r8', slug: 'vintage-halo',       name: 'Vintage Halo',         subtitle: 'Vintage-Style Engagement Ring',       price: 'Starting from £6,200',  metals: 2, setting: 'halo',        image: '/images/rings/ring-8.png' },
  { id: 'r9', slug: 'princess-solitaire', name: 'Princess Solitaire',   subtitle: 'Engagement Ring in Platinum',         price: 'Starting from £3,700',  metals: 3, setting: 'solitaire',   image: '/images/rings/ring-9.png' },
];

interface Props { settings: RingSettingRecord[]; }

export function EngagementRingPage({ settings: _settings }: Props) {
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const [activeMetal,   setActiveMetal]   = useState<RingMetal | null>(null);
  const [filtersOpen,   setFiltersOpen]   = useState(false);
  const [sortOpen,      setSortOpen]      = useState(false);
  const [activeSort,    setActiveSort]    = useState('Featured');

  const rings = RINGS.filter(r => !activeSetting || r.setting === activeSetting);
  const count = rings.length;

  const clearAll = useCallback(() => {
    setActiveSetting(null);
    setActiveMetal(null);
  }, []);

  const activeFilterCount = [activeSetting, activeMetal].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* ── EDITORIAL HERO ───────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ paddingTop: 81, height: 'min(600px, 65vh)' }}>
        <Image
          src="/images/heroes/hero-engagement-rings.png"
          alt="Engagement Rings"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Soft gradient overlay so serif text reads cleanly */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.35) 100%)' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-14 px-6 text-center">
          <h1
            className="font-display text-white text-balance"
            style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 300, letterSpacing: '0.08em', lineHeight: 1.1 }}
          >
            Engagement Rings
          </h1>
          <p
            className="font-sans text-white mt-4"
            style={{ fontSize: 13, letterSpacing: '0.18em', fontWeight: 300, opacity: 0.85, textTransform: 'uppercase' }}
          >
            Crafted to last a lifetime
          </p>
        </div>
      </div>

      {/* ── SORT / COUNT / FILTER BAR — sticky ───────────────────────────── */}
      <div
        className="sticky top-0 z-30 bg-white flex items-center px-6 lg:px-14"
        style={{ height: 52, borderBottom: `1px solid ${BORDER}` }}
      >
        {/* Sort — left */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setSortOpen(v => !v)}
            className="flex items-center gap-1 font-sans"
            style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: G }}
          >
            Sort By
            <ChevronDown className="w-3 h-3 ml-0.5" strokeWidth={1.5} />
          </button>
          {sortOpen && (
            <div
              className="absolute top-full left-0 mt-1 bg-white z-30"
              style={{ minWidth: 200, border: `1px solid ${BORDER}`, boxShadow: '0 8px 32px rgba(0,0,0,0.07)' }}
            >
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setActiveSort(opt); setSortOpen(false); }}
                  className="block w-full text-left px-5 py-3 font-sans"
                  style={{
                    fontSize: 12, letterSpacing: '0.03em',
                    color: activeSort === opt ? G : '#666',
                    fontWeight: activeSort === opt ? 500 : 300,
                    backgroundColor: activeSort === opt ? '#f9f9f9' : 'transparent',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Count — centre */}
        <div className="flex-1 text-center">
          <span className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.08em' }}>
            {count} {count === 1 ? 'product' : 'products'}
          </span>
        </div>

        {/* Filters — right */}
        <div className="flex-1 flex justify-end">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 font-sans"
            style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: G }}
          >
            Filters
            <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
            {activeFilterCount > 0 && (
              <span
                className="flex items-center justify-center rounded-full"
                style={{ width: 17, height: 17, backgroundColor: G, color: '#fff', fontSize: 9, lineHeight: 1 }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── ACTIVE CHIPS ─────────────────────────────────────────────────── */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-3 flex-wrap px-6 lg:px-14 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          {activeSetting && (
            <button
              type="button"
              onClick={() => setActiveSetting(null)}
              className="flex items-center gap-1.5 font-sans px-3 py-1"
              style={{ fontSize: 11, color: G, border: `1px solid ${G}`, letterSpacing: '0.05em' }}
            >
              {SETTINGS.find(s => s.id === activeSetting)?.label}
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          )}
          {activeMetal && (
            <button
              type="button"
              onClick={() => setActiveMetal(null)}
              className="flex items-center gap-1.5 font-sans px-3 py-1"
              style={{ fontSize: 11, color: G, border: `1px solid ${G}`, letterSpacing: '0.05em' }}
            >
              {METALS.find(m => m.id === activeMetal)?.label}
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="font-sans underline"
            style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.05em' }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── RING GRID ────────────────────────────────────────────────────── */}
      <div className="px-6 lg:px-14 py-16">
        {rings.length === 0 ? (
          <div className="py-32 text-center">
            <p className="font-sans" style={{ fontSize: 14, color: '#ccc', letterSpacing: '0.06em' }}>
              No rings match your selection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20">
            {rings.map(ring => (
              <Link key={ring.id} href={`/engagement-rings/${ring.slug}`} className="group block">

                {/* 4:5 portrait card — jewel floats on white with inner padding */}
                <div
                  className="relative w-full overflow-hidden"
                  style={{ aspectRatio: '4/5', backgroundColor: '#fafafa' }}
                >
                  <div className="absolute inset-[8%]">
                    <Image
                      src={ring.image}
                      alt={ring.name}
                      fill
                      className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                </div>

                {/* Text block — name in serif, subtitle + price in light sans */}
                <div className="mt-5 px-1">
                  <p
                    className="font-display text-balance"
                    style={{ fontSize: 16, fontWeight: 300, color: G, letterSpacing: '0.02em', lineHeight: 1.3 }}
                  >
                    {ring.name}
                  </p>
                  <p
                    className="font-sans mt-1.5"
                    style={{ fontSize: 11, fontWeight: 300, color: '#aaa', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                  >
                    {ring.subtitle}
                  </p>
                  <p
                    className="font-sans mt-1"
                    style={{ fontSize: 13, fontWeight: 300, color: '#666', letterSpacing: '0.02em' }}
                  >
                    {ring.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── FILTERS DRAWER ───────────────────────────────────────────────── */}
      <>
        {filtersOpen && (
          <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setFiltersOpen(false)} />
        )}
        <div
          className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white"
          style={{
            width: 300,
            transform: filtersOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.28s ease',
            boxShadow: '-2px 0 40px rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex items-center justify-between px-7 py-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.3em', color: G }}>Filters</span>
            <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
              <X className="w-4 h-4" strokeWidth={1.5} style={{ color: '#999' }} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-7 py-8 space-y-10">
            <div>
              <p className="font-sans uppercase mb-4" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#bbb' }}>Setting Style</p>
              {SETTINGS.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSetting(prev => prev === s.id ? null : s.id)}
                  className="flex items-center justify-between w-full py-3 font-sans"
                  style={{
                    fontSize: 13, letterSpacing: '0.02em',
                    color: activeSetting === s.id ? G : '#666',
                    fontWeight: activeSetting === s.id ? 400 : 300,
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  {s.label}
                  {activeSetting === s.id && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: G, flexShrink: 0 }} />
                  )}
                </button>
              ))}
            </div>

            <div>
              <p className="font-sans uppercase mb-4" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#bbb' }}>Metal</p>
              {METALS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMetal(prev => prev === m.id ? null : m.id)}
                  className="flex items-center justify-between w-full py-3 font-sans"
                  style={{
                    fontSize: 13, letterSpacing: '0.02em',
                    color: activeMetal === m.id ? G : '#666',
                    fontWeight: activeMetal === m.id ? 400 : 300,
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  {m.label}
                  {activeMetal === m.id && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: G, flexShrink: 0 }} />
                  )}
                </button>
              ))}
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => { clearAll(); setFiltersOpen(false); }}
                className="font-sans underline"
                style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.08em' }}
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="px-7 py-5" style={{ borderTop: `1px solid ${BORDER}` }}>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="w-full font-sans uppercase py-3.5"
              style={{ fontSize: 10, letterSpacing: '0.3em', backgroundColor: G, color: '#fff' }}
            >
              View {count} {count === 1 ? 'Ring' : 'Rings'}
            </button>
          </div>
        </div>
      </>

    </div>
  );
}
