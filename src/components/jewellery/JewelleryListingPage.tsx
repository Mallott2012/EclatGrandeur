'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';

const G      = '#1a2b1a';
const BORDER = '#e8e8e8';

const METALS = [
  { id: 'platinum',        label: 'Platinum' },
  { id: 'white_gold_18k',  label: '18k White Gold' },
  { id: 'yellow_gold_18k', label: '18k Yellow Gold' },
  { id: 'rose_gold_18k',   label: '18k Rose Gold' },
];

const SORT_OPTIONS = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest'];

export interface JewelleryProduct {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  price: string;
  metals: number;
  style: string;
  image: string;
}

export interface JewelleryConfig {
  title: string;
  basePath: string;         // e.g. '/necklaces'
  styles: { id: string; label: string }[];
  itemLabel: string;        // singular — 'necklace', 'bracelet', 'earring'
  products: JewelleryProduct[];
}

interface Props { config: JewelleryConfig; }

export function JewelleryListingPage({ config }: Props) {
  const { title, basePath, styles, itemLabel, products } = config;

  const [activeStyle,  setActiveStyle]  = useState<string | null>(null);
  const [activeMetal,  setActiveMetal]  = useState<string | null>(null);
  const [filtersOpen,  setFiltersOpen]  = useState(false);
  const [sortOpen,     setSortOpen]     = useState(false);
  const [activeSort,   setActiveSort]   = useState('Featured');

  const filtered = products.filter(p => !activeStyle || p.style === activeStyle);
  const count    = filtered.length;

  const clearAll = useCallback(() => {
    setActiveStyle(null);
    setActiveMetal(null);
  }, []);

  const activeFilterCount = [activeStyle, activeMetal].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* PAGE TITLE */}
      <div className="text-center pt-28 pb-1">
        <h1
          className="font-display"
          style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 300, letterSpacing: '0.06em', color: G }}
        >
          {title}
        </h1>
      </div>

      {/* SORT / COUNT / FILTER BAR */}
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
            {count} {count === 1 ? itemLabel : `${itemLabel}s`}
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

      {/* ACTIVE FILTER CHIPS */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-3 flex-wrap px-6 lg:px-14 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
          {activeStyle && (
            <button
              type="button"
              onClick={() => setActiveStyle(null)}
              className="flex items-center gap-1.5 font-sans px-3 py-1"
              style={{ fontSize: 11, color: G, border: `1px solid ${G}`, letterSpacing: '0.05em' }}
            >
              {styles.find(s => s.id === activeStyle)?.label}
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

      {/* PRODUCT GRID */}
      <div className="px-6 lg:px-14 py-12">
        {filtered.length === 0 ? (
          <div className="py-32 text-center">
            <p className="font-sans" style={{ fontSize: 14, color: '#ccc', letterSpacing: '0.06em' }}>
              No {itemLabel}s match your selection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {filtered.map(product => (
              <Link
                key={product.id}
                href={`${basePath}/${product.slug}`}
                className="group block text-center"
              >
                {/* Pure white square — product floats */}
                <div className="relative w-full" style={{ aspectRatio: '1/1', backgroundColor: '#fff' }}>
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  {product.metals > 1 && (
                    <div
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 font-sans whitespace-nowrap"
                      style={{
                        fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
                        color: '#999', border: `1px solid ${BORDER}`,
                        backgroundColor: '#fff', padding: '4px 14px',
                      }}
                    >
                      {product.metals} Materials
                    </div>
                  )}
                </div>

                {/* 3-line text */}
                <div className="mt-5 space-y-0.5">
                  <p className="font-sans" style={{ fontSize: 13, fontWeight: 400, color: G }}>
                    {product.name}
                  </p>
                  <p className="font-sans" style={{ fontSize: 12, fontWeight: 300, color: '#999' }}>
                    {product.subtitle}
                  </p>
                  <p className="font-sans" style={{ fontSize: 12, fontWeight: 300, color: '#999' }}>
                    {product.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* FILTERS DRAWER */}
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
              <p className="font-sans uppercase mb-4" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#bbb' }}>Style</p>
              {styles.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStyle(prev => prev === s.id ? null : s.id)}
                  className="flex items-center justify-between w-full py-3 font-sans"
                  style={{
                    fontSize: 13, letterSpacing: '0.02em',
                    color: activeStyle === s.id ? G : '#666',
                    fontWeight: activeStyle === s.id ? 400 : 300,
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  {s.label}
                  {activeStyle === s.id && (
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
              View {count} {count === 1 ? itemLabel : `${itemLabel}s`}
            </button>
          </div>
        </div>
      </>

    </div>
  );
}
