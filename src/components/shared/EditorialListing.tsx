'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, X } from 'lucide-react';
import { StyleScroller, type StyleCard } from './StyleScroller';

const G      = '#1a2b1a';
const STONE  = '#f5f3ef';
const BORDER = '#e8e8e8';
const MUTED  = '#aaa';

const METALS = [
  { id: 'platinum',        label: 'Platinum' },
  { id: 'white_gold_18k',  label: '18k White Gold' },
  { id: 'yellow_gold_18k', label: '18k Yellow Gold' },
  { id: 'rose_gold_18k',   label: '18k Rose Gold' },
];

export interface EditorialItem {
  id:       string;
  slug:     string;
  name:     string;
  subtitle: string;       // e.g. collection name or style
  price:    string;
  image:    string;       // URL — primary still product image
  mediaImage?: string;    // URL — lifestyle/model image revealed on hover
  video?:   string;       // URL — hero video revealed + played on hover
  metal?:   string;       // optional — for ring metal filtering
  style?:   string;       // optional — for style filtering
}

export interface EditorialListingProps {
  categoryTitle:  string;
  categoryLede:   string;
  basePath:       string;
  itemLabel:      string;
  styles?:        { id: string; label: string }[];
  items:          EditorialItem[];
  enableMetals?:  boolean;
}

