'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CategoryCollage } from '@/components/shared/CategoryCollage';
import type { HeroMediaRecord } from '@/lib/hero/service';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import type { RingSettingRecord, RingMetal } from '@/lib/ring-settings/types';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const METALS: { id: RingMetal; label: string }[] = [
  { id: 'platinum',        label: 'Platinum' },
  { id: 'white_gold_18k',  label: '18k White Gold' },
  { id: 'yellow_gold_18k', label: '18k Yellow Gold' },
  { id: 'rose_gold_18k',   label: '18k Rose Gold' },
];

const SORT_OPTIONS = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest'];

interface Props {
  settings:     RingSettingRecord[];
  collageSlots: (HeroMediaRecord | null)[];
}

export function EngagementRingPage({ settings, collageSlots }: Props) {
  const [activeMetal,   setActiveMetal]   = useState<RingMetal | null>(null);
  const [filtersOpen,   setFiltersOpen]   = useState(false);
  const [sortOpen,      setSortOpen]      = useState(false);
  const [activeSort,    setActiveSort]    = useState('Featured');

  const filtered = settings.filter(r =>
    !activeMetal || (r.metals as RingMetal[]).includes(activeMetal)
  );

  const toNum = (v: string | null) => parseFloat(v ?? '0') || 0;
  const sorted = [...filtered].sort((a, b) => {
    if (activeSort === 'Price: Low to High')  return toNum(a.base_price_gbp) - toNum(b.base_price_gbp);
    if (activeSort === 'Price: High to Low')  return toNum(b.base_price_gbp) - toNum(a.base_price_gbp);
    return 0;
  });

  const count = sorted.length;

  const clearAll = useCallback(() => { setActiveMetal(null); }, []);

  return (
    <div className="min-h-screen bg-white" style={{ color: G, paddingTop: 0 }}>

      <CategoryCollage
        title="Engagement Rings"
        subheading="Crafted to last a lifetime"
        slots={collageSlots}
      />

      {/* ── SORT / COUNT / FILTER BAR ──────────────────────────────────── */}
      <div
        className="sticky top-0 z-30 bg-white flex items-center px-6 lg:px-14"
        style={{ height: 52, borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setSortOpen(v => !v)}
            className="flex items-center gap-1 font-sans"
            style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: G }}
          >
            Sort By <ChevronDown className="w-3 h-3 ml-0.5" strokeWidth={1.5} />
          </button>
          {sortOpen && (
            <div
              className="absolute top-full left-0 mt-1 bg-white z-30"
              style={{ minWidth: 200, border: `1px solid ${BORDER}`, boxShadow: '0 8px 32px rgba(0,0,0,0.07)' }}
            >
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt} type="button"
                  onClick={() => { setActiveSort(opt); setSortOpen(false); }}
                  className="block w-full text-left px-5 py-3 font-sans"
                  style={{ fontSize: 12, color: activeSort === opt ? G : '#666', fontWeight: activeSort === opt ? 500 : 300, backgroundColor: activeSort === opt ? '#f9f9f9' : 'transparent' }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 text-center">
          <span className="font-sans" style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.08em' }}>
            {count} {count === 1 ? 'product' : 'products'}
          </span>
        </div>

        <div className="flex-1 flex justify-end">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 font-sans"
            style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: G }}
          >
            Filters <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} />
            {activeMetal && (
              <span className="flex items-center justify-center rounded-full" style={{ width: 17, height: 17, backgroundColor: G, color: '#fff', fontSize: 9 }}>
                1
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── ACTIVE CHIPS ──────────────────────────────────────────────── */}
      {activeMetal && (
        <div className="flex items-center gap-3 px-6 lg:px-14 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <button
            type="button"
            onClick={() => setActiveMetal(null)}
            className="flex items-center gap-1.5 font-sans px-3 py-1"
            style={{ fontSize: 11, color: G, border: `1px solid ${G}` }}
          >
            {METALS.find(m => m.id === activeMetal)?.label}
            <X className="w-3 h-3" strokeWidth={2} />
          </button>
          <button type="button" onClick={clearAll} className="font-sans underline" style={{ fontSize: 11, color: '#bbb' }}>
            Clear all
          </button>
        </div>
      )}

      {/* ── RING GRID ─────────────────────────────────────────────────── */}
      <div className="px-6 lg:px-14 py-16">
        {sorted.length === 0 ? (
          <div className="py-32 text-center">
            <p className="font-display" style={{ fontSize: 22, fontWeight: 300, color: '#ccc', letterSpacing: '0.04em' }}>
              No rings available yet
            </p>
            <p className="font-sans mt-3" style={{ fontSize: 12, color: '#ddd', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              New pieces are added regularly — please check back soon
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-20">
            {sorted.map(ring => {
              const image = (ring as any).media?.[0]?.storage_path ?? '';
              const priceNum = parseFloat(ring.base_price_gbp ?? '');
              const price = !isNaN(priceNum) && priceNum > 0 ? `Starting from £${priceNum.toLocaleString('en-GB')}` : 'Price on application';
              return (
                <Link key={ring.id} href={`/engagement-rings/${ring.slug}`} className="group block">
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: '4/5', backgroundColor: '#fafafa' }}>
                    <div className="absolute inset-[8%]">
                      <Image
                        src={image}
                        alt={ring.name}
                        fill
                        className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                  </div>
                  <div className="mt-5 px-1">
                    <p className="font-display text-balance" style={{ fontSize: 16, fontWeight: 300, color: G, letterSpacing: '0.02em', lineHeight: 1.3 }}>
                      {ring.name}
                    </p>
                    {ring.collection && (
                      <p className="font-sans mt-1.5" style={{ fontSize: 11, fontWeight: 300, color: '#aaa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {ring.collection}
                      </p>
                    )}
                    <p className="font-sans mt-1" style={{ fontSize: 13, fontWeight: 300, color: '#666' }}>
                      {price}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FILTERS DRAWER ────────────────────────────────────────────── */}
      {filtersOpen && <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setFiltersOpen(false)} />}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white"
        style={{ width: 300, transform: filtersOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.28s ease', boxShadow: '-2px 0 40px rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-center justify-between px-7 py-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.3em', color: G }}>Filters</span>
          <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
            <X className="w-4 h-4" strokeWidth={1.5} style={{ color: '#999' }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-7 py-8 space-y-10">
          <div>
            <p className="font-sans uppercase mb-4" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#bbb' }}>Metal</p>
            {METALS.map(m => (
              <button
                key={m.id} type="button"
                onClick={() => setActiveMetal(prev => prev === m.id ? null : m.id)}
                className="flex items-center justify-between w-full py-3 font-sans"
                style={{ fontSize: 13, color: activeMetal === m.id ? G : '#666', fontWeight: activeMetal === m.id ? 400 : 300, borderBottom: `1px solid ${BORDER}` }}
              >
                {m.label}
                {activeMetal === m.id && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: G }} />}
              </button>
            ))}
          </div>
          {activeMetal && (
            <button type="button" onClick={() => { clearAll(); setFiltersOpen(false); }} className="font-sans underline" style={{ fontSize: 11, color: '#bbb' }}>
              Clear all filters
            </button>
          )}
        </div>
        <div className="px-7 py-5" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button
            type="button" onClick={() => setFiltersOpen(false)}
            className="w-full font-sans uppercase py-3.5"
            style={{ fontSize: 10, letterSpacing: '0.3em', backgroundColor: G, color: '#fff' }}
          >
            View {count} {count === 1 ? 'Ring' : 'Rings'}
          </button>
        </div>
      </div>

    </div>
  );
}