/* ── Single product card — still image that reveals the hero video on hover ── */
function ProductCard({
  item,
  basePath,
  priority,
}: {
  item: EditorialItem;
  basePath: string;
  priority: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  const hasVideo    = Boolean(item.video);
  const hasHoverImg = !hasVideo && Boolean(item.mediaImage);
  const hasReveal   = hasVideo || hasHoverImg;

  function enter() {
    setHovered(true);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  }
  function leave() {
    setHovered(false);
    videoRef.current?.pause();
  }

  return (
    <Link
      href={`${basePath}/${item.slug}`}
      className="group flex flex-col"
      style={{ borderRight: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <div
        className="relative overflow-hidden bg-white"
        style={{ aspectRatio: '1 / 1' }}
      >
        {/* Still product image */}
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            priority={priority}
            className="object-contain transition-opacity duration-700 ease-out"
            style={{ padding: '12%', opacity: hovered && hasReveal ? 0 : 1 }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-sans uppercase" style={{ fontSize: 9, letterSpacing: '0.3em', color: '#ccc' }}>
              No image
            </p>
          </div>
        )}

        {/* Hover reveal — hero video (preferred) or lifestyle image */}
        {hasVideo && (
          <video
            ref={videoRef}
            src={item.video}
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
            style={{ opacity: hovered ? 1 : 0 }}
          />
        )}
        {hasHoverImg && (
          <Image
            src={item.mediaImage as string}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="absolute inset-0 object-cover transition-opacity duration-700 ease-out"
            style={{ opacity: hovered ? 1 : 0 }}
          />
        )}
      </div>

      {/* Name + price */}
      <div style={{ padding: '24px 28px 32px' }}>
        <p
          className="font-display"
          style={{ fontSize: 'clamp(15px, 1.3vw, 19px)', fontWeight: 300, letterSpacing: '0.02em', color: G, lineHeight: 1.3 }}
        >
          {item.name}
        </p>
        <p
          className="font-sans"
          style={{ fontSize: 12, fontWeight: 300, color: '#888', letterSpacing: '0.04em', marginTop: 8 }}
        >
          {item.price}
        </p>
      </div>
    </Link>
  );
}

export function EditorialListing({
  categoryTitle,
  categoryLede,
  basePath,
  itemLabel,
  styles = [],
  items,
  enableMetals = false,
}: EditorialListingProps) {
  const [activeStyle, setActiveStyle] = useState<string | null>(null);
  const [activeMetal, setActiveMetal] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy]           = useState<'featured' | 'price_asc' | 'price_desc' | 'name'>('featured');
  const [sortOpen, setSortOpen]       = useState(false);

  // Style filtering is graceful: if no item carries the selected style we
  // keep every product visible rather than emptying the grid.
  const styleHasMatches = activeStyle ? items.some(i => i.style === activeStyle) : false;

  const priceValue = (p: string) => Number(p.replace(/[^0-9.]/g, '')) || 0;

  const filtered = items
    .filter(item => {
      if (activeStyle && styleHasMatches && item.style !== activeStyle) return false;
      if (activeMetal && item.metal !== activeMetal) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc')  return priceValue(a.price) - priceValue(b.price);
      if (sortBy === 'price_desc') return priceValue(b.price) - priceValue(a.price);
      if (sortBy === 'name')       return a.name.localeCompare(b.name);
      return 0;
    });

  const SORT_OPTIONS: { id: typeof sortBy; label: string }[] = [
    { id: 'featured',   label: 'Featured' },
    { id: 'price_asc',  label: 'Price: Low to High' },
    { id: 'price_desc', label: 'Price: High to Low' },
    { id: 'name',       label: 'Name: A to Z' },
  ];

  // Build the scroller cards, giving each style a representative thumbnail.
  const styleCards: StyleCard[] = styles.map((s, i) => ({
    id:    s.id,
    label: s.label,
    image: items.find(it => it.style === s.id)?.image
        ?? (items.length ? items[i % items.length].image : undefined),
  }));

  const activeFilterCount = [activeStyle, activeMetal].filter(Boolean).length;

  function clearAll() {
    setActiveStyle(null);
    setActiveMetal(null);
  }

  return (
    <div className="min-h-screen bg-white" style={{ color: G }}>

      {/* ── CATEGORY HEADER ──────────────────────────────────────────────── */}
      <div style={{ paddingTop: 120, paddingBottom: 44, textAlign: 'center' }}>
        <p className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.36em', color: MUTED, marginBottom: 22 }}>
          Éclat Grandeur
        </p>
        <h1
          className="font-display text-balance"
          style={{ fontSize: 'clamp(44px, 6vw, 78px)', fontWeight: 300, letterSpacing: '0.04em', lineHeight: 1.0, color: G }}
        >
          {categoryTitle}
        </h1>
        <div style={{ width: 40, height: 1, backgroundColor: G, margin: '28px auto 22px', opacity: 0.3 }} />
        <p
          className="font-sans"
          style={{ fontSize: 12, letterSpacing: '0.2em', color: MUTED, textTransform: 'uppercase', fontWeight: 300 }}
        >
          {categoryLede}
        </p>
      </div>

      {/* ── STYLE SCROLLER ───────────────────────────────────────────────── */}
      <StyleScroller
        cards={styleCards}
        activeId={activeStyle}
        onSelect={(id) => setActiveStyle(prev => (prev === id ? null : id))}
      />

      {/* ── FILTER BAR ───────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between bg-white"
        style={{
          borderTop: `1px solid ${BORDER}`,
          borderBottom: `1px solid ${BORDER}`,
          padding: '0 clamp(24px, 5vw, 80px)',
          height: 60,
        }}
      >
        {/* Filter + count */}
        <div className="flex items-center" style={{ gap: 28 }}>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 font-sans"
            style={{ fontSize: 14, letterSpacing: '0.02em', color: G, fontWeight: 300 }}
          >
            Filter
            <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
            {activeFilterCount > 0 && (
              <span
                style={{
                  width: 16, height: 16, borderRadius: '50%',
                  backgroundColor: G, color: '#fff',
                  fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
          <span className="font-sans" style={{ fontSize: 14, color: '#999', letterSpacing: '0.02em', fontWeight: 300 }}>
            ( {filtered.length} {filtered.length === 1 ? itemLabel : `${itemLabel}s`} )
          </span>
        </div>

        {/* Sort By */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortOpen(o => !o)}
            className="flex items-center gap-2 font-sans"
            style={{ fontSize: 14, letterSpacing: '0.02em', color: G, fontWeight: 300 }}
          >
            Sort By
            <ChevronDown
              className="w-4 h-4"
              strokeWidth={1.5}
              style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
            />
          </button>

          {sortOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
              <div
                className="absolute right-0 z-50 bg-white"
                style={{ top: 'calc(100% + 12px)', minWidth: 220, border: `1px solid ${BORDER}`, boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }}
              >
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setSortBy(opt.id); setSortOpen(false); }}
                    className="flex w-full items-center justify-between font-sans"
                    style={{
                      padding: '14px 20px',
                      fontSize: 13,
                      letterSpacing: '0.02em',
                      color: sortBy === opt.id ? G : '#666',
                      fontWeight: sortBy === opt.id ? 400 : 300,
                      textAlign: 'left',
                    }}
                  >
                    {opt.label}
                    {sortBy === opt.id && <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: G }} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── ACTIVE FILTER CHIPS ──────────────────────────────────────────── */}
      {activeFilterCount > 0 && (
        <div
          className="flex flex-wrap items-center gap-3"
          style={{ padding: '12px clamp(24px, 5vw, 80px)', borderBottom: `1px solid ${BORDER}` }}
        >
          {activeStyle && (
            <button
              type="button"
              onClick={() => setActiveStyle(null)}
              className="flex items-center gap-1.5 font-sans px-3 py-1"
              style={{ fontSize: 11, color: G, border: `1px solid ${G}`, letterSpacing: '0.04em' }}
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
              style={{ fontSize: 11, color: G, border: `1px solid ${G}`, letterSpacing: '0.04em' }}
            >
              {METALS.find(m => m.id === activeMetal)?.label}
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          )}
          <button
            type="button"
            onClick={clearAll}
            className="font-sans"
            style={{ fontSize: 11, color: '#bbb', letterSpacing: '0.04em', textDecoration: 'underline' }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── PRODUCT GRID ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ padding: '120px 0', textAlign: 'center' }}>
          <p className="font-display" style={{ fontSize: 28, fontWeight: 300, color: '#ccc', letterSpacing: '0.04em' }}>
            No {itemLabel}s available yet
          </p>
          <p
            className="font-sans"
            style={{ fontSize: 11, color: '#ddd', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 16 }}
          >
            New pieces are added regularly
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 md:grid-cols-3"
          style={{ borderTop: `1px solid ${BORDER}`, borderLeft: `1px solid ${BORDER}` }}
        >
          {filtered.map((item, index) => (
            <ProductCard key={item.id} item={item} basePath={basePath} priority={index < 3} />
          ))}
        </div>
      )}

      {/* ── FILTERS DRAWER ───────────────────────────────────────────────── */}
      {filtersOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.12)' }}
          onClick={() => setFiltersOpen(false)}
        />
      )}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white"
        style={{
          width: 300,
          transform: filtersOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32,0,0.12,1)',
          boxShadow: '-2px 0 40px rgba(0,0,0,0.08)',
          borderLeft: `1px solid ${BORDER}`,
        }}
      >
        <div className="flex items-center justify-between px-7 py-6" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="font-sans uppercase" style={{ fontSize: 10, letterSpacing: '0.32em', color: G }}>
            Refine
          </span>
          <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
            <X className="w-4 h-4" strokeWidth={1.5} style={{ color: '#999' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-8 space-y-10">
          {styles.length > 0 && (
            <div>
              <p className="font-sans uppercase mb-5" style={{ fontSize: 9, letterSpacing: '0.32em', color: '#bbb' }}>
                Style
              </p>
              {styles.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStyle(prev => prev === s.id ? null : s.id)}
                  className="flex w-full items-center justify-between py-3.5 font-sans"
                  style={{
                    fontSize: 13, letterSpacing: '0.02em',
                    color: activeStyle === s.id ? G : '#666',
                    fontWeight: activeStyle === s.id ? 400 : 300,
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  {s.label}
                  {activeStyle === s.id && <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: G }} />}
                </button>
              ))}
            </div>
          )}

          {enableMetals && (
            <div>
              <p className="font-sans uppercase mb-5" style={{ fontSize: 9, letterSpacing: '0.32em', color: '#bbb' }}>
                Metal
              </p>
              {METALS.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMetal(prev => prev === m.id ? null : m.id)}
                  className="flex w-full items-center justify-between py-3.5 font-sans"
                  style={{
                    fontSize: 13, letterSpacing: '0.02em',
                    color: activeMetal === m.id ? G : '#666',
                    fontWeight: activeMetal === m.id ? 400 : 300,
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  {m.label}
                  {activeMetal === m.id && <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: G }} />}
                </button>
              ))}
            </div>
          )}

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => { clearAll(); setFiltersOpen(false); }}
              className="font-sans"
              style={{ fontSize: 11, color: '#bbb', textDecoration: 'underline', letterSpacing: '0.06em' }}
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="px-7 py-5" style={{ borderTop: `1px solid ${BORDER}` }}>
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            className="w-full font-sans uppercase py-4"
            style={{ fontSize: 10, letterSpacing: '0.32em', backgroundColor: G, color: '#fff' }}
          >
            View {filtered.length} {filtered.length === 1 ? itemLabel : `${itemLabel}s`}
          </button>
        </div>
      </div>

    </div>
  );
}
